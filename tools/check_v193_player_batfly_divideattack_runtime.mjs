import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

const bat=runtime.byId['633'];
assert.equal(bat?.f,'PETSKILL_BatFly');
assert.equal(bat?.o,'');
assert.equal(Number(bat?.target),3);
assert.equal(Number(bat?.illegal),0);

const div=runtime.byId['634'];
assert.equal(div?.f,'PETSKILL_DivideAttack');
assert.equal(div?.o,'');
assert.equal(Number(div?.target),3);
assert.equal(Number(div?.illegal),0);

const sideStart=game.indexOf('function sourcePetDirectEnemySideTargets');
const batStart=game.indexOf('function sourcePerformPetBatFlySkill',sideStart);
const divStart=game.indexOf('function sourcePerformPetDivideAttackSkill',batStart);
const tearStart=game.indexOf('function sourcePerformPetTearSkill',divStart);
assert.ok(sideStart>=0&&batStart>sideStart&&divStart>batStart&&tearStart>divStart);

const side=game.slice(sideStart,batStart);
assert.ok(side.includes('targetableEnemyUnits().slice().sort'));
assert.ok(side.includes("sourceBattleStatusSlot({kind:'enemy',unit:a,unitId:a.id})"));

const batFn=game.slice(batStart,divStart);
// battle.c gates through TargetAdjust even though BATTLE_BatFly ignores defNo afterward.
assert.ok(batFn.includes('sourcePetEnemyTargetFromAction(action)'));
// Current Enemy entries have no ride-pet relation: use no-ride 10% branch, min 1.
assert.ok(batFn.includes('Math.trunc(before/10)===0?1:Math.trunc(before/10)'));
assert.ok(batFn.includes('drained+=damage'));
assert.ok(batFn.includes("sourceMarkEnemyDeathCredit(unit,[{kind:'pet',petId:pet.id}])"));
// Source overflow quirk: heal to max but outgoing local addhp becomes 0.
assert.ok(batFn.includes('if(beforeSelf+drained>maxSelf)'));
assert.ok(batFn.includes('pet.hp=maxSelf'));
assert.ok(batFn.includes('sourceProtocolAddHp=0'));
// Direct CHAR_HP path: no normal attack lifecycle.
assert.ok(batFn.includes('sourceNoWake:true'));
assert.ok(batFn.includes('sourceNoCounter:true'));
assert.ok(batFn.includes('sourceNoInnerAddProfit:true'));
assert.equal(batFn.includes('resolvePetEnemyCounterChain'),false);
assert.equal(batFn.includes('sourceBattleFinalizeItemCrushRng'),false);
assert.equal(batFn.includes('battleStatusWakeOnDamage'),false);

const divFn=game.slice(divStart,tearStart);
assert.ok(divFn.includes('sourcePetEnemyTargetFromAction(action)'));
// MP pass only affects CHAR_TYPEPLAYER in source; Enemy-side targets therefore do nothing.
assert.ok(divFn.includes('const mpResults=[]'));
assert.ok(divFn.includes('sourceEnemyMpPassNoop:true'));
// No-ride Enemy branch is current HP / 5, min 1.
assert.ok(divFn.includes('Math.trunc(before/5)===0?1:Math.trunc(before/5)'));
assert.ok(divFn.includes("sourceMarkEnemyDeathCredit(unit,[{kind:'pet',petId:pet.id}])"));
assert.ok(divFn.includes('sourceNoWake:true'));
assert.ok(divFn.includes('sourceNoCounter:true'));
assert.ok(divFn.includes('sourceNoInnerAddProfit:true'));
assert.equal(divFn.includes('resolvePetEnemyCounterChain'),false);
assert.equal(divFn.includes('sourceBattleFinalizeItemCrushRng'),false);
assert.equal(divFn.includes('battleStatusWakeOnDamage'),false);

// Neither dedicated special consumes its own RNG after TargetAdjust succeeds.
assert.equal(batFn.includes('cRand('),false);
assert.equal(divFn.includes('cRand('),false);

const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
assert.ok(loyal.includes("meta?.f==='PETSKILL_BatFly'"));
assert.ok(loyal.includes("meta?.f==='PETSKILL_DivideAttack'"));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_BatFly'")<loyal.indexOf('sourceRuntimePending:true'));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_DivideAttack'")<loyal.indexOf('sourceRuntimePending:true'));

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.93',
  focus:'player-randomact-batfly-divideattack-direct-side-hp-mp-lifecycle',
  skills:[633,634]
}));
