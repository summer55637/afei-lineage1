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
        self.assertIn("indirect_branch_or_jump_table", result["reason"])
        self.assertNotIn("possibly-reachable", result["directTargets"])

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
        self.assertTrue(report["comparison"]["semanticNamedCallTargetParity"])
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
        self.assertFalse(report["comparison"]["semanticNamedCallTargetParity"])
        self.assertEqual(report["semanticCallTargetMismatches"], [{
            "function": "sample()", "onlyInArmeabiV7a": ["foo"], "onlyInX86": ["bar"],
        }])


if __name__ == "__main__":
    unittest.main()
