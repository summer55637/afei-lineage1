#!/usr/bin/env python3
import json
import unittest
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "tools" / "audit_ro0000_android_adrn_consumers.py"

class AdrnConsumerAuditTests(unittest.TestCase):
    def test_candidate_offsets(self):
        text = SCRIPT.read_text(encoding="utf-8")
        for value in ("0x22","0x24","0x26","0x28","0x2a","0x2c","0x2e","0x30","0x32","0x34","0x36","0x38","0x3a","0x3c","0x3e","0x44","0x46","0x48"):
            self.assertIn(value, text)

    def test_classifies_direct_window(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location("adrn_consumers", SCRIPT)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        lines = [
            "  1000: 8b 0d 40 77 11 05    mov    0x5117740,%ecx # adrnbuff",
            "  1006: 8b 41 22             mov    0x22(%ecx),%eax",
        ]
        found = mod.scan_excerpt("x86", "exampleConsumer", lines)
        self.assertTrue(any(item["offset"] == "0x22" and item["strength"] == "direct-base-offset" for item in found))

if __name__ == "__main__":
    unittest.main()
