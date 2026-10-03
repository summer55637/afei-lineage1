#!/usr/bin/env python3
import json
import unittest
from pathlib import Path

EVIDENCE = Path(__file__).resolve().parents[1] / "data/generated/stoneage_ro0000_android_adrn_field_semantics_evidence.json"

class AndroidAdrnFieldSemanticsEvidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads(EVIDENCE.read_text(encoding="utf-8"))

    def test_target_record_shape(self):
        self.assertEqual(self.data["target"]["recordSizeBytes"], 80)

    def test_target_confirmed_offsets(self):
        seen = {o for c in self.data["targetConfirmed"]["directConsumers"] for o in c["offsets"]}
        for offset in ("0x04","0x08","0x0c","0x10","0x14","0x18","0x1c","0x1d","0x1e","0x20","0x40","0x42","0x4c"):
            self.assertIn(offset, seen)

    def test_cross_source_names_are_not_target_proof(self):
        self.assertEqual(self.data["closure"]["status"], "partial-semantic-closure")
        self.assertIn("The target APK directly consumes every source-correlated field.", self.data["closure"]["notClaimed"])

    def test_unknown_ranges_are_complete(self):
        expected = {"0x22","0x24","0x26","0x28","0x2a","0x2c","0x2e","0x30","0x32","0x34","0x36","0x38","0x3a","0x3c","0x3e","0x44","0x46","0x48"}
        self.assertEqual(set(self.data["crossSourceLayout"]["offsets"]), expected)

if __name__ == "__main__":
    unittest.main()
