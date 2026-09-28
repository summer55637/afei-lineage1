import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const skill=id=>runtime.byId[String(id)];

assert.equal(skill(618)?.f,'PETSKILL_Sonic');
assert.equal(Number(skill(618)?.illegal),0);
for(const [id,o] of [
  [640,'命%20 攻%30 防%-50'],
  [666,'命%30 攻%60 防-20%'],
  [718,'命%20 攻%60 防-35%']
]){
  assert.equal(skill(id)?.f,'PETSKILL_Regret','Regret '+id);
  assert.equal(skill(id)?.o,o,'Regret option '+id);
  assert.equal(Number(skill(id)?.illegal),0,'Regret legal '+id);
}

// New helpers are appended immediately before the loyalty dispatcher so older body-slice tests stay isolated.
const pierceStart=game.indexOf('function sourcePetPierceFrontEnemy');
const dizzyStart=game.indexOf('function sourcePetTryRegretDizzy',pierceStart);
const sonicStart=game.indexOf('function sourcePerformPetSonicSkill',dizzyStart);
const regretStart=game.indexOf('function sourcePerformPetRegretSkill',sonicStart);
const firekillStart=game.indexOf('function sourcePetFirekillResolveTarget',regretStart);
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction',firekillStart);
assert.ok(pierceStart>=0&&dizzyStart>pierceStart&&sonicStart>dizzyStart&&regretStart>sonicStart&&firekillStart>regretStart&&loyalStart>firekillStart);

const pierce=game.slice(pierceStart,dizzyStart);
assert.ok(pierce.includes('if(slot<15||slot>=20)return null'));
assert.ok(pierce.includes('const frontSlot=slot-5'));
assert.ok(pierce.includes("sourceBattleStatusSlot({kind:'enemy',unit,unitId:u.id})===frontSlot"));
assert.equal(pierce.includes('enemyUnitHidden(unit)'),false);

const dizzy=game.slice(dizzyStart,sonicStart);
assert.ok(dizzy.includes('const roll=cRand(1,100)'));
assert.ok(dizzy.indexOf('const roll=cRand(1,100)')<dizzy.indexOf('if(!target||n(target.hp)<=0)'));
assert.ok(dizzy.indexOf('const roll=cRand(1,100)')<dizzy.indexOf('if(battleHasAnyStatus(desc))'));
assert.ok(dizzy.includes('if(roll>=successPct)'));
assert.ok(dizzy.includes("battleStatusApply(desc,'dizzy',0)"));

const sonic=game.slice(sonicStart,regretStart);
assert.ok(sonic.includes('sourcePetAdjustedAttackDamageTarget(action)'));
assert.ok(sonic.includes('sourcePetOriginalDamageReact(target)'));
assert.ok(sonic.includes('preGuardDamageMultiplier:secondary&&localSonic ? .5 : 1'));
assert.ok(sonic.includes('sourcePetPierceFrontEnemy(primary)'));
assert.ok(sonic.includes('sourceNoCounter:true'));
assert.equal(sonic.includes('resolvePetEnemyCounterChain'),false);

const regret=game.slice(regretStart,firekillStart);
assert.ok(regret.includes("enemySkillNumber(option,/命%([+-]?\\d+)/,0)"));
assert.ok(regret.includes("enemySignedSkillPercent(option,'攻%')"));
assert.ok(regret.includes("const hasDefenseToken=option.includes('防%')"));
assert.ok(regret.includes('if(hasDefenseToken)'));
assert.ok(regret.includes('battlePetPowerMods.set(pet.id,powerMod)'));
assert.ok(regret.includes('useFixedToughDefense:true'));
assert.ok(regret.includes('preGuardDamageMultiplier:secondary&&localRegret ? .8 : 1'));
assert.ok(regret.includes('sourcePetOriginalDamageReact(target)'));
assert.ok(regret.includes('sourcePetTryRegretDizzy(pet,target,successPct,label)'));
assert.ok(regret.includes("reason:'damage-react-local-skilltype-minus1'"));
assert.ok(regret.includes('sourcePetPierceFrontEnemy(primary)'));
assert.ok(regret.includes('sourceNoCounter:true'));
assert.equal(regret.includes('resolvePetEnemyCounterChain'),false);

// Fixed source parser bug: only 640 contains literal "防%"; 666/718 must not be silently normalized.
assert.equal(String(skill(640)?.o).includes('防%'),true);
assert.equal(String(skill(666)?.o).includes('防%'),false);
assert.equal(String(skill(718)?.o).includes('防%'),false);

// V1.88 Acupuncture crossover: Enemy Regret must snapshot DamageReact before hit consumes it.
const enemyRegretStart=game.indexOf('function performEnemyRegret');
const enemyRegretEnd=game.indexOf('function performEnemyWildViolent',enemyRegretStart);
const enemyRegret=game.slice(enemyRegretStart,enemyRegretEnd);
assert.ok(enemyRegret.includes('battlePetAcupunctureIds.has(target.pet.id)'));
assert.ok(enemyRegret.includes('const localRegret= !hadDamageReact'));
assert.ok(enemyRegret.includes('preGuardDamageMultiplier:secondary&&localRegret ? .8 : 1'));
assert.ok(enemyRegret.includes('const dizzy=localRegret?enemyTryRegretDizzy'));

const loyal=game.slice(loyalStart,game.indexOf('function sourcePetPreCommandAction',loyalStart));
for(const f of ['PETSKILL_Sonic','PETSKILL_Regret']){
  assert.ok(loyal.includes("meta?.f==='"+f+"'"),f+' dispatcher');
  assert.ok(loyal.indexOf("meta?.f==='"+f+"'")<loyal.indexOf('sourceRuntimePending:true'),f+' before pending');
}

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.89',
  focus:'player-randomact-sonic-regret-and-acupuncture-crossover',
  sonic:[618],
  regret:[640,666,718]
}));
