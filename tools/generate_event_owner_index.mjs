#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const args=process.argv.slice(2);
const root=path.resolve(args[args.indexOf('--source-root')+1] || '/tmp/StoneAge');
const out=path.resolve(args[args.indexOf('--out')+1] || 'data/generated/stoneage_event_owner_index.json');
const ref='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

function walk(dir,out=[]){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) walk(p,out);
    else if(e.isFile()) out.push(p);
  }
  return out;
}
function rel(p){return path.relative(root,p).replaceAll(path.sep,'/');}
function add(map,id,row){
  if(!Number.isInteger(id)) return;
  const x=map.get(id)||{eventId:id,occurrences:0,roles:new Set(),files:new Set(),samples:[]};
  x.occurrences++; x.roles.add(row.role); x.files.add(row.path);
  if(x.samples.length<16)x.samples.push(row);
  map.set(id,x);
}
const npcRoot=path.join(root,'gmsv/data/npc');
const files=walk(npcRoot).sort();
const refs=new Map();
const patterns=[
  ['ENDEV',/\bENDEV\s*[=:]\s*(-?\d+)/gi],
  ['NOWEV',/\bNOWEV\s*[=:]\s*(-?\d+)/gi],
  ['Event_End',/\bEvent_End\s*[=:]\s*(-?\d+)/gi],
  ['Event_Now',/\bEvent_Now\s*[=:]\s*(-?\d+)/gi],
  ['EvEnd',/\bEvEnd\s*[=:]\s*(-?\d+)/gi],
  ['EvNow',/\bEvNow\s*[=:]\s*(-?\d+)/gi],
  ['EventNo',/\bEventNo\s*[=:]\s*(-?\d+)/gi]
];
for(const p of files){
  const text=fs.readFileSync(p,'utf8').replace(/\r/g,'');
  const lines=text.split('\n');
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    if(!line||line.startsWith('#'))continue;
    for(const [role,rx] of patterns){
      for(const m of line.matchAll(rx)){
        const id=Number(m[1]);
        if(id>=0)add(refs,id,{path:rel(p),line:i+1,role,expression:m[0],raw:line.slice(0,800)});
      }
    }
  }
}


const encountPath=path.join(root,'gmsv/data/encount.txt');
const encounterEventRefs=[];
if(fs.existsSync(encountPath)){
  let lineNo=0;
  for(const raw of fs.readFileSync(encountPath,'utf8').replace(/\r/g,'').split('\n')){
    lineNo++;
    const line=raw.trim();
    if(!line||line.startsWith('#'))continue;
    const cols=line.split(',');
    for(const [idx,role] of [[30,'EncounterEventNow'],[31,'EncounterEventEnd']]){
      const id=Number((cols[idx]??'').trim());
      if(Number.isInteger(id)&&id>=0) encounterEventRefs.push({path:'gmsv/data/encount.txt',line:lineNo,role,id,expression:role+'='+id,raw:line.slice(0,800)});
    }
  }
  for(const row of encounterEventRefs)add(refs,row.id,row);
}

const missionPath=path.join(root,'gmsv/data/mission.txt');
const jobPath=path.join(root,'gmsv/data/jobdaily.txt');
const missionIds=new Set();
for(const line of fs.readFileSync(missionPath,'utf8').replace(/\r/g,'').split('\n')){
  const t=line.trim(); if(!t||t.startsWith('#'))continue;
  const p=t.split(','); const id=Number(p[0]); if(Number.isInteger(id))missionIds.add(id);
}
const jobIds=new Set();
for(const line of fs.readFileSync(jobPath,'utf8').replace(/\r/g,'').split('\n')){
  const t=line.trim(); if(!t||t.startsWith('#'))continue;
  for(const m of t.matchAll(/\b(?:ENDEV|NOWEV|Event_End|Event_Now|EvEnd|EvNow)\s*[=:]\s*(-?\d+)/gi))jobIds.add(Number(m[1]));
}

const charPath=path.join(root,'gmsv/src/char/char.c');
const char=fs.readFileSync(charPath,'utf8');
function arrayIds(name){
  const i=char.indexOf('int '+name+'[]');
  if(i<0)return [];
  const end=char.indexOf(';',i);
  return [...char.slice(i,end<0?char.length:end).matchAll(/-?\d+/g)].map(m=>Number(m[0])).filter(Number.isInteger);
}
const startupEnd=arrayIds('event_end');
const startupNow=arrayIds('event_now');

const rows=[...refs.values()].map(x=>({
  eventId:x.eventId,
  occurrences:x.occurrences,
  roles:[...x.roles].sort(),
  uniqueFiles:x.files.size,
  sourceBuckets:{
    mission:missionIds.has(x.eventId),
    jobdaily:jobIds.has(x.eventId),
    startupEnd:startupEnd.includes(x.eventId),
    startupNow:startupNow.includes(x.eventId)
  },
  samples:x.samples
})).sort((a,b)=>b.occurrences-a.occurrences||a.eventId-b.eventId);

const allIds=rows.map(r=>r.eventId);
const unresolved=allIds.filter(id=>!missionIds.has(id)&&!jobIds.has(id));
const startupOnly=unresolved.filter(id=>startupEnd.includes(id)||startupNow.includes(id));
const encounterOwned=unresolved.filter(id=>rows.find(r=>r.eventId===id)?.roles.some(x=>x==='EncounterEventNow'||x==='EncounterEventEnd'));
const ownerless=unresolved.filter(id=>!startupEnd.includes(id)&&!startupNow.includes(id)&&!encounterOwned.includes(id));

const index={
  format:'stoneage-event-owner-index-v1',
  generatedAt:'2026-09-30',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref},
  statistics:{
    npcFiles:files.length,
    uniqueEventIds:rows.length,
    eventReferenceOccurrences:rows.reduce((n,r)=>n+r.occurrences,0),
    missionMatchedIds:rows.filter(r=>r.sourceBuckets.mission).length,
    jobdailyMatchedIds:rows.filter(r=>r.sourceBuckets.jobdaily).length,
    unresolvedFromMissionJobdaily:unresolved.length,
    startupDefaultMatchedUnresolvedIds:startupOnly.length,
    encounterOwnedUnresolvedIds:encounterOwned.length,
    ownerlessUnresolvedIds:ownerless.length
  },
  startupDefaults:{eventEnd:[...new Set(startupEnd)].sort((a,b)=>a-b),eventNow:[...new Set(startupNow)].sort((a,b)=>a-b)},
  events:rows,
  unresolvedEventIds:unresolved.sort((a,b)=>a-b),
  startupOwnedUnresolvedIds:startupOnly.sort((a,b)=>a-b),
  encounterOwnedUnresolvedIds:encounterOwned.sort((a,b)=>a-b),
  ownerlessUnresolvedIds:ownerless.sort((a,b)=>a-b),
  policies:{
    startupDefaultArraysAreContextOnly:true,
    unresolvedEventsAreNotInvented:true,
    ownerClosureRequiresConcreteScriptOwner:true
  }
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(index,null,2)+'\n');
console.log(JSON.stringify({pass:true,statistics:index.statistics,startupOnly,ownerlessUnresolvedIds:index.ownerlessUnresolvedIds,output:out}));
