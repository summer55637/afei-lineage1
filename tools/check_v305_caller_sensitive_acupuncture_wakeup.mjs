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
assert.ok(friendly.includes("const wakeTarget=acupuncture.triggered"));
assert.ok(friendly.includes("options.sourceAcupunctureWakeTarget==='attacker'"));
assert.ok(friendly.includes("r?.sourceAcupunctureWakeTarget==='attacker'"));
assert.ok(friendly.includes("wakeTarget==='attacker'?attackerDesc"));
assert.ok(friendly.includes("wakeTarget==='original'?originalTargetDesc"));

const petCalc=sliceFunction('sourcePetAttackDamageCalcOnlyGuardianResult');
assert.ok(petCalc.includes("r.sourceAcupunctureWakeTarget='attacker';"),
  'Pet BATTLE_S_AttackDamage caller must keep attacker as Acupuncture WakeUp target');

const enemyCalc=sliceFunction('resolveEnemyAttackSeqBugToPlayer');
assert.ok(enemyCalc.includes("r.sourceAcupunctureWakeTarget='attacker';"),
  'Enemy special AttackDamage-family Player caller must keep attacker as Acupuncture WakeUp target');

const enemyPet=sliceFunction('enemyApplySkillHit');
assert.ok(enemyPet.includes("r?.sourceAcupunctureWakeTarget==='attacker'"),
  'Enemy special caller must honor caller-specific Acupuncture WakeUp target');

const professionStart=game.indexOf("if(prepared.functionName==='PROFESSION_CHAIN_ATK'){");
const professionEnd=game.indexOf("\n  if(prepared.functionName==='PROFESSION_BRUST')",professionStart);
const professionBranch=game.slice(professionStart,professionEnd);
assert.ok(professionBranch.includes("sourceAcupunctureWakeTarget:\n        prepared.functionName==='PROFESSION_CHAIN_ATK'?'attacker':null"),
  'profession CHAIN_ATK must explicitly retain attacker WakeUp ordering');

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
  sourcePrepareProfessionTrapReaction:()=>({triggered:false}),
  sourcePetOriginalDamageReact:()=>false,
  n:v=>Number.isFinite(Number(v))?Number(v):0
};
vm.createContext(ctx);
vm.runInContext(friendly,ctx);

const original={kind:'enemy',unit:{id:'original'}};
const guardian={kind:'enemy',unit:{id:'guardian'}};
const baseR={actualTarget:guardian,guardian,damage:7,dodged:false,miss:false,critical:false};
ctx.applyFriendlyEnemyHit('player','你',original,Object.assign({},baseR));
assert.equal(wakeTargets.at(-1).desc.unit.id,'original');

ctx.applyFriendlyEnemyHit(
  'player','你',
  original,
  Object.assign({},baseR,{sourceAcupunctureWakeTarget:'attacker'}),
  null,
  {sourceAcupunctureWakeTarget:'attacker'}
);
assert.equal(wakeTargets.at(-1).desc.kind,'player');
assert.equal(wakeTargets.at(-1).desc.unit,undefined);

console.log(JSON.stringify({
  pass:true,
  version:'V3.05',
  primaryBATTLEAttackWakeUp:'original-defender',
  specialBattleSAttackDamageWakeUp:'attacker',
  professionChainAtkWakeUp:'attacker',
  counterWakeUp:'attacker',
  noGlobalWakeUpRule:true
}));
