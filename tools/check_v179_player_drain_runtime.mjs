import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const skill=id=>runtime.byId[String(id)];

const rows=[
  [503,'PETSKILL_DamageToHp','30|50'],
  [504,'PETSKILL_DamageToHp','20|70'],
  [505,'PETSKILL_DamageToHp','10|100'],
  [714,'PETSKILL_DamageToHp','30|100'],
  [833,'PETSKILL_DamageToHp','30|100'],
  [623,'PETSKILL_DamageToHp2','30'],
  [659,'PETSKILL_DamageToHp2','100']
];
for(const [id,f,o] of rows){
  assert.equal(skill(id)?.f,f,'skill '+id+' function');
  assert.equal(skill(id)?.o,o,'skill '+id+' option');
}

// PETSKILL_DamageToHp fixed C integer-division bug: atoi(buf1)/100 is int/int first.
for(const id of [503,504,505,714,833]){
  const first=Number(skill(id).o.split('|')[0]);
  assert.equal(Math.trunc(first/100),0,'skill '+id+' attack reduction truncates to zero');
}
const drain1Start=game.indexOf('function sourcePerformPetDamageToHpSkill');
const drain2Start=game.indexOf('function sourcePerformPetDamageToHp2Skill',drain1Start);
const guardianStart=game.indexOf('function sourcePetAttackDamageCalcOnlyGuardianResult');
assert.ok(guardianStart>=0&&drain1Start>guardianStart&&drain2Start>drain1Start);

const drain1=game.slice(drain1Start,drain2Start);
const drain2=game.slice(drain2Start,game.indexOf('function sourcePerformPetMpDamageSkill',drain2Start));
const guardian=game.slice(guardianStart,game.indexOf('function sourcePetOriginalDamageReact',guardianStart));

assert.ok(drain1.includes('const cIntegerDivision=Math.trunc(attackReduceRaw/100)'));
assert.ok(drain1.includes('sourcePetDrainHeal(pet,r.damage,absorbPct'));
assert.ok(drain1.includes('!hadDamageReact&&r.damage>0&&!r.dodged&&!r.miss'));

// BATTLE_S_AttackDamage Guardian bug: Guardian only replaces local AttackSeq defender;
// DamageSub / death / ItemCrush / drain remain on original target.
assert.ok(guardian.includes('const guardian=attacker?.throwWeapon?null:enemyGuardianFor(target,null)'));
assert.ok(guardian.includes('const calcTarget=guardian||target'));
assert.ok(guardian.includes('r.actualTarget=target'));
assert.ok(guardian.includes("r.guardianSourceBug='BATTLE_S_AttackDamage-defindex-not-updated'"));
assert.equal(guardian.includes('r.actualTarget=guardian'),false);

// Execution-time TargetAdjust fallback must be preserved.
const adjustStart=game.indexOf('function sourcePetAdjustedAttackDamageTarget');
const adjustEnd=game.indexOf('function sourcePetAttackDamageCalcOnlyGuardianResult',adjustStart);
const adjust=game.slice(adjustStart,adjustEnd);
assert.ok(adjust.includes('sourcePetRandomEnemyTarget()'));

// DAMAGETOHP2 source behavior: +20% attack, critical chance *1.3,
// but ORIGINAL target DamageReact downgrades skill_type before AttackSeq so both bonuses disappear.
assert.ok(drain2.includes('const attackPct=hadDamageReact?0:20'));
assert.ok(drain2.includes('const criticalChanceMultiplier=hadDamageReact?1:1.3'));
assert.ok(drain2.includes('sourcePetDrainHeal(pet,r.damage,absorbPct'));

// The "HP50% below" text on skill 623 is descriptive only in this fixed source;
// PETSKILL_DamageToHp2 has no runtime HP gate, so the web handler must not invent one.
assert.equal(/pet\.hp\s*[<>]=?\s*.*maxHp/.test(drain2),false);
assert.equal(drain2.includes('0.5'),false);

// Original target DamageReact is checked before Guardian. Current source-backed enemy react is Acupuncture.
const reactStart=game.indexOf('function sourcePetOriginalDamageReact');
const reactEnd=game.indexOf('function sourcePetDrainHeal',reactStart);
const react=game.slice(reactStart,reactEnd);
assert.ok(react.includes('target?.acupunctureActive'));

// Both are isolated BATTLE_S_AttackDamage cases: no ordinary Counter chain.
assert.equal(drain1.includes('resolvePetEnemyCounterChain'),false);
assert.equal(drain2.includes('resolvePetEnemyCounterChain'),false);

// Drain helper caps at max HP and truncates C-style percentage heal.
const healStart=game.indexOf('function sourcePetDrainHeal');
const healEnd=game.indexOf('function sourcePerformPetDamageToHpSkill',healStart);
const heal=game.slice(healStart,healEnd);
assert.ok(heal.includes('Math.trunc(Math.max(0,Math.trunc(n(damage)))*percent/100)'));
assert.ok(heal.includes('pet.hp=Math.min(maxHp,before+amount)'));

// Dispatch occurs before the sourceRuntimePending fallback.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
for(const f of ['PETSKILL_DamageToHp','PETSKILL_DamageToHp2']){
  assert.ok(loyal.includes("meta?.f==='"+f+"'"),f+' dispatch');
  assert.ok(loyal.indexOf("meta?.f==='"+f+"'")<loyal.indexOf('sourceRuntimePending:true'));
}

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.79',
  focus:'player-randomact-damage-to-hp',
  rows:rows.length,
  damageToHp:[503,504,505,714,833],
  damageToHp2:[623,659]
}));