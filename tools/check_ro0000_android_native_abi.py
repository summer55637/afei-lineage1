import struct
import unittest

from audit_ro0000_android_native_abi import analyze_function, build_report


def function(name, abi, instructions):
    return {
        "name": name, "demangled": name, "type": "FUNC",
        "value": "0x1001" if abi == "armeabi-v7a" else "0x1000", "size": 64,
        "disassembly": {"status": "ok", "excerptTruncated": False, "excerpt": instructions},
    }


def make_audit(arm_functions, x86_functions):
    return {
        "auditedApk": {"sha256": "apk-sha"},
        "nativeLibraries": [
            {"abi": "armeabi-v7a", "path": "lib/armeabi-v7a/libStoneage.so",
             "sha256": "arm-sha", "buildId": "arm-build", "focusedSymbols": arm_functions},
            {"abi": "x86", "path": "lib/x86/libStoneage.so",
             "sha256": "x86-sha", "buildId": "x86-build", "focusedSymbols": x86_functions},
        ],
    }


def synthetic_elf32(size=0x4000):
    data = bytearray(size)
    data[:7] = b"\x7fELF\x01\x01\x01"
    struct.pack_into("<I", data, 28, 52)  # e_phoff
    struct.pack_into("<H", data, 42, 32)  # e_phentsize
    struct.pack_into("<H", data, 44, 1)   # e_phnum
    struct.pack_into("<IIIIIIII", data, 52, 1, 0, 0, 0, size, size, 5, 0x1000)
    return data


class NativeAbiCallParityTests(unittest.TestCase):
    def test_x86_conditional_branches_include_both_reachable_paths(self):
        fn = function("sample()", "x86", [
            "  1000:\te8 00 00 00 00 \tcall   2000 <foo@plt>",
            "  1005:\t75 05                \tjne    100c <sample()+0xc>",
            "  1007:\te8 00 00 00 00 \tcall   3000 <bar@plt>",
            "  100c:\tc3                    \tret",
            "  100d:\te8 00 00 00 00 \tcall   4000 <unreachable@plt>",
        ])
        result = analyze_function(fn, "x86")
        self.assertTrue(result["complete"])
        self.assertEqual(set(result["directTargets"]), {"foo", "bar"})
        self.assertNotIn("unreachable", result["directTargets"])

    def test_arm_thumb_return_excludes_literal_pool_false_call(self):
        fn = function("sample()", "armeabi-v7a", [
            "  1000:\tb500      \tpush   {lr}",
            "  1002:\tf000 f800 \tbl     2000 <foo@plt>",
            "  1006:\tbd00      \tpop    {pc}",
            "  1008:\t47d8      \tblx    fp",
        ])
        result = analyze_function(fn, "armeabi-v7a")
        self.assertTrue(result["complete"])
        self.assertEqual(result["directTargets"], ["foo"])
        self.assertEqual(result["indirectCalls"], 0)

    def test_noreturn_call_stops_reachability(self):
        fn = function("sample()", "armeabi-v7a", [
            "  1000:\tf000 f800 \tblx    2000 <__stack_chk_fail@plt>",
            "  1004:\t47d8      \tblx    fp",
        ])
        result = analyze_function(fn, "armeabi-v7a")
        self.assertTrue(result["complete"])
        self.assertEqual(result["directTargets"], ["__stack_chk_fail"])
        self.assertEqual(result["indirectCalls"], 0)

    def test_jump_table_is_reported_as_incomplete(self):
        fn = function("sample()", "armeabi-v7a", [
            "  1000:\t4608      \tmov    r0, r1",
            "  1002:\te8d0 f000 \ttbb    [r0, r0]",
            "  1006:\tf000 f800 \tbl     2000 <possibly-reachable@plt>",
            "  100a:\tbd00      \tpop    {pc}",
        ])
        result = analyze_function(fn, "armeabi-v7a")
        self.assertFalse(result["complete"])
        self.assertIn("unresolved_arm_switch_table", result["reason"])
        self.assertNotIn("possibly-reachable", result["directTargets"])

    def test_resolves_arm_tbb_table_from_elf_bytes(self):
        binary = synthetic_elf32()
        binary[0x1008:0x100a] = bytes([2, 4])
        fn = function("sample()", "armeabi-v7a", [
            "  1000:\t2801      \tcmp\tr0, #1",
            "  1002:\td80d      \tbhi.n\t1020 <sample()+0x20>",
            "  1004:\te8df f001 \ttbb\t[pc, r1]",
            "  1008:\t0402      \tlsls\tr2, r0, #16",
            "  100c:\t4770      \tbx\tlr",
            "  1010:\t4770      \tbx\tlr",
            "  1020:\t4770      \tbx\tlr",
        ])
        result = analyze_function(fn, "armeabi-v7a", bytes(binary))
        self.assertTrue(result["complete"])
        self.assertEqual(result["switchTables"][0]["entryCount"], 2)
        self.assertEqual(result["switchTables"][0]["targetAddresses"], ["0x100c", "0x1010"])

    def test_resolves_x86_relative32_jump_table(self):
        binary = synthetic_elf32()
        anchor = 0x300b
        struct.pack_into("<ii", binary, 0x2000, 0x1021 - anchor, 0x1022 - anchor)
        fn = function("sample()", "x86", [
            "  1000:\te8 00 00 00 00 \tcall\t1005 <sample()+0x5>",
            "  1005:\t58                    \tpop\t%eax",
            "  1006:\t05 06 20 00 00        \tadd\t$0x2006,%eax",
            "  100c:\t83 e9 01              \tsub\t$0x1,%ecx",
            "  100f:\t77 13                 \tja\t1024 <sample()+0x24>",
            "  1015:\t8b 94 88 f5 ef ff ff  \tmov\t-0x100b(%eax,%ecx,4),%edx",
            "  101d:\t01 c2                 \tadd\t%eax,%edx",
            "  101f:\tff e2                 \tjmp\t*%edx",
            "  1021:\tc3                    \tret",
            "  1022:\tc3                    \tret",
            "  1024:\tc3                    \tret",
        ])
        result = analyze_function(fn, "x86", bytes(binary), [2])
        self.assertTrue(result["complete"])
        self.assertEqual(result["switchTables"][0]["entryCount"], 2)
        self.assertEqual(result["switchTables"][0]["targetAddresses"], ["0x1021", "0x1022"])

    def test_memcpy_memset_and_abi_helpers_are_reported_separately(self):
        arm = function("sample()", "armeabi-v7a", [
            "  1000:\tf000 f800 \tbl     2000 <foo@plt>",
            "  1004:\tf000 f800 \tbl     3000 <__aeabi_memclr4@plt>",
            "  1008:\tbd00      \tpop    {pc}",
        ])
        x86 = function("sample()", "x86", [
            "  1000:\te8 00 00 00 00 \tcall 2000 <foo@plt>",
            "  1005:\te8 00 00 00 00 \tcall 3000 <memset@plt>",
            "  100a:\tc3                    \tret",
        ])
        report = build_report(make_audit([arm], [x86]))
        self.assertTrue(report["comparison"]["comparableSemanticNamedCallTargetParity"])
        self.assertEqual(report["memoryHelperVariances"], [{
            "function": "sample()", "armeabiV7a": {}, "x86": {"memset": 1},
        }])
        self.assertEqual(report["abiSummary"]["armeabi-v7a"]["abiHelperCallCounts"],
                         {"__aeabi_memclr4": 1})

    def test_reachable_named_call_target_mismatch_is_reported(self):
        arm = function("sample()", "armeabi-v7a", [
            "  1000:\tf000 f800 \tbl     2000 <foo@plt>",
            "  1004:\tbd00      \tpop    {pc}",
        ])
        x86 = function("sample()", "x86", [
            "  1000:\te8 00 00 00 00 \tcall 2000 <bar@plt>",
            "  1005:\tc3                    \tret",
        ])
        report = build_report(make_audit([arm], [x86]))
        self.assertFalse(report["comparison"]["comparableSemanticNamedCallTargetParity"])
        self.assertEqual(report["semanticCallTargetMismatches"], [{
            "function": "sample()", "onlyInArmeabiV7a": ["foo"], "onlyInX86": ["bar"],
        }])


if __name__ == "__main__":
    unittest.main()
