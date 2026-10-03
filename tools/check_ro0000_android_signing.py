#!/usr/bin/env python3
import unittest
import base64
import hashlib
import tempfile
import zipfile
from pathlib import Path
from audit_ro0000_android_signing import parse_apksigner_output, audit_v1_manifest_entry_digests


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


    def _write_signed_like_apk(self, path, payload=b"hello", expected=None, algorithm="SHA-256", include_manifest=True):
        if expected is None:
            expected = base64.b64encode(hashlib.sha256(payload).digest()).decode("ascii")
        if algorithm == "SHA-256":
            section_digest = "SHA-256-Digest: " + expected
        else:
            section_digest = algorithm + "-Digest: " + expected
        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("assets/example.bin", payload)
            if include_manifest:
                manifest = (
                    "Manifest-Version: 1.0\r\n\r\n"
                    "Name: assets/example.bin\r\n"
                    + section_digest + "\r\n\r\n"
                )
                zf.writestr("META-INF/MANIFEST.MF", manifest.encode("utf-8"))

    def test_v1_manifest_entry_digest_matches_payload(self):
        with tempfile.TemporaryDirectory() as temp:
            apk = Path(temp) / "matching.apk"
            self._write_signed_like_apk(apk)
            result = audit_v1_manifest_entry_digests(apk)
        self.assertEqual(result["status"], "match")
        self.assertEqual(result["entryCount"], 1)
        self.assertEqual(result["digestCount"], 1)
        self.assertEqual(result["matchedDigestCount"], 1)
        self.assertEqual(result["mismatchEntries"], [])

    def test_v1_manifest_reports_exact_mismatched_entry(self):
        with tempfile.TemporaryDirectory() as temp:
            apk = Path(temp) / "mismatch.apk"
            self._write_signed_like_apk(apk, payload=b"current", expected=base64.b64encode(hashlib.sha256(b"old").digest()).decode("ascii"))
            result = audit_v1_manifest_entry_digests(apk)
        self.assertEqual(result["status"], "mismatch")
        self.assertEqual(result["mismatchDigestCount"], 1)
        self.assertEqual(result["mismatchEntries"], ["assets/example.bin"])

    def test_v1_manifest_reports_unsupported_algorithm_and_missing_entry(self):
        with tempfile.TemporaryDirectory() as temp:
            apk = Path(temp) / "incomplete.apk"
            manifest = (
                "Manifest-Version: 1.0\r\n\r\n"
                "Name: assets/missing.bin\r\n"
                "SHA-256-Digest: YWJj\r\n\r\n"
                "Name: assets/example.bin\r\n"
                "SHA999-Digest: YWJj\r\n\r\n"
            )
            with zipfile.ZipFile(apk, "w") as zf:
                zf.writestr("assets/example.bin", b"hello")
                zf.writestr("META-INF/MANIFEST.MF", manifest.encode("utf-8"))
            result = audit_v1_manifest_entry_digests(apk)
        self.assertEqual(result["status"], "mismatch")
        self.assertEqual(result["missingEntries"], ["assets/missing.bin"])
        self.assertEqual(result["unsupportedDigests"], [{"entry": "assets/example.bin", "algorithm": "SHA999"}])

    def test_v1_manifest_absence_is_not_claimed_as_verified(self):
        with tempfile.TemporaryDirectory() as temp:
            apk = Path(temp) / "unsigned.apk"
            self._write_signed_like_apk(apk, include_manifest=False)
            result = audit_v1_manifest_entry_digests(apk)
        self.assertEqual(result["status"], "no-v1-manifest")


if __name__ == "__main__":
    unittest.main()
