#!/usr/bin/env python3
"""Generate pinned enemybase/itematom Pet merge-fix metadata for field=2 Merge.

Source of truth:
  gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56
  gmsv/data/enemybase1.txt
  gmsv/data/itematom.txt

The pinned data files are decoded as gb18030. This intentionally preserves fixed-C ITEM_merge_getPetFix quirks.  In particular the
pinned build has _MERGE_NEW_8 disabled, and the function's outer for(i=0;i<5;i++)
replays all five ATOMFIX slots five times.
"""
from __future__ import annotations

import hashlib
import json
import re
import urllib.request
from pathlib import Path

SOURCE_REPOSITORY="gavinlinasd/StoneAge"
SOURCE_REF="1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56"
ENEMYBASE_PATH="gmsv/data/enemybase1.txt"
ITEMATOM_PATH="gmsv/data/itematom.txt"
ENEMYBASE_BLOB="a19a508975e3a982fada323861b35b2edab79349"
ITEMATOM_BLOB="85ecfbf543b85b269e6177921f76a587d969ea26"
OUTPUT=Path("data/generated/stoneage_pet_merge_fix_runtime.json")

def c_atoi(value:str)->int:
    m=re.match(r"^[ \t]*([+-]?\d+)",value)
    return int(m.group(1)) if m else 0

def git_blob_sha(data:bytes)->str:
    return hashlib.sha1(f"blob {len(data)}\0".encode("ascii")+data).hexdigest()

def fetch(path:str)->bytes:
    url=f"https://raw.githubusercontent.com/{SOURCE_REPOSITORY}/{SOURCE_REF}/{path}"
    with urllib.request.urlopen(url,timeout=60) as response:
        return response.read()

def parse_atoms(raw:bytes):
    atoms={}
    lines=0
    duplicates=0
    for line in raw.decode("gb18030").splitlines():
        if not line or line.startswith("#"):
            continue
        p=line.split(",")
        if len(p)<2:
            continue
        # Fixed ITEM_initItemAtom() ignores itematom.txt column 3 completely.
        # ITEM_getAtomIndexByName() returns the zero-based item_atoms[] load position.
        atom_index=lines
        lines+=1
        name=p[0]
        if name in atoms:
            duplicates+=1
            continue
        atoms[name]=atom_index
    return atoms,lines,duplicates

def parse_enemybase(raw:bytes,atoms:dict[str,int]):
    by_temp={}
    seen=set()
    stats={
        "enemybaseRows":0,"uniqueTempNo":0,"duplicateTempNoIgnored":0,
        "rowsWithConfiguredFix":0,"configuredSlots":0,"resolvedSlots":0,
        "unresolvedSlots":0,"swappedRanges":0,"itemAtomCount":len(atoms),
        "itemAtomDuplicateNames":0,"expandedResolvedEntries":0,"abortedOuterPasses":0,
    }
    for line in raw.decode("gb18030").splitlines():
        if not line or line.startswith("#"):
            continue
        stats["enemybaseRows"]+=1
        p=line.split(",")
        assert len(p)>=55,len(p)
        temp_no=c_atoi(p[6])
        if temp_no in seen:
            stats["duplicateTempNoIgnored"]+=1
            continue
        seen.add(temp_no)
        slots=[]
        for i in range(5):
            name=p[1+i]
            if not name:
                continue
            stats["configuredSlots"]+=1
            base_add=c_atoi(p[39+i*3])
            fix_min=c_atoi(p[40+i*3])
            fix_max=c_atoi(p[41+i*3])
            atom_index=atoms.get(name)
            if atom_index is None:
                stats["unresolvedSlots"]+=1
            else:
                stats["resolvedSlots"]+=1
                if fix_min>fix_max:
                    fix_min,fix_max=fix_max,fix_min
                    stats["swappedRanges"]+=1
            slots.append({
                "slot":i+1,"name":name,"atomIndex":atom_index,
                "baseAdd":base_add,"fixMin":fix_min,"fixMax":fix_max,
            })
        if not slots:
            continue
        stats["rowsWithConfiguredFix"]+=1
        by_temp[str(temp_no)]={"name":p[0],"slots":slots}

        for _pass in range(5):
            for slot in slots:
                if slot["atomIndex"] is None:
                    stats["abortedOuterPasses"]+=1
                    break
                stats["expandedResolvedEntries"]+=1

    stats["uniqueTempNo"]=len(seen)
    return by_temp,stats

def main():
    enemy_raw=fetch(ENEMYBASE_PATH)
    atom_raw=fetch(ITEMATOM_PATH)
    assert git_blob_sha(enemy_raw)==ENEMYBASE_BLOB
    assert git_blob_sha(atom_raw)==ITEMATOM_BLOB

    atoms,atom_lines,atom_duplicates=parse_atoms(atom_raw)
    assert atom_lines==112
    assert atom_duplicates==0

    by_temp,stats=parse_enemybase(enemy_raw,atoms)
    stats["itemAtomDuplicateNames"]=atom_duplicates
    expected={
        "enemybaseRows":1816,"uniqueTempNo":1813,"duplicateTempNoIgnored":3,
        "rowsWithConfiguredFix":980,"configuredSlots":4602,"resolvedSlots":4572,
        "unresolvedSlots":30,"swappedRanges":2,"itemAtomCount":112,
        "itemAtomDuplicateNames":0,"expandedResolvedEntries":22860,"abortedOuterPasses":75,
    }
    assert stats==expected,(stats,expected)

    payload={
        "format":"stoneage-pet-merge-fix-runtime-v1",
        "source":{
            "repository":SOURCE_REPOSITORY,"ref":SOURCE_REF,
            "enemybasePath":ENEMYBASE_PATH,"enemybaseGitBlobSha":ENEMYBASE_BLOB,
            "itematomPath":ITEMATOM_PATH,"itematomGitBlobSha":ITEMATOM_BLOB,
            "sourceCode":["gmsv/src/item/item_gen.c","gmsv/src/include/enemy.h","gmsv/src/include/version.h"],
        },
        "fixedBuild":{
            "mergeNew8":False,"fmver21":True,"itemRandRangeDomBase":0,
            "itemRandRangeDom":1000,"fmRandRangeDom":4000,"maxItemAtomsSize":256,
        },
        "semantics":{
            "outerPasses":5,
            "slotOrder":[1,2,3,4,5],
            "minMax":"swap when fixMin > fixMax after atom resolution",
            "unknownAtom":"ITEM_getAtomIndexByName < 0 continues the outer ITEM_merge_getPetFix pass, so later slots in that pass are skipped",
            "negativeFallback":"ordinary 1000 / family 4000; no resolved pinned slot currently has a negative effective min/max",
            "petIdentity":"petId is fixed CHAR_PETID, populated from E_T_TEMPNO",
        },
        "stats":stats,
        "byTempNo":{k:by_temp[k] for k in sorted(by_temp,key=lambda x:int(x))},
    }
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print(json.dumps(stats,ensure_ascii=False,sort_keys=True))
    print(f"wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes)")

if __name__=="__main__":
    main()
