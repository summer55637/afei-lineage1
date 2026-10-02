#!/usr/bin/env python3
import tempfile
import unittest
from pathlib import Path

from audit_ro0000_android_java import mask_java, method_records


class JavaSourceRedactionTests(unittest.TestCase):
    def test_masks_comments_strings_and_chars(self):
        source = 'String url = "https://secret.example/path"; // https://comment.example\nchar c = \'x\'; /* host.example */'
        masked = mask_java(source)
        self.assertNotIn("secret.example", masked)
        self.assertNotIn("comment.example", masked)
        self.assertNotIn("host.example", masked)
        self.assertEqual(masked.count("\n"), source.count("\n"))

    def test_supported_package_scope_includes_sdl_helpers(self):
        from audit_ro0000_android_java import supported_package
        self.assertTrue(supported_package("org.libsdl.app"))
        self.assertTrue(supported_package("org.libsdl.app.SDLController"))
        self.assertTrue(supported_package("com.newssa.stoneage.update"))
        self.assertFalse(supported_package("android.app"))

    def test_call_site_count_is_not_deduplicated_identifier_count(self):
        source = """
package com.newssa.stoneage.update;
public class UpdateChecker {
    public void check() {
        client.execute();
        client.execute();
    }
}
"""
        method = next(m for m in method_records(source) if m["name"] == "check")
        self.assertEqual(method["callSites"], 2)
        self.assertEqual(method["uniqueCallIdentifierCount"], 1)
        self.assertEqual(method["calls"], ["client.execute"])
        self.assertEqual([call["target"] for call in method["callSequence"]], ["client.execute", "client.execute"])
    def test_records_calls_without_literal_values(self):
        source = '''
package com.newssa.stoneage.update;
public class UpdateChecker {
    public void check() {
        String endpoint = "https://secret.example/patch";
        this.fetch();
        client.execute();
    }
    private void fetch() { helper(); }
}
'''
        methods = method_records(source)
        check = next(m for m in methods if m["name"] == "check")
        self.assertIn("this.fetch", check["calls"])
        self.assertIn("client.execute", check["calls"])
        serialized = repr(methods)
        self.assertNotIn("secret.example", serialized)
        self.assertNotIn("patch", serialized)


if __name__ == "__main__":
    unittest.main()
