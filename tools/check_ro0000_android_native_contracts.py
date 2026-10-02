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
    args = parser.parse_args()
    native = json.loads(Path(args.native_audit).read_text(encoding="utf-8"))
    contracts = [
        ("client loop contract", json.loads(Path(args.loop_contract).read_text(encoding="utf-8"))),
        ("map movement contract", json.loads(Path(args.movement_contract).read_text(encoding="utf-8"))),
    ]
    errors = validate_contracts(native, contracts)
    if errors:
        raise SystemExit("\n".join(errors))
    print("Android native loop and movement contract anchors match audited x86 and ARMv7 symbols.")


if __name__ == "__main__":
    main()
