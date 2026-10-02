#!/usr/bin/env python3
"""Verify APK signature schemes and publish non-identifying signer fingerprints."""
import argparse
import hashlib
import json
import pathlib
import re
import shutil
import subprocess


SCHEME_PATTERNS = {
    "v1": r"Verified using v1 scheme \(JAR signing\): (true|false)",
    "v2": r"Verified using v2 scheme \(APK Signature Scheme v2\): (true|false)",
    "v3": r"Verified using v3 scheme \(APK Signature Scheme v3\): (true|false)",
    "v3.1": r"Verified using v3\.1 scheme \(APK Signature Scheme v3\.1\): (true|false)",
    "v4": r"Verified using v4 scheme \(APK Signature Scheme v4\): (true|false)",
}


def parse_apksigner_output(output):
    schemes = {}
    for name, pattern in SCHEME_PATTERNS.items():
        match = re.search(pattern, output, re.IGNORECASE)
        schemes[name] = (match.group(1).lower() == "true") if match else None

    signer_count_match = re.search(r"Number of signers:\s*(\d+)", output)
    signers = []
    for block in re.split(r"(?=Signer #\d+ certificate DN:)", output):
        number = re.search(r"Signer #(\d+)", block)
        if not number:
            continue

        def field(pattern):
            match = re.search(pattern, block, re.IGNORECASE)
            return match.group(1).strip() if match else None

        signers.append({
            "number": int(number.group(1)),
            "certificateSha256": field(r"certificate SHA-256 digest:\s*([0-9a-f:]+)"),
            "publicKeySha256": field(r"public key SHA-256 digest:\s*([0-9a-f:]+)"),
            "keyAlgorithm": field(r"key algorithm:\s*(\S+)"),
            "keySizeBits": int(v) if (v := field(r"key size \(bits\):\s*(\d+)")) else None,
        })

    return {
        "schemes": schemes,
        "signerCount": int(signer_count_match.group(1)) if signer_count_match else len(signers),
        "signers": signers,
        "verifiesMarker": bool(re.search(r"^Verifies\s*$", output, re.MULTILINE)),
    }


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apk", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--expected-sha256", default=None)
    args = parser.parse_args()

    apk = pathlib.Path(args.apk)
    if not apk.is_file():
        raise SystemExit("APK not found: " + str(apk))
    tool = shutil.which("apksigner")
    if not tool:
        raise SystemExit("apksigner is required; install Android apksig tools")

    digest = sha256_file(apk)
    if args.expected_sha256 and digest.lower() != args.expected_sha256.lower():
        raise SystemExit("APK SHA-256 differs from expected target identity")

    version = subprocess.run(
        [tool, "version"], check=False, capture_output=True, text=True
    )
    verified = subprocess.run(
        [tool, "verify", "--verbose", "--print-certs", str(apk)],
        check=False, capture_output=True, text=True
    )
    output = (verified.stdout or "") + "\n" + (verified.stderr or "")
    parsed = parse_apksigner_output(output)
    valid = verified.returncode == 0 and parsed["verifiesMarker"]

    result = {
        "format": "ro0000-android-apk-signing-audit-v1",
        "source": {
            "apk": str(apk),
            "sha256": digest,
            "fileBytes": apk.stat().st_size,
        },
        "tool": {
            "name": "apksigner",
            "version": (version.stdout or version.stderr).strip() or None,
        },
        "verification": {
            "status": "verified" if valid else "failed",
            "exitCode": verified.returncode,
            **parsed,
        },
        "disclosure": {
            "certificateDnOmitted": True,
            "reportedIdentity": "SHA-256 fingerprints only",
        },
        "limitations": [
            "Signature verification does not establish the APK publisher's real-world identity.",
            "A signer fingerprint identifies this signing certificate only; no external publisher registry is assumed.",
            "Runtime behavior and external resource availability are outside signature verification.",
        ],
    }

    out = pathlib.Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": result["verification"]["status"],
        "apkSha256": digest,
        "signerCount": parsed["signerCount"],
        "schemes": parsed["schemes"],
        "output": str(out),
    }, ensure_ascii=False, indent=2))
    if not valid:
        detail = output.strip()[-3000:]
        raise SystemExit("APK signature verification failed:\n" + detail)


if __name__ == "__main__":
    main()
