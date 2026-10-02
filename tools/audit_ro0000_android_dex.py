#!/usr/bin/env python3
"""Static DEX structure inventory for the RO0000 Android APK; no code execution."""
import argparse
import hashlib
import json
import pathlib
import re
import struct
import zipfile


def _u16(data, off):
    if off < 0 or off + 2 > len(data):
        raise ValueError("DEX truncated at u16 offset 0x%x" % off)
    return struct.unpack_from("<H", data, off)[0]


def _u32(data, off):
    if off < 0 or off + 4 > len(data):
        raise ValueError("DEX truncated at u32 offset 0x%x" % off)
    return struct.unpack_from("<I", data, off)[0]


def _need(data, off, length, label):
    if off < 0 or length < 0 or off + length > len(data):
        raise ValueError("DEX truncated at " + label)


def _uleb128(data, off):
    value = 0
    shift = 0
    for _ in range(5):
        _need(data, off, 1, "uleb128")
        byte = data[off]
        off += 1
        value |= (byte & 0x7f) << shift
        if not byte & 0x80:
            return value, off
        shift += 7
    raise ValueError("invalid DEX uleb128")


def _mutf8(data, off):
    _, off = _uleb128(data, off)  # UTF-16 code unit length
    end = data.find(b"\x00", off)
    if end < 0:
        raise ValueError("unterminated DEX string")
    raw = data[off:end].replace(b"\xc0\x80", b"\x00")
    # Descriptor and Java identifier strings are ASCII in this target. For
    # modified UTF-8 surrogate sequences, preserve an explicit replacement.
    return raw.decode("utf-8", "replace")


def _table(data, size_off, offset_off, entry_size, label):
    count = _u32(data, size_off)
    offset = _u32(data, offset_off)
    if count == 0:
        return count, offset
    if offset == 0:
        raise ValueError("DEX %s table has entries but zero offset" % label)
    _need(data, offset, count * entry_size, label + " table")
    return count, offset


def _descriptor(types, index):
    if index == 0xffffffff:
        return None
    if index >= len(types):
        raise ValueError("DEX type index out of range: %d" % index)
    return types[index]


def inspect_dex(data):
    if len(data) < 0x70 or not data.startswith(b"dex\n") or data[7] != 0:
        raise ValueError("not a standard DEX file")
    version = data[4:7].decode("ascii", "replace")
    file_size = _u32(data, 0x20)
    header_size = _u32(data, 0x24)
    endian_tag = _u32(data, 0x28)
    if file_size != len(data):
        raise ValueError("DEX file_size mismatch: header=%d actual=%d" % (file_size, len(data)))
    if header_size != 0x70:
        raise ValueError("unsupported DEX header size: %d" % header_size)
    if endian_tag != 0x12345678:
        raise ValueError("unsupported DEX endian tag: 0x%08x" % endian_tag)

    string_count, string_off = _table(data, 0x38, 0x3c, 4, "string_ids")
    type_count, type_off = _table(data, 0x40, 0x44, 4, "type_ids")
    proto_count, proto_off = _table(data, 0x48, 0x4c, 12, "proto_ids")
    field_count, field_off = _table(data, 0x50, 0x54, 8, "field_ids")
    method_count, method_off = _table(data, 0x58, 0x5c, 8, "method_ids")
    class_count, class_off = _table(data, 0x60, 0x64, 32, "class_defs")

    strings = []
    for i in range(string_count):
        item_off = _u32(data, string_off + i * 4)
        _need(data, item_off, 1, "string_data[%d]" % i)
        strings.append(_mutf8(data, item_off))

    types = []
    for i in range(type_count):
        string_idx = _u32(data, type_off + i * 4)
        if string_idx >= len(strings):
            raise ValueError("DEX type descriptor string index out of range")
        types.append(strings[string_idx])

    protos = []
    for i in range(proto_count):
        item = proto_off + i * 12
        _shorty = _u32(data, item)
        return_idx = _u32(data, item + 4)
        parameters_off = _u32(data, item + 8)
        return_type = _descriptor(types, return_idx)
        parameters = []
        if parameters_off:
            count = _u32(data, parameters_off)
            _need(data, parameters_off + 4, count * 2, "proto parameters")
            parameters = [_descriptor(types, _u16(data, parameters_off + 4 + j * 2)) for j in range(count)]
        protos.append((return_type, parameters))

    method_ids = []
    for i in range(method_count):
        item = method_off + i * 8
        class_idx = _u16(data, item)
        proto_idx = _u16(data, item + 2)
        name_idx = _u32(data, item + 4)
        if class_idx >= len(types) or proto_idx >= len(protos) or name_idx >= len(strings):
            raise ValueError("DEX method id index out of range")
        method_ids.append({
            "class": types[class_idx],
            "name": strings[name_idx],
            "proto": protos[proto_idx],
        })

    class_records = []
    native_methods = []
    package_counts = {}
    declared_total = 0
    native_total = 0
    for i in range(class_count):
        item = class_off + i * 32
        class_idx = _u32(data, item)
        access_flags = _u32(data, item + 4)
        superclass_idx = _u32(data, item + 8)
        interfaces_off = _u32(data, item + 12)
        class_data_off = _u32(data, item + 24)
        descriptor = _descriptor(types, class_idx)
        superclass = _descriptor(types, superclass_idx)
        interfaces = []
        if interfaces_off:
            interface_count = _u32(data, interfaces_off)
            _need(data, interfaces_off + 4, interface_count * 2, "class interfaces")
            interfaces = [_descriptor(types, _u16(data, interfaces_off + 4 + j * 2))
                          for j in range(interface_count)]

        declared_methods = []
        native_count = 0
        if class_data_off:
            off = class_data_off
            static_fields, off = _uleb128(data, off)
            instance_fields, off = _uleb128(data, off)
            direct_methods, off = _uleb128(data, off)
            virtual_methods, off = _uleb128(data, off)
            for _ in range(static_fields + instance_fields):
                _, off = _uleb128(data, off)
                _, off = _uleb128(data, off)
            for method_group_count in (direct_methods, virtual_methods):
                method_idx = 0
                for _ in range(method_group_count):
                    diff, off = _uleb128(data, off)
                    flags, off = _uleb128(data, off)
                    _, off = _uleb128(data, off)  # code_off; zero for abstract/native
                    method_idx += diff
                    if method_idx >= len(method_ids):
                        raise ValueError("DEX class_data method index out of range")
                    method = method_ids[method_idx]
                    return_type, parameters = method["proto"]
                    signature = method["name"] + "(" + "".join(parameters) + ")" + str(return_type)
                    rec = {
                        "name": method["name"],
                        "signature": signature,
                        "accessFlags": flags,
                    }
                    declared_methods.append(rec)
                    declared_total += 1
                    if flags & 0x100:
                        native_count += 1
                        native_total += 1
                        native_methods.append({
                            "class": descriptor,
                            "name": method["name"],
                            "signature": signature,
                        })

        package = descriptor[1:descriptor.rfind("/")] if descriptor.startswith("L") and "/" in descriptor else "(default)"
        package_counts[package] = package_counts.get(package, 0) + 1
        class_records.append({
            "descriptor": descriptor,
            "accessFlags": access_flags,
            "superclass": superclass,
            "interfaces": interfaces,
            "declaredMethodCount": len(declared_methods),
            "nativeMethodCount": native_count,
            "declaredMethods": declared_methods,
        })

    string_categories = {
        "urlLike": re.compile(r"(?i)https?://"),
        "androidIntent": re.compile(r"^android\.intent\.action\."),
        "permission": re.compile(r"^android\.permission\."),
        "resourcePath": re.compile(r"(?i)(?:^|/)(?:map|data|assets|res)/|\.(?:bin|dat|lua|sabex|zip)$"),
        "updateTerms": re.compile(r"(?i)update|patch|version|download"),
    }
    indicators = {
        label: sum(1 for value in strings if pattern.search(value))
        for label, pattern in string_categories.items()
    }

    return {
        "dexVersion": version,
        "fileBytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "header": {
            "fileSize": file_size,
            "headerSize": header_size,
            "endianTag": "0x%08x" % endian_tag,
        },
        "counts": {
            "strings": string_count,
            "types": type_count,
            "protos": proto_count,
            "fieldReferences": field_count,
            "methodReferences": method_count,
            "classDefinitions": class_count,
            "declaredMethods": declared_total,
            "nativeMethods": native_total,
        },
        "packages": [{"descriptorPrefix": k, "classCount": v} for k, v in sorted(package_counts.items())],
        "classes": class_records,
        "nativeMethods": native_methods,
        "stringIndicators": indicators,
        "scopeNote": "DEX structural inventory only; method bytecode is not decompiled or executed. Literal URL/string contents are intentionally omitted.",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apk", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    apk = pathlib.Path(args.apk)
    if not apk.is_file():
        raise SystemExit("APK not found: " + str(apk))
    reports = []
    with zipfile.ZipFile(apk) as zf:
        for name in sorted(info.filename for info in zf.infolist()
                           if re.fullmatch(r"classes(?:[2-9][0-9]*)?\.dex", info.filename)):
            reports.append({"path": name, **inspect_dex(zf.read(name))})
    if not reports:
        raise SystemExit("APK contains no classes*.dex")
    result = {
        "format": "ro0000-android-dex-structure-audit-v1",
        "apk": str(apk),
        "dexFiles": reports,
        "summary": {
            "dexFileCount": len(reports),
            "classDefinitions": sum(r["counts"]["classDefinitions"] for r in reports),
            "declaredMethods": sum(r["counts"]["declaredMethods"] for r in reports),
            "nativeMethods": sum(r["counts"]["nativeMethods"] for r in reports),
        },
    }
    out = pathlib.Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result["summary"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
