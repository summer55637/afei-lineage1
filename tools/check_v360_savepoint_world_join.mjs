#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const sourceRoot=process.argv[2] ?? '/tmp/StoneAge';
const fixedRef='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const repo='gavinlinasd/StoneAge';
const serviceIndexPath='data/generated/stoneage_npc_service_index.json';

function rel(v){
  const s=String(v??'').replaceAll('\\','/');
  return s.startsWith('gmsv/data/npc/')?s.slice('gmsv/data/npc/'.length):s;
}
function key(path,blockIndex){ return rel(path)+'#'+Number(blockIndex); }
function fail(message){ throw new Error(message); }

fs.rmSync('/tmp/v360-savepoint-world',{recursive:true,force:true});
fs.mkdirSync('/tmp/v360-savepoint-world',{recursive:true});
execFileSync('node',['tools/generate_world_data_catalog.mjs','--source-root',sourceRoot,'--out-dir','/tmp/v360-savepoint-world'],{stdio:'inherit'});
execFileSync('node',['tools/generate_savepoint_source_catalog.mjs','--source-root',sourceRoot,'--out','/tmp/v360-savepoint-world/stoneage_npc_savepoint_source_index.json'],{stdio:'inherit'});

const world=JSON.parse(fs.readFileSync('/tmp/v360-savepoint-world/stoneage_world_npc_index.json','utf8'));
const catalog=JSON.parse(fs.readFileSync('/tmp/v360-savepoint-world/stoneage_npc_savepoint_source_index.json','utf8'));
const service=JSON.parse(fs.readFileSync(serviceIndexPath,'utf8'));

assert.deepEqual(world.fixedSource,{repository:repo,ref:fixedRef});
assert.deepEqual(catalog.fixedSource,{repository:repo,ref:fixedRef});
assert.equal(service.fixedSource.repository,repo);
assert.equal(service.fixedSource.ref,fixedRef);

const bindings=[];
for(const create of world.creates??[]){
  for(const enemy of create.enemy??[]){
    const candidates=(enemy.templateCandidates??[]).filter(t=>String(t.functionSet??'').toLowerCase()==='savepoint');
    for(const candidate of candidates){
      bindings.push({
        key:key(create.path,create.blockIndex),
        path:rel(create.path),
        blockIndex:Number(create.blockIndex),
        floorId:Number(create.floorId),
        x:Number(create.bornCorner?.x1),
        y:Number(create.bornCorner?.y1),
        templateName:enemy.templateName??null,
        candidatePath:rel(candidate.path),
        candidateBlockIndex:Number(candidate.blockIndex),
        fileRef:enemy.fileRef??null
      });
    }
  }
}

const rows=Object.values(catalog.bySourceKey??{});
const svc=service.services.find(x=>String(x.functionSet).toLowerCase()==='savepoint');
assert.equal(bindings.length,28,'world SavePoint binding count');
assert.equal(rows.length,28,'source SavePoint row count');
assert.deepEqual(catalog.statistics,{savePointInstanceCount:28,unresolvedCount:0,noItemCount:0,itemRequiredCount:27,confirmOnlyCount:1});
assert.equal(svc?.instanceCount,28);
assert.equal(svc?.uniqueFloorCount,26);

const worldByKey=new Map(bindings.map(x=>[x.key,x]));
const seenElder=new Set();
for(const row of rows){
  const w=worldByKey.get(row.sourceKey);
  if(!w)fail('SavePoint catalog binding missing from World NPC index: '+row.sourceKey);
  if(w.floorId!==Number(row.floorId))fail('floor mismatch '+row.sourceKey+': world='+w.floorId+' catalog='+row.floorId);
  if(w.templateName?.toLowerCase()!=='npcgen_savepoint')fail('template name mismatch '+row.sourceKey+': '+w.templateName);
  if(w.candidatePath!==rel(row.templatePath) || w.candidateBlockIndex!==Number(row.templateBlockIndex))fail('template candidate mismatch '+row.sourceKey);
  if(w.fileRef!==row.sourceArgPath)fail('arg fileRef mismatch '+row.sourceKey+': world='+w.fileRef+' catalog='+row.sourceArgPath);
  if(w.x!==Number(w.x)||w.y!==Number(w.y))fail('invalid World SavePoint point '+row.sourceKey);
  if(!row.born || Number(row.floorId)!==Number(row.born.floorId))fail('Born floor mismatch '+row.sourceKey);
  if(seenElder.has(Number(row.elderId)))fail('duplicate elderId: '+row.elderId);
  seenElder.add(Number(row.elderId));
}
const anomaly=rows.find(x=>x.sourceArgPath==='genout/sp_200_449_982');
assert.ok(anomaly);
assert.ok(anomaly.itemRequirementIssues?.some(x=>x.reason==='savepoint-getitem-zero-count-branch-impossible'));
assert.equal(anomaly.itemRequirements.length,16);

console.log(JSON.stringify({
  pass:true,
  fixedSource:repo+'@'+fixedRef,
  worldSavePointBindings:bindings.length,
  catalogRows:rows.length,
  serviceIndexSavePointInstances:svc.instanceCount,
  uniqueSavePointFloors:svc.uniqueFloorCount,
  modeCounts:catalog.statistics,
  anomaly:{sourceArgPath:anomaly.sourceArgPath,issues:anomaly.itemRequirementIssues}
}));
