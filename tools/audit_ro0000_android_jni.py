#!/usr/bin/env python3
"""Cross-check app JNILibrary native declarations against libStoneage JNI exports."""
import argparse
import json
import pathlib
import re
import subprocess

JNI_PREFIX = "Java_com_newssa_stoneage_ko_JNILibrary_"


def parse_jni_exports(readelf_output):
    exports = set()
    for line in readelf_output.splitlines():
        match = re.search(r"\b(Java_com_newssa_stoneage_ko_JNILibrary_[A-Za-z0-9_]+)\s*$", line)
        if match:
            exports.add(match.group(1)[len(JNI_PREFIX):])
    return sorted(exports)


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


def _run_exports(readelf, library):
    proc = subprocess.run([readelf, "-Ws", str(library)], check=True, capture_output=True, text=True)
    return parse_jni_exports(proc.stdout + "\n" + proc.stderr)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dex-audit", required=True)
    parser.add_argument("--apk-sha256", required=True)
    parser.add_argument("--x86-lib", required=True)
    parser.add_argument("--arm-lib", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--readelf", default="readelf")
    args = parser.parse_args()

    dex_path = pathlib.Path(args.dex_audit)
    dex = json.loads(dex_path.read_text(encoding="utf-8"))
    jnilibrary = []
    for dex_file in dex.get("dexFiles", []):
        for cls in dex_file.get("classes", []):
            if cls.get("descriptor") == "Lcom/newssa/stoneage/ko/JNILibrary;":
                jnilibrary = [
                    method for method in cls.get("declaredMethods", [])
                    if method.get("accessFlags", 0) & 0x100
                ]
                break
    if not jnilibrary:
        raise SystemExit("DEX audit contains no JNILibrary native declarations")

    libs = [
        ("armeabi-v7a", pathlib.Path(args.arm_lib)),
        ("x86", pathlib.Path(args.x86_lib)),
    ]
    result = {
        "format": "ro0000-android-jni-declaration-export-audit-v1",
        "source": {"apkSha256": args.apk_sha256},
        "class": "com.newssa.stoneage.ko.JNILibrary",
        "comparison": {},
        "conclusion": {},
        "scope": "JNI symbol-name comparison against each ABI's libStoneage.so; does not include SDL/GCloud vendor libraries."
    }
    for abi, library in libs:
        if not library.is_file():
            raise SystemExit("Native library not found: " + str(library))
        exports = _run_exports(args.readelf, library)
        result["comparison"][abi] = compare_jni_methods(jnilibrary, exports)

    x86 = result["comparison"]["x86"]
    arm = result["comparison"]["armeabi-v7a"]
    result["conclusion"] = {
        "abiExportSetsEqual": x86["exportedJniMethods"] == arm["exportedJniMethods"],
        "dexDeclarationSetEqual": x86["declaredNativeMethods"] == arm["declaredNativeMethods"],
        "stableExportedWithoutDexDeclarationAcrossBothAbis": sorted(
            set(x86["exportedWithoutDexDeclaration"]) & set(arm["exportedWithoutDexDeclaration"])
        ),
        "stableDeclaredWithoutExportAcrossBothAbis": sorted(
            set(x86["declaredWithoutExport"]) & set(arm["declaredWithoutExport"])
        )
    }
    output = pathlib.Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "format": result["format"],
        "conclusion": result["conclusion"],
        "counts": {abi: data["counts"] for abi, data in result["comparison"].items()},
        "output": str(output)
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
