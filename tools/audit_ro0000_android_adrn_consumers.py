#!/usr/bin/env python3
"""Triage target-side consumers of previously unmapped ADRNBIN fields.

This is intentionally narrow: only fields inside the decoded 0x50-byte ADRNBIN
record are searched. A candidate is considered strong only when the disassembly
window contains an ADRNBIN base cue plus an instruction using one of the target
offsets. Offset-only hits remain leads and are not promoted to semantic proof.
"""
import argparse
import json
from pathlib import Path
import re

CANDIDATE_OFFSETS = (
    "0x22","0x24","0x26","0x28","0x2a","0x2c","0x2e","0x30","0x32",
    "0x34","0x36","0x38","0x3a","0x3c","0x3e","0x44","0x46","0x48",
)
CANDIDATE_DECIMAL = {int(x,16): x for x in CANDIDATE_OFFSETS}
BASE_CUES = ("adrnbuff", "0x05117740", "0x5117740", "5117740")
MEM_OP = re.compile(r"\b(?P<mn>mov|movzx|movsx|ldr|ldrb|ldrh|ldrsb|ldrsh|str|strb|strh|stp|ldp|add|sub)\b", re.I)
HEX_OFF = re.compile(r"(?<![0-9A-Fa-f])0x(?P<v>[0-9A-Fa-f]{2})(?![0-9A-Fa-f])", re.I)
DEC_OFF = re.compile(r"(?<![0-9])(?:#|\b)(?P<v>34|36|38|40|42|44|46|48|50|52|54|56|58|60|62|68|70|72)(?![0-9])")

def classify_mnemonic(mn):
    mn = mn.lower()
    if mn.startswith(("str", "stp")):
        return "write"
    if mn.startswith(("ldr", "ldp")) or mn in {"movzx","movsx"}:
        return "read"
    if mn in {"mov","add","sub"}:
        return "read-or-address-arithmetic"
    return "unknown"

def scan_excerpt(abi, function, lines):
    hits = []
    for idx, line in enumerate(lines):
        candidates = []
        for m in HEX_OFF.finditer(line):
            value = int(m.group("v"), 16)
            if value in CANDIDATE_DECIMAL:
                candidates.append(CANDIDATE_DECIMAL[value])
        for m in DEC_OFF.finditer(line):
            value = int(m.group("v"), 10)
            if value in CANDIDATE_DECIMAL:
                candidates.append(CANDIDATE_DECIMAL[value])
        if not candidates:
            continue
        start = max(0, idx - 4)
        end = min(len(lines), idx + 5)
        window = lines[start:end]
        window_text = "\n".join(window).lower()
        base = any(cue.lower() in window_text for cue in BASE_CUES)
        mn = MEM_OP.search(line)
        op_class = classify_mnemonic(mn.group("mn")) if mn else "unknown"
        for offset in sorted(set(candidates), key=lambda x:int(x,16)):
            strength = "direct-base-offset" if base else "offset-only"
            hits.append({
                "abi": abi,
                "function": function,
                "offset": offset,
                "strength": strength,
                "operationClass": op_class,
                "mnemonic": mn.group("mn") if mn else None,
                "instruction": line.strip(),
                "context": [x.strip() for x in window],
            })
    return hits

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--native-audit", required=True)
    ap.add_argument("--output", required=True)
    args = ap.parse_args()
    native = json.loads(Path(args.native_audit).read_text(encoding="utf-8"))
    all_hits = []
    for lib in native.get("nativeLibraries", []):
        abi = lib.get("abi")
        for symbol in lib.get("focusedSymbols", []):
            if symbol.get("type") != "FUNC":
                continue
            dis = symbol.get("disassembly") or {}
            if dis.get("status") != "ok":
                continue
            all_hits.extend(scan_excerpt(abi, symbol.get("name"), dis.get("excerpt", [])))
    direct = [x for x in all_hits if x["strength"] == "direct-base-offset"]
    offsets_found = sorted({x["offset"] for x in all_hits}, key=lambda x:int(x,16))
    direct_offsets = sorted({x["offset"] for x in direct}, key=lambda x:int(x,16))
    result = {
        "format": "ro0000-android-adrn-consumer-triage-v1",
        "target": {
            "recordSizeBytes": 80,
            "candidateOffsets": list(CANDIDATE_OFFSETS),
        },
        "scan": {
            "abis": sorted({x.get("abi") for x in all_hits}),
            "focusedFunctionHits": len(all_hits),
            "directBaseOffsetHits": len(direct),
            "offsetsFound": offsets_found,
            "directBaseOffsetOffsets": direct_offsets,
        },
        "directCandidates": direct,
        "offsetOnlyLeads": [x for x in all_hits if x["strength"] == "offset-only"],
        "closure": {
            "status": "consumer-candidates-found" if direct else "no-direct-consumer-found",
            "semanticRule": "Only direct-base-offset candidates are promoted for manual semantic review; offset-only hits are leads only.",
        },
    }
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({
        "status": result["closure"]["status"],
        "directBaseOffsetHits": len(direct),
        "directBaseOffsetOffsets": direct_offsets,
        "offsetOnlyHits": len(result["offsetOnlyLeads"]),
    }, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
