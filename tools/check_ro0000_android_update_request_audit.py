#!/usr/bin/env python3
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
AUDIT = ROOT / "data/generated/stoneage_ro0000_android_update_request_audit.json"

class AndroidUpdateAuditTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads(AUDIT.read_text(encoding="utf-8"))

    def test_target_identity(self):
        self.assertEqual(
            self.data["source"]["apkSha256"],
            "6899bffacce3560f25709d8e834b79a66e52711cf54d849cd36b05b4e7463d8c",
        )
        self.assertTrue(self.data["binaryRevalidation"]["targetHashMatchesKnownIdentity"])

    def test_request_contracts(self):
        self.assertEqual(
            self.data["resourceListDownload"]["urlFormat"],
            "%s?version=%s&platform=%s&channel=%s",
        )
        self.assertEqual(
            self.data["versionCheck"]["postBodyFormat"],
            "platform=%s&version=%s&channel=%s",
        )
        self.assertEqual(
            self.data["patchSlotHandling"]["filenameFormat"],
            "patch_%d.zip",
        )

    def test_response_gate(self):
        self.assertEqual(
            self.data["responseCallback"]["entryStatusRequired"],
            1,
        )
        self.assertEqual(
            self.data["responseCallback"]["noUpdateResponseLiteral"],
            "1",
        )
        self.assertEqual(
            self.data["responseCallback"]["confirmedUpdateState"],
            8,
        )

    def test_basename_split_contract(self):
        detail = self.data["responseCallback"]["basenameHelperDetail"]
        self.assertEqual(detail["delimiterByte"], "0x2f")
        self.assertEqual(detail["delimiterAscii"], "/")
        self.assertEqual(detail["searchPositionArgument"], "0xffffffff")
        self.assertEqual(detail["postSearchAdjustment"], "returnedPosition + 1")

    def test_install_stage(self):
        self.assertEqual(
            self.data["installationStage"]["installCall"],
            "InstallApk(char const*)",
        )
        self.assertEqual(
            self.data["installationStage"]["wrapper"],
            "InstallApk(char const*) -> Android_InstallApk(char const*)",
        )
        self.assertIn("exit(0)", self.data["installationStage"]["postInstall"])

    def test_host_is_not_recorded(self):
        raw = AUDIT.read_text(encoding="utf-8")
        self.assertNotIn("192.168.", raw)
        self.assertNotIn("clientupdate.php?version=", raw)

if __name__ == "__main__":
    unittest.main()
