#!/usr/bin/env python3
"""Generate fixed item string metadata required by field=2 PetSkills.

Source of truth:
  gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56
  gmsv/data/itemset6.txt

The source is legacy encoded. Strings are decoded with latin1 only as a byte-preserving
transport: every source byte maps 1:1 to U+0000..U+00FF. The web runtime must use these
values for exact equality / ASCII token checks, not as localized display text.
"""
from __future__ import annotations

import hashlib
import json
import re
import urllib.request
from pathlib import Path

SOURCE_REPOSITORY="gavinlinasd/StoneAge"
SOURCE_REF="1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56"
SOURCE_PATH="gmsv/data/itemset6.txt"
SOURCE_URL=f"https://raw.githubusercontent.com/{SOURCE_REPOSITORY}/{SOURCE_REF}/{SOURCE_PATH}"
EXPECTED_SOURCE_BLOB_SHA="eac985796b59286c547db2abce7b3d604a5e6226"
EXPECTED_TEMPLATE_COUNT=10737
OUTPUT=Path("data/generated/stoneage_item_field2_runtime.json")

INT_ORDER=[
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
IDX={name:i for i,name in enumerate(INT_ORDER)}

def c_atoi(value:str)->int:
    m=re.match(r"^[ \t]*([+-]?\d+)",value)
    return int(m.group(1)) if m else 0

def c_bool(value:str)->int:
    return 1 if value.upper() in {"TRUE","1","ON"} else 0

def git_blob_sha(data:bytes)->str:
    return hashlib.sha1(f"blob {len(data)}\0".encode("ascii")+data).hexdigest()

# Match fixed ITEM_itemconfentries order used by the existing V1.72 generator.
E:list[tuple[str,str|None]]=[]
def char(name:str)->None:E.append(("char",name))
def integer(name:str)->None:E.append(("int",name))
def ranged(name:str)->None:E.append(("range",name))
def boolean(name:str)->None:E.append(("bool",name))

for name in ["name","secretName","effectString","argument","typeCode","inlayCode"]:
    char(name)
for name in ["init","preOver","postOver","watch","use","attach","detach","drop","pickup"]:
    char("func."+name)
char("func.relife")
integer("ITEM_ID")

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
    char(f"ingName{i}")
    integer(f"ITEM_INGVALUE{i}")

FIELD2_KEYS={"secretName","effectString","argument","typeCode","inlayCode",
             "ingName0","ingName1","ingName2","ingName3","ingName4"}
FUNC_NAMES=["init","preOver","postOver","watch","use","attach","detach","drop","pickup","relife"]

def parse(raw:bytes):
    text=raw.decode("latin1")
    out={}
    seen_ids=set()
    parsed=0
    syntax_errors=0
    duplicate=0
    typecode_nonempty=0
    repair_ing_nonempty=0
    function_nonempty=0

    for raw_line in text.splitlines():
        if not raw_line or raw_line.startswith("#"):
            continue
        line=raw_line.replace("\t"," ").lstrip(" ")
        tokens=line.split(",")
        readpos=1
        ints=[0]*len(INT_ORDER)
        ints[IDX["ITEM_TYPE"]]=16
        ints[IDX["ITEM_DAMAGEBREAK"]]=-1
        ints[IDX["ITEM_USEPILENUMS"]]=1
        ints[IDX["ITEM_MAGICID"]]=-1
        strings={}
        funcs={}
        bad=False

        for kind,name in E:
            if readpos>len(tokens):
                bad=True
                break
            tok=tokens[readpos-1]
            readpos+=1
            if tok=="":
                continue
            if kind=="char":
                if name.startswith("func."):
                    funcs[name[5:]]=tok
                else:
                    strings[name]=tok
            elif kind=="int":
                ints[IDX[name]]=c_atoi(tok)
            elif kind=="bool":
                ints[IDX[name]]=c_bool(tok)
            elif kind=="range":
                # Range fields consume a second token exactly like ITEM_readItemConfFile
                # whenever the first token is non-empty.
                minv=c_atoi(tok)
                maxv=c_atoi(tokens[readpos-1]) if readpos<=len(tokens) else minv
                ints[IDX[name]]=min(minv,maxv)
                readpos+=1

        if bad:
            syntax_errors+=1
            continue
        item_id=ints[IDX["ITEM_ID"]]
        if item_id in seen_ids:
            duplicate+=1
            continue
        seen_ids.add(item_id)

        row={}
        for key in FIELD2_KEYS:
            v=strings.get(key,"")
            if v!="":
                row[key]=v
        if funcs:
            row["functions"]={k:v for k,v in funcs.items() if v!=""}
            function_nonempty+=sum(1 for v in funcs.values() if v!="")
        if strings.get("typeCode","")!="":
            typecode_nonempty+=1
        if any(strings.get(f"ingName{i}","")!="" for i in range(5)):
            repair_ing_nonempty+=1
        if row:
            out[item_id]=row
        parsed+=1

    return out,{
        "parsedLines":parsed,
        "syntaxErrors":syntax_errors,
        "duplicateIdsIgnored":duplicate,
        "rowsWithField2StringData":len(out),
        "templatesWithTypeCode":typecode_nonempty,
        "templatesWithRepairIngredientName":repair_ing_nonempty,
        "nonblankFunctionStrings":function_nonempty,
    }

def main():
    with urllib.request.urlopen(SOURCE_URL,timeout=60) as response:
        raw=response.read()
    sha=git_blob_sha(raw)
    assert sha==EXPECTED_SOURCE_BLOB_SHA,(sha,EXPECTED_SOURCE_BLOB_SHA)
    rows,stats=parse(raw)
    assert stats["parsedLines"]==EXPECTED_TEMPLATE_COUNT,stats
    payload={
        "format":"stoneage-item-field2-runtime-v1",
        "source":{
            "repository":SOURCE_REPOSITORY,"ref":SOURCE_REF,"path":SOURCE_PATH,
            "gitBlobSha":sha,
            "legacyEncodingReadMode":"latin1-byte-preserving; equality/ASCII-token-use only",
            "sourceCode":["gmsv/src/battle/pet_skill.c","gmsv/src/item/item_gen.c","gmsv/src/item/item.c"],
        },
        "fixedBuild":{
            "itemInslay":True,"petskillFixitem":True,"itemFixAllBase":True,
            "itemPileNums":True,"petskill2Txt":True,
        },
        "semantics":{
            "missingRowOrKey":"empty C string",
            "field2Skills":[200,201,540,572],
            "stringFields":["secretName","effectString","argument","typeCode","inlayCode",
                            "ingName0","ingName1","ingName2","ingName3","ingName4"],
            "functionFields":FUNC_NAMES,
        },
        "stats":stats,
        "byItemId":{str(k):rows[k] for k in sorted(rows)},
    }
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print(json.dumps(stats,ensure_ascii=False,sort_keys=True))
    print(f"wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes)")

if __name__=="__main__":
    main()
