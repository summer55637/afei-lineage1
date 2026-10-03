#!/usr/bin/env python3
import unittest
from audit_ro0000_android_signing_cause import _headers, _split_sections

class AndroidSigningCauseTests(unittest.TestCase):
    def test_split_sections(self):
        raw=b"Manifest-Version: 1.0\r\nCreated-By: test\r\n\r\nName: lib/x.so\r\nSHA1-Digest: abc=\r\n\r\n"
        parts=_split_sections(raw)
        self.assertEqual(len(parts),2)
        self.assertTrue(parts[0].endswith(b"\r\n\r\n"))
        self.assertTrue(parts[1].startswith(b"Name: lib/x.so"))

    def test_unfold_headers(self):
        h=_headers(b"Name: long/name\r\n continuation\r\nSHA1-Digest: abc=\r\n\r\n")
        self.assertEqual(h["name"],"long/namecontinuation")
        self.assertEqual(h["sha1-digest"],"abc=")

if __name__=="__main__": unittest.main()
