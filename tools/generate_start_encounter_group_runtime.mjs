#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args=process.argv.slice(2);
const value=(name,fallback=null)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback;};
const root=path.resolve(value('--source-root','/tmp/StoneAge'));
const targetPath=path.resolve(value('--target-index','data/generated/stoneage_start_encounter_target_index.json'));
const out=path.resolve(value('--out','data/generated/stoneage_start_encounter_group_runtime.json'));
const FIXED='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const SOURCES={
  group:{path:'gmsv/data/group1.txt',sha:'1be75eb3e56ab16d4b433146ec59538ad651c874'},
  enemy:{path:'gmsv/data/enemy1.txt',sha:'bf245a391adeace09915b6e425754b54ab69a8f6'},
  enemyBase:{path:'gmsv/data/enemybase1.txt',sha:'a19a508975e3a982fada323861b35b2edab79349'}
};
const fail=m=>{console.error('Start encounter Group generation FAILED:',m);process.exit(1);};
const gitBlobSha=bytes=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0','utf8'),bytes])).digest('hex');
const readFixed=spec=>{
  const bytes=fs.readFileSync(path.join(root,spec.path));
  const got=gitBlobSha(bytes);
  if(got!==spec.sha)fail(`fixed source SHA mismatch for ${spec.path}: ${got}`);
  return {bytes,content:bytes.toString('utf8')};
};
const toInt=value=>{
  const s=String(value??'').trim();
  if(s==='')return null;
  const m=s.match(/^[+-]?\d+/);
  return m?Number(m[0]):null;
};
const groupSource=readFixed(SOURCES.group), enemySource=readFixed(SOURCES.enemy), enemyBaseSource=readFixed(SOURCES.enemyBase);
const target=JSON.parse(fs.readFileSync(targetPath,'utf8'));
if(target.format!=='stoneage-start-encounter-target-index-v1')fail('target index format mismatch');
if(target.fixedSource?.repository!=='gavinlinasd/StoneAge'||target.fixedSource?.ref!==FIXED)fail('target index fixed source mismatch');
const groupMap=new Map();
for(const raw of groupSource.content.split(/\r?\n/)){
  const p=raw.split(',');
  if(p.length<24||!p[0]||p[0].startsWith('#'))continue;
  const id=toInt(p[1]);
  if(id==null)continue;
  if(groupMap.has(id))fail('duplicate Group ID '+id);
  const members=[];
  for(let i=0;i<10;i++){
    const enemyId=toInt(p[4+i]);
    const createProb=toInt(p[14+i]);
    if(enemyId==null)continue;
    if(createProb==null)fail('Group '+id+' has EnemyID without CREATEPROB at slot '+(i+1));
    members.push({slot:i+1,enemyId,createProb});
  }
  groupMap.set(id,{groupId:id,name:String(p[0]).trim(),appearByItemId:toInt(p[2]),notAppearByItemId:toInt(p[3]),members});
}
const enemyMap=new Map();const enemyBaseByTempNo=new Map();
for(const raw of enemyBaseSource.content.split(/\r?\n/)){
  const p=raw.split(',');
  if(p.length<39||!p[0]||p[0].startsWith('#'))continue;
  const tempNo=toInt(p[6]);
  if(tempNo==null)continue;
  enemyBaseByTempNo.set(tempNo,{tempNo,size:toInt(p[38]),name:String(p[0]).trim()});
}

for(const raw of enemySource.content.split(/\r?\n/)){
  const p=raw.split(',');
  if(p.length<14||!p[0]||p[0].startsWith('#'))continue;
  const enemyId=toInt(p[3]);
  if(enemyId==null)continue;
  if(enemyMap.has(enemyId))fail('duplicate Enemy ID '+enemyId);
  enemyMap.set(enemyId,{enemyId,tempNo:toInt(p[4]),levelMin:toInt(p[5]),levelMax:toInt(p[6]),createMaxNum:toInt(p[7]),createMinNum:toInt(p[8]),petFlg:toInt(p[13])});
}
const referencedIds=[...new Set(Object.values(target.floors??{}).flatMap(f=>
  [...(f.unconditionalRows??[]),...(f.mixedRows??[]),...(f.conditionalItemRows??[])]
  .flatMap(r=>r.groupIds??[])
))].sort((a,b)=>a-b);
const groups=referencedIds.map(groupId=>{
  const group=groupMap.get(groupId);
  if(!group)return {groupId,status:'unresolved'};
  const members=group.members.map(m=>{
    const enemy=enemyMap.get(m.enemyId);
    const enemyBase=enemy?enemyBaseByTempNo.get(enemy.tempNo):null; return {...m,enemy:enemy?{...enemy,base:enemyBase??null}:null,templateResolved:!!enemy&&!!enemyBase};
  });
  return {groupId,status:'resolved',appearByItemId:group.appearByItemId,notAppearByItemId:group.notAppearByItemId,members};
});
const summary={
  referencedGroupCount:groups.length,
  resolvedGroupCount:groups.filter(x=>x.status==='resolved').length,
  unresolvedGroupCount:groups.filter(x=>x.status==='unresolved').length,
  groupsWithMissingEnemy:groups.filter(x=>x.status==='resolved'&&x.members.some(m=>!m.templateResolved)).length
};
if(summary.groupsWithMissingEnemy!==0)fail('one or more referenced Groups contain unresolved Enemy templates');
const result={
  format:'stoneage-start-encounter-group-runtime-v1',
  generatedAt:new Date().toISOString().slice(0,10),
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:FIXED,groupBlobSha:SOURCES.group.sha,enemyBlobSha:SOURCES.enemy.sha,enemyBaseBlobSha:SOURCES.enemyBase.sha},
  inputs:{targetIndex:targetPath.replace(process.cwd()+'/','').replaceAll('\\','/'),targetIndexFormat:target.format},
  policy:{
    purpose:'source-backed Group member selection inputs for start encounter',
    unresolvedGroup:'never promoted',
    missingEnemyTemplate:'never spawned',
    itemGate:'appearByItemId requires player inventory; not auto-satisfied',
    zeroWeight:'group with CREATE/encounter weight 0 is never selected'
  },
  summary,
  groups
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pass:true,output:out,summary},null,2));
