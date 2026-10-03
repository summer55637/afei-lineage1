#!/usr/bin/env python3
"""Regression checks for the Android path/map4/real.bin Lua-container contract."""
import json
import unittest
from pathlib import Path


CONTRACT = Path("data/generated/stoneage_ro0000_android_lua_container_contract.json")


class LuaContainerContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = json.loads(CONTRACT.read_text(encoding="utf-8"))

    def test_target_identity(self):
        self.assertEqual(
            self.doc["source"]["apkSha256"],
            "6899bffacce3560f25709d8e834b79a66e52711cf54d849cd36b05b4e7463d8c",
        )
        self.assertEqual(self.doc["targetPath"], "path/map4/real.bin")

    def test_container_is_distinct_from_asset_realbin(self):
        self.assertEqual(self.doc["distinction"]["classification"], "named-entry Lua loading container")
        self.assertIn("%s/real.bin loaded by AdrnInit", self.doc["distinction"]["notTheSameAs"])
        self.assertIn("%s/adrn.bin loaded by AdrnInit", self.doc["distinction"]["notTheSameAs"])

    def test_record_wire_contract(self):
        record = self.doc["recordEncoding"]
        self.assertEqual(record["wordSizeBytes"], 4)
        self.assertEqual(record["xorKey"], "0x87091272")
        self.assertEqual(record["lengthWord"]["meaning"], "payload byte length after XOR")
        self.assertEqual(record["nameCountWord"]["meaning"], "number of 4-byte name words after XOR")
        self.assertEqual(record["entryFilter"]["condition"], "decoded name contains .lua")

    def test_lua_load_boundary(self):
        runtime = self.doc["runtimeLoad"]
        self.assertEqual(runtime["function"], "myluaload(char*, char*, int)")
        self.assertEqual(runtime["luaApi"], "luaL_loadbuffer(payload, name, payloadLength)")
        self.assertEqual(runtime["execution"], "lua_pcall")

    def test_separate_loose_loader(self):
        loose = self.doc["separateLooseLuaLoader"]
        self.assertEqual(loose["function"], "LoadStoneAgeLUAPath(char const*)")
        self.assertEqual(loose["boundary"], "separate from the path/map4/real.bin record loader")

    def test_fail_closed_until_payload_exists(self):
        boundary = self.doc["verificationBoundary"]
        self.assertFalse(boundary["actualContainerBytes"])
        self.assertFalse(boundary["actualLuaEntryNames"])
        self.assertFalse(boundary["actualLuaPayloadBytes"])
        self.assertFalse(boundary["runtimeExecutionObserved"])


if __name__ == "__main__":
    unittest.main()
