#!/usr/bin/env python3
"""Regression checks for Android BattleSetWazaHitBox evidence."""
import json
import unittest
from pathlib import Path

CONTRACT = Path("data/generated/stoneage_ro0000_android_battle_waza_hitbox_contract.json")

class BattleWazaHitboxContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = json.loads(CONTRACT.read_text(encoding="utf-8"))

    def test_apk_and_elf_identity(self):
        source = self.doc["source"]
        self.assertEqual(source["apkSha256"], "6899bffacce3560f25709d8e834b79a66e52711cf54d849cd36b05b4e7463d8c")
        self.assertEqual(source["libraries"]["x86"]["sha256"], "7c521d9245e2d1668a758402b6975009fd30a7b7b41857d32fc4b51300a29f3d")
        self.assertEqual(source["libraries"]["x86"]["buildId"], "ab97d1ad35dd9296d54ef8d8c6639511db606333")
        self.assertEqual(source["libraries"]["armeabiV7a"]["sha256"], "4826c368a6791e680fc0e366e7af1c054454d2c5ead2ca831e2cd98838ecaa4d")
        self.assertEqual(source["libraries"]["armeabiV7a"]["buildId"], "1b19ccce43386ffaf5371727161330e17b5105c4")

    def test_function_anchor(self):
        fn = self.doc["function"]
        self.assertEqual(fn["name"], "BattleSetWazaHitBox(int, int)")
        self.assertEqual(fn["address"], {"x86": "0x1011c0", "armeabiV7a": "0x0f0241"})
        self.assertEqual(fn["sizeBytes"], {"x86": 7498, "armeabiV7a": 4840})

    def test_switch_table_has_all_twelve_targets(self):
        table = self.doc["function"]["x86SwitchTable"]
        self.assertEqual(table["virtualAddress"], "0x72ef94")
        self.assertEqual(table["relativeBase"], "0x927668")
        self.assertEqual(table["entries"], [
            "0x1012bb", "0x101403", "0x10158d", "0x1017d7",
            "0x101a21", "0x101bae", "0x101cf6", "0x101e9a",
            "0x10205f", "0x1028d3", "0x102d63", "0x102499"
        ])
        self.assertEqual(len(table["entries"]), 12)

    def test_mode_masks_and_special_cases(self):
        modes = {x["index"]: x for x in self.doc["targetModes"]}
        self.assertEqual(set(modes), set(range(12)))
        self.assertEqual(modes[0]["mask"], "0x00000008")
        self.assertEqual(modes[4]["mask"], "0x00002000")
        self.assertEqual(modes[8]["groups"], [
            {"slots": "0..4", "mask": "0x00200000"},
            {"slots": "5..9", "mask": "0x00100000"},
            {"slots": "10..14", "mask": "0x00040000"},
            {"slots": "15..19", "mask": "0x00080000"}
        ])
        self.assertEqual(modes[9]["anomaly"].split(";")[0],
                         "the final 15..19 pair path writes ACTION.atr = 0x8 (direct assignment) rather than OR, potentially clearing other bits")
        self.assertEqual(modes[10]["filters"], ["func != NULL", "hp <= 0"])
        self.assertEqual(modes[11]["groups"], [
            {"slots": "0..4", "mask": "0x02000000"},
            {"slots": "5..9", "mask": "0x01000000"},
            {"slots": "10..14", "mask": "0x00400000"},
            {"slots": "15..19", "mask": "0x00800000"}
        ])

    def test_none_command_and_typeflag(self):
        mode = self.doc["targetModes"][5]
        self.assertEqual(mode["sendByTypeflag"]["typeflag0"],
                         "W|%X|%X (BattleWazaNo, BattleMyNo + 5)")
        self.assertEqual(mode["sendByTypeflag"]["typeflag1"],
                         "P|%X|%X (prouseskill, BattleMyNo)")
        self.assertEqual(self.doc["arguments"]["typeflag1"]["behavior"][2],
                         "select BATTLE_PROWAZA command state (value 5) instead of BATTLE_WAZA (value 4)")

    def test_reference_bit_layout_divergence_and_runtime_limit(self):
        diff = self.doc["referenceComparison"]["flagDifference"]
        self.assertEqual(diff["referenceTravelMask"], "0x00010000")
        self.assertEqual(diff["targetEligibilityMask"], "0x00020000")
        self.assertFalse(self.doc["verificationBoundary"]["deviceRuntimeTargetSelectionObserved"])
        self.assertFalse(self.doc["verificationBoundary"]["serverSkillResolutionVerified"])

if __name__ == "__main__":
    unittest.main()
