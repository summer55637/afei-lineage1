#!/usr/bin/env python3
"""Inspect native ELF metadata embedded in the RO0000 Android APK.

This is a static inventory, not a decompiler: imported APIs and embedded path
strings are leads, not proof of their runtime call relationships or semantics.
"""
import argparse
import hashlib
import json
import pathlib
import re
import shutil
import struct
import subprocess
import tempfile
import zipfile

from audit_ro0000_android_apk import resource_name_candidates

ELF_MACHINES = {
    3: "Intel 80386",
    40: "ARM",
    62: "AMD x86-64",
    183: "AArch64",
}

ABI_MACHINES = {
    "armeabi-v7a": 40,
    "x86": 3,
    "arm64-v8a": 183,
    "x86_64": 62,
}

IO_API_HINTS = {
    "access", "close", "fclose", "fdopen", "fopen", "fopen64", "fread",
    "fseek", "fseeko", "ftell", "ftello", "lseek", "lseek64", "mmap",
    "munmap", "open", "open64", "openat", "opendir", "pread", "pread64",
    "read", "readdir", "stat", "lstat", "SDL_RWFromFile", "SDL_RWread",
    "SDL_RWseek", "SDL_RWtell", "SDL_LoadBMP_RW",
}


def parse_elf_header(data):
    if len(data) < 16 or data[:4] != b"\\x7fELF":
        raise ValueError("not an ELF file")
    elf_class, data_encoding = data[4], data[5]
    if elf_class not in (1, 2):
        raise ValueError("unsupported ELF class: %r" % elf_class)
    if data_encoding not in (1, 2):
        raise ValueError("unsupported ELF byte order: %r" % data_encoding)
    header_size = 52 if elf_class == 1 else 64
    if len(data) < header_size:
        raise ValueError("truncated ELF header")
    endian = "<" if data_encoding == 1 else ">"
    elf_type, machine, version = struct.unpack_from(endian + "HHI", data, 16)
    if elf_class == 1:
        entry = struct.unpack_from(endian + "I", data, 24)[0]
    else:
        entry = struct.unpack_from(endian + "Q", data, 24)[0]
    return {
        "class": "ELF32" if elf_class == 1 else "ELF64",
        "endianness": "little" if data_encoding == 1 else "big",
        "osAbi": data[7],
        "type": elf_type,
        "machineId": machine,
        "machine": ELF_MACHINES.get(machine, "unknown"),
        "version": version,
        "entryPoint": entry,
    }


def parse_needed_libraries(readelf_text):
    return sorted(set(re.findall(r"Shared library: \\[([^]]+)\\]", readelf_text)))


def parse_symbols(readelf_text):
    undefined = set()
    exported = set()
    for line in readelf_text.splitlines():
        fields = line.split()
        if len(fields) < 8 or not fields[0].endswith(":"):
            continue
        if not fields[0][:-1].isdigit():
            continue
        bind, visibility, section, name = fields[4], fields[5], fields[6], fields[7]
        if not name or name == "0":
            continue
        name = name.split("@", 1)[0]
        if section == "UND":
            undefined.add(name)
        elif bind in ("GLOBAL", "WEAK") and visibility == "DEFAULT":
            exported.add(name)
    return sorted(undefined), sorted(exported)


def relevant_symbol_names(names):
    keywords = ("map", "real", "adrn", "spr", "asset", "resource", "update")
    return sorted(name for name in names
                  if name in IO_API_HINTS or any(word in name.lower() for word in keywords))


def run_readelf(readelf, option, binary_path):
    if not readelf:
        return ""
    result = subprocess.run(
        [readelf, option, str(binary_path)],
        check=False, capture_output=True, text=True, errors="replace"
    )
    if result.returncode:
        raise RuntimeError("readelf %s failed: %s" % (option, result.stderr.strip()))
    return result.stdout


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def inspect_library(zip_file, info, readelf, temp_dir):
    data = zip_file.read(info)
    header = parse_elf_header(data)
    abi = info.filename.split("/")[1] if len(info.filename.split("/")) > 2 else ""
    expected_machine = ABI_MACHINES.get(abi)
    binary_path = pathlib.Path(temp_dir) / (abi + "-libStoneage.so")
    binary_path.write_bytes(data)

    dynamic = run_readelf(readelf, "-dW", binary_path) if readelf else ""
    symbols = run_readelf(readelf, "-Ws", binary_path) if readelf else ""
    notes = run_readelf(readelf, "-nW", binary_path) if readelf else ""
    undefined, exported = parse_symbols(symbols)
    build_id_match = re.search(r"Build ID: ([0-9a-fA-F]+)", notes)

    path_candidates = resource_name_candidates(data)
    map_resource_candidates = [
        value for value in path_candidates
        if any(marker in value.lower() for marker in
               ("map4", "real.bin", "adrn.bin", "spr.bin", "spradrn", "update/list"))
    ]
    return {
        "path": info.filename,
        "abi": abi,
        "fileBytes": len(data),
        "sha256": sha256_bytes(data),
        "elf": header,
        "abiMachineMatches": expected_machine is None or header["machineId"] == expected_machine,
        "buildId": build_id_match.group(1).lower() if build_id_match else None,
        "neededLibraries": parse_needed_libraries(dynamic),
        "undefinedIoAndResourceSymbols": relevant_symbol_names(undefined),
        "exportedMapAndResourceSymbols": relevant_symbol_names(exported),
        "mapResourcePathCandidates": map_resource_candidates,
        "readelfAvailable": bool(readelf),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apk", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    apk = pathlib.Path(args.apk)
    digest = hashlib.sha256()
    with apk.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)

    readelf = shutil.which("readelf")
    with zipfile.ZipFile(apk) as zf:
        libraries = sorted(
            (info for info in zf.infolist()
             if re.fullmatch(r"lib/[^/]+/libStoneage\\.so", info.filename)),
            key=lambda info: info.filename
        )
        if not libraries:
            raise SystemExit("no libStoneage.so entries found in APK")
        with tempfile.TemporaryDirectory(prefix="ro0000-native-") as temp_dir:
            results = [inspect_library(zf, info, readelf, temp_dir) for info in libraries]

    result = {
        "format": "ro0000-android-native-elf-audit-v1",
        "auditedApk": {
            "path": str(apk),
            "fileBytes": apk.stat().st_size,
            "sha256": digest.hexdigest(),
        },
        "analysisTools": {
            "readelf": readelf,
            "disassembler": None,
        },
        "nativeLibraries": results,
        "interpretationBoundary": [
            "ELF headers, dynamic dependencies, symbol names, and embedded path strings are static observations.",
            "An imported file API does not identify which resource it opens.",
            "A path string does not prove the referenced file is packaged, downloaded, or successfully loaded.",
            "This report does not establish map tile layout, collision, or walkability semantics.",
        ],
    }
    output = pathlib.Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\\n", encoding="utf-8")
    print(json.dumps({
        "format": result["format"],
        "apkSha256": result["auditedApk"]["sha256"],
        "libraries": [{
            "path": item["path"],
            "elf": item["elf"],
            "neededLibraries": item["neededLibraries"],
            "ioSymbolCount": len(item["undefinedIoAndResourceSymbols"]),
            "mapResourcePathCandidates": item["mapResourcePathCandidates"],
        } for item in results],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
