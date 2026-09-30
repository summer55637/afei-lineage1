#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args=process.argv.slice(2);
const root=path.resolve(args[args.indexOf('--source-root')+1] || '/tmp/StoneAge');
const npcRoot=path.join(root,'gmsv/data/npc');
const itemPath=path.join(root,'gmsv/data/itemset6.txt');
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
function nonEmpty(text){return text.replace(/\r/g,'').split('\n').filter(x=>{const t=x.trim();return t&&!t.startsWith('#');});}

const itemText=fs.readFileSync(itemPath,'utf8').replace(/\r/g,'');
const itemLines=nonEmpty(itemText);
const items=[];
const duplicateIds=[];
const itemMap=new Map();
let invalidRows=0;
for(let n=0;n<itemLines.length;n++){
  const raw=itemLines[n].trim();
  const cols=raw.split(',');
  const idText=(cols[16]??'').trim();
  const id=Number(idText);
  if(!Number.isInteger(id) || id<=0){invalidRows++;continue;}
  const rec={line:n+1,id,name:(cols[0]??'').trim(),secretName:(cols[1]??'').trim(),effect:(cols[2]??'').trim(),argument:(cols[3]??'').trim(),rawColumnCount:cols.length};
  if(itemMap.has(id)) duplicateIds.push({id,firstLine:itemMap.get(id).line,duplicateLine:rec.line});
  else itemMap.set(id,rec);
  items.push(rec);
}

const npcFiles=walk(npcRoot).sort();
const refs=[];
const eventRefs=[];
const rxItem=/(?:^|[|,;&\s])(?:AddItem|DelItem|GetItem|ITEM)(?:\s*[:=]\s*|\s*\|\s*)(-?\d+)/gi;
const rxRand=/(?:^|[|,;&\s])GetRandItem(?:\s*[:=]\s*|\s*\|\s*)(-?\d+)/gi;
const rxEvent=/(?:^|[|,;&\s])(ENDEV|NOWEV|Event_End|Event_Now|EvEnd|EvNow)(?:\s*[:=]\s*|\s*\|\s*)(-?\d+)/gi;

for(const p of npcFiles){
  const text=fs.readFileSync(p,'utf8').replace(/\r/g,'');
  const lines=text.split('\n');
  for(let ln=0;ln<lines.length;ln++){
    const line=lines[ln].trim();
    if(!line||line.startsWith('#'))continue;
    for(const m of line.matchAll(rxItem)){
      refs.push({path:rel(p),line:ln+1,kind:m[0].trim().split(/[\s:=|]/)[0],id:Number(m[1]),raw:line.slice(0,500)});
    }
    for(const m of line.matchAll(rxRand)){
      refs.push({path:rel(p),line:ln+1,kind:'GetRandItem',id:Number(m[1]),raw:line.slice(0,500)});
    }
    for(const m of line.matchAll(rxEvent)){
      eventRefs.push({path:rel(p),line:ln+1,kind:m[1],id:Number(m[2]),raw:line.slice(0,500)});
    }
  }
}

const uniqueItemIds=[...new Set(refs.map(r=>r.id).filter(Number.isInteger))].sort((a,b)=>a-b);
const unresolvedItemIds=uniqueItemIds.filter(id=>!itemMap.has(id));
const resolvedItems=uniqueItemIds.filter(id=>itemMap.has(id)).map(id=>itemMap.get(id));
const referenceCounts=Object.fromEntries([...new Set(refs.map(r=>r.kind))].sort().map(k=>[k,refs.filter(r=>r.kind===k).length]));
const eventIds=[...new Set(eventRefs.map(r=>r.id).filter(Number.isInteger))].sort((a,b)=>a-b);

const missionPath=path.join(root,'gmsv/data/mission.txt');
const jobPath=path.join(root,'gmsv/data/jobdaily.txt');
function parseMission(){
  const lines=nonEmpty(fs.readFileSync(missionPath,'utf8'));
  return lines.map(line=>{const p=line.split(',');return {id:Number(p[0]),level:Number(p[1]),eventFlags:p[2]||'',detail:p[3]||'',limitHours:Number(p[4])};}).filter(x=>Number.isInteger(x.id));
}
function parseJob(){
  const lines=nonEmpty(fs.readFileSync(jobPath,'utf8'));
  return lines.map(line=>{const p=line.split('|');return {jobId:p[0]||'',rule:p[1]||'',explain:p[2]||'',state:p[3]||''};});
}
const missions=parseMission();
const jobs=parseJob();
const missionIds=new Set(missions.map(x=>x.id));
const jobEventIds=new Set();
for(const j of jobs){
  for(const m of j.rule.matchAll(/(?:ENDEV|NOWEV|Event_End|Event_Now|EvEnd|EvNow)\s*[:=]\s*(-?\d+)/gi)) jobEventIds.add(Number(m[1]));
}
const unresolvedEventIds=eventIds.filter(id=>!missionIds.has(id)&&!jobEventIds.has(id));
const missionLinkedEventIds=eventIds.filter(id=>missionIds.has(id));
const jobLinkedEventIds=eventIds.filter(id=>jobEventIds.has(id));

const byItem=new Map();
for(const r of refs){
  const x=byItem.get(r.id)||{id:r.id,occurrences:0,kinds:new Set(),samples:[]};
  x.occurrences++; x.kinds.add(r.kind); if(x.samples.length<8)x.samples.push({path:r.path,line:r.line,kind:r.kind});
  byItem.set(r.id,x);
}
const itemRows=[...byItem.values()].map(x=>{
  const item=itemMap.get(x.id)||null;
  return {id:x.id,occurrences:x.occurrences,kinds:[...x.kinds].sort(),resolved:!!item,item:item?{name:item.name,secretName:item.secretName,effect:item.effect,argument:item.argument}:null,samples:x.samples};
}).sort((a,b)=>b.occurrences-a.occurrences||a.id-b.id);

const index={
  format:'stoneage-item-event-closure-index-v1',
  generatedAt:'2026-09-30',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref,path:'gmsv/data/itemset6.txt',idColumn:17},
  statistics:{
    itemSourceRows:itemLines.length,
    parsedItemRows:items.length,
    invalidItemRows:invalidRows,
    duplicateItemIds:duplicateIds.length,
    uniqueItemIdsInNpcEventRefs:uniqueItemIds.length,
    resolvedItemIds:resolvedItems.length,
    unresolvedItemIds:unresolvedItemIds.length,
    totalNpcEventItemRefs:refs.length,
    referenceCounts,
    eventReferenceOccurrences:eventRefs.length,
    uniqueEventIds:eventIds.length,
    missionLinkedEventIds:missionLinkedEventIds.length,
    jobDailyLinkedEventIds:jobLinkedEventIds.length,
    unresolvedEventIds:unresolvedEventIds.length
  },
  loaderContract:{
    itemIdColumn1Based:17,
    reason:'ITEM_readItemConfFile uses ITEM_ID_TOKEN_INDEX=17 under active _ITEMSET2_ITEM.',
    activeFlagEvidence:'gmsv/src/include/version.h defines _ITEMSET2_ITEM'
  },
  duplicateIds,
  unresolvedItemIds,
  itemReferences:itemRows,
  events:{
    uniqueEventIds:eventIds,
    missionIds:missions.map(x=>x.id),
    jobDailyRuleEventIds:[...jobEventIds].sort((a,b)=>a-b),
    unresolvedEventIds,
    samples:eventRefs.slice(0,200)
  },
  policies:{
    unresolvedItemIdsAreNotInvented:true,
    itemMetadataComesFromPinnedItemset6:true,
    questRewardMeaningRequiresNpcDslContext:true
  }
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(index,null,2)+'\n');
console.log(JSON.stringify({pass:true,statistics:index.statistics,unresolvedItemIds:unresolvedItemIds.slice(0,100),unresolvedEventIds:unresolvedEventIds.slice(0,100),output:out}));
