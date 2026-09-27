#!/usr/bin/env python3
"""Generate the fixed StoneAge ITEM_makeItem template runtime from the pinned original C data.

Source of truth:
  gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56
  gmsv/data/itemset6.txt

The source file is legacy-encoded. The pinned build has _ITEMSET2_ITEM + _ITEM_INSLAY +
_SIMPLIFY_ITEMSTRING enabled, so ITEM_ID_TOKEN_INDEX is 17. Parsing is byte-safe because the C loader is comma-delimited
and every numeric field needed here is ASCII numeric / TRUE-FALSE metadata. For equipment
attach/detach callbacks only, ITEM_ARGUMENT is preserved with latin1 as a byte-preserving
transport so callback code can reproduce fixed strstr()/atoi() semantics without loading the
large field2 runtime. It is not localized display text.
"""
from __future__ import annotations

import hashlib
import json
import re
import urllib.request
from pathlib import Path

SOURCE_REPOSITORY = "gavinlinasd/StoneAge"
SOURCE_REF = "1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56"
SOURCE_PATH = "gmsv/data/itemset6.txt"
SOURCE_URL = f"https://raw.githubusercontent.com/{SOURCE_REPOSITORY}/{SOURCE_REF}/{SOURCE_PATH}"
EXPECTED_SOURCE_BLOB_SHA = "eac985796b59286c547db2abce7b3d604a5e6226"
ITEM_EVENT_PATH = "gmsv/src/item/item_event.c"
ITEM_EVENT_URL = f"https://raw.githubusercontent.com/{SOURCE_REPOSITORY}/{SOURCE_REF}/{ITEM_EVENT_PATH}"
EXPECTED_ITEM_EVENT_BLOB_SHA = "00e05ebe58ef3988f7e0121f2a3aa5ede78344b5"
RECODE_PATH = "recode.sh"
RECODE_URL = f"https://raw.githubusercontent.com/{SOURCE_REPOSITORY}/{SOURCE_REF}/{RECODE_PATH}"
EXPECTED_RECODE_BLOB_SHA = "10ef38a0e84b70e8573d94199d038416afadf923"
SOURCE_EXEC_ENCODING = "gb18030"
EXPECTED_TEMPLATE_COUNT = 10737
OUTPUT = Path("data/generated/stoneage_item_make_runtime.json")

ORDER = [
    "ITEM_ID","ITEM_BASEIMAGENUMBER","ITEM_COST","ITEM_TYPE","ITEM_ABLEUSEFIELD","ITEM_TARGET",
    "ITEM_LEVEL","ITEM_DAMAGEBREAK","ITEM_USEPILENUMS","ITEM_CANBEPILE","ITEM_NEEDSTR","ITEM_NEEDDEX",
    "ITEM_NEEDTRANS","ITEM_NEEDPROFESSION","ITEM_DAMAGECRUSHE","ITEM_MAXDAMAGECRUSHE",
    "ITEM_OTHERDAMAGE","ITEM_OTHERDEFC","ITEM_SUITCODE","ITEM_ATTACKNUM_MIN","ITEM_ATTACKNUM_MAX",
    "ITEM_MODIFYATTACK","ITEM_MODIFYDEFENCE","ITEM_MODIFYQUICK","ITEM_MODIFYHP","ITEM_MODIFYMP",
    "ITEM_MODIFYLUCK","ITEM_MODIFYCHARM","ITEM_MODIFYAVOID","ITEM_MODIFYATTRIB","ITEM_MODIFYATTRIBVALUE",
    "ITEM_MAGICID","ITEM_MAGICPROB","ITEM_MAGICUSEMP","ITEM_MODIFYARRANGE","ITEM_MODIFYSEQUENCE",
    "ITEM_ATTACHPILE","ITEM_HITRIGHT","ITEM_NEGLECTGUARD","ITEM_POISON","ITEM_PARALYSIS","ITEM_SLEEP",
    "ITEM_STONE","ITEM_DRUNK","ITEM_CONFUSION","ITEM_CRITICAL","ITEM_USEACTION","ITEM_DROPATLOGOUT",
    "ITEM_VANISHATDROP","ITEM_ISOVERED","ITEM_CANPETMAIL","ITEM_CANMERGEFROM","ITEM_CANMERGETO",
    "ITEM_INGVALUE0","ITEM_INGVALUE1","ITEM_INGVALUE2","ITEM_INGVALUE3","ITEM_INGVALUE4","ITEM_PUTTIME",
    "ITEM_LEAKLEVEL","ITEM_MERGEFLG","ITEM_CRUSHLEVEL","ITEM_VAR1","ITEM_VAR2","ITEM_VAR3","ITEM_VAR4",
]
assert len(ORDER) == 66
IDX = {name: i for i, name in enumerate(ORDER)}

RANGE_FIELDS = [
    "ITEM_MODIFYATTACK","ITEM_MODIFYDEFENCE","ITEM_MODIFYQUICK","ITEM_MODIFYHP","ITEM_MODIFYMP",
    "ITEM_MODIFYLUCK","ITEM_MODIFYCHARM","ITEM_MODIFYAVOID","ITEM_POISON","ITEM_PARALYSIS",
    "ITEM_SLEEP","ITEM_STONE","ITEM_DRUNK","ITEM_CONFUSION","ITEM_CRITICAL",
]
RANGE_INDICES = [IDX[name] for name in RANGE_FIELDS]

# Fixed build has _SIMPLIFY_ITEMSTRING enabled. ITEM_getDefaultItemSetting() memsets the whole
# ITEM_Item to zero and then applies only the defaults listed by the simplified ITEM_setintdata[].
DEFAULT_DATA = [0] * len(ORDER)
DEFAULT_DATA[IDX["ITEM_TYPE"]] = 16          # ITEM_OTHER
DEFAULT_DATA[IDX["ITEM_DAMAGEBREAK"]] = -1
DEFAULT_DATA[IDX["ITEM_USEPILENUMS"]] = 1
DEFAULT_DATA[IDX["ITEM_MAGICID"]] = -1

def c_atoi(value: str) -> int:
    match = re.match(r"^[ \t]*([+-]?\d+)", value)
    return int(match.group(1)) if match else 0

def c_bool(value: str) -> int:
    value = value.upper()
    return 1 if value in {"TRUE", "1", "ON"} else 0

def git_blob_sha(data: bytes) -> str:
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()

# Exact fixed-build ITEM_itemconfentries order. _ITEM_INSLAY and _Item_ReLifeAct are enabled,
# so item ID is token 17. A range entry consumes its current token and the immediately following
# token only when the current token is non-empty, matching ITEM_readItemConfFile().
E: list[tuple[str, int | None]] = []
def char() -> None: E.append(("char", None))
def integer(name: str) -> None: E.append(("int", IDX[name]))
def ranged(name: str) -> None: E.append(("range", IDX[name]))
def boolean(name: str) -> None: E.append(("bool", IDX[name]))

# 1..16 before ITEM_ID
for _ in range(4): char()                    # name, secretname, effectstring, argument
for _ in range(2): char()                    # _ITEM_INSLAY: acode, inlaycode
for _ in range(9): char()                    # init/pre/post/watch/use/attach/detach/drop/pickup
char()                                       # _Item_ReLifeAct: relifefunc
integer("ITEM_ID")                           # token 17

for name in [
    "ITEM_BASEIMAGENUMBER","ITEM_COST","ITEM_TYPE","ITEM_ABLEUSEFIELD","ITEM_TARGET","ITEM_LEVEL",
    "ITEM_DAMAGEBREAK","ITEM_USEPILENUMS","ITEM_CANBEPILE","ITEM_NEEDSTR","ITEM_NEEDDEX",
    "ITEM_NEEDTRANS","ITEM_NEEDPROFESSION","ITEM_DAMAGECRUSHE","ITEM_MAXDAMAGECRUSHE",
    "ITEM_OTHERDAMAGE","ITEM_OTHERDEFC","ITEM_SUITCODE","ITEM_ATTACKNUM_MIN","ITEM_ATTACKNUM_MAX",
]:
    integer(name)
for name in [
    "ITEM_MODIFYATTACK","ITEM_MODIFYDEFENCE","ITEM_MODIFYQUICK","ITEM_MODIFYHP","ITEM_MODIFYMP",
    "ITEM_MODIFYLUCK","ITEM_MODIFYCHARM","ITEM_MODIFYAVOID",
]:
    ranged(name)
for name in [
    "ITEM_MODIFYATTRIB","ITEM_MODIFYATTRIBVALUE","ITEM_MAGICID","ITEM_MAGICPROB","ITEM_MAGICUSEMP",
    "ITEM_MODIFYARRANGE","ITEM_MODIFYSEQUENCE","ITEM_ATTACHPILE","ITEM_HITRIGHT","ITEM_NEGLECTGUARD",
]:
    integer(name)
for name in [
    "ITEM_POISON","ITEM_PARALYSIS","ITEM_SLEEP","ITEM_STONE","ITEM_DRUNK","ITEM_CONFUSION","ITEM_CRITICAL",
]:
    ranged(name)
integer("ITEM_USEACTION")
for name in [
    "ITEM_DROPATLOGOUT","ITEM_VANISHATDROP","ITEM_ISOVERED","ITEM_CANPETMAIL",
    "ITEM_CANMERGEFROM","ITEM_CANMERGETO",
]:
    boolean(name)
for i in range(5):
    char()
    integer(f"ITEM_INGVALUE{i}")

def parse_templates(raw: bytes) -> tuple[dict[int, tuple[list[int], list[int], dict[str, str]]], dict[str, int]]:
    text = raw.decode("latin1")
    templates: dict[int, tuple[list[int], list[int], dict[str, str]]] = {}
    syntax_errors = 0
    duplicate_ids = 0
    parsed_lines = 0

    for raw_line in text.splitlines():
        if not raw_line or raw_line.startswith("#"):
            continue
        line = raw_line.replace("\t", " ").lstrip(" ")
        tokens = line.split(",")
        # Fixed pre-ID string order: name, secret, effect, argument, typecode, inlaycode,
        # init, preover, postover, watch, use, attach, detach, drop, pickup, relife, ID.
        # Function names are ASCII even though the surrounding itemset is legacy encoded.
        callbacks = {
            "i": tokens[6] if len(tokens) > 6 else "",
            "a": tokens[11] if len(tokens) > 11 else "",
            "d": tokens[12] if len(tokens) > 12 else "",
            # token 4 is ITEM_ARGUMENT. Keep it byte-for-byte through latin1 only when
            # an equipment callback exists; consumers must treat it as source bytes.
            "g": tokens[3] if len(tokens) > 3 else "",
        }
        readpos = 1
        data = DEFAULT_DATA.copy()
        widths = [0] * len(ORDER)
        dataerror = False

        for kind, index in E:
            if readpos > len(tokens):
                dataerror = True
                break
            token = tokens[readpos - 1]
            readpos += 1
            if token == "":
                continue

            if kind == "int":
                data[index] = c_atoi(token)
            elif kind == "bool":
                data[index] = c_bool(token)
            elif kind == "range":
                minvalue = c_atoi(token)
                if readpos <= len(tokens):
                    maxvalue = c_atoi(tokens[readpos - 1])
                else:
                    maxvalue = minvalue
                widths[index] = abs(maxvalue - minvalue)
                data[index] = min(minvalue, maxvalue)
                readpos += 1

        if dataerror:
            syntax_errors += 1
            continue

        # Same normalization performed before ITEM_tbl receives the parsed ITEM_Item.
        attack_min = data[IDX["ITEM_ATTACKNUM_MIN"]]
        attack_max = data[IDX["ITEM_ATTACKNUM_MAX"]]
        if attack_min == 0:
            attack_min = attack_max
        data[IDX["ITEM_ATTACKNUM_MIN"]] = min(attack_min, attack_max)
        data[IDX["ITEM_ATTACKNUM_MAX"]] = max(attack_min, attack_max)

        item_id = data[IDX["ITEM_ID"]]
        if item_id in templates:
            duplicate_ids += 1
            continue
        templates[item_id] = (data, widths, callbacks)
        parsed_lines += 1

    return templates, {
        "parsedLines": parsed_lines,
        "syntaxErrors": syntax_errors,
        "duplicateIdsIgnored": duplicate_ids,
    }

EQUIP_RESIST_KEY_BY_WORK = {
    "CHAR_WORKEQUITFIRE": "fire",
    "CHAR_WORKEQUITTHUNDER": "thunder",
    "CHAR_WORKEQUITICE": "ice",
    "CHAR_WORKEQUITWEAKEN": "weaken",
    "CHAR_WORKEQUITBARRIER": "barrier",
    "CHAR_WORKEQUITNOCAST": "nocast",
    "CHAR_WORKEQUITFALLRIDE": "fallride",
}

def extract_equip_resist_source(raw: bytes) -> dict[str, object]:
    # The pinned repository's recode.sh documents that gmsv was converted
    # gb18030 -> utf8. item_event.c is therefore readable UTF-8 in Git, while
    # p+4 records the original two-DBCS-character execution-string width.
    # Re-encode only the literal marker to GB18030 to reproduce the source runtime bytes.
    text = raw.decode("utf-8")
    attach_start = text.find("void ITEM_MagicResist")
    detach_start = text.find("void ITEM_MagicReResist", attach_start + 1)
    assert attach_start >= 0 and detach_start > attach_start
    attach = text[attach_start:detach_start]
    next_void = text.find("\nvoid ", detach_start + 1)
    detach = text[detach_start:next_void if next_void > detach_start else len(text)]

    pairs = re.findall(
        r'strstr\s*\(\s*itemarg\s*,\s*"([^"]+)"\s*\).*?'
        r'CHAR_setWorkInt\s*\(\s*charaindex\s*,\s*(CHAR_WORKEQUIT[A-Z]+)\s*,\s*'
        r'atoi\s*\(\s*p\s*\+\s*(\d+)\s*\)',
        attach,
        flags=re.S,
    )
    assert len(pairs) == 7, pairs
    markers = []
    seen = set()
    for literal, work, offset_raw in pairs:
        assert work in EQUIP_RESIST_KEY_BY_WORK, work
        key = EQUIP_RESIST_KEY_BY_WORK[work]
        assert key not in seen
        seen.add(key)
        offset = int(offset_raw)
        marker_bytes = literal.encode(SOURCE_EXEC_ENCODING)
        # fixed C uses p+4 for all seven branches. The pinned recode provenance
        # must reconstruct exactly four execution bytes for each two-character marker.
        assert offset == 4, (key, offset)
        assert len(marker_bytes) == offset, (key, literal, marker_bytes.hex(), offset)
        markers.append({
            "key": key,
            "marker": marker_bytes.decode("latin1"),
            "sourceLiteral": literal,
            "atoiOffset": offset,
        })

    detach_targets = re.findall(
        r'CHAR_setWorkInt\s*\(\s*charaindex\s*,\s*(CHAR_WORKEQUIT[A-Z]+)\s*,\s*0\s*\)',
        detach,
    )
    assert len(detach_targets) == 7, detach_targets
    assert set(detach_targets) == {"CHAR_WORKEQUITFIRE"}, detach_targets

    return {
        "markers": markers,
        "sourceExecutionEncoding": SOURCE_EXEC_ENCODING,
        "encodingProvenance": "pinned recode.sh: recode gb18030..utf8 gmsv",
        "attachSemantics": "first matching strstr branch sets exactly one CHAR_WORKEQUIT* to atoi(p+4)",
        "detachSemantics": "all seven ITEM_MagicReResist branches clear CHAR_WORKEQUITFIRE only (fixed source bug)",
        "detachClearsKey": "fire",
    }

def pair(data: list[int], widths: list[int], field: str) -> list[int]:
    i = IDX[field]
    return [data[i], data[i] + widths[i]]

def verify_known_source_rows(templates: dict[int, tuple[list[int], list[int], dict[str, str]]]) -> dict[str, int]:
    weapon_path = Path("data/generated/stoneage_enemy_weapon_runtime.json")
    relife_path = Path("data/generated/stoneage_item_relife_runtime.json")
    weapon = json.loads(weapon_path.read_text(encoding="utf-8"))
    relife = json.loads(relife_path.read_text(encoding="utf-8"))

    checked_weapon = 0
    weapon_pairs = {
        "modifyAttack":"ITEM_MODIFYATTACK","modifyDefense":"ITEM_MODIFYDEFENCE",
        "modifyQuick":"ITEM_MODIFYQUICK","modifyHp":"ITEM_MODIFYHP","modifyMp":"ITEM_MODIFYMP",
        "modifyLuck":"ITEM_MODIFYLUCK","modifyCharm":"ITEM_MODIFYCHARM","modifyAvoid":"ITEM_MODIFYAVOID",
        "poison":"ITEM_POISON","paralysis":"ITEM_PARALYSIS","sleep":"ITEM_SLEEP","stone":"ITEM_STONE",
        "drunk":"ITEM_DRUNK","confusion":"ITEM_CONFUSION","critical":"ITEM_CRITICAL",
    }
    for key, row in weapon["byItemId"].items():
        item_id = int(key)
        assert item_id in templates, f"weapon template missing: {item_id}"
        data, widths, callbacks = templates[item_id]
        assert data[IDX["ITEM_TYPE"]] == int(row["type"]), f"type mismatch {item_id}"
        assert [data[IDX["ITEM_ATTACKNUM_MIN"]], data[IDX["ITEM_ATTACKNUM_MAX"]]] == [int(x) for x in row["attackNum"]], f"attackNum mismatch {item_id}"
        for runtime_key, field in weapon_pairs.items():
            assert pair(data, widths, field) == [int(x) for x in row[runtime_key]], f"{runtime_key} mismatch {item_id}"
        assert data[IDX["ITEM_MAGICUSEMP"]] == int(row["magicUseMp"]), f"magicUseMp mismatch {item_id}"
        checked_weapon += 1

    checked_relife = 0
    relife_pairs = {
        "modifyAttack":"ITEM_MODIFYATTACK","modifyDefense":"ITEM_MODIFYDEFENCE",
        "modifyQuick":"ITEM_MODIFYQUICK","modifyHp":"ITEM_MODIFYHP","modifyMp":"ITEM_MODIFYMP",
        "modifyLuck":"ITEM_MODIFYLUCK","modifyCharm":"ITEM_MODIFYCHARM","modifyAvoid":"ITEM_MODIFYAVOID",
    }
    for key, row in relife["byItemId"].items():
        item_id = int(key)
        assert item_id in templates, f"relife template missing: {item_id}"
        data, widths, callbacks = templates[item_id]
        for runtime_key, field in relife_pairs.items():
            assert pair(data, widths, field) == [int(x) for x in row[runtime_key]], f"{runtime_key} mismatch {item_id}"
        assert callbacks["a"] == str(row.get("attachFunc","")), f"attach callback mismatch {item_id}"
        assert callbacks["d"] == str(row.get("detachFunc","")), f"detach callback mismatch {item_id}"
        checked_relife += 1

    return {"weaponTemplatesCrossChecked": checked_weapon, "relifeTemplatesCrossChecked": checked_relife}

def sparse_row(data: list[int], widths: list[int], callbacks: dict[str, str]) -> dict[str, object]:
    base_overrides: list[int] = []
    random_widths: list[int] = []
    for i, value in enumerate(data):
        if value != DEFAULT_DATA[i]:
            base_overrides.extend((i, value))
    for i, value in enumerate(widths):
        if value != 0:
            random_widths.extend((i, value))
    out: dict[str, object] = {"b": base_overrides, "w": random_widths}
    callback_overrides = {k:v for k,v in callbacks.items() if k in {"i","a","d"} and v != ""}
    if callback_overrides:
        out["f"] = callback_overrides
    if (callbacks.get("a") or callbacks.get("d")) and callbacks.get("g","") != "":
        out["g"] = callbacks["g"]
    return out

def main() -> None:
    with urllib.request.urlopen(SOURCE_URL, timeout=60) as response:
        raw = response.read()
    with urllib.request.urlopen(ITEM_EVENT_URL, timeout=60) as response:
        item_event_raw = response.read()
    with urllib.request.urlopen(RECODE_URL, timeout=60) as response:
        recode_raw = response.read()

    actual_blob_sha = git_blob_sha(raw)
    assert actual_blob_sha == EXPECTED_SOURCE_BLOB_SHA, (
        f"fixed itemset6 blob changed: {actual_blob_sha} != {EXPECTED_SOURCE_BLOB_SHA}"
    )
    item_event_blob_sha = git_blob_sha(item_event_raw)
    assert item_event_blob_sha == EXPECTED_ITEM_EVENT_BLOB_SHA, (
        f"fixed item_event.c blob changed: {item_event_blob_sha} != {EXPECTED_ITEM_EVENT_BLOB_SHA}"
    )
    recode_blob_sha = git_blob_sha(recode_raw)
    assert recode_blob_sha == EXPECTED_RECODE_BLOB_SHA, (
        f"fixed recode.sh blob changed: {recode_blob_sha} != {EXPECTED_RECODE_BLOB_SHA}"
    )
    recode_text = recode_raw.decode("utf-8")
    assert "find gmsv -type f" in recode_text
    assert "recode gb18030..utf8 $file" in recode_text
    equip_resist_source = extract_equip_resist_source(item_event_raw)

    templates, parse_stats = parse_templates(raw)
    assert len(templates) == EXPECTED_TEMPLATE_COUNT, (
        f"template count mismatch: {len(templates)} != {EXPECTED_TEMPLATE_COUNT}; stats={parse_stats}"
    )
    assert 20131 in templates, "GMQUE item 20131 missing"

    checks = verify_known_source_rows(templates)
    randomized_templates = sum(1 for _, widths, _ in templates.values() if any(widths))
    nonzero_width_fields = sum(sum(1 for value in widths if value) for _, widths, _ in templates.values())
    init_callback_templates = sum(1 for _, _, funcs in templates.values() if funcs["i"] != "")
    attach_callback_templates = sum(1 for _, _, funcs in templates.values() if funcs["a"] != "")
    detach_callback_templates = sum(1 for _, _, funcs in templates.values() if funcs["d"] != "")
    callback_argument_templates = sum(
        1 for _, _, funcs in templates.values()
        if (funcs["a"] != "" or funcs["d"] != "") and funcs.get("g","") != ""
    )

    by_item_id = {
        str(item_id): sparse_row(*templates[item_id])
        for item_id in sorted(templates)
    }

    out = {
        "format": "stoneage-item-make-runtime-v2",
        "source": {
            "repository": SOURCE_REPOSITORY,
            "ref": SOURCE_REF,
            "path": SOURCE_PATH,
            "gitBlobSha": actual_blob_sha,
            "legacyEncodingReadMode": "latin1-byte-preserving; callback g is source bytes, not display text",
            "sourceCode": ["gmsv/src/include/version.h","gmsv/src/include/item.h","gmsv/src/include/util.h","gmsv/src/item/item.c",ITEM_EVENT_PATH,RECODE_PATH],
            "itemEventGitBlobSha": item_event_blob_sha,
            "recodeGitBlobSha": recode_blob_sha,
        },
        "equipResistSource": equip_resist_source,
        "fixedBuild": {
            "improveItemTable": False,
            "simplifyItemString": True,
            "simplifyItemString2": True,
            "itemset2Item": True,
            "itemInslay": True,
            "itemRelifeAct": True,
            "itemMaxUserNum": True,
            "itemset4": True,
            "takeItemDamage": True,
            "addDamageDefc": True,
            "suitItem": True,
            "itemset5": True,
            "itemset6": True,
            "fixItemProb": True,
            "itemIdTokenIndex": 17,
        },
        "itemDataIntCount": len(ORDER),
        "itemDataIntOrder": ORDER,
        "defaultData": DEFAULT_DATA,
        "randomRangeFields": RANGE_FIELDS,
        "randomRangeIndices": RANGE_INDICES,
        "parser": {
            "randomRangeRule": "base=min(a,b); randomwidth=ABS(b-a)",
            "nonRangeRandomWidth": 0,
            "representation": "base=defaultData plus flat index/value overrides b; random widths default 0 plus flat index/value overrides w; nonblank init/attach/detach callback names use sparse f.i/f.a/f.d; equipment callback ITEM_ARGUMENT uses optional byte-preserving g",
        },
        "makeItem": {
            "loop": "for i=0..ITEM_DATAINTNUM-1: RAND(0, randomdata[i]); data[i]=template[i]+roll",
            "rngCallsBeforeLeakLevel": len(ORDER),
            "zeroWidthStillConsumesRand": True,
            "leakLevelIndex": IDX["ITEM_LEAKLEVEL"],
            "leakLevelAfterLoop": 1,
        },
        "makeItemAndRegist": {
            "order": [
                "ITEM_makeItem (66 RAND calls after valid template check)",
                "ITEM_initExistItemsOne round-robin existing slot scan",
                "initfunc if nonblank",
                "ITEM_constructFunctable",
            ],
            "invalidTemplateRngCalls": 0,
            "existingArrayFullStillConsumesMakeRng": True,
        },
        "stats": {
            "templates": len(templates),
            "randomizedTemplates": randomized_templates,
            "nonzeroRandomWidthFields": nonzero_width_fields,
            "initCallbackTemplates": init_callback_templates,
            "attachCallbackTemplates": attach_callback_templates,
            "detachCallbackTemplates": detach_callback_templates,
            "callbackArgumentTemplates": callback_argument_templates,
            **parse_stats,
            **checks,
        },
        "byItemId": by_item_id,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps(out["stats"], ensure_ascii=False, sort_keys=True))
    print(f"wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes)")

if __name__ == "__main__":
    main()
