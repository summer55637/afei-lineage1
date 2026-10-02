#!/usr/bin/env python3
import hashlib
import io
import struct
import unittest
import zipfile
import zlib

from audit_ro0000_android_apk import archive_entry_record, parse_axml_manifest, resource_name_candidates


NO_INDEX = 0xffffffff


def _len8(value):
    if value < 0x80:
        return bytes([value])
    return bytes([0x80 | (value >> 8), value & 0xff])


def _string_pool(strings):
    entries=[]
    for value in strings:
        raw=value.encode('utf-8')
        entries.append(_len8(len(value))+_len8(len(raw))+raw+b'\x00')
    strings_start=28+4*len(strings)
    offsets=[]
    cursor=0
    for entry in entries:
        offsets.append(cursor)
        cursor+=len(entry)
    data=b''.join(entries)
    padding=(-len(data))%4
    data+=b'\x00'*padding
    size=strings_start+len(data)
    header=struct.pack('<HHI',0x0001,28,size)
    header+=struct.pack('<IIIII',len(strings),0,0x100,strings_start,0)
    return header+b''.join(struct.pack('<I',offset) for offset in offsets)+data


def _start_tag(index, name, attrs=()):
    size=36+20*len(attrs)
    node=struct.pack('<HHIII',0x0102,16,size,1,NO_INDEX)
    ext=struct.pack('<IIHHHHHH',NO_INDEX,index[name],20,20,len(attrs),0,0,0)
    encoded=b''
    for key,value,kind in attrs:
        if kind=='string':
            value_index=index[value]
            raw=value_index
            value_type=0x03
            data=value_index
        elif kind=='bool':
            raw=NO_INDEX
            value_type=0x12
            data=1 if value else 0
        elif kind=='int':
            raw=NO_INDEX
            value_type=0x10
            data=value
        else:
            raise ValueError(kind)
        encoded+=struct.pack('<IIIHBBI',NO_INDEX,index[key],raw,8,0,value_type,data)
    return node+ext+encoded


def _end_tag(index,name):
    return struct.pack('<HHIII',0x0103,16,24,1,NO_INDEX)+struct.pack('<II',NO_INDEX,index[name])


def _manifest_fixture():
    strings=[
        'manifest','package','com.example.game','versionCode','uses-sdk','minSdkVersion','targetSdkVersion',
        'uses-permission','name','android.permission.INTERNET','application','label','StoneAge','debuggable',
        'activity','.MainActivity','exported','intent-filter','action','android.intent.action.MAIN',
        'category','android.intent.category.LAUNCHER','meta-data','android.app.lib_name','stoneage'
    ]
    index={value:i for i,value in enumerate(strings)}
    chunks=[_string_pool(strings)]
    chunks.append(_start_tag(index,'manifest',[
        ('package','com.example.game','string'),('versionCode',1,'int')
    ]))
    chunks.append(_start_tag(index,'uses-sdk',[
        ('minSdkVersion',21,'int'),('targetSdkVersion',29,'int')
    ]))
    chunks.append(_end_tag(index,'uses-sdk'))
    chunks.append(_start_tag(index,'uses-permission',[
        ('name','android.permission.INTERNET','string')
    ]))
    chunks.append(_end_tag(index,'uses-permission'))
    chunks.append(_start_tag(index,'application',[
        ('label','StoneAge','string'),('debuggable',False,'bool')
    ]))
    chunks.append(_start_tag(index,'activity',[
        ('name','.MainActivity','string'),('exported',True,'bool')
    ]))
    chunks.append(_start_tag(index,'intent-filter'))
    chunks.append(_start_tag(index,'action',[
        ('name','android.intent.action.MAIN','string')
    ]))
    chunks.append(_end_tag(index,'action'))
    chunks.append(_start_tag(index,'category',[
        ('name','android.intent.category.LAUNCHER','string')
    ]))
    chunks.append(_end_tag(index,'category'))
    chunks.append(_end_tag(index,'intent-filter'))
    chunks.append(_start_tag(index,'meta-data',[
        ('name','android.app.lib_name','string'),('label','stoneage','string')
    ]))
    chunks.append(_end_tag(index,'meta-data'))
    chunks.append(_end_tag(index,'activity'))
    chunks.append(_end_tag(index,'application'))
    chunks.append(_end_tag(index,'manifest'))
    body=b''.join(chunks)
    return struct.pack('<HHI',0x0003,8,8+len(body))+body


class AndroidApkStringScanTests(unittest.TestCase):
    def test_archive_entry_record_includes_crc_and_sha256(self):
        payload = b"StoneAge packaged skin fixture"
        stream = io.BytesIO()
        with zipfile.ZipFile(stream, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            archive.writestr("assets/data/skin/test.png", payload)
        stream.seek(0)
        with zipfile.ZipFile(stream) as archive:
            record = archive_entry_record(archive, archive.getinfo("assets/data/skin/test.png"))
        self.assertEqual(record["crc32"], "%08x" % (zlib.crc32(payload) & 0xffffffff))
        self.assertEqual(record["sha256"], hashlib.sha256(payload).hexdigest())
        self.assertEqual(record["bytes"], len(payload))

    def test_ascii_resource_path(self):
        values=resource_name_candidates(b'prefix\x00path/map4/real.bin\x00s/spr.bin\x00')
        self.assertIn('path/map4/real.bin',values)
        self.assertIn('s/spr.bin',values)

    def test_utf16le_resource_path(self):
        values=resource_name_candidates('path/map4/real.bin'.encode('utf-16le'))
        self.assertIn('path/map4/real.bin',values)

    def test_url_is_not_emitted(self):
        values=resource_name_candidates(b'https://example.invalid/private/client.map')
        self.assertEqual(values,[])

    def test_resource_extensions_are_bounded_to_known_types(self):
        values=resource_name_candidates(b'data/known.bin unknown.secret')
        self.assertEqual(values,['data/known.bin'])


class AndroidBinaryManifestTests(unittest.TestCase):
    def test_components_permissions_and_launch_filter(self):
        manifest=parse_axml_manifest(_manifest_fixture())
        self.assertEqual(manifest['parseStatus'],'parsed')
        self.assertEqual(manifest['package'],'com.example.game')
        self.assertEqual(manifest['versionCode'],1)
        self.assertEqual(manifest['minSdkVersion'],21)
        self.assertEqual(manifest['targetSdkVersion'],29)
        self.assertEqual(manifest['permissions'][0]['name'],'android.permission.INTERNET')
        self.assertEqual(manifest['application']['label'],'StoneAge')
        self.assertFalse(manifest['application']['debuggable'])
        activity=manifest['components'][0]
        self.assertEqual(activity['name'],'com.example.game.MainActivity')
        self.assertTrue(activity['exported'])
        self.assertEqual(activity['intentFilters'][0]['actions'],['android.intent.action.MAIN'])
        self.assertEqual(activity['intentFilters'][0]['categories'],['android.intent.category.LAUNCHER'])
        self.assertEqual(activity['metaData'][0]['name'],'android.app.lib_name')

    def test_non_binary_manifest_is_explicit(self):
        self.assertEqual(parse_axml_manifest(b'not xml')['parseStatus'],'not-binary-xml')


if __name__=='__main__':
    unittest.main()
