#!/usr/bin/env python3
import unittest
from audit_ro0000_android_signing import parse_apksigner_output


class ApkSignerOutputTests(unittest.TestCase):
    def test_parses_verified_schemes_and_fingerprints(self):
        output = """Verifies
Verified using v1 scheme (JAR signing): true
Verified using v2 scheme (APK Signature Scheme v2): true
Verified using v3 scheme (APK Signature Scheme v3): false
Number of signers: 1
Signer #1 certificate DN: CN=Example
Signer #1 certificate SHA-256 digest: aa:bb:cc
Signer #1 public key SHA-256 digest: 11:22:33
Signer #1 key algorithm: RSA
Signer #1 key size (bits): 2048
"""
        parsed = parse_apksigner_output(output)
        self.assertTrue(parsed["verifiesMarker"])
        self.assertEqual(parsed["schemes"]["v1"], True)
        self.assertEqual(parsed["schemes"]["v2"], True)
        self.assertEqual(parsed["schemes"]["v3"], False)
        self.assertIsNone(parsed["schemes"]["v3.1"])
        self.assertEqual(parsed["signerCount"], 1)
        self.assertEqual(parsed["signers"][0]["certificateSha256"], "aa:bb:cc")
        self.assertEqual(parsed["signers"][0]["keyAlgorithm"], "RSA")
        self.assertEqual(parsed["signers"][0]["keySizeBits"], 2048)

    def test_does_not_infer_missing_verification(self):
        parsed = parse_apksigner_output("Number of signers: 0\n")
        self.assertFalse(parsed["verifiesMarker"])
        self.assertEqual(parsed["signerCount"], 0)
        self.assertTrue(all(value is None for value in parsed["schemes"].values()))


if __name__ == "__main__":
    unittest.main()
