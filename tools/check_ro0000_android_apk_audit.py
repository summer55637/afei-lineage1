#!/usr/bin/env python3
import unittest
from audit_ro0000_android_apk import resource_name_candidates

class AndroidApkStringScanTests(unittest.TestCase):
    def test_ascii_resource_path(self):
        values=resource_name_candidates(b'prefix\\x00path/map4/real.bin\\x00s/spr.bin\\x00')
        self.assertIn('path/map4/real.bin',values)
        self.assertIn('s/spr.bin',values)

    def test_utf16le_resource_path(self):
        values=resource_name_candidates('path/map4/real.bin'.encode('utf-16le'))
        self.assertIn('path/map4/real.bin',values)

    def test_url_is_not_emitted(self):
        values=resource_name_candidates(b'https://example.invalid/private/client.map')
        self.assertEqual(values,[])

    def test_resource_extensions_are_bounded_to_known_types(self):
        values=resource_name_candidates(b'data/known.bin unknown.secret')
        self.assertEqual(values,['data/known.bin'])

if __name__=='__main__': unittest.main()
