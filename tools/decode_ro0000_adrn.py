#!/usr/bin/env python3
"""Decode a RO0000 target ADRN container through OpenSSL's Blowfish-ECB.

The target binary supplies its key internally; this tool deliberately requires
the operator to provide the key through --key or ADRN_BLOWFISH_KEY and never
stores a default key in the repository.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
from pathlib import Path

HEADER_SIZE = 4
HEADER_WORD_LE = 0x31393839
BLOCK_SIZE = 8
RECORD_SIZE = 80


def decode_blocks(ciphertext: bytes, key_ascii: str) -> bytes:
    if len(ciphertext) % BLOCK_SIZE:
        raise ValueError("ciphertext block area must be a multiple of 8 bytes")
    if not key_ascii:
        raise ValueError("empty Blowfish key")
    openssl = shutil.which("openssl")
    if not openssl:
        raise RuntimeError("openssl executable not found")
    key_hex = key_ascii.encode("ascii").hex()
    proc = subprocess.run(
        [
            openssl,
            "enc",
            "-bf-ecb",
            "-provider",
            "legacy",
            "-d",
            "-K",
            key_hex,
            "-nopad",
        ],
        input=ciphertext,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if proc.returncode:
        raise RuntimeError(
            "OpenSSL Blowfish-ECB decode failed: "
            + proc.stderr.decode("utf-8", errors="replace").strip()
        )
    return proc.stdout


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
    decoded = decode_blocks(payload[:full_len], key_ascii) if full_len else b""

    marker = remainder[0] if remainder else None
    if marker is None:
        target_length = len(payload)
    else:
        target_length = len(payload) - marker - 1

    available = len(decoded)
    materialized = decoded[: min(max(target_length, 0), available)]
    return {
        "format": "ro0000-target-adrn-decoder-v1",
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
    parser.add_argument(
        "--require-record-alignment",
        action="store_true",
        help="fail when target decoded length is not a multiple of 80",
    )
    args = parser.parse_args()

    key = args.key or os.environ.get("ADRN_BLOWFISH_KEY")
    if not key:
        parser.error("provide --key or ADRN_BLOWFISH_KEY")

    result = decode_adrn(args.adrn_file.read_bytes(), key)
    raw = result.pop("output")

    if args.require_record_alignment and result["recordRemainderBytes"] != 0:
        raise SystemExit(
            "decoded length is not aligned to 80-byte ADRNBIN records"
        )

    if args.out:
        args.out.write_bytes(raw)
        result["outputFile"] = str(args.out)

    if args.json:
        args.json.write_text(
            json.dumps(result, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
