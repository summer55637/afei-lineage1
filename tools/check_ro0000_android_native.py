#!/usr/bin/env python3
import struct
import unittest

from audit_ro0000_android_native import (
    parse_elf_header,
    parse_needed_libraries,
    parse_symbols,
    relevant_symbol_names,
    relevant_embedded_strings,
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

    def test_embedded_resource_format_string(self):
        values = relevant_embedded_strings(b"prefix\\x00path/map4/%s/real.bin\\x00")
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
