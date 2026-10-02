#!/usr/bin/env python3
import struct
import unittest

from audit_ro0000_android_native import (
    parse_elf_header,
    parse_needed_libraries,
    parse_symbols,
    relevant_symbol_names,
    relevant_embedded_strings,
    FOCUSED_FUNCTION_RE,
    FOCUSED_OBJECTS,
)


def synthetic_elf(elf_class=1, data_encoding=1, machine=40):
    size = 52 if elf_class == 1 else 64
    data = bytearray(size)
    data[:4] = b"\x7fELF"
    data[4] = elf_class
    data[5] = data_encoding
    data[6] = 1
    endian = "<" if data_encoding == 1 else ">"
    struct.pack_into(endian + "HHI", data, 16, 3, machine, 1)
    if elf_class == 1:
        struct.pack_into(endian + "I", data, 24, 0x12345678)
    else:
        struct.pack_into(endian + "Q", data, 24, 0x123456789ABCDEF0)
    return bytes(data)


class AndroidNativeElfAuditTests(unittest.TestCase):
    def test_elf32_little_endian_arm_header(self):
        header = parse_elf_header(synthetic_elf())
        self.assertEqual(header["class"], "ELF32")
        self.assertEqual(header["endianness"], "little")
        self.assertEqual(header["machine"], "ARM")
        self.assertEqual(header["entryPoint"], 0x12345678)

    def test_elf64_big_endian_header(self):
        header = parse_elf_header(synthetic_elf(elf_class=2, data_encoding=2, machine=183))
        self.assertEqual(header["class"], "ELF64")
        self.assertEqual(header["endianness"], "big")
        self.assertEqual(header["machine"], "AArch64")
        self.assertEqual(header["entryPoint"], 0x123456789ABCDEF0)

    def test_rejects_non_elf_and_truncated_header(self):
        with self.assertRaises(ValueError):
            parse_elf_header(b"not-elf")
        with self.assertRaises(ValueError):
            parse_elf_header(b"\x7fELF" + b"\x01\x01\x01" + b"\x00" * 20)

    def test_updater_symbol_focus_includes_qualified_methods(self):
        candidates = [
            "DownLoadIniFile()",
            "GetBinaryResource()",
            "CIniManage::ReadPatchInfo()",
            "HttpClient::DownloadFile(char const*)",
            "Decompress::UnZipFile(char const*)",
            "DownloadResource(char const*)",
        ]
        for candidate in candidates:
            with self.subTest(candidate=candidate):
                self.assertRegex(candidate, FOCUSED_FUNCTION_RE)
        self.assertNotRegex("UnrelatedGameplayFunction()", FOCUSED_FUNCTION_RE)

    def test_accessor_focus_includes_known_fields(self):
        candidates = [
            "realGetPos(unsigned int, short*, short*)",
            "realGetWH(unsigned int, short*, short*)",
            "realGetHitPoints(unsigned int, short*, short*)",
            "realGetHitFlag(unsigned int, short*)",
            "realGetPrioType(unsigned int, short*)",
            "realGetHeightFlag(unsigned int, short*)",
            "realGetSoundEffect(unsigned int)",
            "realGetWalkSoundEffect(unsigned int)",
            "realGetNo(unsigned int, unsigned int*)",
            "realGetImage(int, unsigned char**, int*, int*)",
        ]
        for candidate in candidates:
            with self.subTest(candidate=candidate):
                self.assertRegex(candidate, FOCUSED_FUNCTION_RE)

    def test_map_and_renderer_focus_includes_target_functions(self):
        candidates = [
            "lssproto_S_recv(int, char*)",
            "lssproto_M_recv(int, int, int, int, int, int, char*)",
            "ReadBattleMap(int)",
            "StockDispBuffer(int, int, int, int, int)",
            "PutBmp(int, int, int, int)",
            "LoadBmp(int)",
            "decoder(unsigned char*, unsigned char**, int*, int*)",
            "decoderPng(unsigned char*, unsigned char**, int*, int*)",
            "ReadAniFile(int)",
            "SpecAnim(int)",
            "play_map_bgm(int)",
        ]
        for candidate in candidates:
            with self.subTest(candidate=candidate):
                self.assertRegex(candidate, FOCUSED_FUNCTION_RE)

    def test_extended_map_cache_movement_and_effect_focus(self):
        candidates = [
            "initMap()",
            "createMap(int, int, int)",
            "setMap(int, int, int)",
            "writeMap(int, int, int, int, int, unsigned short*, unsigned short*, unsigned short*)",
            "readMap(int, int, int, int, int, unsigned short*, unsigned short*, unsigned short*)",
            "resetMap()",
            "redrawMap()",
            "readHitMap(int, int, int, int, unsigned short*, unsigned short*, unsigned short*, unsigned short*)",
            "checkHitMap(int, int)",
            "checkEmptyMap(int)",
            "checkEmptyMapData(int, int, int)",
            "_checkEmptyMap()",
            "setMapMovePoint2(int, int)",
            "_mapMove()",
            "mapMove2()",
            "_partyMapMove()",
            "createAutoMap(int, int, int)",
            "initAutoMapColor()",
            "makeAutoMapColor()",
            "readAutoMapColor(char*)",
            "writeAutoMapColor(char*)",
            "initMapEffect(bool)",
            "mapEffectProc2(int)",
            "mapEffectRain2(int)",
            "mapEffectSnow2(int)",
            "getMapEffectBuf()",
            "InitPteernSeparationBin(char const*, bool)",
            "cleanupRealbin()",
        ]
        for candidate in candidates:
            with self.subTest(candidate=candidate):
                self.assertRegex(candidate, FOCUSED_FUNCTION_RE)

    def test_sdl_input_main_loop_and_map_event_focus(self):
        candidates = [
            "SDL_main",
            "EventProc(unsigned int, SDL_Event*)",
            "GameMain()",
            "DispCallProc()",
            "networkLoop()",
            "ScriptRunningProcess()",
            "Process()",
            "ScrollPanelProcess()",
            "NextScrollPanelRender()",
            "AniProc()",
            "MouseProc()",
            "HitMouseCursor()",
            "ClearMouseOnceState()",
            "InitProc()",
            "GetKeyInputFocus(STR_BUFFER*)",
            "KeyboardTab()",
            "KeyboardBackSpace()",
            "KeyboardLeft()",
            "KeyboardRight()",
            "KeyboardReturn()",
            "MouseNowPoint(int, int)",
            "MouseCrickLeftDownPoint(int, int)",
            "MouseDblCrickRightUpPoint(int, int)",
            "CleanMouseClick()",
            "CheckWndMouse(int, int)",
            "changeInput(STR_BUFFER*, int)",
            "CallbackInputBoxData(int, int)",
            "keyBoardGetWndFlag()",
            "keyBoardSetWndFlag(int)",
            "keyBoardProcWnd()",
            "keyBoardGetStr()",
            "keyBoardInitWnd(int, int)",
            "keyBoardInitStr(int, int)",
            "InitGame()",
            "SystemTask()",
            "EndGame()",
            "checkGuildBoxHit()",
            "DispCallProc()",
            "InitShapeClickStatus()",
            "RealTimeToSATime(tagLSTIME*)",
            "NextScrollPanelRender()",
            "stockDispBtnCls()",
            "joy_read()",
            "DoNormalCallback()",
            "PaletteProc()",
            "Flip()",
            "InitSurfaceInfo()",
            "repairMap()",
            "GetRealX(int)",
            "GetRealY(int)",
            "getAutoAct()",
            "StopAutoWalk()",
            "PeekNextPostion()",
            "GetNextPostion(int*, int*)",
            "CheckOnWarpPoint(int, int)",
            "CheckCurrentGuideRealPosition(int, int)",
            "lssproto_AC_send(int, int, int, int)",
            "lssproto_EV_send(int, int, int, int, int, int)",
            "lssproto_M_send(int, int, int, int, int, int)",
            "_sendMoveRoute()",
            "_sendEncount()",
            "_checkEncount()",
            "moveProc()",
            "onceMoveProc()",
            "partyMoveProc()",
            "_execEtcEvent()",
            "_etcEventCheck()",
            "_sendWarpEvent()",
            "_sendEnemyEvent()",
            "_checkEnemyEvent(int, int)",
            "_checkWarpEvent(int, int)",
            "warpEffectProc()",
            "Java_com_newssa_stoneage_ko_JNILibrary_callbackKeyboardChange",
        ]
        for candidate in candidates:
            with self.subTest(candidate=candidate):
                self.assertRegex(candidate, FOCUSED_FUNCTION_RE)

    def test_input_movement_object_inventory(self):
        names = {
            "mouse", "pc", "nowFloor", "nowFloorGxSize", "nowFloorGySize",
            "mouseCursorMode", "mouseMapX", "mouseMapY", "mouseMapGx", "mouseMapGy",
            "ShowMouseFlg", "mouseLeftCrick", "mouseLeftOn", "mouseRightCrick",
            "mouseRightOn", "moveRoute", "moveRoute2", "moveRouteCnt", "moveRouteCnt2",
            "moveStackFlag", "moveStackGx", "moveStackGy", "moveRouteDir",
            "moveRouteGx", "moveRouteGy", "moveLastDir", "eventWarpSendFlag",
            "eventEnemySendFlag", "_etcEventFlag", "_etcEventStep", "_etcEventMode",
            "_eventWarpNo", "_warpEventFlag", "_enemyEventFlag", "_enemyEventDir",
        }
        self.assertTrue(names.issubset(FOCUSED_OBJECTS))
        self.assertNotIn("idKey", FOCUSED_OBJECTS)
        self.assertNotIn("RegKey", FOCUSED_OBJECTS)

    def test_embedded_resource_format_string(self):
        values = relevant_embedded_strings(b"prefix\x00path/map4/%s/real.bin\x00")
        self.assertIn("path/map4/%s/real.bin", values)

    def test_embedded_utf16le_resource_string(self):
        value = "s/%s/adrn.bin"
        values = relevant_embedded_strings(value.encode("utf-16le"))
        self.assertIn(value, values)

    def test_dynamic_dependencies(self):
        output = """
 0x00000001 (NEEDED) Shared library: [libc.so]
 0x00000001 (NEEDED) Shared library: [libSDL2.so]
"""
        self.assertEqual(parse_needed_libraries(output), ["libSDL2.so", "libc.so"])

    def test_dynamic_symbol_classification(self):
        output = """
Symbol table '.dynsym' contains 3 entries:
   Num:    Value  Size Type    Bind   Vis      Ndx Name
     1: 00000000     0 FUNC    GLOBAL DEFAULT  UND SDL_RWFromFile
     2: 00001000    12 FUNC    GLOBAL DEFAULT   12 loadMapResource
"""
        undefined, exported = parse_symbols(output)
        self.assertEqual(undefined, ["SDL_RWFromFile"])
        self.assertEqual(exported, ["loadMapResource"])
        self.assertEqual(
            relevant_symbol_names(undefined + exported),
            ["SDL_RWFromFile", "loadMapResource"],
        )


if __name__ == "__main__":
    unittest.main()
