import unittest

from audit_ro0000_android_battlemap_crosscheck import build_crosscheck


def native_audit(arm_sha="arm-sha", x86_sha="x86-sha", apk_sha="apk-sha"):
    return {
        "auditedApk": {"sha256": apk_sha},
        "nativeLibraries": [
            {
                "abi": "armeabi-v7a",
                "path": "lib/armeabi-v7a/libStoneage.so",
                "sha256": arm_sha,
                "buildId": "arm-build",
                "focusedSymbols": [],
            },
            {
                "abi": "x86",
                "path": "lib/x86/libStoneage.so",
                "sha256": x86_sha,
                "buildId": "x86-build",
                "focusedSymbols": [],
            },
        ],
    }


def table_contract():
    return {
        "format": "ro0000-android-battlemap-table-contract-v1",
        "source": {
            "apkSha256": "apk-sha",
            "libraries": {
                "armeabi-v7a": {"sha256": "arm-sha", "buildId": "arm-build"},
                "x86": {"sha256": "x86-sha", "buildId": "x86-build"},
            },
        },
        "table": {
            "filenameEntryStrideBytes": 512,
            "sizeBytes": 112640,
            "slotCount": 220,
            "minimumIndexInclusive": 0,
            "maximumIndexInclusive": 219,
            "filenameTemplate": "data/battlemap/battle%03d.sabex",
        },
    }


def selector_audit(candidates=(1, 2, 201), **summary_overrides):
    unused = sorted(set(range(220)) - set(candidates))
    summary = {
        "distinctBattleMapNos": len(set(candidates)),
        "unusedBattleMapNos": unused,
        "reversedRanges": [],
        "duplicateImageAssignments": 0,
    }
    summary.update(summary_overrides)
    return {
        "source": "ro0000/server/merged-source/gmsv/data/map/battlemap.txt",
        "summary": summary,
        "selectedRanges": [{
            "blockLine": 1,
            "effective": list(candidates),
            "ranges": [{"valid": True}],
        }],
    }


class AndroidBattleMapSelectorCrosscheckTests(unittest.TestCase):
    def test_server_candidates_fit_target_filename_table(self):
        report = build_crosscheck(native_audit(), selector_audit(), table_contract())
        self.assertEqual(report["targetBattleMapTable"]["slotCount"], 220)
        self.assertEqual(report["targetBattleMapTable"]["minimumIndexInclusive"], 0)
        self.assertEqual(report["targetBattleMapTable"]["maximumIndexInclusive"], 219)
        self.assertEqual(report["serverSelector"]["distinctCandidateCount"], 3)
        self.assertTrue(report["serverSelector"]["allCandidatesWithinAndroidTable"])
        self.assertEqual(report["serverSelector"]["selectedBattleMapNos"], [1, 2, 201])

    def test_repeated_candidate_does_not_inflate_distinct_count(self):
        selector = selector_audit((1, 2, 201))
        selector["selectedRanges"].append({
            "blockLine": 8, "effective": [2, 3, 201], "ranges": [{"valid": True}]
        })
        selector["summary"]["distinctBattleMapNos"] = 4
        selector["summary"]["unusedBattleMapNos"] = sorted(set(range(220)) - {1, 2, 3, 201})
        report = build_crosscheck(native_audit(), selector, table_contract())
        self.assertEqual(report["serverSelector"]["distinctCandidateCount"], 4)

    def test_candidate_outside_target_table_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "exceed Android BattleMapFile slots: 220"):
            build_crosscheck(native_audit(), selector_audit((1, 220)), table_contract())

    def test_inconsistent_selector_summary_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "distinctBattleMapNos disagrees"):
            build_crosscheck(native_audit(), selector_audit((1, 2), distinctBattleMapNos=9),
                             table_contract())

    def test_apk_hash_mismatch_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "APK SHA-256 mismatch"):
            build_crosscheck(native_audit(apk_sha="different"), selector_audit(), table_contract())

    def test_abi_hash_mismatch_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "armeabi-v7a library SHA-256 mismatch"):
            build_crosscheck(native_audit(arm_sha="different"), selector_audit(), table_contract())

    def test_inconsistent_table_dimensions_are_rejected(self):
        contract = table_contract()
        contract["table"]["slotCount"] = 221
        with self.assertRaisesRegex(ValueError, "size/count/stride disagree"):
            build_crosscheck(native_audit(), selector_audit(), contract)

    def test_source_anomalies_are_retained_as_warnings(self):
        selector = selector_audit(
            (1, 2, 201),
            reversedRanges=[{"blockLine": 267, "rangeLine": 280, "first": 3137, "last": 1349}],
            duplicateImageAssignments=1,
        )
        report = build_crosscheck(native_audit(), selector, table_contract())
        self.assertEqual(len(report["serverSelector"]["reversedRanges"]), 1)
        self.assertEqual(report["serverSelector"]["duplicateImageAssignments"], 1)


if __name__ == "__main__":
    unittest.main()
