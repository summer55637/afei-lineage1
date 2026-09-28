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

# Fixed item_gen.c tables used by ITEM_simplify_atoms / ITEM_getTableNum / ITEM_randRange.
ITEM_GEN_RATE=0.7
ITEM_RAND_NUMS=[10,30,65,125,205,305,425,565,725,905,1125,1354,1594,1825,2105,2405,2725,3065,3425,3805]
ITEM_RAND_TABLE=[[700,1300],[900,1100]]
ITEM_SEARCH_TABLE=[[0.8,1.2],[0.7,1.3]]
MERGE_RETRY_THRESHOLDS=[[0],[250,0],[400,150,0],[700,260,70,0],[740,500,200,40,0]]
MERGE_MAXMATCH=2048
MERGE_OUTER_ATTEMPTS=5
ODDS_TABLE=[0.1,0.25,0.35,0.4,0.42,0.44,0.46,0.47,0.48,0.49,0.5,0.51,0.52,0.53]
MERGE_RANGEWIDTH_MIN=0.87
MERGE_RANGEWIDTH_MAX=1.05

def build_merge_math():
    rows=[]
    for i,num in enumerate(ITEM_RAND_NUMS):
        minnum=0 if i==0 else rows[-1]["maxnum"]+1
        maxnum=int(num+(ITEM_RAND_NUMS[i+1]-num)*ITEM_GEN_RATE) if i+1<len(ITEM_RAND_NUMS) else 4000
        rows.append({"num":num,"minnum":minnum,"maxnum":maxnum,"rate":maxnum/float(num)})
    return {
        "itemGenRate":ITEM_GEN_RATE,
        "itemRandNums":ITEM_RAND_NUMS,
        "itemRandTable":ITEM_RAND_TABLE,
        "itemSearchTable":ITEM_SEARCH_TABLE,
        "itemRandTableForItem":rows,
        "oddsTable":ODDS_TABLE,
        "mergeRangeWidth":{"min":MERGE_RANGEWIDTH_MIN,"max":MERGE_RANGEWIDTH_MAX},
        "retryThresholds":MERGE_RETRY_THRESHOLDS,
        "maxMatch":MERGE_MAXMATCH,
        "outerMergeAttempts":MERGE_OUTER_ATTEMPTS,
        "rngLifecycle":{
            "makeItemCallsPerInput":66,
            "mergeItemMergeBeforeMergeItem":"ITEM_makeItem for every selected CANMERGEFROM item",
            "cooldownPosition":"after all input ITEM_makeItem calls, before atom collection/randRange",
            "retryRollPosition":"RAND(0,999) occurs before extractcnt>=ideal break check",
            "finalCandidateSelection":"random()%match consumes one shared libc RNG call",
            "allRetryFailureFallback":"RAND(0,num-1) selects one input ITEM_ID",
        },
        "randDom":1000,
    }

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
    byte_atoms={}
    lines=0
    duplicates=0
    for raw_line in raw.splitlines():
        if not raw_line or raw_line.startswith(b"#"):
            continue
        # gb18030 is used only for human-readable enemybase/itematom matching in this
        # generator. latin1 is a 1:1 byte transport used to match V2.04 ITEM_INGNAME
        # strings, which are intentionally stored byte-preserving.
        line=raw_line.decode("gb18030")
        byte_line=raw_line.decode("latin1")
        p=line.split(",")
        bp=byte_line.split(",")
        if len(p)<2 or len(bp)<2:
            continue
        # Fixed ITEM_initItemAtom() ignores itematom.txt column 3 completely.
        # ITEM_getAtomIndexByName() returns the zero-based item_atoms[] load position.
        atom_index=lines
        lines+=1
        name=p[0]
        byte_name=bp[0]
        if name in atoms:
            duplicates+=1
            continue
        atoms[name]=atom_index
        byte_atoms[byte_name]=atom_index
    return atoms,byte_atoms,lines,duplicates

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

    atoms,byte_atoms,atom_lines,atom_duplicates=parse_atoms(atom_raw)
    assert atom_lines==112
    assert len(byte_atoms)==112
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
            "atomIndex":"zero-based ITEM_initItemAtom load order; itematom.txt third column is ignored by fixed C",
            "byteNameLookup":"latin1 1:1 source-byte keys reproduce cross-file ITEM_INGNAME -> itematom strcmp",
            "minMax":"swap when fixMin > fixMax after atom resolution",
            "unknownAtom":"ITEM_getAtomIndexByName < 0 continues the outer ITEM_merge_getPetFix pass, so later slots in that pass are skipped",
            "negativeFallback":"ordinary 1000 / family 4000; no resolved pinned slot currently has a negative effective min/max",
            "petIdentity":"petId is fixed CHAR_PETID, populated from E_T_TEMPNO",
        },
        "stats":stats,
        "atomIndexByByteName":byte_atoms,
        "mergeMath":build_merge_math(),
        "byTempNo":{k:by_temp[k] for k in sorted(by_temp,key=lambda x:int(x))},
    }
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print(json.dumps(stats,ensure_ascii=False,sort_keys=True))
    print(f"wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes)")

if __name__=="__main__":
    main()
