#!/usr/bin/env python3
"""Compare reachable named call targets in the APK's ARMv7 and x86 builds.

This is an ABI-aware static cross-check, not a machine-code equivalence proof.
It follows intraprocedural control flow where the disassembly is unambiguous,
records indirect control flow as an explicit coverage limitation, and keeps
compiler-dependent memory helper calls separate from semantic call parity.
"""
import argparse
import collections
import json
import re
import struct
import hashlib
import sys
from pathlib import Path

TARGET_ABIS = ("armeabi-v7a", "x86")
MEMORY_HELPERS = {"memcpy", "memset"}
ABI_HELPER_RE = re.compile(
    r"^(?:__aeabi_[A-Za-z0-9_]+|__gnu_[A-Za-z0-9_]+|"
    r"__x86\.get_pc_thunk\.[A-Za-z]+|_GLOBAL_OFFSET_TABLE_)$"
)
NORETURN_RE = re.compile(
    r"(?:^|::)(?:__stack_chk_fail|__assert_fail|__fortify_fail|abort|exit|"
    r"_exit|__cxa_throw|__cxa_rethrow|terminate)(?:$|\()"
)
INSTRUCTION_RE = re.compile(r"^\s*([0-9a-fA-F]+):")
TARGET_RE = re.compile(r"\b(?:0x)?([0-9a-fA-F]{4,16})\s*<([^>]+)>")
ADDRESS_RE = re.compile(r"\b(?:0x)?([0-9a-fA-F]{4,16})\b")


def _instruction_map(lines):
    """Parse GNU/LLVM objdump instruction lines, ignoring symbol headers."""
    instructions = {}
    for line in lines or []:
        match = INSTRUCTION_RE.match(line)
        if not match:
            continue
        address = int(match.group(1), 16)
        # Preserve tabs: ARM separates mnemonic and operands, x86 often does not.
        rest = line.split(":", 1)[1].lstrip(" ")
        fields = rest.split("\t")
        if len(fields) >= 3:
            assembly = " ".join(part.strip() for part in fields[2:] if part.strip())
        else:
            assembly = fields[-1].strip()
        if "UNDEFINED instruction" in assembly or assembly.startswith("@ <UNDEFINED>"):
            assembly = ""
        instructions[address] = assembly
    return dict(sorted(instructions.items()))


def _target(operands):
    match = TARGET_RE.search(operands)
    if match:
        return int(match.group(1), 16), match.group(2)
    match = ADDRESS_RE.search(operands)
    if match:
        return int(match.group(1), 16), None
    return None, None


def normalize_target(label):
    """Normalize objdump label decoration without discarding C++ signatures."""
    if not label:
        return None
    label = re.sub(r"\+0x[0-9a-fA-F]+$", "", label.strip())
    label = re.sub(r"(?:@@Base|@plt|@PLT)$", "", label)
    return re.sub(r"\s+", " ", label).strip()


def _mnemonic_and_operands(assembly):
    parts = assembly.strip().split(None, 1)
    return (parts[0].lower(), parts[1].strip() if len(parts) > 1 else "") if parts else ("", "")


def _is_return(abi, mnemonic, operands):
    if abi == "x86":
        return mnemonic.startswith(("ret", "iret", "lret"))
    if mnemonic in ("bx", "bx.n", "bx.w", "bxns") and operands.strip().lower() == "lr":
        return True
    if mnemonic.startswith("pop") and re.search(r"\bpc\b", operands):
        return True
    if mnemonic.startswith("ldm") and re.search(r"\bpc\b", operands) and re.match(r"^sp!?,?\s*\{", operands):
        return True
    if mnemonic in ("mov", "movs", "mov.w") and re.search(r"\bpc\s*,\s*lr\b", operands):
        return True
    if mnemonic.startswith("subs") and re.search(r"\bpc\s*,\s*lr\b", operands):
        return True
    return False


def _is_conditional_branch(abi, mnemonic):
    if abi == "x86":
        return (mnemonic.startswith("j") and not mnemonic.startswith("jmp")) or mnemonic.startswith("loop")
    if mnemonic in ("cbz", "cbnz", "cbz.n", "cbnz.n"):
        return True
    return bool(re.fullmatch(r"b(?:eq|ne|cs|hs|cc|lo|mi|pl|vs|vc|hi|ls|ge|lt|gt|le)(?:\.n|\.w)?", mnemonic))


def _is_unconditional_branch(abi, mnemonic):
    return mnemonic.startswith("jmp") if abi == "x86" else mnemonic in ("b", "b.n", "b.w")


def _is_call(abi, mnemonic):
    return mnemonic.startswith("call") if abi == "x86" else mnemonic in ("bl", "blx", "bl.n", "bl.w", "blx.n", "blx.w")


def _is_indirect_call(abi, mnemonic, operands, label):
    if label:
        return False
    if abi == "x86":
        return operands.lstrip().startswith("*")
    if mnemonic.startswith("blx"):
        return bool(re.match(r"^(?:r(?:1[0-2]|[0-9])|ip|lr|\[)", operands.strip(), re.I))
    return False


def _base_function_name(value):
    return normalize_target(value or "").split("(", 1)[0]


def _elf_file_offset(binary_data, address, size):
    """Map a loadable ELF virtual address to its file-backed offset."""
    if not binary_data or binary_data[:4] != b"\x7fELF":
        raise ValueError("missing or invalid ELF binary")
    elf_class, encoding = binary_data[4], binary_data[5]
    if encoding not in (1, 2):
        raise ValueError("unsupported ELF endianness")
    endian = "<" if encoding == 1 else ">"
    if elf_class == 1:
        if len(binary_data) < 52:
            raise ValueError("truncated ELF32 header")
        phoff = struct.unpack_from(endian + "I", binary_data, 28)[0]
        phentsize = struct.unpack_from(endian + "H", binary_data, 42)[0]
        phnum = struct.unpack_from(endian + "H", binary_data, 44)[0]
        minimum = 32
        fmt = endian + "IIIIIIII"
    elif elf_class == 2:
        if len(binary_data) < 64:
            raise ValueError("truncated ELF64 header")
        phoff = struct.unpack_from(endian + "Q", binary_data, 32)[0]
        phentsize = struct.unpack_from(endian + "H", binary_data, 54)[0]
        phnum = struct.unpack_from(endian + "H", binary_data, 56)[0]
        minimum = 56
        fmt = endian + "IIQQQQQQ"
    else:
        raise ValueError("unsupported ELF class")
    if phentsize < minimum or phoff + phentsize * phnum > len(binary_data):
        raise ValueError("invalid ELF program-header table")
    for index in range(phnum):
        record = struct.unpack_from(fmt, binary_data, phoff + index * phentsize)
        if elf_class == 1:
            p_type, p_offset, p_vaddr, _, p_filesz, _, _, _ = record
        else:
            p_type, _, p_offset, p_vaddr, _, p_filesz, _, _ = record
        if p_type == 1 and p_vaddr <= address and address + size <= p_vaddr + p_filesz:
            offset = p_offset + address - p_vaddr
            if offset + size <= len(binary_data):
                return offset
    raise ValueError("virtual address range is not file-backed: 0x%x+0x%x" % (address, size))


def _arm_switch_case_count(instructions, address):
    """Recover an ARM TBB/TBH entry count from its nearby unsigned bound guard."""
    addresses = list(instructions)
    try:
        position = addresses.index(address)
    except ValueError:
        return None
    for branch_pos in range(position - 1, max(-1, position - 10), -1):
        mnemonic, _ = _mnemonic_and_operands(instructions[addresses[branch_pos]])
        if not mnemonic.startswith("bhi"):
            continue
        for compare_pos in range(branch_pos - 1, max(-1, branch_pos - 7), -1):
            compare_mnemonic, compare_operands = _mnemonic_and_operands(
                instructions[addresses[compare_pos]]
            )
            if compare_mnemonic not in ("cmp", "cmp.w", "cmp.n"):
                continue
            match = re.search(r",\s*#(0x[0-9a-fA-F]+|\d+)", compare_operands)
            if match:
                return int(match.group(1), 0) + 1
        return None
    return None


def _x86_switch_case_count(instructions, address):
    """Infer a local x86 switch bound when this lowering emits one."""
    addresses = list(instructions)
    try:
        position = addresses.index(address)
    except ValueError:
        return None
    for branch_pos in range(position - 1, max(-1, position - 13), -1):
        mnemonic, _ = _mnemonic_and_operands(instructions[addresses[branch_pos]])
        if mnemonic != "ja":
            continue
        for sub_pos in range(branch_pos - 1, max(-1, branch_pos - 9), -1):
            sub_mnemonic, sub_operands = _mnemonic_and_operands(
                instructions[addresses[sub_pos]]
            )
            if sub_mnemonic not in ("sub", "subl"):
                continue
            match = re.match(r"\$(-?0x[0-9a-fA-F]+|-?\d+),", sub_operands)
            if match:
                limit = int(match.group(1), 0)
                if 0 <= limit < 65536:
                    return limit + 1
        return None
    return None


def _arm_switch_counts(function):
    instructions = _instruction_map((function.get("disassembly") or {}).get("excerpt", []))
    return [
        _arm_switch_case_count(instructions, address)
        for address, assembly in instructions.items()
        if _mnemonic_and_operands(assembly)[0] in ("tbb", "tbh")
    ]


def _x86_pic_anchor(instructions):
    """Recover the ELF-wide PIC/GOT anchor from a call-next/pop/add sequence."""
    addresses = list(instructions)
    for index, address in enumerate(addresses[:-2]):
        mnemonic, operands = _mnemonic_and_operands(instructions[address])
        if not mnemonic.startswith("call"):
            continue
        target_address, _ = _target(operands)
        if target_address != addresses[index + 1]:
            continue
        pop_mnemonic, pop_operands = _mnemonic_and_operands(
            instructions[addresses[index + 1]]
        )
        add_mnemonic, add_operands = _mnemonic_and_operands(
            instructions[addresses[index + 2]]
        )
        pop_match = re.fullmatch(r"%([a-z0-9]+)", pop_operands.strip(), re.I)
        add_match = re.match(
            r"\$(-?0x[0-9a-fA-F]+|-?\d+),\s*%([a-z0-9]+)",
            add_operands, re.I
        )
        if (pop_mnemonic == "pop" and pop_match and add_mnemonic in ("add", "addl")
                and add_match and pop_match.group(1).lower() == add_match.group(2).lower()):
            return (target_address + int(add_match.group(1), 0)) & 0xFFFFFFFF
    return None


def _resolve_arm_switch(function, address, mnemonic, instructions, binary_data):
    count = _arm_switch_case_count(instructions, address)
    if count is None or count <= 0:
        return None
    width = 1 if mnemonic == "tbb" else 2
    if count > (256 if width == 1 else 65536) or binary_data is None:
        return None
    table_address = address + 4
    try:
        offset = _elf_file_offset(binary_data, table_address, count * width)
    except ValueError:
        return None
    raw = binary_data[offset:offset + count * width]
    endian = "<" if binary_data[5] == 1 else ">"
    if width == 1:
        entries = list(raw)
    else:
        entries = list(struct.unpack(endian + "H" * count, raw))
    targets = [table_address + 2 * entry for entry in entries]
    start = int(function.get("value", "0"), 16) & ~1
    end = start + int(function.get("size", 0))
    if not all(start <= target < end and target in instructions for target in targets):
        return None
    return {
        "address": "0x%x" % address,
        "kind": mnemonic,
        "entryCount": count,
        "entryValues": ["0x%x" % entry for entry in entries],
        "tableAddress": "0x%x" % table_address,
        "targetAddresses": ["0x%x" % target for target in sorted(set(targets))],
        "resolved": True,
        "resolution": "ELF-backed TBB/TBH relative table; target = table start + 2 * entry",
    }


def _resolve_x86_switch(function, address, instructions, binary_data, paired_count):
    if binary_data is None or paired_count is None or paired_count <= 0:
        return None
    addresses = list(instructions)
    try:
        position = addresses.index(address)
    except ValueError:
        return None
    if position < 2:
        return None
    jump_mnemonic, jump_operands = _mnemonic_and_operands(instructions[address])
    jump_register = re.fullmatch(r"\*%([a-z0-9]+)", jump_operands.strip(), re.I)
    add_mnemonic, add_operands = _mnemonic_and_operands(instructions[addresses[position - 1]])
    move_mnemonic, move_operands = _mnemonic_and_operands(instructions[addresses[position - 2]])
    if not jump_mnemonic.startswith("jmp") or not jump_register:
        return None
    add_match = re.fullmatch(r"%([a-z0-9]+),\s*%([a-z0-9]+)", add_operands, re.I)
    move_match = re.match(
        r"(-?0x[0-9a-fA-F]+|-?\d+)\(%([a-z0-9]+),%([a-z0-9]+),([1248])\),\s*%([a-z0-9]+)",
        move_operands, re.I
    )
    if move_mnemonic not in ("mov", "movl") or not add_match or not move_match:
        return None
    displacement, base, index, scale, destination = move_match.groups()
    if (add_match.group(1).lower() != base.lower()
            or add_match.group(2).lower() != destination.lower()
            or jump_register.group(1).lower() != destination.lower()
            or int(scale) != 4):
        return None

    anchor = _x86_pic_anchor(instructions)
    if anchor is None:
        return None
    local_count = _x86_switch_case_count(instructions, address)
    if local_count is not None and local_count != paired_count:
        return None
    table_address = (anchor + int(displacement, 0)) & 0xFFFFFFFF
    try:
        offset = _elf_file_offset(binary_data, table_address, paired_count * 4)
    except ValueError:
        return None
    entries = list(struct.unpack_from("<" + "i" * paired_count, binary_data, offset))
    targets = [(anchor + entry) & 0xFFFFFFFF for entry in entries]
    start = int(function.get("value", "0"), 16)
    end = start + int(function.get("size", 0))
    if not all(start <= target < end and target in instructions for target in targets):
        return None
    return {
        "address": "0x%x" % address,
        "kind": "x86-relative32-jump-table",
        "entryCount": paired_count,
        "entryValues": ["0x%x" % (entry & 0xFFFFFFFF) for entry in entries],
        "tableAddress": "0x%x" % table_address,
        "baseAnchor": "0x%x" % anchor,
        "targetAddresses": ["0x%x" % target for target in sorted(set(targets))],
        "resolved": True,
        "resolution": "ELF-backed signed 32-bit relative table; target = PIC anchor + entry",
    }


def analyze_function(function, abi, binary_data=None, paired_switch_counts=None):
    disassembly = function.get("disassembly") or {}
    if disassembly.get("status") != "ok" or disassembly.get("excerptTruncated", False):
        return {
            "complete": False, "reason": ["disassembly_unavailable_or_truncated"],
            "directTargets": [], "tailTargets": [], "memoryHelpers": [],
            "abiHelpers": [], "indirectCalls": 0, "indirectBranches": 0,
            "switchTables": [], "visitedInstructions": 0, "listedInstructions": 0,
        }

    instructions = _instruction_map(disassembly.get("excerpt", []))
    if not instructions:
        return {
            "complete": False, "reason": ["no_instructions"], "directTargets": [],
            "tailTargets": [], "memoryHelpers": [], "abiHelpers": [],
            "indirectCalls": 0, "indirectBranches": 0, "switchTables": [],
            "visitedInstructions": 0, "listedInstructions": 0,
        }

    start = int(function.get("value", "0"), 16)
    if abi == "armeabi-v7a":
        start &= ~1  # ELF function values may carry the Thumb state bit.
    addresses = list(instructions)
    next_address = {address: addresses[index + 1] if index + 1 < len(addresses) else None
                    for index, address in enumerate(addresses)}
    own_base = _base_function_name(function.get("demangled") or function.get("name") or "")
    pending = [start]
    visited = set()
    direct_targets, tail_targets, memory_helpers, abi_helpers = [], [], [], []
    indirect_calls = indirect_branches = 0
    switch_tables = []
    switch_ordinal = 0
    paired_switch_counts = paired_switch_counts or []
    reasons = set()

    while pending:
        address = pending.pop()
        if address in visited:
            continue
        assembly = instructions.get(address)
        if assembly is None:
            reasons.add("branch_target_missing_from_excerpt")
            continue
        visited.add(address)
        if not assembly:
            reasons.add("undefined_or_data_reached")
            continue

        mnemonic, operands = _mnemonic_and_operands(assembly)
        following = next_address[address]

        if _is_return(abi, mnemonic, operands) or mnemonic in ("udf", "ud2", "hlt", "bkpt", "int3"):
            continue

        if _is_call(abi, mnemonic):
            target_address, label = _target(operands)
            normalized = normalize_target(label)
            if _is_indirect_call(abi, mnemonic, operands, label):
                indirect_calls += 1
            elif normalized:
                local_label = normalized.startswith(own_base + "+")
                call_to_next = target_address is not None and target_address == following
                if not local_label and not call_to_next:
                    if normalized in MEMORY_HELPERS:
                        memory_helpers.append(normalized)
                    elif ABI_HELPER_RE.fullmatch(normalized):
                        abi_helpers.append(normalized)
                    else:
                        direct_targets.append(normalized)
            elif target_address is not None and target_address == following:
                # x86 PIC get-PC sequence (call next instruction).
                pass
            else:
                reasons.add("unresolved_direct_call")
            if following is not None and not (normalized and NORETURN_RE.search(normalized)):
                pending.append(following)
            continue

        if abi == "armeabi-v7a" and mnemonic in ("tbb", "tbh"):
            indirect_branches += 1
            table = _resolve_arm_switch(function, address, mnemonic, instructions, binary_data)
            switch_ordinal += 1
            if table:
                switch_tables.append(table)
                pending.extend(int(target, 16) for target in table["targetAddresses"])
            else:
                switch_tables.append({
                    "address": "0x%x" % address, "kind": mnemonic,
                    "entryCount": _arm_switch_case_count(instructions, address),
                    "resolved": False,
                })
                reasons.add("unresolved_arm_switch_table")
            continue

        if abi == "armeabi-v7a" and mnemonic.startswith("bx") and operands.strip().lower() != "lr":
            indirect_branches += 1
            reasons.add("indirect_branch")
            continue
        if abi == "x86" and _is_unconditional_branch(abi, mnemonic) and operands.lstrip().startswith("*"):
            indirect_branches += 1
            count = (paired_switch_counts[switch_ordinal]
                     if switch_ordinal < len(paired_switch_counts) else None)
            table = _resolve_x86_switch(function, address, instructions, binary_data, count)
            switch_ordinal += 1
            if table:
                switch_tables.append(table)
                pending.extend(int(target, 16) for target in table["targetAddresses"])
            else:
                switch_tables.append({
                    "address": "0x%x" % address, "kind": "x86-indirect-jump",
                    "entryCount": count, "resolved": False,
                })
                reasons.add("unresolved_x86_jump_table")
            continue
        if abi == "armeabi-v7a" and re.match(r"^pc\s*,", operands) and mnemonic.startswith(("ldr", "mov")):
            indirect_branches += 1
            reasons.add("indirect_branch")
            continue
        if abi == "armeabi-v7a" and mnemonic.startswith("ldm") and re.search(r"\bpc\b", operands) and not re.match(r"^sp!?,?\s*\{", operands):
            indirect_branches += 1
            reasons.add("indirect_branch")
            continue

        if _is_unconditional_branch(abi, mnemonic):
            target_address, label = _target(operands)
            if target_address in instructions:
                pending.append(target_address)
            elif label:
                normalized = normalize_target(label)
                if normalized and not normalized.startswith(own_base + "+"):
                    tail_targets.append(normalized)
                else:
                    reasons.add("unresolved_unconditional_branch")
            else:
                reasons.add("unresolved_unconditional_branch")
            continue

        if _is_conditional_branch(abi, mnemonic):
            target_address, label = _target(operands)
            if target_address in instructions:
                pending.append(target_address)
            elif label:
                normalized = normalize_target(label)
                if normalized and not normalized.startswith(own_base + "+"):
                    tail_targets.append(normalized)
                else:
                    reasons.add("unresolved_conditional_branch")
            else:
                reasons.add("unresolved_conditional_branch")
            if following is not None:
                pending.append(following)
            continue

        if following is not None:
            pending.append(following)
        else:
            reasons.add("falls_off_disassembly_excerpt")

    return {
        "complete": not reasons,
        "reason": sorted(reasons),
        "directTargets": sorted(direct_targets),
        "tailTargets": sorted(tail_targets),
        "memoryHelpers": sorted(memory_helpers),
        "abiHelpers": sorted(abi_helpers),
        "indirectCalls": indirect_calls,
        "indirectBranches": indirect_branches,
        "switchTables": switch_tables,
        "visitedInstructions": len(visited),
        "listedInstructions": len(instructions),
    }


def _function_map(library):
    result, duplicates = {}, []
    for function in library.get("focusedSymbols", []):
        if function.get("type") != "FUNC":
            continue
        name = function.get("demangled") or function.get("name")
        if name in result:
            duplicates.append(name)
        result[name] = function
    return result, sorted(set(duplicates))


def build_report(native_audit, binaries=None):
    libraries = {
        lib.get("abi"): lib for lib in native_audit.get("nativeLibraries", [])
        if lib.get("abi") in TARGET_ABIS and lib.get("path", "").endswith("/libStoneage.so")
    }
    missing_abis = [abi for abi in TARGET_ABIS if abi not in libraries]
    if missing_abis:
        raise ValueError("missing target libStoneage.so ABI(s): " + ", ".join(missing_abis))

    binary_data = {}
    for abi, path in (binaries or {}).items():
        if path is not None:
            binary_data[abi] = path if isinstance(path, bytes) else Path(path).read_bytes()
            expected = libraries.get(abi, {}).get("sha256")
            actual = hashlib.sha256(binary_data[abi]).hexdigest()
            if expected and actual.lower() != expected.lower():
                raise ValueError("%s binary SHA-256 does not match native audit" % abi)

    functions, analyses, duplicates = {}, {}, {}
    for abi in TARGET_ABIS:
        functions[abi], duplicates[abi] = _function_map(libraries[abi])

    # Resolve ARM tables first. Their explicit index bounds supply the
    # corresponding case count for x86 tables whose lowering has no guard.
    arm_switch_counts = {
        name: _arm_switch_counts(function)
        for name, function in functions["armeabi-v7a"].items()
    }
    analyses["armeabi-v7a"] = {
        name: analyze_function(fn, "armeabi-v7a", binary_data.get("armeabi-v7a"))
        for name, fn in functions["armeabi-v7a"].items()
    }
    analyses["x86"] = {
        name: analyze_function(
            fn, "x86", binary_data.get("x86"), arm_switch_counts.get(name, [])
        )
        for name, fn in functions["x86"].items()
    }

    arm_names, x86_names = set(functions["armeabi-v7a"]), set(functions["x86"])
    comparable = sorted(
        name for name in arm_names & x86_names
        if analyses["armeabi-v7a"][name]["complete"] and analyses["x86"][name]["complete"]
    )
    mismatches = []
    for name in comparable:
        arm_targets = set(analyses["armeabi-v7a"][name]["directTargets"])
        x86_targets = set(analyses["x86"][name]["directTargets"])
        if arm_targets != x86_targets:
            mismatches.append({
                "function": name,
                "onlyInArmeabiV7a": sorted(arm_targets - x86_targets),
                "onlyInX86": sorted(x86_targets - arm_targets),
            })

    switch_table_mismatches = []
    for name in sorted(arm_names & x86_names):
        arm_tables = analyses["armeabi-v7a"][name]["switchTables"]
        x86_tables = analyses["x86"][name]["switchTables"]
        if len(arm_tables) != len(x86_tables):
            switch_table_mismatches.append({
                "function": name, "armeabiV7aSiteCount": len(arm_tables),
                "x86SiteCount": len(x86_tables),
            })
            continue
        for ordinal, (arm_table, x86_table) in enumerate(zip(arm_tables, x86_tables)):
            if arm_table.get("entryCount") != x86_table.get("entryCount"):
                switch_table_mismatches.append({
                    "function": name, "site": ordinal,
                    "armeabiV7aEntryCount": arm_table.get("entryCount"),
                    "x86EntryCount": x86_table.get("entryCount"),
                })

    incomplete = {
        abi: [{"function": name, "reasons": item["reason"]}
              for name, item in sorted(analyses[abi].items()) if not item["complete"]]
        for abi in TARGET_ABIS
    }
    memory_variances = []
    for name in sorted(arm_names & x86_names):
        arm_ops = collections.Counter(analyses["armeabi-v7a"][name]["memoryHelpers"])
        x86_ops = collections.Counter(analyses["x86"][name]["memoryHelpers"])
        if arm_ops != x86_ops:
            memory_variances.append({
                "function": name,
                "armeabiV7a": dict(sorted(arm_ops.items())),
                "x86": dict(sorted(x86_ops.items())),
            })

    def totals(abi):
        items = list(analyses[abi].values())
        switch_tables = [table for item in items for table in item["switchTables"]]
        return {
            "functionCount": len(items),
            "completeFunctionCount": sum(item["complete"] for item in items),
            "incompleteFunctionCount": sum(not item["complete"] for item in items),
            "indirectCallSiteCount": sum(item["indirectCalls"] for item in items),
            "indirectBranchSiteCount": sum(item["indirectBranches"] for item in items),
            "switchTableSiteCount": len(switch_tables),
            "resolvedSwitchTableSiteCount": sum(bool(table.get("resolved")) for table in switch_tables),
            "resolvedSwitchEntryCount": sum(
                int(table.get("entryCount") or 0) for table in switch_tables if table.get("resolved")
            ),
            "memoryHelperCallCounts": dict(sorted(collections.Counter(
                helper for item in items for helper in item["memoryHelpers"]
            ).items())),
            "abiHelperCallCounts": dict(sorted(collections.Counter(
                helper for item in items for helper in item["abiHelpers"]
            ).items())),
        }

    same_names = arm_names == x86_names
    return {
        "format": "ro0000-android-native-abi-call-parity-v1",
        "source": {
            "apkSha256": native_audit.get("auditedApk", {}).get("sha256"),
            "armeabiV7a": {"sha256": libraries["armeabi-v7a"].get("sha256"),
                            "buildId": libraries["armeabi-v7a"].get("buildId")},
            "x86": {"sha256": libraries["x86"].get("sha256"),
                    "buildId": libraries["x86"].get("buildId")},
        },
        "comparison": {
            "sameFunctionNameSet": same_names,
            "functionCount": len(arm_names & x86_names),
            "comparableFunctionCount": len(comparable),
            "incompleteFunctionCounts": {abi: len(incomplete[abi]) for abi in TARGET_ABIS},
            "semanticNamedCallTargetMismatchCount": len(mismatches),
            "comparableSemanticNamedCallTargetParity": not mismatches and same_names,
            "allFunctionsComparable": len(comparable) == len(arm_names & x86_names),
            "sameIncompleteFunctionSet": {name for name, item in analyses["armeabi-v7a"].items() if not item["complete"]} == {name for name, item in analyses["x86"].items() if not item["complete"]},
            "switchTableSiteParity": not switch_table_mismatches,
            "switchTableMismatchCount": len(switch_table_mismatches),
            "resolvedSwitchTableSiteCount": sum(totals(abi)["resolvedSwitchTableSiteCount"] for abi in TARGET_ABIS),
            "resolvedSwitchEntryCount": sum(totals(abi)["resolvedSwitchEntryCount"] for abi in TARGET_ABIS),
            "definition": "Reachable named direct call targets compared as sets. ELF-backed ARM TBB/TBH and x86 relative jump tables are followed when all table entries resolve inside the function. Tail branches, memset/memcpy, and ABI-specific compiler helpers are reported separately. Unsupported indirect control flow remains incomplete.",
        },
        "abiSummary": {abi: totals(abi) for abi in TARGET_ABIS},
        "functionInventory": {
            "onlyInArmeabiV7a": sorted(arm_names - x86_names),
            "onlyInX86": sorted(x86_names - arm_names),
            "duplicateNames": duplicates,
        },
        "semanticCallTargetMismatches": mismatches,
        "switchTableMismatches": switch_table_mismatches,
        "switchTableInventory": {
            abi: {
                name: item["switchTables"]
                for name, item in sorted(analyses[abi].items()) if item["switchTables"]
            } for abi in TARGET_ABIS
        },
        "memoryHelperVariances": memory_variances,
        "incompleteControlFlow": incomplete,
        "interpretationBoundary": [
            "Call-target parity is not instruction-level or behavioral equivalence.",
            "Tail branches are not included in direct-call parity because linker veneers and aliases can obscure their semantic targets.",
            "Indirect calls are counted but their targets are unresolved.",
            "Jump tables are followed only when an ELF-backed bounded table can be validated; other indirect control flow remains incomplete.",
            "memset/memcpy differences are recorded as ABI/compiler implementation variance and excluded from semantic target parity.",
        ],
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--native-audit", required=True, help="native ELF audit JSON")
    parser.add_argument("--arm-binary", required=True, help="extracted armeabi-v7a libStoneage.so")
    parser.add_argument("--x86-binary", required=True, help="extracted x86 libStoneage.so")
    parser.add_argument("--output", required=True, help="output comparison JSON")
    args = parser.parse_args(argv)
    source = json.loads(Path(args.native_audit).read_text(encoding="utf-8"))
    report = build_report(
        source, {"armeabi-v7a": args.arm_binary, "x86": args.x86_binary}
    )
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    comparison = report["comparison"]
    print(json.dumps({
        "sameFunctionNameSet": comparison["sameFunctionNameSet"],
        "functionCount": comparison["functionCount"],
        "comparableFunctionCount": comparison["comparableFunctionCount"],
        "semanticNamedCallTargetMismatchCount": comparison["semanticNamedCallTargetMismatchCount"],
        "allFunctionsComparable": comparison["allFunctionsComparable"],
        "switchTableSiteParity": comparison["switchTableSiteParity"],
        "resolvedSwitchTableSiteCount": comparison["resolvedSwitchTableSiteCount"],
        "resolvedSwitchEntryCount": comparison["resolvedSwitchEntryCount"],
        "incompleteFunctionCounts": comparison["incompleteFunctionCounts"],
        "output": args.output,
    }, ensure_ascii=False, sort_keys=True))
    if not comparison["sameFunctionNameSet"]:
        print("focused function name sets differ", file=sys.stderr)
        return 1
    if any(report["functionInventory"]["duplicateNames"].values()):
        print("duplicate focused function names", file=sys.stderr)
        return 1
    if not comparison["comparableSemanticNamedCallTargetParity"]:
        print("reachable semantic named call targets differ across ABIs", file=sys.stderr)
        return 1
    if not comparison["switchTableSiteParity"]:
        print("switch table site or entry counts differ across ABIs", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
