import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const readme=fs.readFileSync('README.md','utf8');
const changelog=fs.readFileSync('CHANGELOG.md','utf8');

function sliceFunction(name){
  const start=game.indexOf('function '+name+'(');
  assert.ok(start>=0,'missing '+name);
  const end=game.indexOf('\nfunction ',start+10);
  return game.slice(start,end>start?end:start+30000);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const acu=sliceFunction('sourceFinishAcupunctureReaction');
assert.ok(acu.includes('r.sourcePendingDeathCredit={unit:attackerDesc.unit,actors:[targetDesc],processed:false};'));
assert.equal(acu.includes('sourceMarkEnemyDeathCredit(attackerDesc.unit,[targetDesc]);'),false);

const trap=sliceFunction('sourceFinishProfessionTrapReaction');
assert.ok(trap.includes('r.sourcePendingDeathCredit={unit:attackerDesc.unit,actors:[targetDesc],processed:false};'));
assert.equal(trap.includes('sourceMarkEnemyDeathCredit(attackerDesc.unit,[targetDesc]);'),false);

const crush=sliceFunction('sourceBattleFinalizeItemCrushRng');
assert.ok(crush.includes('sourceFinalizePendingReactionDeathCredit(r);'));

const finalizer=sliceFunction('sourceFinalizePendingReactionDeathCredit');
assert.ok(finalizer.includes('pending.processed=true;'));
assert.ok(finalizer.includes('sourceMarkEnemyDeathCredit(unit,pending.actors||[]);'));

const creditCalls=[];
let rolls=0;
const ctx={
  Math,Number,Object,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  battleStatusHp:d=>Math.max(0,Math.trunc(Number(d?.unit?.hp??d?.pet?.hp??0))),
  battleStatusSetHp:(d,hp)=>{if(d?.unit)d.unit.hp=hp;if(d?.pet)d.pet.hp=hp;},
  sourceTrackDamageSubUltimate:()=>({}),
  sourceMarkEnemyDeathCredit:(unit,actors)=>{creditCalls.push({unit,actors});},
  battleStatusWakeOnDamage:()=>{},
  cRand:()=>{rolls++;return 42;},
  sourceUltimateMaxHp:()=>100,
  battleUltimateWork:new Map(),
  battleUltimateFlags:new Map(),
  sourceUltimateImmune:()=>false,
  addLog:()=>{}
};
vm.createContext(ctx);
vm.runInContext(sliceFunction('sourceFinalizePendingReactionDeathCredit'),ctx);
vm.runInContext(sliceFunction('sourceBattleFinalizeItemCrushRng'),ctx);
vm.runInContext(sliceFunction('sourceFinishAcupunctureReaction'),ctx);
vm.runInContext(sliceFunction('sourceFinishProfessionTrapReaction'),ctx);

const enemy={id:'enemy',name:'Enemy',hp:4};
const player={kind:'player'};
const acuReaction={
  triggered:true,
  attackerDesc:{kind:'enemy',unit:enemy,unitId:enemy.id},
  targetDesc:player,
  r:{damage:8},
  fullDamage:8,
  reflectedDamage:4
};
ctx.sourceFinishAcupunctureReaction(acuReaction);
assert.equal(enemy.hp,0);
assert.equal(creditCalls.length,0,'death credit must not be granted before ItemCrush');
ctx.sourceBattleFinalizeItemCrushRng(acuReaction.r);
assert.equal(rolls,1);
assert.equal(creditCalls.length,1);
assert.equal(creditCalls[0].unit,enemy);
ctx.sourceBattleFinalizeItemCrushRng(acuReaction.r);
assert.equal(creditCalls.length,1,'pending credit must be idempotent after ItemCrush');

const enemy2={id:'enemy2',name:'Enemy2',hp:3};
const trapReaction={
  triggered:true,
  attackerDesc:{kind:'enemy',unit:enemy2,unitId:enemy2.id},
  targetDesc:player,
  r:{damage:9},
  trapDamage:3
};
ctx.sourceFinishProfessionTrapReaction(trapReaction);
assert.equal(enemy2.hp,0);
assert.equal(creditCalls.length,1);
ctx.sourceBattleFinalizeItemCrushRng(trapReaction.r);
assert.equal(rolls,2);
assert.equal(creditCalls.length,2);
assert.equal(creditCalls[1].unit,enemy2);

assert.match(html,/PLAYABLE CORE V3\.08/);
assert.match(readme,/PLAYABLE CORE V3\.08/);
assert.match(readme,/V3\.08 — reaction death credit waits for ItemCrush boundary/);
assert.match(changelog,/V3\.08：Trap／Acupuncture 反傷 attacker death credit 改到 ItemCrush 後/);

console.log(JSON.stringify({
  pass:true,
  version:'V3.08',
  pendingReactionDeathCredit:true,
  itemCrushBeforeCredit:true,
  idempotent:true
}));
