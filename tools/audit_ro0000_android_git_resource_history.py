#!/usr/bin/env python3
"""Audit reachable Git history for RO0000 Android external client resources.

This audit is intentionally path/content-boundary oriented. It does not publish
or reconstruct proprietary payload bytes; it only determines whether matching
client-resource paths are present in any reachable Git history and records
their Git object identities/sizes.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path
from typing import Iterable

FORMAT = "ro0000-android-git-resource-history-audit-v1"

PATTERNS = {
    "target_sabex": re.compile(r"(^|/)battle\d{2,3}\.sabex$", re.IGNORECASE),
    "legacy_sab": re.compile(r"(^|/)battle\d{2,3}\.sab$", re.IGNORECASE),
    "target_adrrsrc": re.compile(r"(^|/)s/(?:adrn|real|spr|spradrn)\.bin$", re.IGNORECASE),
    "target_map4_real": re.compile(r"(^|/)path/map4/real\.bin$", re.IGNORECASE),
    "target_palette": re.compile(r"(^|/)data/pal/palet_\d+\.sap$", re.IGNORECASE),
    "target_update_list": re.compile(r"(^|/)data/update/list\.dat$", re.IGNORECASE),
    "target_patch_zip": re.compile(r"(^|/)patch_[0-5]\.zip$", re.IGNORECASE),
    "target_serverdata": re.compile(r"(^|/)data/serverdata\.dat$", re.IGNORECASE),
}

TARGET_CLASSES = {
    "target_sabex",
    "target_adrrsrc",
    "target_map4_real",
    "target_palette",
    "target_update_list",
    "target_patch_zip",
    "target_serverdata",
}


def run_git(args: list[str], *, check: bool = True, cwd: str | None = None) -> str:
    proc = subprocess.run(
        ["git", *args],
        cwd=cwd,
        check=check,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return proc.stdout


def normalize_path(path: str) -> str:
    return path.replace("\\", "/").strip()


def classify_path(path: str) -> str | None:
    normalized = normalize_path(path)
    for name, pattern in PATTERNS.items():
        if pattern.search(normalized):
            return name
    return None


def iter_reachable_objects() -> Iterable[tuple[str, str]]:
    output = run_git(["rev-list", "--objects", "--all"])
    for line in output.splitlines():
        if not line.strip():
            continue
        oid, _, path = line.partition(" ")
        if path:
            yield oid, normalize_path(path)


def read_blob_prefix(oid: str, limit: int = 256) -> bytes:
    proc = subprocess.Popen(
        ["git", "cat-file", "blob", oid],
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )
    assert proc.stdout is not None
    try:
        prefix = proc.stdout.read(limit)
    finally:
        proc.kill()
        proc.wait()
    return prefix


def blob_size(oid: str) -> int | None:
    text = run_git(["cat-file", "-s", oid], check=False).strip()
    try:
        return int(text)
    except ValueError:
        return None


def collect_refs() -> list[str]:
    output = run_git([
        "for-each-ref",
        "--format=%(refname)",
        "refs/remotes/origin",
        "refs/tags",
    ])
    return [line for line in output.splitlines() if line]


def audit_repository() -> dict:
    head = run_git(["rev-parse", "HEAD"]).strip()
    refs = collect_refs()

    matches: list[dict] = []
    seen_pairs: set[tuple[str, str]] = set()

    for oid, path in iter_reachable_objects():
        classification = classify_path(path)
        if classification is None:
            continue
        key = (oid, path)
        if key in seen_pairs:
            continue
        seen_pairs.add(key)

        size = blob_size(oid)
        prefix = read_blob_prefix(oid) if size is not None else b""
        matches.append({
            "path": path,
            "classification": classification,
            "oid": oid,
            "sizeBytes": size,
            "looksLikeGitLfsPointer": prefix.startswith(
                b"version https://git-lfs.github.com/spec/v1"
            ),
        })

    matches.sort(key=lambda item: (item["classification"], item["path"], item["oid"]))

    by_class: dict[str, int] = {}
    for item in matches:
        by_class[item["classification"]] = by_class.get(item["classification"], 0) + 1

    target_matches = [
        item for item in matches if item["classification"] in TARGET_CLASSES
    ]
    payload_like = [
        item for item in target_matches
        if item["classification"] in {
            "target_sabex",
            "target_adrrsrc",
            "target_map4_real",
            "target_palette",
            "target_patch_zip",
        }
    ]
    lfs_target_matches = [
        item for item in target_matches if item["looksLikeGitLfsPointer"]
    ]

    return {
        "format": FORMAT,
        "source": {
            "headSha": head,
            "refsScanned": refs,
            "historyScanMethod": "git rev-list --objects --all over a full-depth checkout",
            "scope": "reachable Git history of current repository refs/tags; unreachable/dangling Git objects and external Actions artifacts are outside this audit",
        },
        "patterns": {
            name: pattern.pattern for name, pattern in PATTERNS.items()
        },
        "scan": {
            "reachablePathObjectPairsMatched": len(matches),
            "matchedPathCount": len({item["path"] for item in matches}),
            "matchedClassCounts": by_class,
        },
        "findings": {
            "targetClientResourcePathsEverTracked": bool(target_matches),
            "payloadLikeTargetPathsEverTracked": bool(payload_like),
            "targetLfsPointerPaths": len(lfs_target_matches),
            "targetMatches": target_matches,
            "nonPayloadLineageMatches": [
                item for item in matches if item["classification"] == "legacy_sab"
            ],
        },
        "interpretation": (
            "No target client external-resource paths are present in any reachable Git history."
            if not target_matches
            else "At least one target client external-resource path is present in reachable Git history; inspect the listed object identities before treating it as a production payload."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    result = audit_repository()
    destination = Path(args.output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "format": result["format"],
        "targetClientResourcePathsEverTracked": result["findings"]["targetClientResourcePathsEverTracked"],
        "payloadLikeTargetPathsEverTracked": result["findings"]["payloadLikeTargetPathsEverTracked"],
        "matchedPathCount": result["scan"]["matchedPathCount"],
        "output": str(destination),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
