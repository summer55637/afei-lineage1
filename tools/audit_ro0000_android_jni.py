#!/usr/bin/env python3
"""Cross-check DEX native declarations against every packaged Android ELF library."""
import argparse
import hashlib
import json
import pathlib
import re
import subprocess
import tempfile
import zipfile

JNI_PREFIX = "Java_com_newssa_stoneage_ko_JNILibrary_"


def parse_jni_exports(readelf_output):
    exports = set()
    for line in readelf_output.splitlines():
        fields = line.split()
        if len(fields) < 8 or not fields[0].endswith(":"):
            continue
        if not fields[0][:-1].isdigit() or fields[6] == "UND":
            continue
        if fields[4] not in ("GLOBAL", "WEAK") or fields[5] != "DEFAULT":
            continue
        name = fields[7].split("@", 1)[0]
        if name.startswith(JNI_PREFIX):
            exports.add(name[len(JNI_PREFIX):])
    return sorted(exports)


def parse_all_jni_symbols(readelf_output):
    symbols = set()
    jni_onload = False
    for line in readelf_output.splitlines():
        fields = line.split()
        if len(fields) < 8 or not fields[0].endswith(":"):
            continue
        if not fields[0][:-1].isdigit() or fields[6] == "UND":
            continue
        if fields[4] not in ("GLOBAL", "WEAK") or fields[5] != "DEFAULT":
            continue
        name = fields[7].split("@", 1)[0]
        if name.startswith("Java_"):
            symbols.add(name)
        if name == "JNI_OnLoad":
            jni_onload = True
    return sorted(symbols), jni_onload



def parse_jni_onload_symbols(readelf_output):
    """Return defined, externally visible JNI_OnLoad function records."""
    records = []
    for line in readelf_output.splitlines():
        fields = line.split()
        if len(fields) < 8 or not fields[0].endswith(":"):
            continue
        if not fields[0][:-1].isdigit() or fields[6] == "UND":
            continue
        if fields[3] != "FUNC" or fields[4] not in ("GLOBAL", "WEAK") or fields[5] != "DEFAULT":
            continue
        name = fields[7].split("@", 1)[0]
        if name != "JNI_OnLoad":
            continue
        try:
            value = int(fields[1], 16)
            size = int(fields[2], 10)
        except ValueError:
            continue
        records.append({"value": "0x%x" % value, "size": size})
    return sorted(records, key=lambda item: (int(item["value"], 16), item["size"]))


def summarize_onload_disassembly(disassembly):
    """Keep only call-level evidence; do not publish raw vendor disassembly."""
    calls = []
    indirect_calls = 0
    instruction_lines = []
    for line in disassembly.splitlines():
        match = re.match(r"^\s*([0-9a-fA-F]+):", line)
        if not match:
            continue
        address = int(match.group(1), 16)
        rest = line.split(":", 1)[1].strip()
        if not rest:
            continue
        # Normalize whitespace and omit runner-specific file/header text so
        # the evidence fingerprint remains stable across CI executions.
        instruction_lines.append("%x:%s" % (address, " ".join(rest.split())))
        fields = rest.split(None, 1)
        mnemonic = fields[0].lower()
        operands = fields[1] if len(fields) > 1 else ""
        is_call = (
            mnemonic.startswith("call")
            or mnemonic in ("bl", "blx", "bl.n", "bl.w", "blx.n", "blx.w")
        )
        if not is_call:
            continue
        target = re.search(r"<([^>]+)>", operands)
        if target:
            name = re.sub(r"\+0x[0-9a-fA-F]+$", "", target.group(1).strip())
            name = re.sub(r"(?:@@Base|@plt|@PLT)$", "", name)
            if name and name != "JNI_OnLoad":
                calls.append(name)
        elif operands.lstrip().startswith("*") or mnemonic.startswith("blx"):
            indirect_calls += 1
    normalized = "\n".join(instruction_lines)
    return {
        "instructionLineCount": len(instruction_lines),
        "directCallTargets": sorted(set(calls)),
        "indirectCallSiteCount": indirect_calls,
        "disassemblySha256": hashlib.sha256(
            normalized.encode("utf-8", errors="replace")
        ).hexdigest(),
    }

def relevant_native_strings(binary_data, declarations):
    """Find class and method names that appear as printable ELF strings."""
    strings = [
        value.decode("ascii", "ignore")
        for value in re.findall(rb"[\x20-\x7e]{4,}", binary_data)
    ]
    found = []
    for method in declarations:
        owner = method.get("class") or ""
        name = method.get("name") or ""
        if not name:
            continue
        owner_path = owner[1:-1] if owner.startswith("L") and owner.endswith(";") else owner
        owner_dot = owner_path.replace("/", ".")
        owner_simple = owner_path.rsplit("/", 1)[-1]
        class_candidates = [
            value for value in strings
            if owner_path in value or owner_dot in value or owner_simple in value
        ]
        method_candidates = [value for value in strings if name in value]
        if class_candidates or method_candidates:
            found.append({
                "class": owner,
                "name": name,
                "classStringCandidates": sorted(set(class_candidates))[:8],
                "methodStringCandidates": sorted(set(method_candidates))[:8],
            })
    return found

def inspect_jni_onload(binary_path, binary_data, records, objdump, declarations):
    evidence = []
    for record in records:
        command = [
            objdump, "-d", "--demangle", "--no-show-raw-insn",
            "--disassemble=JNI_OnLoad", str(binary_path),
        ]
        proc = subprocess.run(
            command, check=False, capture_output=True, text=True, errors="replace"
        )
        if proc.returncode:
            evidence.append({
                **record,
                "status": "disassembly-unavailable",
                "detail": (proc.stderr or proc.stdout).strip()[:300],
                "callSummary": None,
            })
            continue
        summary = summarize_onload_disassembly(proc.stdout)
        evidence.append({
            **record,
            "status": "disassembly-ok",
            "callSummary": summary,
            "candidateNativeMethodStrings": relevant_native_strings(
                binary_data, declarations
            ),
            "interpretation": "Call targets and matching printable strings are leads only; they do not prove RegisterNatives success or invocation.",
        })
    return evidence

def compare_jni_methods(declared, exports):
    declared_names = sorted({item["name"] for item in declared})
    export_names = sorted(set(exports))
    declared_set, export_set = set(declared_names), set(export_names)
    return {
        "declaredNativeMethods": declared_names,
        "exportedJniMethods": export_names,
        "matched": sorted(declared_set & export_set),
        "declaredWithoutExport": sorted(declared_set - export_set),
        "exportedWithoutDexDeclaration": sorted(export_set - declared_set),
        "counts": {
            "declared": len(declared_names),
            "exported": len(export_names),
            "matched": len(declared_set & export_set),
            "declaredWithoutExport": len(declared_set - export_set),
            "exportedWithoutDexDeclaration": len(export_set - declared_set),
        },
        "interpretation": {
            "missingExportProvesRuntimeFailure": False,
            "extraExportProvesStaleCode": False,
            "reason": "JNI exports and DEX declarations are a static name-level comparison; reflection, optional callbacks, and runtime registration are not inferred."
        }
    }


def jni_escape(value):
    result = []
    for char in value:
        if char.isascii() and char.isalnum():
            result.append(char)
        elif char == "/":
            result.append("_")
        elif char == "_":
            result.append("_1")
        elif char == ";":
            result.append("_2")
        elif char == "[":
            result.append("_3")
        else:
            result.append("_0%04x" % ord(char))
    return "".join(result)


def jni_symbol_candidates(class_descriptor, name, signature):
    if not (class_descriptor.startswith("L") and class_descriptor.endswith(";")):
        raise ValueError("invalid declaring class descriptor: %r" % class_descriptor)
    left = signature.find("(")
    right = signature.find(")", left + 1)
    if left < 0 or right < 0:
        raise ValueError("invalid DEX method signature: %r" % signature)
    owner = class_descriptor[1:-1]
    short = "Java_" + jni_escape(owner) + "_" + jni_escape(name)
    long = short + "__" + jni_escape(signature[left + 1:right])
    return {"short": short, "long": long}


def extract_native_declarations(dex_audit):
    methods = []
    for dex_file in dex_audit.get("dexFiles", []):
        for cls in dex_file.get("classes", []):
            for method in cls.get("declaredMethods", []):
                if method.get("accessFlags", 0) & 0x100:
                    methods.append({
                        "class": cls.get("descriptor"),
                        "name": method.get("name"),
                        "signature": method.get("signature"),
                    })
    methods.sort(key=lambda m: (m["class"] or "", m["name"] or "", m["signature"] or ""))
    return methods


def inspect_apk_libraries(apk_path, readelf, objdump="objdump", declarations=None):
    by_abi = {}
    with zipfile.ZipFile(apk_path) as zf, tempfile.TemporaryDirectory(prefix="ro0000-jni-") as temp:
        entries = [
            info for info in zf.infolist()
            if re.fullmatch(r"lib/[^/]+/[^/]+\.so", info.filename)
        ]
        for index, info in enumerate(sorted(entries, key=lambda x: x.filename)):
            _, abi, library_name = info.filename.split("/")
            local_path = pathlib.Path(temp) / ("%04d-%s" % (index, library_name))
            local_path.write_bytes(zf.read(info))
            proc = subprocess.run(
                [readelf, "-Ws", str(local_path)],
                check=False, capture_output=True, text=True, errors="replace"
            )
            if proc.returncode:
                raise RuntimeError("readelf failed for packaged native library %s: %s" %
                                   (info.filename, proc.stderr.strip()))
            binary_data = zf.read(info)
            readelf_output = proc.stdout + "\n" + proc.stderr
            symbols, has_onload = parse_all_jni_symbols(readelf_output)
            onload_records = parse_jni_onload_symbols(readelf_output)
            onload_evidence = []
            if onload_records:
                onload_evidence = inspect_jni_onload(
                    local_path, binary_data, onload_records, objdump, declarations or []
                )
            by_abi.setdefault(abi, []).append({
                "path": info.filename,
                "sha256": hashlib.sha256(binary_data).hexdigest(),
                "byteSize": info.file_size,
                "jniExports": symbols,
                "jniOnLoadExported": has_onload,
                "jniOnLoadEvidence": onload_evidence,
            })
    return by_abi


def compare_all_declarations(declarations, libraries_by_abi):
    output = {}
    for abi, libraries in sorted(libraries_by_abi.items()):
        export_locations = {}
        for library in libraries:
            for symbol in library["jniExports"]:
                export_locations.setdefault(symbol, []).append(library["path"])
        records = []
        for method in declarations:
            candidates = jni_symbol_candidates(method["class"], method["name"], method["signature"])
            matches = []
            for form in ("short", "long"):
                for library in export_locations.get(candidates[form], []):
                    matches.append({
                        "symbol": candidates[form],
                        "form": form,
                        "library": library,
                    })
            class_descriptor = method["class"] or ""
            owner = class_descriptor[1:-1] if class_descriptor.startswith("L") and class_descriptor.endswith(";") else ""
            package_prefix = "Java_" + jni_escape(owner.rsplit("/", 1)[0]) + "_" if "/" in owner else ""
            package_related_libraries = [
                lib["path"] for lib in libraries
                if package_prefix and lib["jniOnLoadExported"]
                and any(symbol.startswith(package_prefix) for symbol in lib["jniExports"])
            ]
            if matches:
                status = "static-export-match"
            elif package_related_libraries:
                status = "no-static-export-package-related-jni-onload"
            else:
                status = "no-static-export-or-package-related-jni-onload"
            records.append({
                **method,
                "jniCandidates": candidates,
                "matches": matches,
                "packageRelatedJniOnLoadLibraries": package_related_libraries,
                "status": status,
            })
        output[abi] = {
            "libraries": libraries,
            "jniOnLoadLibraries": [lib["path"] for lib in libraries if lib["jniOnLoadExported"]],
            "declarations": records,
            "counts": {
                "nativeDeclarations": len(records),
                "staticExportMatched": sum(r["status"] == "static-export-match" for r in records),
                "noStaticExportPackageRelatedJniOnLoad": sum(
                    r["status"] == "no-static-export-package-related-jni-onload" for r in records
                ),
                "noStaticExportOrPackageRelatedJniOnLoad": sum(
                    r["status"] == "no-static-export-or-package-related-jni-onload" for r in records
                ),
                "packagedLibraries": len(libraries),
            },
        }
    declaration_keys = {
        (m["class"], m["name"], m["signature"]) for m in declarations
    }
    per_abi_matches = {
        abi: {
            (m["class"], m["name"], m["signature"])
            for m in data["declarations"] if m["status"] == "static-export-match"
        }
        for abi, data in output.items()
    }
    all_abis = set(output)
    intersections = set.intersection(*(per_abi_matches[a] for a in all_abis)) if all_abis else set()
    unions = set.union(*(per_abi_matches[a] for a in all_abis)) if all_abis else set()
    return {
        "byAbi": output,
        "parity": {
            "abis": sorted(all_abis),
            "staticExportMatchedInEveryAbi": len(intersections),
            "staticExportMatchedInSomeButNotAllAbis": [
                {
                    "class": key[0], "name": key[1], "signature": key[2],
                    "matchedAbis": sorted(abi for abi in all_abis if key in per_abi_matches[abi]),
                }
                for key in sorted(unions - intersections)
            ],
            "declarationCount": len(declaration_keys),
            "note": "Static JNI symbol matches are ABI-specific. Missing symbol names do not prove failure because a library may register natives dynamically or load them through another path."
        }
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dex-audit", required=True)
    parser.add_argument("--apk", required=True, help="Original APK containing all packaged ABI libraries")
    parser.add_argument("--apk-sha256", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--readelf", default="readelf")
    parser.add_argument("--objdump", default="objdump")
    args = parser.parse_args()

    dex_path = pathlib.Path(args.dex_audit)
    apk_path = pathlib.Path(args.apk)
    dex = json.loads(dex_path.read_text(encoding="utf-8"))
    declarations = extract_native_declarations(dex)
    if not declarations:
        raise SystemExit("DEX audit contains no native declarations")
    if not apk_path.is_file():
        raise SystemExit("APK not found: " + str(apk_path))
    apk_digest = hashlib.sha256(apk_path.read_bytes()).hexdigest()
    if apk_digest.lower() != args.apk_sha256.lower():
        raise SystemExit("APK SHA-256 differs from expected target identity")

    libraries = inspect_apk_libraries(apk_path, args.readelf, args.objdump, declarations)
    comparison = compare_all_declarations(declarations, libraries)
    legacy_declarations = [m for m in declarations
                           if m["class"] == "Lcom/newssa/stoneage/ko/JNILibrary;"]
    stoneage_comparison = {}
    for abi, data in comparison["byAbi"].items():
        stoneage_exports = []
        for lib in data["libraries"]:
            if lib["path"].endswith("/libStoneage.so"):
                stoneage_exports.extend(
                    symbol[len(JNI_PREFIX):] for symbol in lib["jniExports"]
                    if symbol.startswith(JNI_PREFIX)
                )
        stoneage_comparison[abi] = compare_jni_methods(legacy_declarations, stoneage_exports)
    result = {
        "format": "ro0000-android-jni-full-apk-audit-v2",
        "source": {"apkSha256": apk_digest},
        "nativeDeclarationCount": len(declarations),
        "classCount": len({m["class"] for m in declarations}),
        "stoneageJniLibraryComparison": stoneage_comparison,
        "allNativeDeclarationComparison": comparison,
        "interpretation": {
            "missingStaticExportProvesRuntimeFailure": False,
            "reason": "A static name match establishes a candidate exported JNI entrypoint only. Dynamic registration, JNI_OnLoad control flow, lazy library loading, reflection, and actual invocation require separate evidence or runtime observation.",
        },
    }
    output = pathlib.Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "format": result["format"],
        "nativeDeclarationCount": len(declarations),
        "classCount": result["classCount"],
        "byAbi": {abi: data["counts"] for abi, data in comparison["byAbi"].items()},
        "output": str(output),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
