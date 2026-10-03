#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args=process.argv.slice(2);
const value=(name,fallback=null)=>{
  const i=args.indexOf(name);
  return i>=0 ? args[i+1] : fallback;
};
const input=path.resolve(value('--world-index','data/generated/stoneage_world_npc_index.json'));
const output=path.resolve(value('--out','data/generated/stoneage_healer_source_catalog.json'));
const sourceRepo=value('--source-repo','gavinlinasd/StoneAge');
const sourceRef=value('--source-ref','1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
const TEMPLATE='npcgen_healer';
const FUNCTION_SET='Healer';

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));
const normalize=v=>String(v??'').trim().toLowerCase();

function fail(message){
  console.error('Healer source catalog generation FAILED:',message);
  process.exit(1);
}
if(!fs.existsSync(input))fail('world NPC index missing: '+input);

let world;
try{world=JSON.parse(fs.readFileSync(input,'utf8'));}catch(error){fail('world NPC index JSON invalid: '+error.message);}

if(!isObject(world))fail('world NPC index must be an object');
if(world.fixedSource?.repository!==sourceRepo||world.fixedSource?.ref!==sourceRef){
  fail('world NPC index fixed source mismatch');
}
if(!Array.isArray(world.creates))fail('world NPC index creates missing');

const instances=[];
for(const create of world.creates){
  for(const enemy of Array.isArray(create.enemy)?create.enemy:[]){
    const normalizedTemplate=normalize(enemy.normalizedTemplateName??enemy.templateName);
    const candidates=Array.isArray(enemy.templateCandidates)?enemy.templateCandidates:[];
    const healerCandidates=candidates.filter(t=>normalize(t?.functionSet)===normalize(FUNCTION_SET));
    if(normalizedTemplate!==normalize(TEMPLATE)&&healerCandidates.length===0)continue;
    if(normalizedTemplate!==normalize(TEMPLATE)){
      continue;
    }
    const exactPoint=isObject(create.bornCorner)
      && Number(create.bornCorner.x1)===Number(create.bornCorner.x2)
      && Number(create.bornCorner.y1)===Number(create.bornCorner.y2);
    const rect=isObject(create.bornCorner)
      ? {
          x1:Number(create.bornCorner.x1),
          y1:Number(create.bornCorner.y1),
          x2:Number(create.bornCorner.x2),
          y2:Number(create.bornCorner.y2)
        }
      : null;
    instances.push({
      floorId:Number(create.floorId),
      exactPoint:exactPoint?{x:Number(create.bornCorner.x1),y:Number(create.bornCorner.y1)}:null,
      bornCorner:rect,
      bornCenter:clone(create.bornCenter??null),
      sourcePath:String(create.path??''),
      createBlobSha:String(create.sha256??''),
      createBlockIndex:Number(create.blockIndex),
      createStartLine:Number(create.startLine),
      createNum:create.createNum==null?null:Number(create.createNum),
      enemyRaw:String(enemy.raw??''),
      templateName:String(enemy.templateName??TEMPLATE),
      templateCandidates:clone(healerCandidates.length?healerCandidates:enemy.templateCandidates??[]),
      fileRef:enemy.fileRef??null,
      fileExists:enemy.fileExists??null
    });
  }
}

instances.sort((a,b)=>a.floorId-b.floorId||String(a.sourcePath).localeCompare(String(b.sourcePath))||a.createBlockIndex-b.createBlockIndex);

const byFloor={};
for(const row of instances){
  const key=String(row.floorId);
  const bucket=byFloor[key]??={
    floorId:row.floorId,
    instanceCount:0,
    exactPointCount:0,
    exactPoints:[],
    nonPointCount:0
  };
  bucket.instanceCount++;
  if(row.exactPoint){
    bucket.exactPointCount++;
    bucket.exactPoints.push(clone(row.exactPoint));
  }else{
    bucket.nonPointCount++;
  }
  byFloor[key]=bucket;
}

const outputData={
  format:'stoneage-healer-source-catalog-v1',
  generatedAt:new Date().toISOString().slice(0,10),
  purpose:'Fixed-C source-backed Healer NPC instance catalog for idle supply route planning. No synthetic coordinates.',
  fixedSource:{
    repository:sourceRepo,
    ref:sourceRef
  },
  sourceInputs:{
    worldNpcIndex:path.basename(input),
    worldNpcIndexFixedSource:clone(world.fixedSource??null)
  },
  selection:{
    templateName:TEMPLATE,
    functionSet:FUNCTION_SET,
    rule:'create.enemy normalizedTemplateName must equal npcgen_healer and the resolved template candidate must identify Healer when candidates are present'
  },
  statistics:{
    healerCreateCount:instances.length,
    exactPointCount:instances.filter(x=>!!x.exactPoint).length,
    nonPointCount:instances.filter(x=>!x.exactPoint).length,
    uniqueFloorCount:Object.keys(byFloor).length
  },
  floors:Object.values(byFloor),
  instances
};

fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(outputData,null,2)+'\n');
console.log(JSON.stringify({
  pass:true,
  format:outputData.format,
  fixedSource:sourceRepo+'@'+sourceRef,
  statistics:outputData.statistics,
  output
},null,2));
