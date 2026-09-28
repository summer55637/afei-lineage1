import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const readme=fs.readFileSync('README.md','utf8');
const changelog=fs.readFileSync('CHANGELOG.md','utf8');
const docs=fs.readFileSync('docs/changelog/part-07-v1.75-onward.md','utf8');

function sliceFunction(name){
  const start=game.indexOf('function '+name+'(');
  assert.ok(start>=0,'missing '+name);
  const end=game.indexOf('\nfunction ',start+10);
  return game.slice(start,end>start?end:start+30000);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const queue=sliceFunction('sourceQueuePendingDeathCredit');
const finalizer=sliceFunction('sourceFinalizePendingReactionDeathCredit');
const crush=sliceFunction('sourceBattleFinalizeItemCrushRng');
const comboApply=sliceFunction('sourceComboApplyDamage');
const comboAcu=sliceFunction('sourceComboAcupunctureSegment');
const acu=sliceFunction('sourceFinishAcupunctureReaction');
const combo=sliceFunction('sourcePerformCombo');

assert.ok(comboApply.includes('sourceQueuePendingDeathCredit(lastResult||{},target.unit,rewardActors);'));
assert.equal(comboApply.includes('sourceMarkEnemyDeathCredit(target.unit,rewardActors);'),false);
assert.ok(comboAcu.includes('sourceQueuePendingDeathCredit(r,target.unit,rewardActors);'));
assert.equal(comboAcu.includes('sourceMarkEnemyDeathCredit(target.unit,rewardActors);'),false);
assert.ok(queue.includes('r.sourcePendingDeathCredit=pending;'));
assert.ok(queue.includes('r.sourcePendingDeathCredits.push(pending);'));
assert.ok(finalizer.includes('Array.isArray(r.sourcePendingDeathCredits)'));
assert.ok(finalizer.includes('pendings.sort((a,b)=>'));
assert.ok(finalizer.includes('sourceBattleStatusSlot({kind:\'enemy\',unit:a?.unit})'));
assert.ok(finalizer.includes('sourceMarkEnemyDeathCredit(unit,pending.actors||[]);'));
assert.ok(crush.includes('sourceFinalizePendingReactionDeathCredit(r);'));
assert.ok(combo.includes('const lastComboResult=hits[hits.length-1]?.r||{ultimateCriticalEnemyOnly:true};'));
assert.ok(combo.includes('lastComboResult.ultimateCriticalEnemyOnly=true;'));
assert.ok(combo.includes('sourceBattleFinalizeItemCrushRng(lastComboResult);'));

const itemCrushPos=combo.indexOf('sourceBattleFinalizeItemCrushRng');
const addProfitPos=combo.indexOf('sourceProcessBattleDeathsAtAddProfit');
assert.ok(itemCrushPos>=0&&addProfitPos>itemCrushPos,'Combo ItemCrush must precede AddProfit-side death processing');

const creditCalls=[];
let rolls=0;
const ctx={
  Math,Number,Object,Array,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  battleStatusHp:d=>Math.max(0,Math.trunc(Number(d?.unit?.hp??d?.pet?.hp??0))),
  battleStatusSetHp:(d,hp)=>{if(d?.unit)d.unit.hp=hp;else if(d?.pet)d.pet.hp=hp;},
  sourceTrackDamageSubUltimate:()=>({}),
  sourceMarkEnemyDeathCredit:(unit,actors)=>{creditCalls.push({unit,actors});unit.sourceRewardProcessed=true;},
  sourceBattleStatusSlot:d=>d?.unit?10+Number(d.unit.battleSlot??0):(d?.kind==='player'?0:5),
  battleStatusWakeOnDamage:()=>{},
  cRand:()=>{rolls++;return 42;},
  sourceUltimateMaxHp:()=>100,
  battleUltimateWork:new Map(),
  battleUltimateFlags:new Map(),
  sourceUltimateImmune:()=>false,
  battleStatusActorDesc:actor=>actor?.kind==='enemy'
    ?{kind:'enemy',unit:actor.unit,unitId:actor.unitId}
    :(actor?.kind==='player'?{kind:'player'}:actor?.kind==='pet'?{kind:'pet',pet:actor.pet,petId:actor.petId}:null),
  sourcePrepareProfessionTrapReaction:()=>({triggered:false}),
  sourcePrepareAcupunctureReaction:(attackerDesc,targetDesc,r)=>({
    triggered:true,targetUnit:null,targetPet:null,attackerDesc,targetDesc,r,
    fullDamage:r.damage,reflectedDamage:3,counter:false
  }),
  sourceLogAcupunctureReaction:()=>{},
  addLog:()=>{}
};
vm.createContext(ctx);
for(const fn of [queue,finalizer,crush,acu,comboApply,comboAcu])vm.runInContext(fn,ctx);

const normalEnemy={id:'combo-normal',name:'ComboNormal',hp:4,battleSlot:3};
const normalR={damage:8};
ctx.sourceComboApplyDamage(
  {kind:'enemy',unit:normalEnemy,unitId:normalEnemy.id},
  8,
  normalR,
  [{kind:'player'}]
);
assert.equal(normalEnemy.hp,0);
assert.equal(creditCalls.length,0,'normal Combo death credit must wait for ItemCrush');
ctx.sourceBattleFinalizeItemCrushRng(normalR);
assert.equal(rolls,1);
assert.equal(creditCalls.length,1);
assert.equal(creditCalls[0].unit,normalEnemy);
ctx.sourceBattleFinalizeItemCrushRng(normalR);
assert.equal(creditCalls.length,1,'normal Combo pending credit must be idempotent');

const target={id:'combo-target',name:'ComboTarget',hp:4,battleSlot:2};
const attacker={id:'combo-attacker',name:'ComboAttacker',hp:3,battleSlot:7};
const reactionR={damage:6};
ctx.sourceComboAcupunctureSegment(
  {kind:'enemy',unit:attacker,unitId:attacker.id},
  {kind:'enemy',unit:target,unitId:target.id},
  reactionR,
  [{kind:'enemy',unitId:attacker.id}]
);
assert.equal(target.hp,0);
assert.equal(attacker.hp,0);
assert.equal(creditCalls.length,1,'Acupuncture Combo must hold both deaths until ItemCrush');
assert.ok(reactionR.sourcePendingDeathCredit);
assert.ok(Array.isArray(reactionR.sourcePendingDeathCredits));
assert.equal(reactionR.sourcePendingDeathCredits.length,1);
ctx.sourceBattleFinalizeItemCrushRng(reactionR);
assert.equal(rolls,2);
assert.equal(creditCalls.length,3,'ItemCrush finalization must release both Combo enemy death credits');
assert.equal(creditCalls[1].unit,target,'C AddProfit scan is Entry-slot order');
assert.equal(creditCalls[2].unit,attacker,'C AddProfit scan is Entry-slot order');
ctx.sourceBattleFinalizeItemCrushRng(reactionR);
assert.equal(creditCalls.length,3,'combined pending Combo credits must be idempotent');

assert.match(html,/PLAYABLE CORE V3\.09/);
assert.match(readme,/PLAYABLE CORE V3\.09/);
assert.match(readme,/V3\.09 — Combo death credit waits for ItemCrush boundary/);
assert.match(changelog,/V3\.09：Combo 死亡獎勵 credit 延後到 ItemCrush 後/);
assert.match(docs,/## V3\.09 Combo death credit waits for ItemCrush boundary/);

console.log(JSON.stringify({
  pass:true,
  version:'V3.09',
  comboNormalDeathPending:true,
  comboReactionDoubleDeathPending:true,
  itemCrushBeforeCredit:true,
  entrySlotOrder:true,
  idempotent:true
}));
