import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const skill=id=>runtime.byId[String(id)];

for(const [id,o] of [[506,'50|50'],[507,'50|75'],[508,'50|100']]){
  assert.equal(skill(id)?.f,'PETSKILL_MpDamage','skill '+id+' function');
  assert.equal(skill(id)?.o,o,'skill '+id+' option');
  assert.equal(Math.trunc(Number(o.split('|')[0])/100),0,'skill '+id+' attack reduction int bug');
}

const start=game.indexOf('function sourcePerformPetMpDamageSkill');
const end=game.indexOf('function sourcePetAttrSkillSpec',start);
assert.ok(start>=0&&end>start);
const body=game.slice(start,end);

assert.ok(body.includes('const cIntegerDivision=Math.trunc(attackReduceRaw/100)'));
assert.ok(body.includes('const mpDamage=0'));
assert.ok(body.includes("sourceTargetType:'enemy'"));
assert.ok(body.includes('sourcePetAttackDamageCalcOnlyGuardianResult(pet,target'));
assert.ok(body.includes('sourcePetOriginalDamageReact(target)'));
assert.equal(body.includes('state.mp='),false);
assert.equal(body.includes('resolvePetEnemyCounterChain'),false);

// RANDOMACT target is still execution-time adjusted Enemy COM2; no metadata expansion to a Player.
assert.ok(body.includes('sourcePetAdjustedAttackDamageTarget(action)'));
assert.equal(body.includes('meta?.target'),false);

// Shared BATTLE_S_AttackDamage Guardian bug must retain original damage target.
const gstart=game.indexOf('function sourcePetAttackDamageCalcOnlyGuardianResult');
const gend=game.indexOf('function sourcePetOriginalDamageReact',gstart);
const guardian=game.slice(gstart,gend);
assert.ok(guardian.includes('const calcTarget=guardian||target'));
assert.ok(guardian.includes('r.actualTarget=target'));
assert.ok(guardian.includes("BATTLE_S_AttackDamage-defindex-not-updated"));

// Dispatcher is live before pending fallback.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
assert.ok(loyal.includes("meta?.f==='PETSKILL_MpDamage'"));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_MpDamage'")<loyal.indexOf('sourceRuntimePending:true'));

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.80',
  focus:'player-randomact-mp-damage',
  skills:[506,507,508]
}));