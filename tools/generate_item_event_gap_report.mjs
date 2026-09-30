#!/usr/bin/env node
import fs from 'node:fs';
const j=JSON.parse(fs.readFileSync('data/generated/stoneage_item_event_closure_index.json','utf8'));
function roleGroup(role){
  if(role==='AddItem'||role==='GetRandItem') return 'reward_or_grant';
  if(role==='DelItem'||role==='ITEM'||role==='GetItem'||role==='CheckItem'||role==='EntryItem') return 'requirement_or_consume';
  return 'other';
}
const unresolved=(j.itemReferences||[]).filter(r=>!r.resolved);
const byGroup=new Map();
for(const r of unresolved){
  for(const role of r.roles||[]){
    const g=roleGroup(role);
    const x=byGroup.get(g)||{occurrences:0,uniqueIds:new Set(),roles:new Set(),topIds:new Map(),samples:[]};
    x.occurrences+=r.occurrences||0;x.uniqueIds.add(r.id);x.roles.add(role);x.topIds.set(r.id,(x.topIds.get(r.id)||0)+(r.occurrences||0));
    for(const s of r.samples||[]) if(x.samples.length<24)x.samples.push({id:r.id,...s});
    byGroup.set(g,x);
  }
}
const groups=Object.fromEntries([...byGroup.entries()].map(([g,x])=>[g,{occurrences:x.occurrences,uniqueIds:x.uniqueIds.size,roles:[...x.roles].sort(),topIds:[...x.topIds.entries()].sort((a,b)=>b[1]-a[1]).slice(0,40).map(([id,count])=>({id,count})),samples:x.samples}]));
const pathCounts={};
for(const r of unresolved){for(const s of r.samples||[]){const parts=s.path.split('/');const key=parts.length>1?parts.slice(0,2).join('/'):(parts[0]||'(root)');pathCounts[key]=(pathCounts[key]||0)+(r.occurrences||0);}}
const eventUnresolved=(j.events?.unresolvedEventIds||[]);
const report={format:'stoneage-item-event-gap-report-v1',generatedAt:'2026-09-30',fixedSource:j.fixedSource,statistics:{uniqueUnresolvedItemIds:j.statistics.unresolvedItemIds,unresolvedItemReferenceOccurrences:j.statistics.unresolvedReferenceOccurrences,uniqueEventIdsUnresolved:eventUnresolved.length,eventReferenceOccurrences:j.statistics.eventReferenceOccurrences},groups,pathCounts:Object.fromEntries(Object.entries(pathCounts).sort((a,b)=>b[1]-a[1])),unresolvedItemIds:j.unresolvedItemIds,unresolvedEventIds:eventUnresolved,policy:'Do not fabricate missing item definitions or event definitions; resolve against fixed source or explicitly classify as inactive/legacy.'};
fs.writeFileSync('data/generated/stoneage_item_event_gap_report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:true,statistics:report.statistics,groups:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,{occurrences:v.occurrences,uniqueIds:v.uniqueIds,roles:v.roles}])),topPaths:Object.entries(report.pathCounts).slice(0,20)}));