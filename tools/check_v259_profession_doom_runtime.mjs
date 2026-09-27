import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const workflow=fs.readFileSync('.github/workflows/generate-item-make-runtime.yml','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(src,name){
  const sig='function '+name+'(';const i=src.indexOf(sig);assert.ok(i>=0,'missing '+name);
  const op=src.indexOf('(',i);let pd=0,q=null,esc=false,line=false,block=false,cp=-1;
  for(let p=op;p<src.length;p++){const c=src[p],nx=src[p+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&nx==='/'){block=false;p++}continue}
    if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){line=true;p++;continue}
    if(c==='/'&&nx==='*'){block=true;p++;continue}
    if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue}
    if(c==='(')pd++;else if(c===')'&&--pd===0){cp=p;break}
  }
  assert.ok(cp>=0,'bad signature '+name);
  const bs=src.indexOf('{',cp);let d=0;q=null;esc=false;line=false;block=false;
  for(let p=bs;p<src.length;p++){const c=src[p],nx=src[p+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&nx==='/'){block=false;p++}continue}
    if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){line=true;p++;continue}
    if(c==='/'&&nx==='*'){block=true;p++;continue}
    if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue}
    if(c==='{')d++;else if(c==='}'&&--d===0)return src.slice(i,p+1);
  }
  throw new Error('unterminated '+name);
}

const row=runtime.bySkillId['3'];
assert.ok(row);
assert.equal(row.name,'世界末日');
assert.equal(row.func,'PROFESSION_DOOM');
assert.equal(row.option,'无|1|1|320|240|1000|4700|0|320|240');
assert.equal(row.professionClass,2);
assert.equal(row.target,3);
assert.equal(row.kind,3);
assert.equal(row.costMp,10);
assert.equal(row.img1,101697);
assert.equal(row.img2,101640);
assert.equal(row.commonCommand,'BATTLE_COM_S_DOOM');

const supportCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_DOOM',3),true);

const levelM=level=>{
  level=Math.trunc(Number(level)||0);
  if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;
  if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;
};
const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionMagicLevelM:levelM};
vm.createContext(costCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [level,cost] of [[10,50],[40,50],[50,100],[80,100],[90,150],[100,150]]){
  const x=costCtx.sourceProfessionMagicCostPlan('PROFESSION_DOOM',level,row.option);
  assert.equal(x.dynamic,true);
  assert.equal(x.cost,cost);
}

const practiceCtx={
  Math,Number,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:levelM,
  sourcePlayerProfessionMagicSuitPower:()=>({mPower:0,m2Power:0}),
  state:{},
  cRand:(a,b)=>a===0&&b===99?99:a===98&&b===102?100:100
};
vm.createContext(practiceCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicPracticePower'),practiceCtx);
for(const [level,power] of [[20,200],[30,250],[50,300],[70,350],[80,400],[90,450],[100,550]]){
  const x=practiceCtx.sourceProfessionMagicPracticePower('BATTLE_COM_S_DOOM',level,100);
  assert.equal(x.power,power);
  assert.equal(x.mpPower,0);
  assert.equal(x.varianceRoll,100);
}

const targetCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,cRand:()=>0};
vm.createContext(targetCtx);
vm.runInContext(extractFunction(game,'sourceProfessionDoomTargetCount'),targetCtx);
vm.runInContext(extractFunction(game,'sourceProfessionDoomSelectSlots'),targetCtx);
for(const [tier,count] of [[1,2],[2,2],[3,4],[4,4],[5,6],[6,6],[7,8],[8,10],[10,10]]){
  assert.equal(targetCtx.sourceProfessionDoomTargetCount(tier),count);
}
let draw=[0,0,1,2,3,4,5],drawCalls=[];
let selection=targetCtx.sourceProfessionDoomSelectSlots(
  [13,11,10,12,14,18,16,15,17,19],5,
  {randInclusive:(a,b)=>{drawCalls.push([a,b]);return draw.shift();}}
);
assert.deepEqual(Array.from(selection.slots),[13,11,10,12,14,18]);
assert.deepEqual(Array.from(selection.rolls),[0,0,1,2,3,4,5]);
assert.equal(selection.getNum,6);
assert.equal(selection.sourceCount,10);
assert.deepEqual(drawCalls,Array(7).fill([0,9]));

let noDraws=0;
selection=targetCtx.sourceProfessionDoomSelectSlots(
  [13,11,10,12,14,18,16,15,17,19],8,
  {randInclusive:()=>{noDraws++;return 0;}}
);
assert.equal(noDraws,0);
assert.deepEqual(Array.from(selection.slots),[13,11,10,12,14,18,16,15,17,19]);

const dexCtx={
  Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,
  battleDexRoll:()=>999,sourceCRandMacroValue:()=>0
};
vm.createContext(dexCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleDexRoll'),dexCtx);
let dexArgs=null;
const dex=dexCtx.sourceProfessionBattleDexRoll(
  {commonCommand:'BATTLE_COM_S_DOOM'},80,
  {randMacro:(a,b)=>{dexArgs=[a,b];return 20.3;}}
);
assert.deepEqual(dexArgs,[0.3,60]);
assert.equal(dex,79);

const dodgeQueue=[],dodgeCalls=[];
const dodgeCtx={
  Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,
  enemyUnitHidden:()=>false,
  sourceProfessionPlayerMagicProficiencyVector:()=>({fire:25,ice:25,thunder:25}),
  cRand:(a,b)=>{dodgeCalls.push([a,b]);return dodgeQueue.shift();}
};
vm.createContext(dodgeCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicEnemyDodge'),dodgeCtx);
dodgeQueue.push(1,89);dodgeCalls.length=0;
let dodge=dodgeCtx.sourceProfessionMagicEnemyDodge({hp:100,level:1},{magicType:-1,command:'BATTLE_COM_S_DOOM'});
assert.equal(dodge.miss,false);
assert.equal(dodge.secondRoll,89);
assert.deepEqual(dodgeCalls,[[1,100],[1,100]]);
dodgeQueue.push(1,90);dodgeCalls.length=0;
dodge=dodgeCtx.sourceProfessionMagicEnemyDodge({hp:100,level:1},{magicType:-1,command:'BATTLE_COM_S_DOOM'});
assert.equal(dodge.miss,true);
assert.equal(dodge.secondRoll,90);

const fearCtx={
  Math,Number,Map,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  battleProfessionDoomFearStates:new Map(),
  battleStatusKey:d=>d?.kind==='enemy'?'enemy:'+d.unitId:d?.kind==='player'?'player':null
};
vm.createContext(fearCtx);
for(const fn of ['sourceProfessionDoomFearState','sourceProfessionDoomFearApply','sourceProfessionDoomFearStatusSeq','sourceProfessionDoomFearAdjusted']){
  vm.runInContext(extractFunction(game,fn),fearCtx);
}
const fearDesc={kind:'enemy',unitId:'e1'};
let fear=fearCtx.sourceProfessionDoomFearApply(fearDesc);
assert.equal(fear.applied,true);
assert.equal(fear.turns,4);
let adjusted=fearCtx.sourceProfessionDoomFearAdjusted(fearDesc,120,220,140,100,200,100);
assert.equal(adjusted.active,true);
assert.equal(adjusted.attack,110);
assert.equal(adjusted.defense,200);
assert.equal(adjusted.quick,120);
let tick=fearCtx.sourceProfessionDoomFearStatusSeq(fearDesc);
assert.equal(tick.beforeTurns,4);assert.equal(tick.turns,3);assert.equal(tick.expired,false);
fearCtx.sourceProfessionDoomFearStatusSeq(fearDesc);
fearCtx.sourceProfessionDoomFearStatusSeq(fearDesc);
tick=fearCtx.sourceProfessionDoomFearStatusSeq(fearDesc);
assert.equal(tick.turns,0);assert.equal(tick.expired,true);
assert.equal(fearCtx.sourceProfessionDoomFearState(fearDesc),null);

const animCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(animCtx);
vm.runInContext(extractFunction(game,'sourceProfessionDoomAnimation'),animCtx);
let anim=animCtx.sourceProfessionDoomAnimation(row,21);
assert.equal(anim.magicType,-1);assert.equal(anim.attIdx,3);
assert.equal(anim.img1,101697);assert.equal(anim.img2,101640);
assert.equal(anim.showType,1);assert.equal(anim.showBehind,1);
assert.equal(anim.x,320);assert.equal(anim.y,240);
assert.equal(anim.shakeStart,1000);assert.equal(anim.shakeEnd,4700);assert.equal(anim.disappear,0);
anim=animCtx.sourceProfessionDoomAnimation(row,20);
assert.equal(anim.img2,101639);assert.equal(anim.x,320);assert.equal(anim.y,240);

const dead={id:'dead',name:'dead',battleSlot:0,hp:100,level:1,mp:0,maxMp:0};
const live={id:'live',name:'live',battleSlot:1,hp:500,level:1,mp:0,maxMp:0};
let unusedRolls=0,wakes=[];
const execCtx={
  Math,Number,String,Object,Array,Map,
  state:{hp:100,maxHp:100,mp:100,maxMp:100},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  battleProfessionDoomFearStates:new Map(),
  battleStatusKey:d=>d?.kind==='enemy'?'enemy:'+String(d.unit?.id??d.unitId):null,
  sourceProfessionPlayerMagicSameSide:()=>false,
  sourceSetMagicPetMultiList:()=>({ok:true,toNo:21,slots:[10,11],fallback:false,rolls:[]}),
  sourceProfessionMagicEnemySortedSlots:s=>s.slice(),
  sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(id)]||null,
  sourceProfessionDoomAnimation:()=>({magicType:-1,attIdx:3,img1:101697,img2:101640,x:320,y:240}),
  sourceProfessionMagicPracticePower:()=>({power:200,mpPower:0,skillLevel:10,criticalRoll:100,m2Roll:99,varianceRoll:100}),
  sourceProfessionDoomSelectSlots:s=>({slots:s.slice(),rolls:[],getNum:10,sourceCount:s.length}),
  sourceProfessionEnemyByBattleSlot:s=>s===10?dead:live,
  sourceProfessionMagicEnemyDodge:()=>({miss:false,roll:1,threshold:0,secondRoll:1}),
  sourceProfessionPlayerMagicProficiencyVector:()=>({fire:0,ice:0,thunder:0}),
  sourceProfessionMagicPreDamagePower:p=>p,
  sourceProfessionMagicGetDamage:o=>o.power,
  cRand:(a,b)=>{unusedRolls++;assert.deepEqual([a,b],[1,100]);return 77;},
  sourceMarkEnemyDeathCredit:()=>{},
  sourceProfessionDoomFearApply:null,
  sourceProfessionMagicWakeTarget:t=>{wakes.push(t.id);return true;},
  syncEnemyTarget:()=>{},
  addLog:()=>{}
};
vm.createContext(execCtx);
vm.runInContext(extractFunction(game,'sourceProfessionDoomFearApply'),execCtx);
vm.runInContext(extractFunction(game,'sourceProfessionDoomExecute'),execCtx);
const out=execCtx.sourceProfessionDoomExecute(
  {skillId:3,functionName:'PROFESSION_DOOM',toNo:21,displayLevel:100},
  '世界末日'
);
assert.equal(unusedRolls,2);
assert.equal(dead.hp,0);assert.equal(live.hp,300);
assert.deepEqual(Array.from(out.hits,x=>x.targetUnitId),['dead','live']);
assert.deepEqual(Array.from(out.fears,x=>x.targetUnitId),['live']);
assert.equal(execCtx.battleProfessionDoomFearStates.has('enemy:dead'),false);
assert.equal(execCtx.battleProfessionDoomFearStates.get('enemy:live').turns,4);
assert.deepEqual(wakes,['dead','live']);
assert.equal(out.sourceDoomChargeBlockCommentedOut,true);

const active=extractFunction(game,'sourceProfessionDoomExecute');
assert.ok(active.indexOf('sourceProfessionMagicPracticePower')<active.indexOf('sourceProfessionDoomSelectSlots'));
assert.ok(active.indexOf('sourceProfessionDoomSelectSlots')<active.indexOf('sourceProfessionMagicEnemyDodge'));
assert.ok(active.indexOf('sourceProfessionMagicEnemyDodge')<active.indexOf('const unusedChangeStatusRoll=cRand(1,100)'));
assert.ok(active.indexOf('target.hp=Math.max(0,before-damage)')<active.indexOf('sourceProfessionDoomFearApply'));
assert.ok(active.indexOf('sourceProfessionDoomFearApply')<active.indexOf('sourceProfessionMagicWakeTarget'));
assert.ok(active.includes('sourceTargetDoomStatusCaseCommentedOut:true'));

const enemyPrepare=extractFunction(game,'enemyPrepareRoundAction');
assert.ok(enemyPrepare.indexOf('sourceMagicPetAdjusted')<enemyPrepare.indexOf('sourceProfessionDoomFearAdjusted'));
assert.ok(enemyPrepare.indexOf('sourceProfessionDoomFearAdjusted')<enemyPrepare.indexOf('if(weakened)'));
assert.ok(enemyPrepare.includes('unit.roundDoomFearApplied=doomFear.active'));

const status=extractFunction(game,'processBattleStatusTurn');
assert.ok(status.includes('const professionDoomFear=sourceProfessionDoomFearStatusSeq(desc)'));
assert.ok(status.includes('extra.professionDoomFear=professionDoomFear'));

const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battleProfessionDoomFearStates=new Map()'));

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("prepared.functionName==='PROFESSION_DOOM'"));
assert.ok(dispatcher.includes('sourceProfessionDoomExecute(prepared,magicName)'));
assert.ok(dispatcher.indexOf("prepared.functionName==='PROFESSION_DOOM'")<dispatcher.indexOf('if(toNo<10)'));

assert.ok(workflow.includes('"tools/check_v259_profession_doom_runtime.mjs"'));
assert.ok(workflow.includes('Run V2.59 DOOM regression'));
for(const v of ['2.58','2.59'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.59 live：[^<]*世界末日/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.59-core',focus:'Skill 3 DOOM',
  mp:'tier1-4=50, tier5-8=100, tier9-10=150',
  target:'SortLoc then 2/4/6/8/10 unique rejection-loop draws',
  dodge:'base Enemy dodge then RAND(1,100)<90',
  fear:'tier10 hit+alive targets: independent raw CHAR_WORKFEAR=4; compliance subtracts base 10/10/20',
  charge:'source DOOMTIME no-action branch is commented out',
  saveSchema:30
}));
