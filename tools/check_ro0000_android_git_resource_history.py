#!/usr/bin/env python3
import unittest

from audit_ro0000_android_git_resource_history import (
    TARGET_CLASSES,
    classify_path,
    normalize_path,
)


class AndroidGitResourceHistoryTests(unittest.TestCase):
    def test_target_battle_map(self):
        self.assertEqual(
            classify_path("ro0000/client-assets/data/battlemap/battle00.sabex"),
            "target_sabex",
        )
        self.assertEqual(
            classify_path("data/battlemap/battle219.SABEX"),
            "target_sabex",
        )

    def test_legacy_battle_map_is_separate_lineage(self):
        self.assertEqual(
            classify_path("data/battleMap/battle218.sab"),
            "legacy_sab",
        )
        self.assertNotEqual("legacy_sab", TARGET_CLASSES)

    def test_target_binary_resources(self):
        for path in (
            "s/adrn.bin",
            "s/real.bin",
            "s/spr.bin",
            "s/spradrn.bin",
            "path/map4/real.bin",
            "data/pal/Palet_1.sap",
            "data/update/list.dat",
            "patch_0.zip",
            "patch_5.zip",
            "data/serverdata.dat",
        ):
            self.assertIsNotNone(classify_path(path), path)

    def test_unrelated_server_binary_is_not_target_resource(self):
        self.assertIsNone(
            classify_path("ro0000/server/merged-source/gmsv/data/attmagic.bin")
        )
        self.assertIsNone(classify_path("data/ablua/npc/duanwei/1v1.bin"))

    def test_normalization(self):
        self.assertEqual(normalize_path(r"data\\pal\\PALET_1.SAP"), "data/pal/PALET_1.SAP")


if __name__ == "__main__":
    unittest.main()
