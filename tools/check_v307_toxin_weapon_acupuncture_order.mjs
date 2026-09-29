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

const friendly=sliceFunction('applyFriendlyEnemyHit');
assert.ok(friendly.includes("sourceAcupunctureWakeTarget==='actual'"));
assert.ok(friendly.includes("wakeTarget==='actual'?targetDesc"),
  'caller-sensitive selector must support actual/Guardian WakeUp');

const toxin=sliceFunction('sourceProfessionToxinWeaponExecute');
assert.ok(toxin.includes("r.sourceAcupunctureWakeTarget='actual';"),
  'Toxin Weapon must preserve actual defindex WakeUp order');
assert.ok(toxin.includes("sourceAcupunctureWakeTarget:'actual'"),
  'Toxin Weapon caller must explicitly request actual-target WakeUp');

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
  battleStatusSetHp:()=>{},
  sourceTrackDamageSubUltimate:()=>({}),
  sourceFinishAcupunctureReaction:()=>{},
  battleStatusWakeOnDamage:(desc,damage)=>wakeTargets.push({desc,damage}),
  sourcePlayerSuitPoisonAfterPhysicalHit:()=>null,
  sourceBattleFinalizeItemCrushRng:()=>null,
  sourceProcessBattleDeathsAtAddProfit:()=>{},
  sourceMarkEnemyDeathCredit:()=>{},
  addLog:()=>{},
  sourceLogAcupunctureReaction:()=>{},
  n:v=>Number.isFinite(Number(v))?Number(v):0
};
vm.createContext(ctx);
vm.runInContext(friendly,ctx);

const original={id:'original',name:'Original'};
const guardian={id:'guardian',name:'Guardian'};
const baseR={actualTarget:guardian,guardian,damage:7,dodged:false,miss:false,critical:false};

ctx.applyFriendlyEnemyHit('player','你',original,Object.assign({},baseR));
assert.equal(wakeTargets.at(-1).desc.unit.id,'original');

ctx.applyFriendlyEnemyHit(
  'player','你',original,
  Object.assign({},baseR,{sourceAcupunctureWakeTarget:'actual'}),
  null,
  {sourceAcupunctureWakeTarget:'actual'}
);
assert.equal(wakeTargets.at(-1).desc.unit.id,'guardian');

console.log(JSON.stringify({
  pass:true,
  version:'V3.07',
  toxinWeaponWakeUpTarget:'actual-defindex',
  primaryWakeUpTarget:'original-defender',
  specialAttackDamageWakeUpTarget:'attacker'
}));
