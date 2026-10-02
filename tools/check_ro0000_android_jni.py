#!/usr/bin/env python3
import unittest

from audit_ro0000_android_jni import parse_jni_exports, compare_jni_methods


class JniDeclarationExportTests(unittest.TestCase):
    def test_parse_qualified_jni_symbols(self):
        output = """    10: 00001000 20 FUNC GLOBAL DEFAULT 11 Java_com_newssa_stoneage_ko_JNILibrary_callbackFoo
    11: 00001100 32 FUNC GLOBAL DEFAULT 11 Java_com_newssa_stoneage_ko_JNILibrary_callbackBar
    12: 00001200 16 FUNC LOCAL DEFAULT 11 Java_other_Class_method
"""
        self.assertEqual(parse_jni_exports(output), ["callbackBar", "callbackFoo"])

    def test_classifies_mismatch_without_assigning_cause(self):
        declared = [{"name": "callbackFoo"}, {"name": "callbackMissing"}]
        result = compare_jni_methods(declared, ["callbackFoo", "callbackExtra"])
        self.assertEqual(result["matched"], ["callbackFoo"])
        self.assertEqual(result["declaredWithoutExport"], ["callbackMissing"])
        self.assertEqual(result["exportedWithoutDexDeclaration"], ["callbackExtra"])
        self.assertFalse(result["interpretation"]["extraExportProvesStaleCode"])


if __name__ == "__main__":
    unittest.main()
