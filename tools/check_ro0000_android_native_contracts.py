#!/usr/bin/env python3
"""Validate Android native behavior contract anchors against the audited ELF symbols."""
import argparse
import json
import re
import unittest
from pathlib import Path


ABI_KEYS = {
    "x86": "x86",
    "armeabiV7a": "armeabi-v7a",
}


def normalized(value):
    return re.sub(r"\s+", "", str(value or ""))


def function_matches(symbol, expected):
    expected = normalized(expected)
    demangled = normalized(symbol.get("demangled"))
    raw = normalized(symbol.get("name"))
    base = expected.split("(", 1)[0]
    if raw == expected or demangled == expected:
        return True
    return demangled.startswith(base + "(") or raw.startswith(base + "(")


def collect_function_entries(document):
    entries = []

    def visit(value, path="$"):
        if isinstance(value, dict):
            function = value.get("function")
            address = value.get("address")
            if isinstance(function, str) and isinstance(address, dict):
                entries.append((path, function, address))
            for key, child in value.items():
                visit(child, path + "." + key)
        elif isinstance(value, list):
            for i, child in enumerate(value):
                visit(child, f"{path}[{i}]")

    visit(document)
    return entries


def validate_contracts(native, contracts):
    errors = []
    if native.get("auditedApk", {}).get("sha256") is None:
        errors.append("native audit missing APK SHA-256")
    libs = {lib.get("abi"): lib for lib in native.get("nativeLibraries", [])}
    if set(ABI_KEYS.values()) - set(libs):
        errors.append("native audit missing required ABI: " + ", ".join(sorted(set(ABI_KEYS.values()) - set(libs))))
    for contract_name, contract in contracts:
        source = contract.get("source", {})
        for key, abi in ABI_KEYS.items():
            expected_source = source.get(key, {})
            lib = libs.get(abi)
            if not lib:
                continue
            if expected_source.get("sha256") != lib.get("sha256"):
                errors.append(f"{contract_name}: {abi} SHA-256 does not match audited ELF")
            if expected_source.get("buildId") != lib.get("buildId"):
                errors.append(f"{contract_name}: {abi} build ID does not match audited ELF")
        symbols = {
            abi: (lib.get("focusedSymbols", []) if lib else [])
            for abi, lib in libs.items()
        }
        for path, function, addresses in collect_function_entries(contract):
            for key, abi in ABI_KEYS.items():
                expected_address = addresses.get(key)
                if expected_address is None:
                    errors.append(f"{contract_name}:{path}: missing address for {key}")
                    continue
                expected_value = int(str(expected_address), 0)
                matches = [s for s in symbols.get(abi, []) if s.get("type") == "FUNC" and function_matches(s, function)]
                if not matches:
                    errors.append(f"{contract_name}:{path}: {abi} function not present in focused ELF symbols: {function}")
                    continue
                if expected_value not in {int(str(s.get("value", "0")), 0) for s in matches}:
                    actual = ", ".join(s.get("value", "?") for s in matches)
                    errors.append(f"{contract_name}:{path}: {abi} address mismatch for {function}: expected {expected_address}, found {actual}")
    return errors


def validate_resource_function_anchors(native, layout):
    errors = []
    apk_sha = native.get("auditedApk", {}).get("sha256")
    libs = {lib.get("abi"): lib for lib in native.get("nativeLibraries", [])}
    for section_name in ("autoMapColor", "autoMapRendering", "worldMapRuntime"):
        section = layout.get(section_name)
        if not isinstance(section, dict):
            errors.append(f"resource layout missing {section_name}")
            continue
        source = section.get("source", {})
        if source.get("apkSha256") != apk_sha:
            errors.append(f"{section_name}: APK SHA-256 does not match native audit")
        expected_libraries = source.get("libraries", {})
        for abi_key, abi in ABI_KEYS.items():
            expected = expected_libraries.get(abi)
            lib = libs.get(abi)
            if not isinstance(expected, dict):
                errors.append(f"{section_name}: missing source library identity for {abi}")
                continue
            if not lib:
                continue
            if expected.get("sha256") != lib.get("sha256"):
                errors.append(f"{section_name}: {abi} SHA-256 does not match audited ELF")
            if expected.get("buildId") != lib.get("buildId"):
                errors.append(f"{section_name}: {abi} build ID does not match audited ELF")

        functions = section.get("functions", {})
        if not isinstance(functions, dict) or not functions:
            errors.append(f"{section_name}: missing function anchors")
            continue
        for function, addresses in functions.items():
            if not isinstance(addresses, dict):
                errors.append(f"{section_name}: malformed address map for {function}")
                continue
            for abi_key, abi in ABI_KEYS.items():
                expected_address = addresses.get(abi_key)
                if expected_address is None:
                    errors.append(f"{section_name}: missing {abi_key} address for {function}")
                    continue
                lib = libs.get(abi)
                if not lib:
                    continue
                matches = [
                    symbol for symbol in lib.get("focusedSymbols", [])
                    if symbol.get("type") == "FUNC" and function_matches(symbol, function)
                ]
                if not matches:
                    errors.append(f"{section_name}: {abi} function not present in focused ELF symbols: {function}")
                    continue
                expected_value = int(str(expected_address), 0)
                if expected_value not in {
                    int(str(symbol.get("value", "0")), 0) for symbol in matches
                }:
                    actual = ", ".join(symbol.get("value", "?") for symbol in matches)
                    errors.append(
                        f"{section_name}: {abi} address mismatch for {function}: "
                        f"expected {expected_address}, found {actual}"
                    )
    for function, required_targets in section.get("requiredCallCounts", {}).items():
            if function not in functions:
                errors.append(f"{section_name}: call evidence references unknown function {function}")
                continue
            for abi_key, abi in ABI_KEYS.items():
                lib = libs.get(abi)
                if not lib:
                    continue
                matches = [
                    symbol for symbol in lib.get("focusedSymbols", [])
                    if symbol.get("type") == "FUNC" and function_matches(symbol, function)
                ]
                if not matches:
                    continue
                symbol = matches[0]
                disassembly = symbol.get("disassembly") or {}
                if disassembly.get("status") != "ok" or disassembly.get("excerptTruncated", False):
                    errors.append(f"{section_name}: missing complete disassembly for call evidence {abi}/{function}")
                    continue
                call_lines = [
                    line for line in disassembly.get("excerpt", [])
                    if re.search(r"\b(?:blx?(?:\.[a-z]+)?|call\w*)\b", line, re.I)
                ]
                for target, minimum in required_targets.items():
                    actual = sum(1 for line in call_lines if target.lower() in line.lower())
                    if not isinstance(minimum, int) or minimum < 1:
                        errors.append(f"{section_name}: invalid required call count for {function}/{target}")
                    elif actual < minimum:
                        errors.append(
                            f"{section_name}: {abi} call evidence count too low for "
                            f"{function}/{target}: expected at least {minimum}, found {actual}"
                        )
    return errors


class NativeContractTests(unittest.TestCase):
    def test_function_matching_accepts_demangled_and_jni_names(self):
        self.assertTrue(function_matches(
            {"name": "_Z8GameMainv", "demangled": "GameMain()"}, "GameMain"
        ))
        self.assertTrue(function_matches(
            {"name": "SDL_main", "demangled": "SDL_main"}, "SDL_main"
        ))
        self.assertTrue(function_matches(
            {
                "name": "Java_com_newssa_stoneage_ko_JNILibrary_callbackKeyboardChange",
                "demangled": "Java_com_newssa_stoneage_ko_JNILibrary_callbackKeyboardChange",
            },
            "Java_com_newssa_stoneage_ko_JNILibrary_callbackKeyboardChange",
        ))
        self.assertTrue(function_matches(
            {"name": "_Z15setMapMovePoint2ii", "demangled": "setMapMovePoint2(int, int)"},
            "setMapMovePoint2(int,int)",
        ))

    def test_contract_address_and_build_identity_are_checked(self):
        native = {
            "auditedApk": {"sha256": "apk-hash"},
            "nativeLibraries": [
                {
                    "abi": "x86", "sha256": "x86-hash", "buildId": "x86-build",
                    "focusedSymbols": [{"type": "FUNC", "name": "_Z8GameMainv",
                                        "demangled": "GameMain()", "value": "0x1000"}],
                },
                {
                    "abi": "armeabi-v7a", "sha256": "arm-hash", "buildId": "arm-build",
                    "focusedSymbols": [{"type": "FUNC", "name": "_Z8GameMainv",
                                        "demangled": "GameMain()", "value": "0x2001"}],
                },
            ],
        }
        contract = {
            "source": {
                "x86": {"sha256": "x86-hash", "buildId": "x86-build"},
                "armeabiV7a": {"sha256": "arm-hash", "buildId": "arm-build"},
            },
            "loop": {"function": "GameMain", "address": {"x86": "0x1000", "armeabiV7a": "0x2001"}},
        }
        self.assertEqual(validate_contracts(native, [("fixture", contract)]), [])

        contract["loop"]["address"]["x86"] = "0x1001"
        errors = validate_contracts(native, [("fixture", contract)])
        self.assertTrue(any("address mismatch" in error for error in errors))

    def test_resource_layout_function_anchors_validate_both_abis(self):
        native = {
            "auditedApk": {"sha256": "apk-hash"},
            "nativeLibraries": [
                {"abi": "x86", "sha256": "x86-hash", "buildId": "x86-build",
                 "focusedSymbols": [
                     {"type": "FUNC", "name": "createAutoMap", "demangled": "createAutoMap(int,int,int)", "value": "0x1000"},
                     {"type": "FUNC", "name": "DrawAutoMapping", "demangled": "DrawAutoMapping(int,int,unsigned char*,int,int)", "value": "0x2000"},
                 ]},
                {"abi": "armeabi-v7a", "sha256": "arm-hash", "buildId": "arm-build",
                 "focusedSymbols": [
                     {"type": "FUNC", "name": "createAutoMap", "demangled": "createAutoMap(int,int,int)", "value": "0x3001"},
                     {"type": "FUNC", "name": "DrawAutoMapping", "demangled": "DrawAutoMapping(int,int,unsigned char*,int,int)", "value": "0x4001"},
                 ]},
            ],
        }
        layout = {
            "autoMapColor": {
                "source": {
                    "apkSha256": "apk-hash",
                    "libraries": {
                        "x86": {"sha256": "x86-hash", "buildId": "x86-build"},
                        "armeabi-v7a": {"sha256": "arm-hash", "buildId": "arm-build"},
                    },
                },
                "functions": {"createAutoMap": {"x86": "0x1000", "armeabiV7a": "0x3001"}},
            },
            "autoMapRendering": {
                "source": {
                    "apkSha256": "apk-hash",
                    "libraries": {
                        "x86": {"sha256": "x86-hash", "buildId": "x86-build"},
                        "armeabi-v7a": {"sha256": "arm-hash", "buildId": "arm-build"},
                    },
                },
                "functions": {"DrawAutoMapping": {"x86": "0x2000", "armeabiV7a": "0x4001"}},
            },
        }
        world_functions = {
            "initWorldMap": {"x86": "0x5000", "armeabiV7a": "0x6001"},
            "worldMapProc": {"x86": "0x5100", "armeabiV7a": "0x6101"},
            "mapWndProc": {"x86": "0x5200", "armeabiV7a": "0x6201"},
            "EndWarpMap": {"x86": "0x5300", "armeabiV7a": "0x6301"},
            "setWarpMap": {"x86": "0x5400", "armeabiV7a": "0x6401"},
        }
        native["nativeLibraries"][0]["focusedSymbols"].extend([
            {"type": "FUNC", "name": name, "demangled": name + "()", "value": addresses["x86"]}
            for name, addresses in world_functions.items()
        ])
        native["nativeLibraries"][1]["focusedSymbols"].extend([
            {"type": "FUNC", "name": name, "demangled": name + "()", "value": addresses["armeabiV7a"]}
            for name, addresses in world_functions.items()
        ])
        layout["worldMapRuntime"] = {
            "source": layout["autoMapColor"]["source"],
            "functions": world_functions,
        }
        self.assertEqual(validate_resource_function_anchors(native, layout), [])
        layout["autoMapRendering"]["functions"]["DrawAutoMapping"]["x86"] = "0x2001"
        errors = validate_resource_function_anchors(native, layout)
        self.assertTrue(any("address mismatch" in error for error in errors))
        layout["worldMapRuntime"]["functions"]["worldMapProc"]["x86"] = "0x5101"
        errors = validate_resource_function_anchors(native, layout)
        self.assertTrue(any("worldMapRuntime: x86 address mismatch for worldMapProc" in error for error in errors))

    def test_contract_build_identity_mismatch_is_rejected(self):
        native = {
            "auditedApk": {"sha256": "apk-hash"},
            "nativeLibraries": [
                {"abi": "x86", "sha256": "wrong", "buildId": "wrong",
                 "focusedSymbols": []},
                {"abi": "armeabi-v7a", "sha256": "arm-hash", "buildId": "arm-build",
                 "focusedSymbols": []},
            ],
        }
        contract = {
            "source": {
                "x86": {"sha256": "x86-hash", "buildId": "x86-build"},
                "armeabiV7a": {"sha256": "arm-hash", "buildId": "arm-build"},
            }
        }
        errors = validate_contracts(native, [("fixture", contract)])
        self.assertTrue(any("SHA-256 does not match" in error for error in errors))
        self.assertTrue(any("build ID does not match" in error for error in errors))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--native-audit", required=True)
    parser.add_argument("--loop-contract", required=True)
    parser.add_argument("--movement-contract", required=True)
    parser.add_argument("--resource-layout", required=True)
    args = parser.parse_args()
    native = json.loads(Path(args.native_audit).read_text(encoding="utf-8"))
    contracts = [
        ("client loop contract", json.loads(Path(args.loop_contract).read_text(encoding="utf-8"))),
        ("map movement contract", json.loads(Path(args.movement_contract).read_text(encoding="utf-8"))),
    ]
    errors = validate_contracts(native, contracts)
    resource_layout = json.loads(Path(args.resource_layout).read_text(encoding="utf-8"))
    errors.extend(validate_resource_function_anchors(native, resource_layout))
    if errors:
        raise SystemExit("\n".join(errors))
    print("Android native loop, movement, auto-map color and rendering anchors match audited x86 and ARMv7 symbols.")


if __name__ == "__main__":
    main()
