#!/usr/bin/env python3
import struct
import unittest

from audit_ro0000_android_dex import inspect_dex


def _uleb(value):
    out=bytearray()
    while True:
        byte=value&0x7f
        value>>=7
        if value:
            out.append(byte|0x80)
        else:
            out.append(byte)
            return bytes(out)


def _minimal_dex():
    strings=["Lcom/example/Test;","V","nativeFoo","V","Test.java"]
    header_size=0x70
    string_ids_off=header_size
    type_ids_off=string_ids_off+len(strings)*4
    proto_ids_off=type_ids_off+2*4
    method_ids_off=proto_ids_off+12
    class_defs_off=method_ids_off+8
    data_off=class_defs_off+32

    string_data=bytearray()
    string_offsets=[]
    for value in strings:
        string_offsets.append(data_off+len(string_data))
        raw=value.encode("utf-8")
        string_data.extend(_uleb(len(value))+raw+b"\x00")
    class_data_off=data_off+len(string_data)
    class_data=_uleb(0)+_uleb(0)+_uleb(1)+_uleb(0)+_uleb(0)+_uleb(0x109)+_uleb(0)
    file_size=class_data_off+len(class_data)

    data=bytearray(file_size)
    data[:8]=b"dex\n035\x00"
    struct.pack_into("<I",data,0x20,file_size)
    struct.pack_into("<I",data,0x24,header_size)
    struct.pack_into("<I",data,0x28,0x12345678)
    struct.pack_into("<II",data,0x38,len(strings),string_ids_off)
    struct.pack_into("<II",data,0x40,2,type_ids_off)
    struct.pack_into("<II",data,0x48,1,proto_ids_off)
    struct.pack_into("<II",data,0x50,0,0)
    struct.pack_into("<II",data,0x58,1,method_ids_off)
    struct.pack_into("<II",data,0x60,1,class_defs_off)
    struct.pack_into("<II",data,0x68,file_size-data_off,data_off)

    for i,offset in enumerate(string_offsets):
        struct.pack_into("<I",data,string_ids_off+i*4,offset)
    struct.pack_into("<II",data,type_ids_off,0,1)
    struct.pack_into("<III",data,proto_ids_off,3,1,0)
    struct.pack_into("<HHI",data,method_ids_off,0,0,2)
    struct.pack_into("<IIIIIIII",data,class_defs_off,0,0x1,0xffffffff,0,4,0,class_data_off,0)
    data[data_off:class_data_off]=string_data
    data[class_data_off:]=class_data
    return bytes(data)


class DexStructureAuditTests(unittest.TestCase):
    def test_rejects_non_dex(self):
        with self.assertRaisesRegex(ValueError,"not a standard DEX"):
            inspect_dex(b"not a dex file")

    def test_rejects_truncated_header(self):
        with self.assertRaisesRegex(ValueError,"not a standard DEX"):
            inspect_dex(b"dex\n035\x00")

    def test_parses_class_method_and_native_flag(self):
        report=inspect_dex(_minimal_dex())
        self.assertEqual(report["dexVersion"],"035")
        self.assertEqual(report["counts"]["classDefinitions"],1)
        self.assertEqual(report["counts"]["methodReferences"],1)
        self.assertEqual(report["counts"]["declaredMethods"],1)
        self.assertEqual(report["counts"]["nativeMethods"],1)
        self.assertEqual(report["classes"][0]["descriptor"],"Lcom/example/Test;")
        self.assertEqual(report["nativeMethods"][0]["name"],"nativeFoo")
        self.assertEqual(report["nativeMethods"][0]["signature"],"nativeFoo()V")


if __name__=="__main__":
    unittest.main()
