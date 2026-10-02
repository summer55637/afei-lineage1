#!/usr/bin/env python3
import struct
import unittest

from audit_ro0000_android_dex import inspect_dex


class DexStructureAuditTests(unittest.TestCase):
    def test_rejects_non_dex(self):
        with self.assertRaisesRegex(ValueError, "not a standard DEX"):
            inspect_dex(b"not a dex file")

    def test_rejects_truncated_header(self):
        with self.assertRaisesRegex(ValueError, "not a standard DEX"):
            inspect_dex(b"dex\n035\x00")


if __name__ == "__main__":
    unittest.main()
