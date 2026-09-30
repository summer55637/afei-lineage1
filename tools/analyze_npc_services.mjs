#!/usr/bin/env node
import fs from 'node:fs';
const input='data/generated/stoneage_world_npc_index.json';
const output='data/generated/stoneage_npc_service_index.json';
const j=JSON.parse(fs.readFileSync(input,'utf8'));
const service=new Map();
const template=new Map();
const floorService=new Map();
for(const c of j.creates||[]){
  for(const e of c.enemy||[]){
    const candidates=e.templateCandidates||[];
    for(const t of candidates){
      const fn=t.functionSet||'(missing)';
      const rec=service.get(fn)||{functionSet:fn,instanceCount:0,uniqueFloors:new Set(),templates:new Set(),sourceStatus:(t.functionSet&&j.sourceFunctionSets?.some(x=>x.toLowerCase()===String(fn).toLowerCase()))?'known':'unknown'};
      rec.instanceCount++;
      if(Number.isFinite(c.floorId)) rec.uniqueFloors.add(c.floorId);
      if(t.path) rec.templates.add(t.path+'#'+t.blockIndex);
      service.set(fn,rec);
      if(Number.isFinite(c.floorId)){
        const fs=(floorService.get(c.floorId)||new Set()); fs.add(fn); floorService.set(c.floorId,fs);
      }
    }
  }
}
const rows=[...service.values()].map(r=>({
  functionSet:r.functionSet,
  sourceStatus:r.sourceStatus,
  instanceCount:r.instanceCount,
  uniqueFloorCount:r.uniqueFloors.size,
  floors:[...r.uniqueFloors].sort((a,b)=>a-b),
  templateCount:r.templates.size
})).sort((a,b)=>b.instanceCount-a.instanceCount||a.functionSet.localeCompare(b.functionSet));
const byFloor=[...floorService.entries()].map(([floor,set])=>({floor:Number(floor),serviceCount:set.size,services:[...set].sort()})).sort((a,b)=>b.serviceCount-a.serviceCount||a.floor-b.floor);
const categories={
  shop:['ItemShop','PoolItemShop','PetShop','PetSkillShop','ItemchangeMan'],
  movement:['Warp','WarpMan','FMWarpMan','Bus','Airplane','TranserMan','Riderman'],
  recovery:['Healer','WindowHealer','FmHealer'],
  progression:['Transmigration','RoomAdminNew','PetMaker','PetFusion'],
  information:['TownPeople','Oldman','StoryTeller','Msg','Dengon','Windowman','SignBoard','Quiz'],
  social:['Familyman','FMPKMan','FMPKCallMan','Bankman','FmDengon','FmLetter'],
  system:['Sysinfo','TimeMan','Mic','CheckMan','LuckyMan','Charm']
};
const categorySummary={};
for(const [cat,names] of Object.entries(categories)){
  const hit=rows.filter(r=>names.some(n=>n.toLowerCase()===r.functionSet?.toLowerCase()));
  categorySummary[cat]={functionSets:hit.map(r=>r.functionSet),instanceCount:hit.reduce((n,r)=>n+r.instanceCount,0),uniqueFloorCount:new Set(hit.flatMap(r=>r.floors)).size};
}
const out={
  format:'stoneage-npc-service-index-v1',
  generatedAt:'2026-09-30',
  fixedSource:j.fixedSource,
  statistics:{serviceFunctionSets:rows.length,totalServiceInstances:rows.reduce((n,r)=>n+r.instanceCount,0),uniqueServiceFloors:new Set(rows.flatMap(r=>r.floors)).size,floorsWithMultipleServiceTypes:byFloor.filter(x=>x.serviceCount>1).length},
  categorySummary,
  services:rows,
  floors:byFloor
};
fs.writeFileSync(output,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({pass:true,statistics:out.statistics,categorySummary,output}));
