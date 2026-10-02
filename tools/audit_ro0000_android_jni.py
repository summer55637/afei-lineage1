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


def inspect_apk_libraries(apk_path, readelf):
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
            symbols, has_onload = parse_all_jni_symbols(proc.stdout + "\n" + proc.stderr)
            by_abi.setdefault(abi, []).append({
                "path": info.filename,
                "sha256": hashlib.sha256(zf.read(info)).hexdigest(),
                "byteSize": info.file_size,
                "jniExports": symbols,
                "jniOnLoadExported": has_onload,
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

    libraries = inspect_apk_libraries(apk_path, args.readelf)
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
