#!/usr/bin/env python3
"""Cross-check RO0000 server battle-map selector IDs against Android APK slots."""
import argparse
import json
import sys
from pathlib import Path

TARGET_ABIS = ("armeabi-v7a", "x86")
BATTLE_MAP_FILENAME_STRIDE = 512


def _target_table_capacities(native_audit):
    capacities = {}
    table_sizes = {}
    for library in native_audit.get("nativeLibraries", []):
        abi = library.get("abi")
        if abi not in TARGET_ABIS or not library.get("path", "").endswith("/libStoneage.so"):
            continue
        matches = [
            symbol for symbol in library.get("focusedSymbols", [])
            if symbol.get("name") == "BattleMapFile" and symbol.get("type") in ("OBJECT", "NOTYPE")
        ]
        if len(matches) != 1:
            raise ValueError(
                "expected exactly one BattleMapFile object in " + abi
                + "; found " + str(len(matches))
            )
        size = matches[0].get("size")
        if not isinstance(size, int) or size <= 0:
            raise ValueError("invalid BattleMapFile size in " + abi)
        if size % BATTLE_MAP_FILENAME_STRIDE:
            raise ValueError(
                "BattleMapFile size is not divisible by the 512-byte filename stride in " + abi
            )
        table_sizes[abi] = size
        capacities[abi] = size // BATTLE_MAP_FILENAME_STRIDE

    missing = [abi for abi in TARGET_ABIS if abi not in capacities]
    if missing:
        raise ValueError("missing target BattleMapFile ABI(s): " + ", ".join(missing))
    if len(set(capacities.values())) != 1:
        raise ValueError("BattleMapFile slot capacities differ across target ABIs")
    return capacities, table_sizes


def build_crosscheck(native_audit, selector_audit):
    capacities, table_sizes = _target_table_capacities(native_audit)
    capacity = capacities["x86"]
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
                abi: next(
                    lib.get("sha256") for lib in native_audit.get("nativeLibraries", [])
                    if lib.get("abi") == abi
                    and lib.get("path", "").endswith("/libStoneage.so")
                )
                for abi in TARGET_ABIS
            },
        },
        "targetBattleMapTable": {
            "filenameEntryStrideBytes": BATTLE_MAP_FILENAME_STRIDE,
            "tableSizeBytes": dict(sorted(table_sizes.items())),
            "slotCapacity": capacity,
            "acceptedIndexRange": {"minimumInclusive": 0, "maximumInclusive": capacity - 1},
        },
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
            "The check proves that configured server candidate numbers fit the Android BattleMapFile index range.",
            "It does not prove that the corresponding battleNNN.sabex payloads are present or valid.",
            "The server map selector and the Android SABEX payload format remain separate evidence layers.",
            "Reversed ranges and duplicate image assignments are reported as source-data anomalies and are not silently rewritten.",
        ],
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--native-audit", required=True)
    parser.add_argument("--selector-audit", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args(argv)
    native = json.loads(Path(args.native_audit).read_text(encoding="utf-8"))
    selector = json.loads(Path(args.selector_audit).read_text(encoding="utf-8"))
    report = build_crosscheck(native, selector)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "slotCapacity": report["targetBattleMapTable"]["slotCapacity"],
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
