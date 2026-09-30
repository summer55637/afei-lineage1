#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args=process.argv.slice(2);
const root=path.resolve(args[args.indexOf('--source-root')+1] || '/tmp/StoneAge');
const out=path.resolve(args[args.indexOf('--out')+1] || 'data/generated/stoneage_item_event_closure_index.json');
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
function nonEmpty(text){
  return text.replace(/\r/g,'').split('\n').filter(x=>{
    const t=x.trim();
    return t && !t.startsWith('#');
  });
}
function sha256(buf){return crypto.createHash('sha256').update(buf).digest('hex');}
function splitItemIds(value){
  const ids=[];
  for(const token of String(value).split(',')){
    const m=token.trim().match(/^(-?\d+)/);
    if(m) ids.push(Number(m[1]));
  }
  return ids;
}

const itemPath=path.join(root,'gmsv/data/itemset6.txt');
const itemText=fs.readFileSync(itemPath,'utf8').replace(/\r/g,'');
const itemLines=nonEmpty(itemText);
const items=[];
const duplicateIds=[];
const itemMap=new Map();
let invalidRows=0;
for(let n=0;n<itemLines.length;n++){
  const raw=itemLines[n].trim();
  const cols=raw.split(',');
  const id=Number((cols[16]??'').trim());
  if(!Number.isInteger(id) || id<0){invalidRows++;continue;}
  const rec={
    line:n+1,id,
    name:(cols[0]??'').trim(),
    secretName:(cols[1]??'').trim(),
    effect:(cols[2]??'').trim(),
    argument:(cols[3]??'').trim(),
    rawColumnCount:cols.length
  };
  if(itemMap.has(id)) duplicateIds.push({id,firstLine:itemMap.get(id).line,duplicateLine:rec.line});
  else itemMap.set(id,rec);
  items.push(rec);
}

const npcRoot=path.join(root,'gmsv/data/npc');
const npcFiles=walk(npcRoot).sort();
const refs=[];
const eventRefs=[];
const rolePatterns=[
  ['AddItem',/\bAddItem\s*[:=]\s*([^|&}]+)/gi],
  ['DelItem',/\bDelItem\s*[:=]\s*([^|&}]+)/gi],
  ['GetRandItem',/\bGetRandItem\s*[:=]\s*([^|&}]+)/gi],
  ['GetItem',/\bGetItem\s*[:=]\s*([^|&}]+)/gi],
  ['EntryItem',/\bEntryItem\s*[:=]\s*([^|&}]+)/gi],
  ['CheckItem',/\bCheckItem\s*[:=]\s*([^|&}]+)/gi],
  ['ITEM',/\bITEM\s*(?:=|<|>|!=)\s*(-?\d+)/gi]
];
const eventRx=/\b(ENDEV|NOWEV|Event_End|Event_Now|EvEnd|EvNow)\s*[:=]\s*(-?\d+)/gi;

for(const p of npcFiles){
  const text=fs.readFileSync(p,'utf8').replace(/\r/g,'');
  const lines=text.split('\n');
  for(let ln=0;ln<lines.length;ln++){
    const line=lines[ln].trim();
    if(!line||line.startsWith('#')) continue;
    for(const [role,rx] of rolePatterns){
      for(const m of line.matchAll(rx)){
        const ids=role==='ITEM' ? [Number(m[1])] : splitItemIds(m[1]);
        for(const id of ids){
          refs.push({path:rel(p),line:ln+1,role,id,expression:m[0].slice(0,500),raw:line.slice(0,800)});
        }
      }
    }
    for(const m of line.matchAll(eventRx)){
      eventRefs.push({path:rel(p),line:ln+1,role:m[1],id:Number(m[2]),raw:line.slice(0,800)});
    }
  }
}

const uniqueItemIds=[...new Set(refs.map(r=>r.id).filter(Number.isInteger))].sort((a,b)=>a-b);
const unresolvedItemIds=uniqueItemIds.filter(id=>!itemMap.has(id));
const byItem=new Map();
for(const r of refs){
  const x=byItem.get(r.id)||{id:r.id,occurrences:0,roles:new Set(),samples:[]};
  x.occurrences++; x.roles.add(r.role);
  if(x.samples.length<10)x.samples.push({path:r.path,line:r.line,role:r.role,expression:r.expression});
  byItem.set(r.id,x);
}
const itemRows=[...byItem.values()].map(x=>{
  const item=itemMap.get(x.id)||null;
  return {
    id:x.id,
    occurrences:x.occurrences,
    roles:[...x.roles].sort(),
    resolved:!!item,
    tableItem:item?{line:item.line,name:item.name,secretName:item.secretName,effect:item.effect,argument:item.argument}:null,
    samples:x.samples
  };
}).sort((a,b)=>b.occurrences-a.occurrences||a.id-b.id);

const referenceCounts=Object.fromEntries(
  [...new Set(refs.map(r=>r.role))].sort().map(role=>[
    role,
    {
      occurrences:refs.filter(r=>r.role===role).length,
      uniqueIds:new Set(refs.filter(r=>r.role===role).map(r=>r.id)).size,
      unresolvedIds:[...new Set(refs.filter(r=>r.role===role&&!itemMap.has(r.id)).map(r=>r.id))].sort((a,b)=>a-b)
    }
  ])
);

const missionPath=path.join(root,'gmsv/data/mission.txt');
const jobPath=path.join(root,'gmsv/data/jobdaily.txt');
function parseMission(){
  return nonEmpty(fs.readFileSync(missionPath,'utf8')).map(line=>{
    const p=line.split(',');
    return {id:Number(p[0]),level:Number(p[1]),eventFlags:p[2]||'',detail:p[3]||'',limitHours:Number(p[4])};
  }).filter(x=>Number.isInteger(x.id));
}
function parseJob(){
  return nonEmpty(fs.readFileSync(jobPath,'utf8')).map(line=>{
    const p=line.split('|');
    return {jobId:p[0]||'',rule:p[1]||'',explain:p[2]||'',state:p[3]||''};
  });
}
const missions=parseMission();
const jobs=parseJob();
const missionIds=new Set(missions.map(x=>x.id));
const jobEventIds=new Set();
for(const j of jobs){
  for(const m of j.rule.matchAll(/(?:ENDEV|NOWEV|Event_End|Event_Now|EvEnd|EvNow)\s*[:=]\s*(-?\d+)/gi))
    jobEventIds.add(Number(m[1]));
}
const eventIds=[...new Set(eventRefs.map(r=>r.id).filter(Number.isInteger))].sort((a,b)=>a-b);
const unresolvedEventIds=eventIds.filter(id=>!missionIds.has(id)&&!jobEventIds.has(id));
const missionLinkedEventIds=eventIds.filter(id=>missionIds.has(id));
const jobLinkedEventIds=eventIds.filter(id=>jobEventIds.has(id));

const index={
  format:'stoneage-item-event-closure-index-v2',
  generatedAt:'2026-09-30',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref,itemPath:'gmsv/data/itemset6.txt',idColumn1Based:17},
  loaderContract:{
    source:'gmsv/src/item/item.c',
    itemIdIndex1Based:17,
    activeFlag:'_ITEMSET2_ITEM',
    makeItemFunction:'ITEM_makeItemAndRegist',
    checkFunction:'ITEM_CHECKITEMTABLE'
  },
  statistics:{
    itemSourceRows:itemLines.length,
    parsedItemRows:items.length,
    invalidItemRows:invalidRows,
    duplicateItemIds:duplicateIds.length,
    itemIdMin:items.length?Math.min(...items.map(x=>x.id)):null,
    itemIdMax:items.length?Math.max(...items.map(x=>x.id)):null,
    totalNpcItemRefs:refs.length,
    uniqueItemIdsInNpcRefs:uniqueItemIds.length,
    resolvedItemIds:uniqueItemIds.length-unresolvedItemIds.length,
    unresolvedItemIds:unresolvedItemIds.length,
    resolvedReferenceOccurrences:refs.filter(r=>itemMap.has(r.id)).length,
    unresolvedReferenceOccurrences:refs.filter(r=>!itemMap.has(r.id)).length,
    referenceCounts,
    eventReferenceOccurrences:eventRefs.length,
    uniqueEventIds:eventIds.length,
    missionLinkedEventIds:missionLinkedEventIds.length,
    jobDailyLinkedEventIds:jobLinkedEventIds.length,
    unresolvedEventIds:unresolvedEventIds.length
  },
  duplicateIds,
  unresolvedItemIds,
  itemReferences:itemRows,
  events:{
    uniqueEventIds:eventIds,
    missionIds:[...missionIds].sort((a,b)=>a-b),
    jobDailyRuleEventIds:[...jobEventIds].sort((a,b)=>a-b),
    missionLinkedEventIds,
    jobLinkedEventIds,
    unresolvedEventIds,
    samples:eventRefs.slice(0,300)
  },
  policies:{
    unknownItemIdsAreNotInvented:true,
    itemMetadataComesFromPinnedItemset6:true,
    itemIdRolesAreSeparatedByCDataKey:true,
    questClosureRequiresEventAndNpcContext:true
  }
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(index,null,2)+'\n');
console.log(JSON.stringify({pass:true,statistics:index.statistics,topUnresolved:index.unresolvedItemIds.slice(0,120),topUnresolvedEvents:index.events.unresolvedEventIds,output:out}));
