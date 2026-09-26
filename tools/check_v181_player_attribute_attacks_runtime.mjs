import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const skill=id=>runtime.byId[String(id)];

const modifyRows=[
  [544,'EA|20'],[545,'WA|20'],[546,'FI|20'],[547,'WI|20'],
  [825,'EA|9999'],[826,'WA|9999'],[827,'FI|9999'],[828,'WI|9999']
];
const mdfyRows=[
  [548,'EA|100'],[549,'WA|100'],[550,'FI|100'],[551,'WI|100'],
  [697,'FI|100'],[698,'WI|100'],[699,'EA|100'],[700,'WA|100']
];
for(const [id,o] of modifyRows){
  assert.equal(skill(id)?.f,'PETSKILL_Modifyattack','skill '+id+' function');
  assert.equal(skill(id)?.o,o,'skill '+id+' option');
}
for(const [id,o] of mdfyRows){
  assert.equal(skill(id)?.f,'PETSKILL_Mdfyattack','skill '+id+' function');
  assert.equal(skill(id)?.o,o,'skill '+id+' option');
}

const specStart=game.indexOf('function sourcePetAttrSkillSpec');
const modStart=game.indexOf('function sourcePerformPetModifyAttackSkill',specStart);
const mdfyStart=game.indexOf('function sourcePerformPetMdfyAttackSkill',modStart);
const end=game.indexOf('function sourcePerformPetGuardianSkill',mdfyStart);
assert.ok(specStart>=0&&modStart>specStart&&mdfyStart>modStart&&end>mdfyStart);
const spec=game.slice(specStart,modStart);
const mod=game.slice(modStart,mdfyStart);
const mdfy=game.slice(mdfyStart,end);

for(const token of ["code==='EA'?'earth'","code==='WA'?'water'","code==='FI'?'fire'","code==='WI'?'wind'"]){
  assert.ok(spec.includes(token),token);
}

// MODIFYATT: DamageReact downgrades local skill_type before the post-AttackSeq bonus switch.
assert.ok(mod.includes('const hadDamageReact=sourcePetOriginalDamageReact(target)'));
assert.ok(mod.includes('if(!hadDamageReact&&r.damage>0)'));
assert.ok(mod.includes("battleBaseElements({kind:'enemy',unit:target,unitId:target.id})"));
assert.ok(mod.includes('bonusRoll=cRand(0,attr+4)'));
assert.ok(mod.includes('bonusStep=Math.trunc(bonusRoll/100)'));
assert.ok(mod.includes('const factor=n(spec.amount)/100+bonusStep'));

// Guardian is calc-only through the shared BATTLE_S_AttackDamage helper; bonus uses ORIGINAL target attr.
assert.ok(mod.includes('sourcePetAttackDamageCalcOnlyGuardianResult(pet,target'));
assert.equal(mod.includes('r.guardianCalcOnly?.elements'),false);

// MDFYATTACK: attack elements are replaced for AttackSeq itself.
assert.ok(mdfy.includes("const elements={earth:0,water:0,fire:0,wind:0}"));
assert.ok(mdfy.includes('elements[spec.key]=spec.amount'));
assert.ok(mdfy.includes('attackerOverride:{elements}'));

// Local skill_type may become -1 on DamageReact, but WORKBATTLECOM1 remains MDFYATTACK;
// therefore the element replacement must NOT be gated off by hadDamageReact.
assert.ok(mdfy.includes('const hadDamageReact=sourcePetOriginalDamageReact(target)'));
assert.equal(mdfy.includes('if(!hadDamageReact'),false);

// Both are isolated BATTLE_S_AttackDamage cases; no ordinary Counter.
assert.equal(mod.includes('resolvePetEnemyCounterChain'),false);
assert.equal(mdfy.includes('resolvePetEnemyCounterChain'),false);

// TargetAdjust fallback is shared with the previous BATTLE_S_AttackDamage group.
assert.ok(mod.includes('sourcePetAdjustedAttackDamageTarget(action)'));
assert.ok(mdfy.includes('sourcePetAdjustedAttackDamageTarget(action)'));

// Dispatch before pending fallback.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
for(const f of ['PETSKILL_Modifyattack','PETSKILL_Mdfyattack']){
  assert.ok(loyal.includes("meta?.f==='"+f+"'"));
  assert.ok(loyal.indexOf("meta?.f==='"+f+"'")<loyal.indexOf('sourceRuntimePending:true'));
}

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.81',
  focus:'player-randomact-attribute-attacks',
  modify:modifyRows.map(x=>x[0]),
  mdfy:mdfyRows.map(x=>x[0])
}));