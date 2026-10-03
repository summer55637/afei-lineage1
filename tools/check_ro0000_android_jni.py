#!/usr/bin/env python3
import unittest

from audit_ro0000_android_jni import (parse_jni_exports, parse_all_jni_symbols, parse_jni_onload_symbols, summarize_onload_disassembly, relevant_native_strings, compare_jni_methods, jni_escape, jni_symbol_candidates, compare_all_declarations)


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

    def test_parse_defined_jni_onload_symbol(self):
        output = """  7: 00001234 48 FUNC GLOBAL DEFAULT 11 JNI_OnLoad
  8: 00000000  0 FUNC GLOBAL DEFAULT UND JNI_OnLoad
  9: 00001234 48 FUNC LOCAL DEFAULT 11 JNI_OnLoad
"""
        self.assertEqual(
            parse_jni_onload_symbols(output),
            [{"value": "0x1234", "size": 48}],
        )

    def test_summarize_jni_onload_calls_without_publishing_disassembly(self):
        output = """00001000 <JNI_OnLoad>:
    1000: push %ebp
    1001: call 2000 <FindClass@plt>
    1006: call *%eax
    1008: ret
"""
        result = summarize_onload_disassembly(output)
        self.assertEqual(result["instructionLineCount"], 4)
        self.assertEqual(result["directCallTargets"], ["FindClass"])
        self.assertEqual(result["indirectCallSiteCount"], 1)
        self.assertEqual(len(result["disassemblySha256"]), 64)

    def test_relevant_native_strings_keep_class_and_method_candidates_separate(self):
        declarations = [
            {
                "class": "Lcom/tencent/gcloud/voice/GCloudVoiceEngineHelper;",
                "name": "ChangeRole",
                "signature": "ChangeRole(I)I",
            },
        ]
        data = b"prefix\0com/tencent/gcloud/voice/GCloudVoiceEngineHelper\0ChangeRole\0/private/vendor/build/path\0unrelated\0"
        exports = [
            "Java_com_tencent_gcloud_voice_GCloudVoiceEngineHelper_Init",
        ]
        result = relevant_native_strings(data, declarations, exports)
        self.assertEqual(result[0]["class"], declarations[0]["class"])
        self.assertTrue(result[0]["methodNameLiteralPresent"])
        self.assertTrue(result[0]["classPathLiteralPresent"])
        self.assertEqual(result[0]["matchingMethodStringCount"], 1)
        self.assertNotIn("stringCandidates", result[0])
        self.assertNotIn("/private/vendor/build/path", str(result))

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
