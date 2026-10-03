import unittest

from audit_ro0000_android_battlemap_crosscheck import build_crosscheck


def native_audit(arm_size=112640, x86_size=112640):
    return {
        "auditedApk": {"sha256": "apk-sha"},
        "nativeLibraries": [
            {
                "abi": "armeabi-v7a",
                "path": "lib/armeabi-v7a/libStoneage.so",
                "sha256": "arm-sha",
                "focusedSymbols": [{"name": "BattleMapFile", "type": "OBJECT", "size": arm_size}],
            },
            {
                "abi": "x86",
                "path": "lib/x86/libStoneage.so",
                "sha256": "x86-sha",
                "focusedSymbols": [{"name": "BattleMapFile", "type": "OBJECT", "size": x86_size}],
            },
        ],
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
        report = build_crosscheck(native_audit(), selector_audit())
        self.assertEqual(report["targetBattleMapTable"]["slotCapacity"], 220)
        self.assertEqual(report["targetBattleMapTable"]["acceptedIndexRange"],
                         {"minimumInclusive": 0, "maximumInclusive": 219})
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
        report = build_crosscheck(native_audit(), selector)
        self.assertEqual(report["serverSelector"]["distinctCandidateCount"], 4)

    def test_candidate_outside_target_table_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "exceed Android BattleMapFile slots: 220"):
            build_crosscheck(native_audit(), selector_audit((1, 220)))

    def test_inconsistent_selector_summary_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "distinctBattleMapNos disagrees"):
            build_crosscheck(native_audit(), selector_audit((1, 2), distinctBattleMapNos=9))

    def test_abi_table_capacity_mismatch_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "capacities differ"):
            build_crosscheck(native_audit(x86_size=112128), selector_audit())

    def test_missing_battlemapfile_object_is_rejected(self):
        native = native_audit()
        native["nativeLibraries"][0]["focusedSymbols"] = []
        with self.assertRaisesRegex(ValueError, "expected exactly one BattleMapFile"):
            build_crosscheck(native, selector_audit())

    def test_source_anomalies_are_retained_as_warnings(self):
        selector = selector_audit(
            (1, 2, 201),
            reversedRanges=[{"blockLine": 267, "rangeLine": 280, "first": 3137, "last": 1349}],
            duplicateImageAssignments=1,
        )
        report = build_crosscheck(native_audit(), selector)
        self.assertEqual(len(report["serverSelector"]["reversedRanges"]), 1)
        self.assertEqual(report["serverSelector"]["duplicateImageAssignments"], 1)


if __name__ == "__main__":
    unittest.main()
