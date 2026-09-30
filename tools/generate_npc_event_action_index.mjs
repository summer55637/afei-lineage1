#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args=process.argv.slice(2);
const root=path.resolve(args[args.indexOf('--source-root')+1] || '/tmp/StoneAge');
const out=path.resolve(args[args.indexOf('--out')+1] || 'data/generated/stoneage_npc_event_action_index.json');
const npcRoot=path.join(root,'gmsv/data/npc');
const cPath=path.join(root,'gmsv/src/npc/npc_eventaction.c');
const sourceRef='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

function walk(dir,out=[]){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) walk(p,out);
    else if(e.isFile()) out.push(p);
  }
  return out;
}
function rel(p){return path.relative(root,p).replaceAll(path.sep,'/');}
const files=walk(npcRoot).sort();
const c=fs.readFileSync(cPath,'utf8');
const sourceActionKeys=[...new Set([...c.matchAll(/NPC_Util_GetStrFromStrWithDelim\(\s*buf1\s*,\s*"([A-Za-z][A-Za-z0-9_]*)"/g)].map(m=>m[1]))].sort();
const actionCounts=Object.fromEntries(sourceActionKeys.map(k=>[k,0]));
const actionFiles=Object.fromEntries(sourceActionKeys.map(k=>[k,[]]));
const samples={};
const conditionCounts={FREE:0,ENDEV:0,NOWEV:0,ITEM:0,GOLD:0,LV:0,TRANS:0,PET:0,TITLE:0};

function sample(k,p,line){
  samples[k] ??= [];
  if(samples[k].length<12) samples[k].push({path:rel(p),line:line.slice(0,360)});
}
for(const p of files){
  const txt=fs.readFileSync(p,'utf8').replace(/\r/g,'');
  for(const raw of txt.split('\n')){
    const line=raw.trim();
    if(!line || line.startsWith('#')) continue;
    for(const key of sourceActionKeys){
      const rx=new RegExp('(^|[|&;])'+key+'(?=[:=|&;]|$)');
      if(rx.test(line)){
        actionCounts[key]++;
        if(!actionFiles[key].includes(rel(p)) && actionFiles[key].length<40) actionFiles[key].push(rel(p));
        sample(key,p,line);
      }
    }
    for(const key of Object.keys(conditionCounts)){
      const rx=new RegExp('(^|[|&;])'+key+'(?=[:=|&;]|$)');
      if(rx.test(line)){conditionCounts[key]++; sample('COND_'+key,p,line);}
    }
  }
}
const itemSets={AddItem:new Set(),DelItem:new Set(),GetItem:new Set(),ITEM:new Set(),reITEM:new Set()};
for(const p of files){
  const txt=fs.readFileSync(p,'utf8').replace(/\r/g,'');
  for(const raw of txt.split('\n')){
    const line=raw.trim();
    for(const spec of [
      ['AddItem',/(?:^|[|;])AddItem[=:|]?(-?\d+)/gi],
      ['DelItem',/(?:^|[|;])DelItem[=:|]?(-?\d+)/gi],
      ['GetItem',/(?:^|[|;])GetItem[=:|]?(-?\d+)/gi],
      ['ITEM',/(?:^|[|;&])ITEM[=:|]?(-?\d+)/g],
      ['reITEM',/(?:^|[|;&])reITEM[=:|]?(-?\d+)/g]
    ]){
      const [k,rx]=spec;
      for(const m of line.matchAll(rx)) itemSets[k].add(Number(m[1]));
    }
  }
}
const actionRows=Object.entries(actionCounts).sort((a,b)=>b[1]-a[1]);
const index={
  format:'stoneage-npc-event-action-index-v1',
  generatedAt:'2026-09-30',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:sourceRef,path:'gmsv/src/npc/npc_eventaction.c'},
  statistics:{
    npcFiles:files.length,
    sourceActionKeyCount:sourceActionKeys.length,
    actionKeysObserved:actionRows.filter(x=>x[1]>0).length,
    totalActionKeyMatches:actionRows.reduce((n,x)=>n+x[1],0),
    conditionCounts,
    itemReferenceCounts:Object.fromEntries(Object.entries(itemSets).map(([k,s])=>[k,s.size]))
  },
  sourceActionKeys,
  actionCounts:actionRows,
  actionFileSamples:actionFiles,
  itemIdReferences:Object.fromEntries(Object.entries(itemSets).map(([k,s])=>[k,[...s].sort((a,b)=>a-b)])),
  lineSamples:samples,
  policies:{sourceActionKeysAreDerivedFromC:true,scannedNpcDataAllFiles:true,unresolvedActionsAreNotPromoted:true,itemIdsAreReferencesOnly:true}
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(index,null,2)+'\n');
console.log(JSON.stringify({pass:true,statistics:index.statistics,topActionKeys:actionRows.slice(0,30),output:out}));
