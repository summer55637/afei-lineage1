#!/usr/bin/env python3
"""Inspect native ELF metadata embedded in the RO0000 Android APK.

This static audit inventories ELF metadata and optionally disassembles focused
map/resource functions. Disassembly excerpts are leads, not semantic proof.
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

FOCUSED_FUNCTION_RE = re.compile(
    r"^(?:AdrnInit|adrnDecode|readHitMap|checkHitMap|checkEmptyMap(?:Data)?|"
    r"_checkEmptyMap|realGet[A-Za-z]*|LoadSprbin|InitSprBinFileOpen|"
    r"InitPteernSeparationBin|LoadStoneAgeLUA(?:Path)?|ReLoadStoneAgeLUA|"
    r"myluaload|DownLoadIniFile|GetBinaryResource|UpdateAppNewVersion|DownloadResource|"
    r"(?:[A-Za-z_]\w*::)*ReadPatchInfo|(?:[A-Za-z_]\w*::)*(?:DownloadFile|UnZipFile)|"
    r"initResources|loadResources|cleanupRealbin|"
    r"SDL_main|Java_com_newssa_stoneage_ko_JNILibrary_callbackKeyboardChange|"
    r"EventProc|GameMain|DispCallProc|networkLoop|ScriptRunningProcess|Process|"
    r"ScrollPanelProcess|NextScrollPanelRender|AniProc|MouseProc|HitMouseCursor|"
    r"ClearMouseOnceState|InitProc|GetKeyInputFocus|Keyboard(?:Tab|BackSpace|Left|Right|Return)|"
    r"MouseNowPoint|Mouse(?:DblCrick|Crick)(?:Left|Right)(?:Up|Down)Point|"
    r"CleanMouseClick|CheckWndMouse|changeInput|keyBoard(?:Get|Set|Proc|Init)[A-Za-z]*|"
    r"moveProc|onceMoveProc|partyMoveProc|_execEtcEvent|_etcEventCheck|"
    r"_sendWarpEvent|_sendEnemyEvent|_checkEnemyEvent|_checkWarpEvent|warpEffectProc|"
    r"initMap|readMap|writeMap|createMap|setMap|resetMap|redrawMap|drawMap2|drawMapUi|"
    r"lssproto_[A-Za-z0-9_]+_recv|ReadBattleMap|StockDispBuffer|PutBmp|LoadBmp|"
    r"decoderPng|decoder|ReadAniFile|SpecAnim|play_map_bgm|drawMap|setEventMemory|"
    r"DrawBattleMap|ddrawBattleMap|PutTileBmp|DrawAutoMapping|MakeHitBox|MakeAnimDisp|"
    r"getRouteMap|updateMapArea|setMapMovePoint2|setMapMovePoint|_setMapMovePoint|"
    r"_mapMove|mapMove2|_partyMapMove|mapCheckSum|getMapArea(?:Cnt|X1|X2|Y1|Y2)|"
    r"createAutoMap|initAutoMapColor|makeAutoMapColor|getAutoMapColor|readAutoMapColor|writeAutoMapColor|"
    r"initWorldMap|worldMapProc|EndWarpMap|setWarpMap|mapWndProc|drawAutoMap|"
    r"initMapEffect|mapEffectProc2|mapEffectRain2|mapEffectSnow2|mapEffectStar|"
    r"mapEffectRain|mapEffectSnow|mapEffectKamiFubuki|mapEffectFallingStar|getMapEffectBuf|delMapEffectBuf|"
    r"DrawMapEffect|drawMapEffect|mapEffectProc|HotUpdatePutbmp|InitSpriteInfo|"
    r"FreeGetBattleMap)(?:\s*\(|$)",
    re.IGNORECASE,
)

FOCUSED_OBJECTS = {
    "BattleMapFile", "MapWmdFlagBak", "MaxAdrnID", "RealBinHeight",
    "RealBinWidth", "Realbinfp", "adrnbuff", "hitMap", "nextMaxAdrnID",
    "pRealBinBits", "autoMappingBuf", "autoMappingInitFlag", "fMapBgm",
    "fMapHeight", "fMapWidth", "mapAreaHeight", "mapAreaWidth",
    "mapAreaX1", "mapAreaX2", "mapAreaY1", "mapAreaY2", "mapConfigData",
    "mapEffectDrawFlag", "mapEffectFallingStarFlag", "mapEffectFallingStarTime",
    "mapEffectKamiFubukiCnt", "mapEffectKamiFubukiLevel", "mapEffectMoveDir",
    "mapEffectRainCnt", "mapEffectRainLevel", "mapEffectSnowCnt",
    "mapEffectSnowLevel", "mapEffectStarFlag", "mapEmptyDir", "mapEmptyFlag",
    "mapEmptyGx", "mapEmptyGy", "mapEmptyStartTime", "masterBufMapEffect",
    "oldMapEffectRainLevel", "oldMapEffectSnowLevel", "useBufMapEffect",
    "mouse", "pc", "nowFloor", "nowFloorGxSize", "nowFloorGySize",
    "mouseCursorMode", "mouseMapX", "mouseMapY", "mouseMapGx", "mouseMapGy",
    "ShowMouseFlg", "mouseLeftCrick", "mouseLeftOn", "mouseRightCrick", "mouseRightOn",
    "mouseLeftPushTime", "beforeMouseLeftPushTime", "moveRouteCnt", "moveRouteCnt2",
    "moveStackFlag", "moveStackGx", "moveStackGy", "moveRoute2", "moveRoute",
    "moveRouteGx", "moveRouteGy", "moveRouteDir", "moveAddTbl", "moveLastDir",
    "charObjMoveFlag", "floorChangeFlag", "eventWarpSendFlag", "eventWarpSendId",
    "eventEnemySendFlag", "eventEnemySendId", "eventId", "_etcEventFlag",
    "_etcEventStep", "_etcEventMode", "_eventWarpNo", "_warpEventFlag",
    "_enemyEventFlag", "_enemyEventDir", "etcEventFlag", "npcPromptFlag",
    "userMessageEventType", "mapCenterX", "mapCenterY", "draw_map_bgm_flg",
    "map_bgm_no", "autoMapColorTbl",
}


def parse_elf_header(data):
    if len(data) < 16 or data[:4] != b"\x7fELF":
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
    return sorted(set(re.findall(r"Shared library: \[(.*?)\]", readelf_text)))


def parse_symbol_records(readelf_text):
    records = []
    for line in readelf_text.splitlines():
        fields = line.split()
        if len(fields) < 8 or not fields[0].endswith(":"):
            continue
        if not fields[0][:-1].isdigit():
            continue
        try:
            size = int(fields[2], 10)
            value = int(fields[1], 16)
        except ValueError:
            continue
        records.append({
            "value": value,
            "size": size,
            "type": fields[3],
            "bind": fields[4],
            "visibility": fields[5],
            "section": fields[6],
            "name": fields[7].split("@", 1)[0],
        })
    return records


def parse_symbols(readelf_text):
    undefined = set()
    exported = set()
    for record in parse_symbol_records(readelf_text):
        if record["section"] == "UND":
            undefined.add(record["name"])
        elif record["bind"] in ("GLOBAL", "WEAK") and record["visibility"] == "DEFAULT":
            exported.add(record["name"])
    return sorted(undefined), sorted(exported)


def relevant_embedded_strings(data):
    """Return bounded ASCII/UTF-16LE strings related to map/resource paths."""
    runs = [value.decode("ascii", "ignore")
            for value in re.findall(rb"[\x20-\x7e]{4,}", data)]
    runs += [value[::2].decode("ascii", "ignore")
             for value in re.findall(rb"(?:[\x20-\x7e]\x00){4,}", data)]
    pattern = re.compile(
        r"(?i)(?:map4|/(?:adrn|real|spr|spradrn)[.]bin|data/update/list[.]dat)"
    )
    return sorted({
        value for value in runs
        if len(value) <= 200 and pattern.search(value)
    })[:100]


def relevant_symbol_names(names):
    markers = (
        "adrn", "realbin", "realget", "hitmap", "loadsprbin", "downloadresource",
        "battlemapfile", "maxadrnid", "mapwmflag", "mapwidth", "mapheight",
        "maparea", "mapconfig", "mapempty", "automap", "drawmap", "mapwarp",
        "mapbgm", "mapeffect", "mapmove", "getmap", "setmap", "initmap", "shiftmap", "loadmap",
    )
    return sorted(name for name in names
                  if name in IO_API_HINTS or any(marker in name.lower() for marker in markers))


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


def demangle_names(cxxfilt, names):
    if not cxxfilt or not names:
        return {name: name for name in names}
    result = subprocess.run(
        [cxxfilt], input="\n".join(names) + "\n",
        check=False, capture_output=True, text=True, errors="replace"
    )
    if result.returncode:
        return {name: name for name in names}
    demangled = result.stdout.splitlines()
    if len(demangled) != len(names):
        return {name: name for name in names}
    return dict(zip(names, demangled))


def focused_symbol_records(records, cxxfilt):
    names = sorted(set(r["name"] for r in records
                       if r["section"] != "UND"
                       and r["bind"] in ("GLOBAL", "WEAK")
                       and r["visibility"] == "DEFAULT"))
    demangled = demangle_names(cxxfilt, names)
    result = []
    seen = set()
    for record in records:
        name = record["name"]
        if record["section"] == "UND" or record["bind"] not in ("GLOBAL", "WEAK"):
            continue
        if record["visibility"] != "DEFAULT":
            continue
        display = demangled.get(name, name)
        is_focus = (
            record["type"] == "FUNC" and bool(FOCUSED_FUNCTION_RE.match(display))
        ) or (record["type"] in ("OBJECT", "NOTYPE") and name in FOCUSED_OBJECTS)
        key = (name, record["value"], record["type"])
        if is_focus and key not in seen:
            seen.add(key)
            result.append({
                "name": name,
                "demangled": display,
                "type": record["type"],
                "value": "0x%x" % record["value"],
                "size": record["size"],
            })
    return sorted(result, key=lambda item: (int(item["value"], 16), item["name"]))


def select_disassembler():
    llvm = shutil.which("llvm-objdump")
    if llvm:
        return {"path": llvm, "kind": "llvm"}
    objdump = shutil.which("objdump")
    if objdump:
        return {"path": objdump, "kind": "gnu"}
    return None


def disassemble_function(disassembler, binary_path, symbol, machine_id):
    if not disassembler:
        return {"status": "unavailable"}
    start = int(symbol["value"], 16)
    if machine_id == 40:
        start &= ~1  # ARM ELF function values may carry the Thumb state bit.
    stop = start + max(int(symbol["size"]), 1)
    command = [
        disassembler["path"], "-d", "--demangle",
        "--start-address=0x%x" % start,
        "--stop-address=0x%x" % stop,
        str(binary_path),
    ]
    result = subprocess.run(
        command, check=False, capture_output=True, text=True, errors="replace"
    )
    if result.returncode:
        return {
            "status": "unsupported-or-error",
            "detail": (result.stderr or result.stdout).strip()[:600],
        }
    lines = result.stdout.splitlines()
    instruction_re = re.compile(r"\s*[0-9a-fA-F]+:\s")
    instruction_count = sum(1 for line in lines if instruction_re.match(line))
    if not instruction_count:
        return {
            "status": "no-instruction-output",
            "detail": "\n".join(lines[:8])[:600],
        }
    limit = 10000
    return {
        "status": "ok",
        "instructionLineCount": instruction_count,
        "disassemblyLineCount": len(lines),
        "disassemblySha256": hashlib.sha256(result.stdout.encode("utf-8", errors="replace")).hexdigest(),
        "excerpt": lines[:limit],
        "excerptTruncated": len(lines) > limit,
    }


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def inspect_library(zip_file, info, readelf, cxxfilt, disassembler, temp_dir):
    data = zip_file.read(info)
    header = parse_elf_header(data)
    abi = info.filename.split("/")[1] if len(info.filename.split("/")) > 2 else ""
    expected_machine = ABI_MACHINES.get(abi)
    binary_path = pathlib.Path(temp_dir) / (abi + "-libStoneage.so")
    binary_path.write_bytes(data)

    dynamic = run_readelf(readelf, "-dW", binary_path) if readelf else ""
    symbols = run_readelf(readelf, "-Ws", binary_path) if readelf else ""
    notes = run_readelf(readelf, "-nW", binary_path) if readelf else ""
    records = parse_symbol_records(symbols)
    undefined, exported = parse_symbols(symbols)
    focused = focused_symbol_records(records, cxxfilt)
    functions = [
        item for item in focused
        if item["type"] == "FUNC"
    ]
    for item in functions:
        item["disassembly"] = disassemble_function(
            disassembler, binary_path, item, header["machineId"]
        )
    build_id_match = re.search(r"Build ID: ([0-9a-fA-F]+)", notes)

    path_candidates = resource_name_candidates(data)
    embedded_relevant_strings = relevant_embedded_strings(data)
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
        "focusedSymbols": focused,
        "mapResourcePathCandidates": map_resource_candidates,
        "embeddedRelevantStrings": embedded_relevant_strings,
        "readelfAvailable": bool(readelf),
        "cxxfiltAvailable": bool(cxxfilt),
        "disassembler": disassembler["path"] if disassembler else None,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apk", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument(
        "--extract-dir",
        default=None,
        help="Optionally copy embedded libStoneage.so files under this directory",
    )
    args = parser.parse_args()

    apk = pathlib.Path(args.apk)
    digest = hashlib.sha256()
    with apk.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)

    readelf = shutil.which("readelf")
    cxxfilt = shutil.which("c++filt")
    disassembler = select_disassembler()
    with zipfile.ZipFile(apk) as zf:
        libraries = sorted(
            (info for info in zf.infolist()
             if re.fullmatch(r"lib/[^/]+/libStoneage\.so", info.filename)),
            key=lambda info: info.filename
        )
        if not libraries:
            raise SystemExit("no libStoneage.so entries found in APK")
        extract_dir = pathlib.Path(args.extract_dir) if args.extract_dir else None
        if extract_dir:
            for info in libraries:
                relative = pathlib.Path(*info.filename.split("/")[1:])
                destination = extract_dir / relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(zf.read(info))
        with tempfile.TemporaryDirectory(prefix="ro0000-native-") as temp_dir:
            results = [
                inspect_library(zf, info, readelf, cxxfilt, disassembler, temp_dir)
                for info in libraries
            ]

    result = {
        "format": "ro0000-android-native-elf-audit-v1",
        "auditedApk": {
            "path": str(apk),
            "fileBytes": apk.stat().st_size,
            "sha256": digest.hexdigest(),
        },
        "analysisTools": {
            "readelf": readelf,
            "cxxfilt": cxxfilt,
            "disassembler": disassembler["path"] if disassembler else None,
        },
        "nativeLibraries": results,
        "interpretationBoundary": [
            "ELF headers, dynamic dependencies, symbol names, and embedded path strings are static observations.",
            "Function disassembly is limited to named symbol ranges and does not establish callers or runtime behavior.",
            "An imported file API does not identify which resource it opens.",
            "A path string does not prove the referenced file is packaged, downloaded, or successfully loaded.",
            "This report does not establish map tile layout, collision, or walkability semantics.",
        ],
    }
    output = pathlib.Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "format": result["format"],
        "apkSha256": result["auditedApk"]["sha256"],
        "libraries": [{
            "path": item["path"],
            "elf": item["elf"],
            "neededLibraries": item["neededLibraries"],
            "focusedSymbols": [
                {"name": symbol["name"], "demangled": symbol["demangled"],
                 "value": symbol["value"], "size": symbol["size"],
                 "disassemblyStatus": symbol.get("disassembly", {}).get("status")}
                for symbol in item["focusedSymbols"]
            ],
            "mapResourcePathCandidates": item["mapResourcePathCandidates"],
        } for item in results],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
