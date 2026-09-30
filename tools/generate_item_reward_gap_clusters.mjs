#!/usr/bin/env node
import fs from 'node:fs';
const j=JSON.parse(fs.readFileSync('data/generated/stoneage_item_event_closure_index.json','utf8'));
const groups=new Map();
for(const r of j.itemReferences||[]){
  if(r.resolved)continue;
  if(!(r.roles||[]).some(x=>x==='AddItem'||x==='GetRandItem'))continue;
  const prefix=(r.samples?.[0]?.path||'(unknown)').split('/').slice(0,3).join('/');
  const x=groups.get(prefix)||{pathPrefix:prefix,occurrences:0,uniqueIds:new Set(),roles:new Set(),ids:new Map(),samples:[]};
  x.occurrences+=r.occurrences||0;x.uniqueIds.add(r.id);for(const role of r.roles||[])x.roles.add(role);
  x.ids.set(r.id,(x.ids.get(r.id)||0)+(r.occurrences||0));
  for(const s of r.samples||[])if(x.samples.length<20)x.samples.push({id:r.id,...s});
  groups.set(prefix,x);
}
const rows=[...groups.values()].map(x=>({pathPrefix:x.pathPrefix,occurrences:x.occurrences,uniqueIds:x.uniqueIds.size,roles:[...x.roles].sort(),topIds:[...x.ids.entries()].sort((a,b)=>b[1]-a[1]).slice(0,30).map(([id,count])=>({id,count})),samples:x.samples})).sort((a,b)=>b.occurrences-a.occurrences);
const report={format:'stoneage-item-reward-gap-cluster-v1',generatedAt:'2026-09-30',fixedSource:j.fixedSource,statistics:{clusterCount:rows.length,totalUnresolvedRewardOccurrences:rows.reduce((n,r)=>n+r.occurrences,0),uniqueUnresolvedRewardIds:new Set(rows.flatMap(r=>r.topIds.map(x=>x.id))).size},clusters:rows,policy:'Clusters are descriptive source-data groupings only; no runtime priority is inferred from counts.'};
fs.writeFileSync('data/generated/stoneage_item_reward_gap_clusters.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:true,statistics:report.statistics,topClusters:rows.slice(0,20).map(r=>({pathPrefix:r.pathPrefix,occurrences:r.occurrences,uniqueIds:r.uniqueIds,roles:r.roles}))}));