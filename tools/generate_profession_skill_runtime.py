#!/usr/bin/env python3
"""Generate the pinned StoneAge profession-skill runtime for V2.20."""
from __future__ import annotations
import hashlib
import json
import re
import urllib.request
from pathlib import Path

SOURCE_REPOSITORY="gavinlinasd/StoneAge"
SOURCE_REF="1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56"
PROFESSION_PATH="gmsv/data/profession.txt"
PROFESSION_C_PATH="gmsv/src/battle/profession_skill.c"
VERSION_PATH="gmsv/src/include/version.h"
PROFESSION_URL=f"https://raw.githubusercontent.com/{SOURCE_REPOSITORY}/{SOURCE_REF}/{PROFESSION_PATH}"
PROFESSION_C_URL=f"https://raw.githubusercontent.com/{SOURCE_REPOSITORY}/{SOURCE_REF}/{PROFESSION_C_PATH}"
VERSION_URL=f"https://raw.githubusercontent.com/{SOURCE_REPOSITORY}/{SOURCE_REF}/{VERSION_PATH}"
EXPECTED_PROFESSION_BLOB="12d059fa6f3c972875fbddc3b20ce3ea3119b658"
EXPECTED_PROFESSION_C_BLOB="dde3f879f13be466efe051daadb4811b22acddbc"
EXPECTED_VERSION_BLOB="af6c866fd609a39e2960236275f6bf39e7f47b2c"
OUTPUT=Path("data/generated/stoneage_profession_skill_runtime.json")

CHAR_FIELDS=("name","text","func","option")
INT_FIELDS=(
    "skillId","professionClass","target","costMp","useFlag","kind","icon","img1","img2",
    "cost","fixValue","limit1","percent1","limit2","percent2","limit3","percent3","limit4","percent4"
)

def blob_sha(data:bytes)->str:
    return hashlib.sha1(f"blob {len(data)}\0".encode("ascii")+data).hexdigest()

def fetch(url:str, expected:str)->bytes:
    with urllib.request.urlopen(url,timeout=60) as r:
        data=r.read()
    got=blob_sha(data)
    assert got==expected,(url,got,expected)
    return data

def c_atoi(value:str)->int:
    m=re.match(r"^[ \t]*([+-]?\d+)",value)
    return int(m.group(1)) if m else 0

def active_define(text:str,name:str)->bool:
    return re.search(r"^\s*#define\s+"+re.escape(name)+r"\b",text,re.M) is not None

def parse_rows(raw:bytes):
    rows=[]
    for raw_line in raw.decode("gb18030").splitlines():
        if not raw_line or raw_line.startswith("#") or raw_line.strip()=="":
            continue
        line=raw_line.replace("\t"," ").lstrip(" ")
        tokens=line.split(",")
        assert len(tokens)==23,(len(tokens),line)
        row={}
        for i,key in enumerate(CHAR_FIELDS):
            row[key]=tokens[i]
        for i,key in enumerate(INT_FIELDS):
            row[key]=c_atoi(tokens[i+4])
        rows.append(row)
    assert len(rows)==69,len(rows)
    return rows

def parse_dispatch(c_text:str):
    marker="static PROFESSION_SKILL_skillFunctionTable PROFESSION_SKILL_functbl[]"
    start=c_text.index(marker)
    end=c_text.index("};",start)
    pairs=[]
    cfunc_to_name={}
    line_re=re.compile(r'^\{\s*"([^"]+)"\s*,\s*(PROFESSION_[A-Za-z0-9_]+)\s*,\s*0\s*\}')
    for raw_line in c_text[start:end].splitlines():
        line=raw_line.strip()
        if line.startswith("//"):
            continue
        m=line_re.match(line)
        if not m:
            continue
        pairs.append({"name":m.group(1),"cFunction":m.group(2)})
        cfunc_to_name[m.group(2)]=m.group(1)
    assert len(pairs)==64,len(pairs)

    common={}
    common_re=re.compile(
        r'int\s+(PROFESSION_[A-Za-z0-9_]+)\s*\([^)]*\)\s*\{\s*'
        r'profession_common_fun\s*\([^;]*?,\s*(BATTLE_COM_[A-Za-z0-9_]+)\s*\)\s*;'
        r'\s*return\s+TRUE\s*;\s*\}'
    )
    for m in common_re.finditer(c_text):
        name=cfunc_to_name.get(m.group(1))
        if name:
            common[name]=m.group(2)
    return pairs,{k:common[k] for k in sorted(common)}

def main():
    p_raw=fetch(PROFESSION_URL,EXPECTED_PROFESSION_BLOB)
    c_raw=fetch(PROFESSION_C_URL,EXPECTED_PROFESSION_C_BLOB)
    v_raw=fetch(VERSION_URL,EXPECTED_VERSION_BLOB)
    rows=parse_rows(p_raw)
    pairs,common=parse_dispatch(c_raw.decode("latin1"))
    dispatch={x["name"] for x in pairs}
    unique_funcs=list(dict.fromkeys(x["func"] for x in rows))
    assert len(unique_funcs)==57,len(unique_funcs)
    assert all(x in dispatch for x in unique_funcs)

    by_id={}
    for base in sorted(rows,key=lambda x:x["skillId"]):
        row=dict(base)
        row["dispatchKnown"]=row["func"] in dispatch
        if row["func"] in common:
            row["commonCommand"]=common[row["func"]]
        by_id[str(row["skillId"])]=row

    ids=[x["skillId"] for x in rows]
    max_id=max(ids)
    holes=[i for i in range(1,max_id+1) if i not in ids]
    assert holes==[63,64,65],holes
    by_prof={str(cls):sum(1 for x in rows if x["professionClass"]==cls) for cls in (1,2,3)}

    version=v_raw.decode("latin1")
    fixed={
        "professionSkill":active_define(version,"_PROFESSION_SKILL"),
        "charProfession":active_define(version,"_CHAR_PROFESSION"),
        "proskillOptimum":active_define(version,"_PROSKILL_OPTIMUM"),
        "professionAddskill":active_define(version,"_PROFESSION_ADDSKILL"),
        "outOfBattleSkill":active_define(version,"_OUTOFBATTLESKILL"),
    }
    assert all(fixed.values()),fixed

    payload={
        "format":"stoneage-profession-skill-runtime-v1",
        "source":{
            "repository":SOURCE_REPOSITORY,"ref":SOURCE_REF,
            "professionPath":PROFESSION_PATH,"professionBlobSha":EXPECTED_PROFESSION_BLOB,
            "professionSkillCPath":PROFESSION_C_PATH,"professionSkillCBlobSha":EXPECTED_PROFESSION_C_BLOB,
            "versionPath":VERSION_PATH,"versionBlobSha":EXPECTED_VERSION_BLOB,
        },
        "fixedBuild":fixed,
        "fields":{"char":list(CHAR_FIELDS),"int":list(INT_FIELDS)},
        "stats":{
            "rows":len(rows),"maxSkillId":max_id,"tableSize":max_id+1,"holes":holes,
            "byProfession":by_prof,
            "useFlag0":sum(1 for x in rows if x["useFlag"]==0),
            "useFlag1":sum(1 for x in rows if x["useFlag"]==1),
            "uniqueDataFunctions":len(unique_funcs),
            "functionTable":len(pairs),
            "commonCommandFunctions":len(common),
        },
        "functionTable":pairs,
        "commonCommandByFunc":common,
        "bySkillId":by_id,
    }
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print(json.dumps(payload["stats"],ensure_ascii=False,sort_keys=True))

if __name__=="__main__":
    main()
