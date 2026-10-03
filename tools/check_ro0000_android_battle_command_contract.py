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
            "setDamageNum": ("0x33d0f0", "0x225445", 855, 572),
            "showDamageNum": ("0x33b090", "0x22429d", 8282, 4520),
            "damageDispx": ("0x10c210", "0x0f6679", 343, 224),
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


    def test_damage_number_lifecycle_and_rendering(self):
        visual = self.doc["damageNumberVisual"]
        life = visual["lifecycle"]
        self.assertEqual(life["callback"], "showDamage_num(action*)")
        self.assertEqual(life["workOffsets"]["stateByte"], "0x00")
        self.assertEqual(life["workOffsets"]["timerByte"], "0x01")
        self.assertEqual(life["workOffsets"]["sourceActionPointer"], "0x08")
        self.assertIn("action+0x170=0x18 (24)", life["initialization"])
        self.assertEqual([state["workState"] for state in life["states"]], [0, 1, 2])
        self.assertIn("subtract 2", life["states"][0]["perCallback"])
        self.assertIn("action+0x174=16", life["states"][0]["transition"])
        self.assertIn("add 2", life["states"][1]["perCallback"])
        self.assertIn("24", life["states"][1]["transition"])
        self.assertIn("work[1]=60", life["states"][1]["transition"])
        self.assertIn("decrement work[1]", life["states"][2]["perCallback"])
        self.assertIn("DeathAction()", life["states"][2]["transition"])
        self.assertIn("pattern(action,0,1)", life["normalFrameTail"])
        special = visual["creation"]["specialVisualBranch"]
        self.assertIn("0x18db7", special["condition"])
        self.assertIn("0x1d532", special["condition"])
        self.assertIn("0x19650", special["condition"])
        self.assertEqual(special["effectGraphic"], "0x18de2 (102882)")
        rendering = visual["rendering"]
        self.assertIn("font number 101", rendering["primaryRenderer"])
        self.assertIn("y+12", rendering["secondaryRenderer"]["work+0x238"])
        self.assertIn("y+60", rendering["secondaryRenderer"]["work+0x234"])
        self.assertIn("not fully translated", rendering["boundary"])


    def test_cross_source_boundary_and_runtime_limit(self):
        self.assertEqual(self.doc["crossSourceReference"]["commit"], "8c870c87ce1305c52fb6713bf824619467847bba")
        self.assertEqual(self.doc["crossSourceReference"]["role"], "semantic reference only; exact source/build identity with the audited APK is not established")
        self.assertFalse(self.doc["verificationBoundary"]["deviceRuntimeBattlePlaybackObserved"])
        self.assertFalse(self.doc["verificationBoundary"]["serverBattleFormulaVerifiedFromApk"])

if __name__ == "__main__":
    unittest.main()
