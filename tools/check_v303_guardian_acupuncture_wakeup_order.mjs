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
  return game.slice(start,end>start?end:start+26000);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const hit=sliceFunction('applyFriendlyEnemyHit');
assert.ok(hit.includes('const originalTargetDesc={kind:\'enemy\',unit:target,unitId:target.id};'));
assert.ok(hit.includes('const wakeDesc=acupuncture.triggered?originalTargetDesc:targetDesc;'),
  'primary Acupuncture must WakeUp original defNo even when Guardian is actual defender');
assert.equal(
  hit.includes('battleStatusWakeOnDamage(targetDesc,r.damage);'),
  false,
  'ordinary primary caller must not WakeUp Guardian after Acupuncture'
);

const wakeTargets=[];
const ctx={
  Math,Number,Object,
  state:{petBox:[]},
  sourcePreAttackDamageReactCounterBlock:()=>{},
  sourceBattleDamageReactActive:()=>false,
  battleStatusActorDesc:()=>null,
  battleStatusDescName:d=>d?.unit?.name||'target',
  sourcePrepareProfessionTrapReaction:()=>({triggered:false}),
  sourcePrepareAcupunctureReaction:()=>({triggered:true}),
  battleStatusHp:()=>10,
  sourceTrackDamageSubUltimate:()=>({}),
  sourceFinishAcupunctureReaction:()=>{},
  battleStatusWakeOnDamage:(desc,damage)=>wakeTargets.push({desc,damage}),
  sourcePlayerSuitPoisonAfterPhysicalHit:()=>null,
  sourceBattleFinalizeItemCrushRng:()=>null,
  addLog:()=>{},
  sourceLogAcupunctureReaction:()=>{},
  sourceMarkEnemyDeathCredit:()=>{},
  n:v=>Number.isFinite(Number(v))?Number(v):0
};
vm.createContext(ctx);
vm.runInContext(sliceFunction('applyFriendlyEnemyHit'),ctx);

const original={id:'original',name:'Original'};
const guardian={id:'guardian',name:'Guardian'};
const r={actualTarget:guardian,guardian,damage:7,dodged:false,miss:false,critical:false};
ctx.applyFriendlyEnemyHit('player','你',original,r,null,{});
assert.equal(wakeTargets.length,1);
assert.equal(wakeTargets[0].desc.unit.id,'original');
assert.equal(wakeTargets[0].damage,7);

console.log(JSON.stringify({
  pass:true,
  version:'V3.03',
  scenario:'Guardian itself owns Acupuncture',
  primaryWakeUpTarget:'original-defender',
  noSecondWakeUp:true
}));
