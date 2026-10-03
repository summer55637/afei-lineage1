#!/usr/bin/env python3
"""Cross-check RO0000 server battle-map selector IDs against the audited Android APK table."""
import argparse
import json
import sys
from pathlib import Path

TARGET_ABIS = ("armeabi-v7a", "x86")


def _validated_target_table(native_audit, table_contract):
    if table_contract.get("format") != "ro0000-android-battlemap-table-contract-v1":
        raise ValueError("Android battle-map table contract format mismatch")
    source = table_contract.get("source", {})
    audited_apk_sha = native_audit.get("auditedApk", {}).get("sha256")
    if not audited_apk_sha or source.get("apkSha256") != audited_apk_sha:
        raise ValueError("Android battle-map table contract APK SHA-256 mismatch")

    native_libraries = {
        library.get("abi"): library
        for library in native_audit.get("nativeLibraries", [])
        if library.get("abi") in TARGET_ABIS
        and library.get("path", "").endswith("/libStoneage.so")
    }
    expected_libraries = source.get("libraries", {})
    for abi in TARGET_ABIS:
        library = native_libraries.get(abi)
        expected = expected_libraries.get(abi, {})
        if not library:
            raise ValueError("missing target libStoneage.so ABI: " + abi)
        if library.get("sha256") != expected.get("sha256"):
            raise ValueError("Android battle-map table contract " + abi + " library SHA-256 mismatch")
        if library.get("buildId") != expected.get("buildId"):
            raise ValueError("Android battle-map table contract " + abi + " Build ID mismatch")

    table = table_contract.get("table", {})
    stride = table.get("filenameEntryStrideBytes")
    count = table.get("slotCount")
    size = table.get("sizeBytes")
    if any(not isinstance(value, int) or isinstance(value, bool) or value <= 0
           for value in (stride, count, size)):
        raise ValueError("Android battle-map table contract has invalid dimensions")
    if stride * count != size:
        raise ValueError("Android battle-map table contract size/count/stride disagree")
    if table.get("minimumIndexInclusive") != 0 or table.get("maximumIndexInclusive") != count - 1:
        raise ValueError("Android battle-map table contract index bounds disagree with slot count")
    return table, native_libraries


def build_crosscheck(native_audit, selector_audit, table_contract):
    table, libraries = _validated_target_table(native_audit, table_contract)
    capacity = table["slotCount"]
    blocks = selector_audit.get("selectedRanges")
    if not isinstance(blocks, list):
        raise ValueError("selector audit is missing selectedRanges")

    candidates = set()
    block_summaries = []
    for block in blocks:
        effective = block.get("effective")
        if not isinstance(effective, list) or not effective:
            raise ValueError("selector block is missing effective battle map candidates")
        for value in effective:
            if not isinstance(value, int) or isinstance(value, bool):
                raise ValueError("selector candidate must be an integer")
            candidates.add(value)
        ranges = block.get("ranges", [])
        block_summaries.append({
            "blockLine": block.get("blockLine"),
            "candidates": effective,
            "rangeCount": len(ranges),
            "validRangeCount": sum(1 for item in ranges if item.get("valid") is True),
            "reversedRangeCount": sum(1 for item in ranges if item.get("valid") is False),
        })

    out_of_range = sorted(value for value in candidates if value < 0 or value >= capacity)
    summary = selector_audit.get("summary", {})
    recorded_distinct = summary.get("distinctBattleMapNos")
    if recorded_distinct is not None and recorded_distinct != len(candidates):
        raise ValueError(
            "selector distinctBattleMapNos disagrees with selectedRanges: "
            + str(recorded_distinct) + " != " + str(len(candidates))
        )
    expected_unused = sorted(set(range(capacity)) - candidates)
    recorded_unused = summary.get("unusedBattleMapNos")
    if recorded_unused is not None and sorted(recorded_unused) != expected_unused:
        raise ValueError("selector unusedBattleMapNos disagrees with target slot capacity")

    if out_of_range:
        raise ValueError(
            "server battle-map candidates exceed Android BattleMapFile slots: "
            + ", ".join(map(str, out_of_range))
        )

    return {
        "format": "ro0000-android-battlemap-selector-crosscheck-v1",
        "source": {
            "apkSha256": native_audit.get("auditedApk", {}).get("sha256"),
            "serverSelectorSource": selector_audit.get("source"),
            "targetLibraryHashes": {
                abi: {
                    "sha256": libraries[abi].get("sha256"),
                    "buildId": libraries[abi].get("buildId"),
                }
                for abi in TARGET_ABIS
            },
        },
        "targetBattleMapTable": dict(table),
        "serverSelector": {
            "activeBlockCount": len(blocks),
            "distinctCandidateCount": len(candidates),
            "selectedBattleMapNos": sorted(candidates),
            "unusedAndroidSlots": expected_unused,
            "allCandidatesWithinAndroidTable": True,
            "reversedRanges": summary.get("reversedRanges", []),
            "duplicateImageAssignments": summary.get("duplicateImageAssignments", 0),
            "blocks": block_summaries,
        },
        "interpretationBoundary": [
            "The check proves that configured server candidate numbers fit the hash-anchored Android BattleMapFile index range.",
            "It does not prove that the corresponding battleNNN.sabex payloads are present or valid.",
            "The server map selector and the Android SABEX payload format remain separate evidence layers.",
            "Reversed ranges and duplicate image assignments are reported as source-data anomalies and are not silently rewritten.",
        ],
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--native-audit", required=True)
    parser.add_argument("--selector-audit", required=True)
    parser.add_argument("--table-contract", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args(argv)
    native = json.loads(Path(args.native_audit).read_text(encoding="utf-8"))
    selector = json.loads(Path(args.selector_audit).read_text(encoding="utf-8"))
    contract = json.loads(Path(args.table_contract).read_text(encoding="utf-8"))
    report = build_crosscheck(native, selector, contract)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "slotCapacity": report["targetBattleMapTable"]["slotCount"],
        "distinctCandidateCount": report["serverSelector"]["distinctCandidateCount"],
        "allCandidatesWithinAndroidTable": report["serverSelector"]["allCandidatesWithinAndroidTable"],
        "reversedRangeCount": len(report["serverSelector"]["reversedRanges"]),
        "output": str(output),
    }, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
