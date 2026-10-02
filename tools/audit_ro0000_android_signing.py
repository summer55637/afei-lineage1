#!/usr/bin/env python3
"""Audit APK signature schemes without modifying the APK or exposing certificate DNs."""
import argparse
import base64
import hashlib
import json
import pathlib
import re
import shutil
import subprocess
import tempfile
import zipfile


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


def _certificate_fingerprints(apk):
    fingerprints = []
    with zipfile.ZipFile(apk) as zf:
        cert_entries = sorted(
            name for name in zf.namelist()
            if re.fullmatch(r"META-INF/[^/]+\.(?:RSA|DSA|EC)", name, re.IGNORECASE)
        )
        for name in cert_entries:
            try:
                proc = subprocess.run(
                    ["openssl", "pkcs7", "-inform", "DER", "-print_certs"],
                    input=zf.read(name), check=False, capture_output=True
                )
                if proc.returncode:
                    fingerprints.append({"entry": name, "status": "certificate-container-unreadable"})
                    continue
                blocks = re.findall(
                    rb"-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----",
                    proc.stdout, re.DOTALL
                )
                for index, block in enumerate(blocks, 1):
                    match = re.search(rb"-----BEGIN CERTIFICATE-----\s*(.*?)\s*-----END CERTIFICATE-----", block, re.DOTALL)
                    if not match:
                        continue
                    der = base64.b64decode(re.sub(rb"\s+", b"", match.group(1)))
                    fingerprints.append({
                        "entry": name,
                        "certificateIndex": index,
                        "certificateSha256": hashlib.sha256(der).hexdigest(),
                    })
            except (KeyError, ValueError):
                fingerprints.append({"entry": name, "status": "certificate-container-unreadable"})
    return fingerprints


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _run_verify(tool, apk, minimum_api=None):
    command = [tool, "verify", "--verbose", "--print-certs"]
    if minimum_api is not None:
        command += ["--min-sdk-version", str(minimum_api)]
    command.append(str(apk))
    result = subprocess.run(command, check=False, capture_output=True, text=True)
    output = (result.stdout or "") + "\n" + (result.stderr or "")
    parsed = parse_apksigner_output(output)
    return {
        "minimumApi": minimum_api,
        "exitCode": result.returncode,
        "verified": result.returncode == 0 and parsed["verifiesMarker"],
        **parsed,
        "diagnosticCodes": sorted(set(
            (["V1_ENTRY_DIGEST_MISMATCH"] if re.search(
                r"digest of .* does not match the digest specified in META-INF/MANIFEST\.MF",
                output, re.IGNORECASE
            ) else [])
            + (["APK_DOES_NOT_VERIFY"] if "DOES NOT VERIFY" in output else [])
            + (["SIGNER_OR_SCHEME_ERROR"] if result.returncode and not re.search(
                r"digest of .* does not match the digest specified in META-INF/MANIFEST\.MF",
                output, re.IGNORECASE
            ) else [])
        )),
    }


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
    openssl = shutil.which("openssl")
    if not openssl:
        raise SystemExit("openssl is required for certificate fingerprint fallback")

    digest = sha256_file(apk)
    if args.expected_sha256 and digest.lower() != args.expected_sha256.lower():
        raise SystemExit("APK SHA-256 differs from expected target identity")

    version = subprocess.run([tool, "version"], check=False, capture_output=True, text=True)
    profiles = [
        _run_verify(tool, apk, None),
        _run_verify(tool, apk, 24),
        _run_verify(tool, apk, 28),
    ]
    verified = all(profile["verified"] for profile in profiles)
    if profiles[0]["verified"]:
        status = "verified-across-declared-range"
    elif profiles[1]["verified"] or profiles[2]["verified"]:
        status = "verified-only-for-some-api-ranges"
    else:
        status = "signature-verification-failed"

    result = {
        "format": "ro0000-android-apk-signing-audit-v2",
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
            "status": status,
            "profiles": profiles,
        },
        "certificateFingerprints": _certificate_fingerprints(apk),
        "disclosure": {
            "certificateDnOmitted": True,
            "reportedIdentity": "SHA-256 fingerprints only",
        },
        "limitations": [
            "Signature verification does not establish the APK publisher's real-world identity.",
            "A signer fingerprint identifies this certificate only; no external publisher registry is assumed.",
            "Runtime behavior and external resource availability are outside signature verification.",
        ],
    }

    out = pathlib.Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": status,
        "apkSha256": digest,
        "profiles": [
            {"minimumApi": p["minimumApi"], "verified": p["verified"],
             "schemes": p["schemes"], "diagnosticCodes": p["diagnosticCodes"]}
            for p in profiles
        ],
        "certificateFingerprints": result["certificateFingerprints"],
        "output": str(out),
    }, ensure_ascii=False, indent=2))
    # This is an evidence audit, not a release gate. Preserve failed results in
    # the report and continue the APK/ELF audit without modifying or re-signing it.


if __name__ == "__main__":
    main()
