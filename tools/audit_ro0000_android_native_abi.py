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


def analyze_function(function, abi):
    disassembly = function.get("disassembly") or {}
    if disassembly.get("status") != "ok" or disassembly.get("excerptTruncated", False):
        return {
            "complete": False, "reason": ["disassembly_unavailable_or_truncated"],
            "directTargets": [], "tailTargets": [], "memoryHelpers": [],
            "abiHelpers": [], "indirectCalls": 0, "indirectBranches": 0,
            "visitedInstructions": 0, "listedInstructions": 0,
        }

    instructions = _instruction_map(disassembly.get("excerpt", []))
    if not instructions:
        return {
            "complete": False, "reason": ["no_instructions"], "directTargets": [],
            "tailTargets": [], "memoryHelpers": [], "abiHelpers": [],
            "indirectCalls": 0, "indirectBranches": 0,
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
            reasons.add("indirect_branch_or_jump_table")
            continue
        if abi == "armeabi-v7a" and mnemonic.startswith("bx") and operands.strip().lower() != "lr":
            indirect_branches += 1
            reasons.add("indirect_branch")
            continue
        if abi == "x86" and _is_unconditional_branch(abi, mnemonic) and operands.lstrip().startswith("*"):
            indirect_branches += 1
            reasons.add("indirect_branch_or_jump_table")
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


def build_report(native_audit):
    libraries = {
        lib.get("abi"): lib for lib in native_audit.get("nativeLibraries", [])
        if lib.get("abi") in TARGET_ABIS and lib.get("path", "").endswith("/libStoneage.so")
    }
    missing_abis = [abi for abi in TARGET_ABIS if abi not in libraries]
    if missing_abis:
        raise ValueError("missing target libStoneage.so ABI(s): " + ", ".join(missing_abis))

    functions, analyses, duplicates = {}, {}, {}
    for abi in TARGET_ABIS:
        functions[abi], duplicates[abi] = _function_map(libraries[abi])
        analyses[abi] = {name: analyze_function(fn, abi) for name, fn in functions[abi].items()}

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
        return {
            "functionCount": len(items),
            "completeFunctionCount": sum(item["complete"] for item in items),
            "incompleteFunctionCount": sum(not item["complete"] for item in items),
            "indirectCallSiteCount": sum(item["indirectCalls"] for item in items),
            "indirectBranchSiteCount": sum(item["indirectBranches"] for item in items),
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
            "semanticNamedCallTargetParity": not mismatches and same_names,
            "definition": "Reachable named direct call targets compared as sets. Tail branches, memset/memcpy, and ABI-specific compiler helpers are reported separately. Indirect control flow and incomplete disassemblies are not inferred.",
        },
        "abiSummary": {abi: totals(abi) for abi in TARGET_ABIS},
        "functionInventory": {
            "onlyInArmeabiV7a": sorted(arm_names - x86_names),
            "onlyInX86": sorted(x86_names - arm_names),
            "duplicateNames": duplicates,
        },
        "semanticCallTargetMismatches": mismatches,
        "memoryHelperVariances": memory_variances,
        "incompleteControlFlow": incomplete,
        "interpretationBoundary": [
            "Call-target parity is not instruction-level or behavioral equivalence.",
            "Tail branches are not included in direct-call parity because linker veneers and aliases can obscure their semantic targets.",
            "Indirect calls are counted but their targets are unresolved.",
            "Jump tables and other unsupported control flow are listed as incomplete.",
            "memset/memcpy differences are recorded as ABI/compiler implementation variance and excluded from semantic target parity.",
        ],
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--native-audit", required=True, help="native ELF audit JSON")
    parser.add_argument("--output", required=True, help="output comparison JSON")
    args = parser.parse_args(argv)
    source = json.loads(Path(args.native_audit).read_text(encoding="utf-8"))
    report = build_report(source)
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    comparison = report["comparison"]
    print(json.dumps({
        "sameFunctionNameSet": comparison["sameFunctionNameSet"],
        "functionCount": comparison["functionCount"],
        "comparableFunctionCount": comparison["comparableFunctionCount"],
        "semanticNamedCallTargetMismatchCount": comparison["semanticNamedCallTargetMismatchCount"],
        "incompleteFunctionCounts": comparison["incompleteFunctionCounts"],
        "output": args.output,
    }, ensure_ascii=False, sort_keys=True))
    if not comparison["sameFunctionNameSet"]:
        print("focused function name sets differ", file=sys.stderr)
        return 1
    if any(report["functionInventory"]["duplicateNames"].values()):
        print("duplicate focused function names", file=sys.stderr)
        return 1
    if not comparison["semanticNamedCallTargetParity"]:
        print("reachable semantic named call targets differ across ABIs", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
