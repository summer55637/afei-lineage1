#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const args=process.argv.slice(2);
const value=(name,fallback=null)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback;};
const root=path.resolve(value('--source-root','/tmp/StoneAge'));
const out=path.resolve(value('--out','data/generated/stoneage_new_player_pet_runtime.json'));
const fixedRef='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const closurePath=path.resolve(value('--closure','data/generated/stoneage_new_player_event_closure.json'));
function fail(m){console.error('New-player Pet generation FAILED:',m);process.exit(1);}
if(!fs.existsSync(root))fail('source root missing: '+root);
if(!fs.existsSync(path.join(root,'gmsv/data/enemy1.txt')))fail('enemy1.txt missing');
if(!fs.existsSync(path.join(root,'gmsv/data/enemybase1.txt')))fail('enemybase1.txt missing');
if(fs.existsSync(path.join(root,'.git'))){
  try{
    const head=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
    if(head!==fixedRef)fail('source checkout HEAD must equal pinned ref '+fixedRef+'; got '+head);
  }catch(error){fail('could not verify source checkout ref: '+String(error?.message??error));}
}
const closure=JSON.parse(fs.readFileSync(closurePath,'utf8'));
const requested=[...new Set((closure.script?.branches??[]).flatMap(b=>Array.isArray(b.getPet)?b.getPet:b.getPet==null?[]:[b.getPet]).map(Number).filter(Number.isInteger))];
if(!requested.length)fail('no new-player GetPet IDs found in closure');

function sha256(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
function gitBlobSha(bytes){const header=Buffer.from('blob '+bytes.length+'\\0','utf8');return crypto.createHash('sha1').update(Buffer.concat([header,bytes])).digest('hex');}
function atoi(value){const m=String(value??'').trim().match(/^[+-]?\\d+/);return m?Number(m[0]):0;}
function clean(value){return String(value??'').trim();}
const enemyPath=path.join(root,'gmsv/data/enemy1.txt');
const basePath=path.join(root,'gmsv/data/enemybase1.txt');
const enemyBytes=fs.readFileSync(enemyPath);
const baseBytes=fs.readFileSync(basePath);
const enemySource={path:'gmsv/data/enemy1.txt',blobSha:gitBlobSha(enemyBytes),sha256:sha256(enemyBytes)};
const baseSource={path:'gmsv/data/enemybase1.txt',blobSha:gitBlobSha(baseBytes),sha256:sha256(baseBytes)};

const enemyRows=[];
for(const raw of enemyBytes.toString('utf8').replace(/\\r/g,'').split('\\n')){
  const line=raw.trim();if(!line||line.startsWith('#'))continue;
  const p=line.split(',');
  if(p.length<14)continue;
  const row={
    name:clean(p[0]),enemyId:atoi(p[3]),tempNo:atoi(p[4]),lvMin:atoi(p[5]),lvMax:atoi(p[6]),
    createMax:atoi(p[7]),createMin:atoi(p[8]),tactics:atoi(p[9]),exp:atoi(p[10]),duelPoint:atoi(p[11]),
    style:atoi(p[12]),petFlg:atoi(p[13]),source:{...enemySource,lineDigest:crypto.createHash('sha1').update(Buffer.from(raw)).digest('hex')}
  };
  if(requested.includes(row.enemyId))enemyRows.push(row);
}
const byEnemyId={};
for(const row of enemyRows){
  if(byEnemyId[String(row.enemyId)])fail('duplicate requested Enemy ID '+row.enemyId);
  if(row.petFlg!==1)fail('requested Enemy ID '+row.enemyId+' is not flagged as pet');
  byEnemyId[String(row.enemyId)]=row;
}
for(const id of requested)if(!byEnemyId[String(id)])fail('requested Enemy ID missing from enemy1: '+id);

const tempNos=[...new Set(enemyRows.map(x=>x.tempNo))];
const byTempNo={};
for(const raw of baseBytes.toString('utf8').replace(/\\r/g,'').split('\\n')){
  const line=raw.trim();if(!line||line.startsWith('#'))continue;
  const p=line.split(',');
  if(p.length<55)continue;
  const tempNo=atoi(p[6]);
  if(!tempNos.includes(tempNo))continue;
  const row={
    name:clean(p[0]),tempNo,
    initNum:atoi(p[7]),lvUpPoint:atoi(p[8]),
    baseStats:{vital:atoi(p[9]),str:atoi(p[10]),tgh:atoi(p[11]),dex:atoi(p[12])},
    modAi:atoi(p[13]),get:atoi(p[14]),
    elements:{earth:atoi(p[15]),water:atoi(p[16]),fire:atoi(p[17]),wind:atoi(p[18])},
    status:{poison:atoi(p[19]),paralysis:atoi(p[20]),sleep:atoi(p[21]),stone:atoi(p[22]),drunk:atoi(p[23]),confusion:atoi(p[24])},
    petSkills:Array.from({length:7},(_,i)=>atoi(p[25+i])),
    rare:atoi(p[32]),critical:atoi(p[33]),counter:atoi(p[34]),slot:atoi(p[35]),imageNumber:atoi(p[36]),petFlg:atoi(p[37]),
    limitLevel:atoi(p[54]),source:{...baseSource,lineDigest:crypto.createHash('sha1').update(Buffer.from(raw)).digest('hex')}
  };
  if(byTempNo[String(tempNo)])fail('duplicate requested EnemyBase TempNo '+tempNo);
  byTempNo[String(tempNo)]=row;
}
for(const id of requested){
  const tempNo=byEnemyId[String(id)].tempNo;
  if(!byTempNo[String(tempNo)])fail('EnemyBase template missing for Enemy ID '+id+' TempNo '+tempNo);
}
const catalog={
  format:'stoneage-new-player-pet-runtime-v1',
  generatedAt:'2026-09-30',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:fixedRef},
  buildFlags:{BATTLENPC_WARP_PLAYER:true,petMailEffectMax:1},
  sourceContracts:{
    eventGetPet:'gmsv/src/npc/npc_eventaction.c::NPC_ActionAddPet uses ENEMY_ID then ENEMY_createPetFromEnemyIndex',
    petFactory:'gmsv/src/char/enemy.c::ENEMY_createPetFromEnemyIndex stores ENEMY_TEMPNO in CHAR_PETID',
    enemyParser:'gmsv/src/char/enemy.c::ENEMY_initEnemy with _BATTLENPC_WARP_PLAYER => data columns begin at 4'
  },
  parser:{
    enemyColumns:{name:1,tacticsOption:2,actCondition:3,enemyId:4,tempNo:5,lvMin:6,lvMax:7,petFlg:14},
    enemyBaseColumns:{name:1,tempNo:7,initNum:8,lvUpPoint:9,baseVital:10,baseStr:11,baseTgh:12,baseDex:13,imageNumber:37,limitLevel:55},
    numericParser:'atoi semantics (e.g. 4.50 -> 4), matching fixed-C source',
    rngCallsPerPet:'1 level + 4 base + 10 allocation + 1 petMailEffect = 16'
  },
  petMaxHave:5,
  stats:{requestedEnemyIds:requested.length,resolvedEnemyIds:Object.keys(byEnemyId).length,resolvedTempNos:Object.keys(byTempNo).length},
  sourceFiles:{enemy:enemySource,enemyBase:baseSource},
  byEnemyId,
  byTempNo,
  policy:'Only source-backed new-player GetPet IDs are promoted; derived HP/MP compliance, rank and canonical persistent ID remain explicit/unresolved.'
};
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(catalog,null,2)+'\\n');
console.log(JSON.stringify({pass:true,stats:catalog.stats,enemySource,baseSource,output:out}));
