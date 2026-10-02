#!/usr/bin/env python3
from __future__ import annotations

import ctypes
import ctypes.util
import importlib.util
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location(
    "decode_ro0000_adrn", HERE / "decode_ro0000_adrn.py"
)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

KEY = b"0123456789abcdef0123456789abcdef"
PLAINTEXT = bytes((i * 37 + 11) & 0xff for i in range(80))


def encrypt_blocks(data: bytes, key: bytes) -> bytes:
    if len(data) % 8:
        raise AssertionError("test plaintext must be block aligned")
    libname = ctypes.util.find_library("crypto")
    if not libname:
        raise RuntimeError("libcrypto not found")
    L = ctypes.CDLL(libname)

    L.OSSL_PROVIDER_load.argtypes = [ctypes.c_void_p, ctypes.c_char_p]
    L.OSSL_PROVIDER_load.restype = ctypes.c_void_p
    L.EVP_CIPHER_CTX_new.restype = ctypes.c_void_p
    L.EVP_CIPHER_CTX_free.argtypes = [ctypes.c_void_p]
    L.EVP_bf_ecb.restype = ctypes.c_void_p
    L.EVP_EncryptInit_ex.argtypes = [
        ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p,
        ctypes.c_void_p, ctypes.c_void_p,
    ]
    L.EVP_EncryptInit_ex.restype = ctypes.c_int
    L.EVP_CIPHER_CTX_set_key_length.argtypes = [ctypes.c_void_p, ctypes.c_int]
    L.EVP_CIPHER_CTX_set_key_length.restype = ctypes.c_int
    L.EVP_CIPHER_CTX_set_padding.argtypes = [ctypes.c_void_p, ctypes.c_int]
    L.EVP_CIPHER_CTX_set_padding.restype = ctypes.c_int
    L.EVP_EncryptUpdate.argtypes = [
        ctypes.c_void_p, ctypes.POINTER(ctypes.c_ubyte),
        ctypes.POINTER(ctypes.c_int), ctypes.POINTER(ctypes.c_ubyte), ctypes.c_int,
    ]
    L.EVP_EncryptUpdate.restype = ctypes.c_int
    L.EVP_EncryptFinal_ex.argtypes = [
        ctypes.c_void_p, ctypes.POINTER(ctypes.c_ubyte), ctypes.POINTER(ctypes.c_int),
    ]
    L.EVP_EncryptFinal_ex.restype = ctypes.c_int

    if not L.OSSL_PROVIDER_load(None, b"legacy"):
        raise RuntimeError("OpenSSL legacy provider unavailable")

    ctx = L.EVP_CIPHER_CTX_new()
    if not ctx:
        raise RuntimeError("EVP_CIPHER_CTX_new failed")
    try:
        cipher = L.EVP_bf_ecb()
        key_buf = (ctypes.c_ubyte * len(key)).from_buffer_copy(key)
        inp = (ctypes.c_ubyte * len(data)).from_buffer_copy(data)
        out = (ctypes.c_ubyte * (len(data) + 8))()
        n1 = ctypes.c_int()
        n2 = ctypes.c_int()

        assert L.EVP_EncryptInit_ex(ctx, cipher, None, None, None) == 1
        assert L.EVP_CIPHER_CTX_set_key_length(ctx, len(key)) == 1
        assert L.EVP_EncryptInit_ex(ctx, None, None, key_buf, None) == 1
        assert L.EVP_CIPHER_CTX_set_padding(ctx, 0) == 1
        assert L.EVP_EncryptUpdate(
            ctx, out, ctypes.byref(n1), inp, len(data)
        ) == 1
        tail = ctypes.cast(
            ctypes.byref(out, n1.value), ctypes.POINTER(ctypes.c_ubyte)
        )
        assert L.EVP_EncryptFinal_ex(ctx, tail, ctypes.byref(n2)) == 1
        return bytes(out[: n1.value + n2.value])
    finally:
        L.EVP_CIPHER_CTX_free(ctx)


ciphertext = encrypt_blocks(PLAINTEXT, KEY)
container = module.HEADER_WORD_LE.to_bytes(4, "little") + ciphertext
result = module.decode_adrn(container, KEY.decode("ascii"))

assert result["headerWordLE"] == "0x31393839"
assert result["encodedPayloadBytes"] == 80
assert result["encryptedBlockBytes"] == 80
assert result["remainderBytes"] == 0
assert result["targetDecodedLength"] == 80
assert result["materializedDecodedBytes"] == 80
assert result["recordCount"] == 1
assert result["recordRemainderBytes"] == 0
assert result["output"] == PLAINTEXT

print("ADRN decoder 32-byte Blowfish regression passed")
