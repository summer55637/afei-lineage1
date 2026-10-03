#!/usr/bin/env python3
"""Regression checks for the Android battle command decoder evidence."""
import json
import unittest
from pathlib import Path

CONTRACT = Path("data/generated/stoneage_ro0000_android_battle_command_decode_contract.json")

class BattleCommandDecodeContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = json.loads(CONTRACT.read_text(encoding="utf-8"))

    def test_target_identity(self):
        source = self.doc["source"]
        self.assertEqual(source["apkSha256"], "6899bffacce3560f25709d8e834b79a66e52711cf54d849cd36b05b4e7463d8c")
        self.assertEqual(source["x86"]["sha256"], "7c521d9245e2d1668a758402b6975009fd30a7b7b41857d32fc4b51300a29f3d")
        self.assertEqual(source["x86"]["buildId"], "ab97d1ad35dd9296d54ef8d8c6639511db606333")
        self.assertEqual(source["armeabiV7a"]["sha256"], "4826c368a6791e680fc0e366e7af1c054454d2c5ead2ca831e2cd98838ecaa4d")
        self.assertEqual(source["armeabiV7a"]["buildId"], "1b19ccce43386ffaf5371727161330e17b5105c4")

    def test_function_anchors(self):
        expected = {
            "BattleProc": ("0x10c790", "0x0f69c1", 9590, 6364),
            "master": ("0x359eb0", "0x234eb1", 17284, 9348),
            "getNum": ("0x3408e0", "0x22753d", 408, 252),
            "getCommandAsc": ("0x347740", "0x22b1a1", 500, 332),
        }
        for name, (x86, arm, x86_size, arm_size) in expected.items():
            entry = self.doc["functions"][name]
            self.assertEqual(entry["address"]["x86"], x86)
            self.assertEqual(entry["address"]["armeabiV7a"], arm)
            self.assertEqual(entry["sizeBytes"]["x86"], x86_size)
            self.assertEqual(entry["sizeBytes"]["armeabiV7a"], arm_size)

    def test_command_queue_and_marker(self):
        queue = self.doc["queues"]["BattleCmd"]
        self.assertEqual(queue["storage"]["slotCount"], 4)
        self.assertEqual(queue["storage"]["slotSizeBytes"], 4096)
        self.assertEqual(queue["storage"]["readerIndexAdvance"], "(readPointer + 1) & 3")
        self.assertEqual(self.doc["localHelpers"]["getCommand"]["x86Address"], "0x35e240")
        self.assertIn("B<opcode>|", self.doc["localHelpers"]["getCommand"]["behavior"])

    def test_token_bounds_are_not_overclaimed(self):
        self.assertIn("uppercase hexadecimal", self.doc["tokens"]["numeric"]["encoding"])
        self.assertIn("no explicit token-length bound", self.doc["tokens"]["numeric"]["safetyBoundary"])
        self.assertIn("not a general UTF-8 decoder", self.doc["tokens"]["text"]["boundary"])

    def test_damage_client_consumer_semantics(self):
        damage = self.doc["damageResult"]
        self.assertEqual(damage["opcode"], "D")
        self.assertEqual(damage["category0"]["subtype0"]["popupId"], 6)
        self.assertEqual(damage["category0"]["subtype1"]["popupId"], 14)
        self.assertEqual(damage["category0"]["subtype2"]["popupId"], 36)
        self.assertEqual(damage["category1"]["subtype0"]["popupId"], 16)
        self.assertEqual(damage["category1"]["subtype1"]["popupId"], 15)
        self.assertIn("does not calculate authoritative damage", damage["targetBehavior"]["values"])
        self.assertIn("restores the command cursor", damage["targetBehavior"]["repeat"])

    def test_cross_source_boundary_and_runtime_limit(self):
        self.assertEqual(self.doc["crossSourceReference"]["commit"], "8c870c87ce1305c52fb6713bf824619467847bba")
        self.assertEqual(self.doc["crossSourceReference"]["role"], "semantic reference only; exact source/build identity with the audited APK is not established")
        self.assertFalse(self.doc["verificationBoundary"]["deviceRuntimeBattlePlaybackObserved"])
        self.assertFalse(self.doc["verificationBoundary"]["serverBattleFormulaVerifiedFromApk"])

if __name__ == "__main__":
    unittest.main()
