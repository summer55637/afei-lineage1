#!/usr/bin/env python3
"""Decode a RO0000 target ADRN container using target-compatible Blowfish ECB.

The target binary supplies its key internally; this tool requires the operator
to provide the key through --key or ADRN_BLOWFISH_KEY and never stores a
default key in the repository.
"""
from __future__ import annotations

import argparse
import ctypes
import ctypes.util
import hashlib
import json
import os
from pathlib import Path

HEADER_SIZE = 4
HEADER_WORD_LE = 0x31393839
BLOCK_SIZE = 8
RECORD_SIZE = 80


class OpenSSLBlowfish:
    def __init__(self, key: bytes) -> None:
        if not key:
            raise ValueError("empty Blowfish key")
        libname = ctypes.util.find_library("crypto")
        if not libname:
            raise RuntimeError("libcrypto not found")
        self.lib = ctypes.CDLL(libname)
        L = self.lib

        L.OSSL_PROVIDER_load.argtypes = [ctypes.c_void_p, ctypes.c_char_p]
        L.OSSL_PROVIDER_load.restype = ctypes.c_void_p
        L.EVP_CIPHER_CTX_new.restype = ctypes.c_void_p
        L.EVP_CIPHER_CTX_free.argtypes = [ctypes.c_void_p]
        L.EVP_bf_ecb.restype = ctypes.c_void_p
        L.EVP_DecryptInit_ex.argtypes = [
            ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p,
            ctypes.c_void_p, ctypes.c_void_p,
        ]
        L.EVP_DecryptInit_ex.restype = ctypes.c_int
        L.EVP_CIPHER_CTX_set_key_length.argtypes = [ctypes.c_void_p, ctypes.c_int]
        L.EVP_CIPHER_CTX_set_key_length.restype = ctypes.c_int
        L.EVP_CIPHER_CTX_set_padding.argtypes = [ctypes.c_void_p, ctypes.c_int]
        L.EVP_CIPHER_CTX_set_padding.restype = ctypes.c_int
        L.EVP_DecryptUpdate.argtypes = [
            ctypes.c_void_p, ctypes.POINTER(ctypes.c_ubyte),
            ctypes.POINTER(ctypes.c_int), ctypes.POINTER(ctypes.c_ubyte), ctypes.c_int,
        ]
        L.EVP_DecryptUpdate.restype = ctypes.c_int
        L.EVP_DecryptFinal_ex.argtypes = [
            ctypes.c_void_p, ctypes.POINTER(ctypes.c_ubyte), ctypes.POINTER(ctypes.c_int),
        ]
        L.EVP_DecryptFinal_ex.restype = ctypes.c_int

        self.provider = L.OSSL_PROVIDER_load(None, b"legacy")
        if not self.provider:
            raise RuntimeError("OpenSSL legacy provider could not be loaded")
        self.ctx = L.EVP_CIPHER_CTX_new()
        if not self.ctx:
            raise RuntimeError("EVP_CIPHER_CTX_new failed")

        cipher = L.EVP_bf_ecb()
        if not cipher:
            self.close()
            raise RuntimeError("EVP_bf_ecb unavailable")

        key_buf = (ctypes.c_ubyte * len(key)).from_buffer_copy(key)
        if L.EVP_DecryptInit_ex(self.ctx, cipher, None, None, None) != 1:
            self.close()
            raise RuntimeError("EVP_DecryptInit_ex(cipher) failed")
        if L.EVP_CIPHER_CTX_set_key_length(self.ctx, len(key)) != 1:
            self.close()
            raise RuntimeError("target Blowfish key length unsupported")
        if L.EVP_DecryptInit_ex(self.ctx, None, None, key_buf, None) != 1:
            self.close()
            raise RuntimeError("EVP_DecryptInit_ex(key) failed")
        if L.EVP_CIPHER_CTX_set_padding(self.ctx, 0) != 1:
            self.close()
            raise RuntimeError("EVP_CIPHER_CTX_set_padding failed")

    def decrypt(self, ciphertext: bytes) -> bytes:
        if len(ciphertext) % BLOCK_SIZE:
            raise ValueError("ciphertext block area must be a multiple of 8 bytes")
        if not ciphertext:
            return b""
        L = self.lib
        inp = (ctypes.c_ubyte * len(ciphertext)).from_buffer_copy(ciphertext)
        out = (ctypes.c_ubyte * (len(ciphertext) + BLOCK_SIZE))()
        n1 = ctypes.c_int()
        n2 = ctypes.c_int()

        if L.EVP_DecryptUpdate(self.ctx, out, ctypes.byref(n1), inp, len(ciphertext)) != 1:
            raise RuntimeError("EVP_DecryptUpdate failed")
        tail = ctypes.cast(ctypes.byref(out, n1.value), ctypes.POINTER(ctypes.c_ubyte))
        if L.EVP_DecryptFinal_ex(self.ctx, tail, ctypes.byref(n2)) != 1:
            raise RuntimeError("EVP_DecryptFinal_ex failed")
        return bytes(out[: n1.value + n2.value])

    def close(self) -> None:
        if getattr(self, "ctx", None):
            self.lib.EVP_CIPHER_CTX_free(self.ctx)
            self.ctx = None


def decode_adrn(data: bytes, key_ascii: str) -> dict:
    if len(data) < HEADER_SIZE:
        raise ValueError("ADRN file is shorter than its 4-byte header")
    header_word = int.from_bytes(data[:4], "little")
    if header_word != HEADER_WORD_LE:
        raise ValueError(
            f"unexpected ADRN header word: 0x{header_word:08x}; "
            f"expected 0x{HEADER_WORD_LE:08x}"
        )

    payload = data[HEADER_SIZE:]
    full_len = (len(payload) // BLOCK_SIZE) * BLOCK_SIZE
    remainder = payload[full_len:]

    cipher = OpenSSLBlowfish(key_ascii.encode("ascii"))
    try:
        decoded = cipher.decrypt(payload[:full_len])
    finally:
        cipher.close()

    marker = remainder[0] if remainder else None
    target_length = len(payload) if marker is None else len(payload) - marker - 1
    if target_length < 0:
        raise ValueError("target decoded length became negative")

    available = len(decoded)
    materialized = decoded[:min(target_length, available)]

    return {
        "format": "ro0000-target-adrn-decoder-v2",
        "inputBytes": len(data),
        "headerWordLE": f"0x{header_word:08x}",
        "encodedPayloadBytes": len(payload),
        "encryptedBlockBytes": full_len,
        "remainderBytes": len(remainder),
        "remainderMarker": marker,
        "targetDecodedLength": target_length,
        "availableDecodedBlockBytes": available,
        "materializedDecodedBytes": len(materialized),
        "decodedSha256": hashlib.sha256(materialized).hexdigest(),
        "recordSizeBytes": RECORD_SIZE,
        "recordCount": target_length // RECORD_SIZE,
        "recordRemainderBytes": target_length % RECORD_SIZE,
        "output": materialized,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("adrn_file", type=Path)
    parser.add_argument("--key", default=None, help="ASCII Blowfish key")
    parser.add_argument("--out", type=Path, default=None)
    parser.add_argument("--json", type=Path, default=None)
    parser.add_argument("--require-record-alignment", action="store_true")
    args = parser.parse_args()

    key = args.key or os.environ.get("ADRN_BLOWFISH_KEY")
    if not key:
        parser.error("provide --key or ADRN_BLOWFISH_KEY")

    result = decode_adrn(args.adrn_file.read_bytes(), key)
    raw = result.pop("output")

    if args.require_record_alignment and result["recordRemainderBytes"] != 0:
        raise SystemExit("decoded length is not aligned to 80-byte ADRNBIN records")
    if args.out:
        args.out.write_bytes(raw)
        result["outputFile"] = str(args.out)
    if args.json:
        args.json.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
