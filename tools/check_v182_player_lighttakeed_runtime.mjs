import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const skill=id=>runtime.byId[String(id)];

// 574 exists but is source-illegal for CHAR_TYPEPET; PETSKILL_Use returns FALSE before its function.
assert.equal(skill(574)?.f,'PETSKILL_ToothCrushe');
assert.equal(Number(skill(574)?.illegal),1);
const planStart=game.indexOf('function sourcePetRandomSkillPlan');
const planEnd=game.indexOf('function sourcePetChargeSpec',planStart);
const plan=game.slice(planStart,planEnd);
assert.ok(plan.includes('if(Math.trunc(n(meta.illegal))!==0)'));
assert.ok(plan.includes('sourceIllegal:true'));
assert.ok(plan.indexOf('sourceIllegal:true')<plan.indexOf("return {kind:'skill',slot:iNum,skillId,meta,targetDesc}"));

// Fixed Lighttakeed rows.
for(const [id,o] of [[609,'ABSROB'],[610,'REFLEC'],[611,'VANISH']]){
  assert.equal(skill(id)?.f,'PETSKILL_Lighttakeed','skill '+id+' function');
  assert.equal(skill(id)?.o,o,'skill '+id+' option');
  assert.equal(Number(skill(id)?.illegal),0,'skill '+id+' legal');
}

const start=game.indexOf('function sourcePerformPetLighttakeedSkill');
const end=game.indexOf('function sourcePerformPetGuardianSkill',start);
assert.ok(start>=0&&end>start);
const body=game.slice(start,end);

// PETSKILL_Lighttakeed writes WORKATTACKPOWER=FIXSTR*0.7 and WORKDEFENCEPOWER=FIXTOUGH*0.5.
// Its WORKQUICK*0.95 source line is commented and must not be invented.
assert.ok(body.includes('const attack=Math.trunc(n(base.attack)*.7)'));
assert.ok(body.includes('const defense=Math.trunc(n(base.defense)*.5)'));
assert.ok(body.includes("battlePetPowerMods.set(pet.id,{attack,defense,skillId:action?.skillId,sourceLighttakeed:true})"));
const bodyCode=body.replace(/\/\/.*$/gm,'');
assert.equal(bodyCode.includes('.95'),false);

// battlePetPowerMods must reset at next round compliance boundary, matching WORK lifetime.
const orderStart=game.indexOf('function normalBattleOrder');
const orderEnd=game.indexOf('const order=[]',orderStart);
const roundHead=game.slice(orderStart,orderEnd);
assert.ok(roundHead.includes('battlePetPowerMods.clear()'));

// Current source-backed Enemy reacts do not include VANISH/ABSROB/REFLEC.
// Acupuncture is positive ReactType but mismatches every Lighttake request.
assert.ok(body.includes('const hadDamageReact=sourcePetOriginalDamageReact(target)'));
assert.ok(body.includes('const matchedReact=false'));
assert.ok(body.includes('const absorbed=false'));
assert.equal(body.includes('damageVanish'),false);
assert.equal(body.includes('damageAbsorb'),false);
assert.equal(body.includes('damageReflect'),false);

// Physical part uses BATTLE_S_AttackDamage calc-only Guardian path and has no ordinary Counter.
assert.ok(body.includes('sourcePetAttackDamageCalcOnlyGuardianResult(pet,target'));
assert.ok(body.includes('sourcePetAdjustedAttackDamageTarget(action)'));
assert.equal(body.includes('resolvePetEnemyCounterChain'),false);

// Dispatcher is live; ToothCrushe deliberately has no player dispatch because illegal gate catches it first.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
assert.ok(loyal.includes("meta?.f==='PETSKILL_Lighttakeed'"));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_Lighttakeed'")<loyal.indexOf('sourceRuntimePending:true'));
assert.equal(loyal.includes("meta?.f==='PETSKILL_ToothCrushe'"),false);

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.82',
  focus:'player-randomact-lighttakeed-illegal-tooth-audit',
  lighttakeed:[609,610,611],
  illegalNoAction:[574]
}));