#!/usr/bin/env python3
import unittest

from audit_ro0000_android_jni import (parse_jni_exports, parse_all_jni_symbols, compare_jni_methods, jni_escape, jni_symbol_candidates, compare_all_declarations)


class JniDeclarationExportTests(unittest.TestCase):
    def test_parse_qualified_jni_symbols(self):
        output = """    10: 00001000 20 FUNC GLOBAL DEFAULT 11 Java_com_newssa_stoneage_ko_JNILibrary_callbackFoo
    11: 00001100 32 FUNC GLOBAL DEFAULT 11 Java_com_newssa_stoneage_ko_JNILibrary_callbackBar
    12: 00001200 16 FUNC LOCAL DEFAULT 11 Java_other_Class_method
"""
        self.assertEqual(parse_jni_exports(output), ["callbackBar", "callbackFoo"])

    def test_parse_all_jni_symbols_ignores_undefined_and_local(self):
        output = """    10: 00001000 20 FUNC GLOBAL DEFAULT 11 Java_org_libsdl_app_SDLActivity_nativePause
    11: 00000000  0 FUNC GLOBAL DEFAULT UND Java_org_libsdl_app_SDLActivity_nativeResume
    12: 00001100 32 FUNC WEAK DEFAULT 11 JNI_OnLoad
    13: 00001200 16 FUNC LOCAL DEFAULT 11 Java_other_Class_method
"""
        symbols, onload = parse_all_jni_symbols(output)
        self.assertEqual(symbols, ["Java_org_libsdl_app_SDLActivity_nativePause"])
        self.assertTrue(onload)

    def test_jni_mangling_and_overloaded_signature_candidates(self):
        self.assertEqual(jni_escape("org/libsdl/app/SDLActivity"), "org_libsdl_app_SDLActivity")
        self.assertEqual(jni_escape("native_name"), "native_1name")
        candidates = jni_symbol_candidates(
            "Lcom/tencent/gcloud/voice/GCloudVoiceEngineHelper;",
            "SetMode",
            "SetMode(I)I",
        )
        self.assertEqual(
            candidates["short"],
            "Java_com_tencent_gcloud_voice_GCloudVoiceEngineHelper_SetMode",
        )
        self.assertEqual(
            candidates["long"],
            "Java_com_tencent_gcloud_voice_GCloudVoiceEngineHelper_SetMode__I",
        )

    def test_all_declarations_report_static_matches_and_dynamic_possibility(self):
        declarations = [
            {"class": "Lorg/libsdl/app/SDLActivity;", "name": "nativePause", "signature": "nativePause()V"},
            {"class": "Lcom/example/Voice;", "name": "Init", "signature": "Init()I"},
            {"class": "Lcom/example/Voice;", "name": "missingVoiceMethod", "signature": "missingVoiceMethod()V"},
            {"class": "Lcom/tencent/bugly/NativeCrashHandler;", "name": "nativeLog", "signature": "nativeLog()V"},
        ]
        libraries = {
            "x86": [
                {"path": "lib/x86/libSDL2.so", "jniExports": [
                    "Java_org_libsdl_app_SDLActivity_nativePause"
                ], "jniOnLoadExported": True},
                {"path": "lib/x86/libvoice.so", "jniExports": [
                    "Java_com_example_Voice_Init"
                ], "jniOnLoadExported": True},
            ]
        }
        result = compare_all_declarations(declarations, libraries)
        records = result["byAbi"]["x86"]["declarations"]
        self.assertEqual(records[0]["status"], "static-export-match")
        self.assertEqual(records[1]["status"], "static-export-match")
        self.assertEqual(records[2]["status"], "no-static-export-package-related-jni-onload")
        self.assertEqual(records[3]["status"], "no-static-export-or-package-related-jni-onload")
        self.assertEqual(result["parity"]["staticExportMatchedInEveryAbi"], 2)

    def test_classifies_mismatch_without_assigning_cause(self):
        declared = [{"name": "callbackFoo"}, {"name": "callbackMissing"}]
        result = compare_jni_methods(declared, ["callbackFoo", "callbackExtra"])
        self.assertEqual(result["matched"], ["callbackFoo"])
        self.assertEqual(result["declaredWithoutExport"], ["callbackMissing"])
        self.assertEqual(result["exportedWithoutDexDeclaration"], ["callbackExtra"])
        self.assertFalse(result["interpretation"]["extraExportProvesStaleCode"])


if __name__ == "__main__":
    unittest.main()
