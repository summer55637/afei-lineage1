import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(source,name){
  const marker='function '+name+'(';
  const start=source.indexOf(marker);
  assert.ok(start>=0,'missing '+name);
  const ps=source.indexOf('(',start);
  let pd=0,pe=-1,q=null,esc=false,lc=false,bc=false;
  for(let i=ps;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(lc){if(c==='\n')lc=false;continue}
    if(bc){if(c==='*'&&n==='/'){bc=false;i++}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='\x60'){q=c;continue}
    if(c==='/'&&n==='/'){lc=true;i++;continue}
    if(c==='/'&&n==='*'){bc=true;i++;continue}
    if(c==='(')pd++; else if(c===')'&&--pd===0){pe=i;break}
  }
  const bs=source.indexOf('{',pe);let d=0;q=null;esc=false;lc=false;bc=false;
  for(let i=bs;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(lc){if(c==='\n')lc=false;continue}
    if(bc){if(c==='*'&&n==='/'){bc=false;i++}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='\x60'){q=c;continue}
    if(c==='/'&&n==='/'){lc=true;i++;continue}
    if(c==='/'&&n==='*'){bc=true;i++;continue}
    if(c==='{')d++; else if(c==='}'&&--d===0)return source.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

for(const [id,func,mp,option] of [
  [46,'PROFESSION_ENTWINE',13,'缠|成%40|敏%30|效%1|回%5'],
  [48,'PROFESSION_DRAGNET',11,'罗|成%30|效%1|回%2']
]){
  const row=runtime.bySkillId[String(id)];
  assert.ok(row);assert.equal(row.func,func);assert.equal(row.costMp,mp);
  assert.equal(row.option,option);assert.equal(row.commonCommand,id===46?'BATTLE_COM_S_ENTWINE':'BATTLE_COM_S_DRAGNET');
}

const sctx={};
vm.createContext(sctx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),sctx);
assert.equal(sctx.sourceProfessionBattleFunctionSupported('PROFESSION_ENTWINE'),true);
assert.equal(sctx.sourceProfessionBattleFunctionSupported('PROFESSION_DRAGNET'),true);

let statuses=new Map(),roll=1,dragnetCount=0,cancelCalls=0,logCalls=0;
const ctx={
  Math,Number,String,Object,Array,
  enemy:{sourceBattleTurn:7,units:[]},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(id)]||null,
  sourceProfessionStatusAttackCheck:(desc,success)=>({success:roll<success,roll,threshold:success,reason:roll<success?'hit':'roll'}),
  battleStatusApply:(desc,type,turns)=>{statuses.set(desc.unitId,{type,turns:turns+1});return true},
  sourceProfessionDragnetEnemyCount:()=>dragnetCount,
  sourceProfessionCancelEnemyCurrentCommand:(unit,type)=>{cancelCalls++;return {turn:7,statusType:type}},
  addLog:()=>{logCalls++}
};
vm.createContext(ctx);
for(const name of ['sourceProfessionStatusOptionInt','sourceProfessionHunterControlExecute'])vm.runInContext(extractFunction(game,name),ctx);

let target={id:901,name:'Enemy',quick:100,roundFixQuick:100,roundQuick:100};
let prepared={skillId:46,functionName:'PROFESSION_ENTWINE',toNo:10,attackSkillTier:5};
let result=ctx.sourceProfessionHunterControlExecute(target,prepared,'樹根纏繞');
assert.equal(result.success,60);
assert.equal(result.storedTurns,6);
assert.equal(result.dexPercent,50);
assert.equal(result.fixedDexBefore,100);
assert.equal(result.fixedDexAfter,50);
assert.equal(target.roundFixQuick,50);
assert.equal(target.roundQuick,100,'Entwine must not rebuild WORKQUICK');
assert.equal(result.nextPreCommandResetsEntwineDex,true);
assert.equal(cancelCalls,1);

dragnetCount=1;roll=31;
target={id:902,name:'Enemy2',quick:80,roundFixQuick:80,roundQuick:80};
prepared={skillId:48,functionName:'PROFESSION_DRAGNET',toNo:11,attackSkillTier:5};
result=ctx.sourceProfessionHunterControlExecute(target,prepared,'天羅地網');
assert.equal(result.baseSuccess,30);
assert.equal(result.dragnetBefore,1);
assert.equal(result.success,32);
assert.equal(result.applied,true);
assert.equal(result.storedTurns,3);

dragnetCount=2;roll=20;
target={id:903,name:'Enemy3',quick:80,roundFixQuick:80,roundQuick:80};
result=ctx.sourceProfessionHunterControlExecute(target,prepared,'天羅地網');
assert.equal(result.success,20);
assert.equal(result.applied,false,'strict roll < threshold means roll 20 misses threshold 20');

const check=extractFunction(game,'sourceProfessionStatusAttackCheck');
assert.ok(check.indexOf('const roll=cRand(1,100)')<check.indexOf('battleHasAnyStatus(targetDesc)'));
assert.ok(check.includes('roll<threshold'));

const canMove=extractFunction(game,'battleStatusCanMove');
assert.ok(canMove.includes("st.type==='dragnet'"));
assert.equal(canMove.includes("st.type==='entwine'"),false);

const hunter=extractFunction(game,'sourceProfessionHunterControlExecute');
assert.ok(hunter.includes("success=Math.trunc(success*.64)"));
assert.ok(hunter.includes("success=Math.trunc(success*.4)"));
assert.ok(hunter.includes("target.roundFixQuick=fixedDexAfter"));
assert.ok(!hunter.includes('target.roundQuick=fixedDexAfter'));

const enemyAction=extractFunction(game,'performEnemyAction');
assert.ok(enemyAction.includes('sourceProfessionEnemyCommandCancelled(unit)'));
assert.ok(enemyAction.includes('sourceProfessionCommandCancelled:true'));

assert.match(html,/PLAYABLE CORE V2\.40/);
assert.match(html,/V2\.40 live：[^<]*樹根纏繞[^<]*天羅地網/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
 pass:true,version:'V2.40',
 focus:'Skills 46/48 ENTWINE + DRAGNET fixed profession status-change lifecycle',
 skills:[46,48],
 sourceBugs:['ENTWINE stored status does not block CanMove','ENTWINE FIXDEX reduction is not reapplied after next PreCommand compliance'],
 dragnetDiminish:'1 => x0.64; 2+ => x0.4, C-int truncation',
 saveSchema:30
}));
