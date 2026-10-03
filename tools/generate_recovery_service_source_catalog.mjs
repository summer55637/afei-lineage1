#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args=process.argv.slice(2);
const value=(name,fallback=null)=>{
  const i=args.indexOf(name);
  return i>=0 ? args[i+1] : fallback;
};
const input=path.resolve(value('--world-index','data/generated/stoneage_world_npc_index.json'));
const output=path.resolve(value('--out','data/generated/stoneage_recovery_service_source_catalog.json'));
const sourceRepo=value('--source-repo','gavinlinasd/StoneAge');
const sourceRef=value('--source-ref','1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');

const SERVICES=new Map([
  ['healer',{templates:['npcgen_healer'],execution:'direct_full_recovery',interaction:'NPC_Util_CharDistance <= 2',policy:'ordinary_healer'}],
  ['windowhealer',{templates:['npcgen_winhealer'],execution:'windowed_recovery',interaction:'NPC_Util_CharDistance <= configured_range or window callback',policy:'explicit_cost_and_range_required'}],
  ['fmhealer',{templates:['npcgen_fmhealer'],execution:'family_recovery',interaction:'face_to_face <= 2',policy:'family_service_context_required'}]
]);

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));
const normalize=v=>String(v??'').trim().toLowerCase();

function fail(message){
  console.error('Recovery service source catalog generation FAILED:',message);
  process.exit(1);
}
if(!fs.existsSync(input))fail('world NPC index missing: '+input);
let world;
try{world=JSON.parse(fs.readFileSync(input,'utf8'));}catch(error){fail('world NPC index JSON invalid: '+error.message);}
if(!isObject(world)||world.format!=='stoneage-world-npc-index-v1')fail('world NPC index format invalid');
if(world.fixedSource?.repository!==sourceRepo||world.fixedSource?.ref!==sourceRef)fail('world NPC fixed source mismatch');

const instances=[];
for(const create of world.creates??[]){
  for(const enemy of Array.isArray(create.enemy)?create.enemy:[]){
    const candidates=Array.isArray(enemy.templateCandidates)?enemy.templateCandidates:[];
    for(const [key,profile] of SERVICES){
      const templateName=normalize(enemy.templateName);
      const matchesTemplate=profile.templates.includes(templateName);
      const matchesFunction=candidates.some(t=>normalize(t?.functionSet)===key);
      if(!matchesTemplate && !matchesFunction)continue;
      const selected=candidates.find(t=>normalize(t?.functionSet)===key)??null;
      const exactPoint=isObject(create.bornCorner)
        && Number(create.bornCorner.x1)===Number(create.bornCorner.x2)
        && Number(create.bornCorner.y1)===Number(create.bornCorner.y2);
      instances.push({
        service:key,
        floorId:Number(create.floorId),
        exactPoint:exactPoint?{x:Number(create.bornCorner.x1),y:Number(create.bornCorner.y1)}:null,
        bornCorner:clone(create.bornCorner??null),
        bornCenter:clone(create.bornCenter??null),
        sourcePath:String(create.path??''),
        createBlobSha:String(create.sha256??''),
        createBlockIndex:Number(create.blockIndex),
        createStartLine:Number(create.startLine),
        createNum:create.createNum==null?null:Number(create.createNum),
        enemyRaw:String(enemy.raw??''),
        templateName:String(enemy.templateName??''),
        templatePath:selected?.path??null,
        templateBlockIndex:selected?.blockIndex==null?null:Number(selected.blockIndex),
        sourceTemplateFunctionSet:selected?.functionSet??null,
        fileRef:enemy.fileRef??null,
        fileExists:enemy.fileExists??null,
        execution:profile.execution,
        interaction:profile.interaction,
        policy:profile.policy,
        routeEligible:key==='healer'&&exactPoint
      });
    }
  }
}
instances.sort((a,b)=>String(a.service).localeCompare(String(b.service))||a.floorId-b.floorId||String(a.sourcePath).localeCompare(String(b.sourcePath))||a.createBlockIndex-b.createBlockIndex);

const statistics={totalInstances:instances.length};
for(const key of SERVICES.keys()){
  const rows=instances.filter(x=>x.service===key);
  statistics[key]={instanceCount:rows.length,exactPointCount:rows.filter(x=>!!x.exactPoint).length,nonPointCount:rows.filter(x=>!x.exactPoint).length,uniqueFloorCount:new Set(rows.map(x=>x.floorId)).size,routeEligibleCount:rows.filter(x=>x.routeEligible).length};
}
statistics.uniqueFloorCount=new Set(instances.map(x=>x.floorId)).size;

const outputData={
  format:'stoneage-recovery-service-source-catalog-v1',
  generatedAt:new Date().toISOString().slice(0,10),
  purpose:'Fixed-C source-backed recovery service instance catalog. Service semantics remain separated; no synthetic coordinates.',
  fixedSource:{repository:sourceRepo,ref:sourceRef},
  sourceInputs:{worldNpcIndex:path.basename(input),worldNpcIndexFixedSource:clone(world.fixedSource??null)},
  serviceProfiles:Object.fromEntries([...SERVICES.entries()].map(([key,p])=>[key,p])),
  statistics,
  instances
};

fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(outputData,null,2)+'\n');
console.log(JSON.stringify({pass:true,format:outputData.format,fixedSource:sourceRepo+'@'+sourceRef,statistics,output},null,2));
