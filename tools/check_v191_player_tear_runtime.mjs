import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

const expected={
  615:'20',
  616:'50',
  651:'150',
  656:'70'
};
for(const [id,opt] of Object.entries(expected)){
  const row=runtime.byId[id];
  assert.equal(row?.f,'PETSKILL_BattleTearDamage');
  assert.equal(row?.o,opt);
  assert.equal(Number(row?.target),1);
  assert.equal(Number(row?.illegal),0);
}

const tearStart=game.indexOf('function sourcePerformPetTearSkill');
const sonicStart=game.indexOf('function sourcePerformPetSonicSkill',tearStart);
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction',sonicStart);
assert.ok(tearStart>=0&&sonicStart>tearStart&&loyalStart>sonicStart);
const tear=game.slice(tearStart,sonicStart);

// PETSKILL_Use work-power writes happen before battle.c executes TargetAdjust.
assert.ok(tear.includes('const attack=Math.trunc(baseAttack*.9)'));
assert.ok(tear.includes('const defense=Math.trunc(baseDefense*.8)'));
assert.ok(tear.includes('battlePetPowerMods.set(pet.id,{'));
assert.ok(tear.includes('sourceTear:true'));
assert.ok(tear.indexOf('battlePetPowerMods.set')<tear.indexOf('sourcePetAdjustedAttackDamageTarget(action)'));

// TargetAdjust + old-wound damage source behavior.
assert.ok(tear.includes('sourcePetAdjustedAttackDamageTarget(action)'));
assert.ok(tear.includes('const missingHp=Math.max(0,targetMaxHp-targetHpBefore)'));
assert.ok(tear.includes('const tearPct=sourceCAtoi(meta?.o)'));
assert.ok(tear.includes('tearBonus=Math.trunc(missingHp*tearPct/100)'));
assert.ok(tear.includes('if(tearBonus<=0)'));
assert.ok(tear.includes('r.damage=0'));
assert.ok(tear.includes('r.sourceTearZeroedBaseDamage=true'));

// DamageReact is read before AttackSeq and suppresses only the local TEAR special switch.
assert.ok(tear.includes('const hadDamageReact=sourcePetOriginalDamageReact(target)'));
assert.ok(tear.includes('const localTear=!hadDamageReact'));
assert.ok(tear.includes('if(!r.dodged&&localTear)'));
assert.ok(tear.includes('sourcePetAttackDamageCalcOnlyGuardianResult(pet,target'));
assert.ok(tear.includes('attackerOverride:{attack}'));
assert.ok(tear.includes("applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id)"));

// PETSKILLTEAR is isolated BATTLE_S_AttackDamage: no common Counter / inner AddProfit.
assert.ok(tear.includes('sourceNoCounter:true'));
assert.equal(tear.includes('resolvePetEnemyCounterChain'),false);
assert.equal(tear.includes('sourceProcessBattleDeathsAtAddProfit'),false);

const loyal=game.slice(loyalStart,game.indexOf('function sourcePetPreCommandAction',loyalStart));
assert.ok(loyal.includes("meta?.f==='PETSKILL_BattleTearDamage'"));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_BattleTearDamage'")<loyal.indexOf('sourceRuntimePending:true'));

// Enemy Tear must obey the same pre-AttackSeq DamageReact crossover.
const enemyTearStart=game.indexOf('function performEnemyTear');
const enemyRegretStart=game.indexOf('function performEnemyRegret',enemyTearStart);
assert.ok(enemyTearStart>=0&&enemyRegretStart>enemyTearStart);
const enemyTear=game.slice(enemyTearStart,enemyRegretStart);
assert.ok(enemyTear.includes('battlePetAcupunctureIds.has(chosen.pet.id)'));
assert.ok(enemyTear.includes('const localTear=!hadDamageReact'));
assert.ok(enemyTear.includes('if(!r.dodged&&localTear)'));
assert.ok(enemyTear.includes('r.sourceTearZeroedBaseDamage=true'));
assert.ok(enemyTear.includes('hadDamageReact,localTear'));

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.91',
  focus:'player-randomact-tear-old-wound-damage-and-damagereact-crossover',
  skills:[615,616,651,656]
}));
