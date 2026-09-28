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

const hit=sliceFunction('battleApplyPhysicalHit');
assert.ok(hit.includes('const wakeDesc=acupuncture.triggered?(r?.originalTargetDesc||targetDesc):targetDesc;'),
  'Enemy->Player Guardian Acupuncture must prefer the fixed original defNo WakeUp descriptor');
assert.ok(hit.includes('if(!(counter&&acupuncture.triggered))battleStatusWakeOnDamage(wakeDesc,r.damage);'));

const resolver=sliceFunction('resolveEnemyDirectAttackToPlayer');
assert.ok(resolver.includes("r.originalTargetDesc={kind:'player'};'),
  'Enemy->Player resolver must retain original target descriptor for post-DamageSub WakeUp');

const wakeTargets=[];
const ctx={
  Math,Number,Object,
  state:{petBox:[]},
  sourcePreAttackDamageReactCounterBlock:()=>{},
  sourceBattleDamageReactActive:()=>false,
  battleStatusDescName:d=>d?.unit?.name||d?.pet?.name||'target',
  sourcePrepareProfessionTrapReaction:()=>({triggered:false}),
  sourcePrepareAcupunctureReaction:()=>({triggered:true}),
  battleStatusHp:()=>10,
  sourceTrackDamageSubUltimate:()=>({}),
  sourceFinishAcupunctureReaction:()=>{},
  battleStatusWakeOnDamage:(desc,damage)=>wakeTargets.push({desc,damage}),
  sourcePlayerSuitPoisonAfterPhysicalHit:()=>null,
  sourceBattleFinalizeItemCrushRng:()=>null,
  sourceProcessBattleDeathsAtAddProfit:()=>{},
  sourceMarkEnemyDeathCredit:()=>{},
  addLog:()=>{},
  sourceLogAcupunctureReaction:()=>{},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  playerBattleView:()=>({kind:'player'}),
  battlePetAcupunctureIds:new Set()
};
vm.createContext(ctx);
vm.runInContext(sliceFunction('battleApplyPhysicalHit'),ctx);

const originalPlayer={kind:'player'};
const guardianPet={kind:'pet',pet:{id:'guardian',name:'Guardian'},petId:'guardian'};
const r={
  originalTargetDesc:originalPlayer,
  actualTargetDesc:guardianPet,
  damage:7,dodged:false,miss:false,critical:false
};

ctx.battleApplyPhysicalHit(
  {kind:'enemy',unit:{id:'enemy',name:'Enemy'}},
  guardianPet,
  r
);

assert.equal(wakeTargets.length,1);
assert.equal(wakeTargets[0].desc.kind,'player');
assert.equal(wakeTargets[0].damage,7);

console.log(JSON.stringify({
  pass:true,
  version:'V3.04',
  scenario:'Enemy -> Player Guardian Pet owns Acupuncture',
  primaryWakeUpTarget:'original-player',
  noSecondWakeUp:true
}));
