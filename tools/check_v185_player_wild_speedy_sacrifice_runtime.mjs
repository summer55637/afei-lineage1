import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const skill=id=>runtime.byId[String(id)];

const wild=new Map([
  [541,'攻%+80 防%-35 回避30'],
  [652,'攻%+60 防%-50 回避50'],
  [665,'攻%+150 防%-20 回避20'],
  [671,'攻%+115 防%-25 回避10']
]);
for(const [id,option] of wild){
  assert.equal(skill(id)?.f,'PETSKILL_WildViolentAttack','wild '+id+' function');
  assert.equal(skill(id)?.o,option,'wild '+id+' option');
  assert.equal(Number(skill(id)?.illegal),0,'wild '+id+' legal');
}
assert.equal(skill(542)?.f,'PETSKILL_SpeedyAttack');
assert.equal(skill(542)?.o,'防%-30 敏%+30');
assert.equal(Number(skill(542)?.illegal),0);
assert.equal(skill(573)?.f,'PETSKILL_Sacrifice');
assert.equal(Number(skill(573)?.illegal),0);

const wildStart=game.indexOf('function sourcePerformPetWildViolentSkill');
const speedyStart=game.indexOf('function sourcePerformPetSpeedyAttackSkill',wildStart);
assert.ok(wildStart>=0&&speedyStart>wildStart);
const wildBody=game.slice(wildStart,speedyStart);
assert.ok(wildBody.includes("enemySignedSkillPercent(option,'攻%')"));
assert.ok(wildBody.includes("enemySignedSkillPercent(option,'防%')"));
assert.ok(wildBody.includes('option.match(/回?避([+-]?\\d+)/)'));
assert.ok(wildBody.includes('battlePetPowerMods.set(pet.id'));
assert.ok(wildBody.includes('const count=cRand(3,10)'));
assert.ok(wildBody.includes('damageDivisor:count'));
assert.ok(wildBody.includes('duckBonusPercent:duckBonus'));
assert.ok(wildBody.includes('sourcePetEnemyTargetFromAction(action)'));
assert.ok(wildBody.includes("resolvePetEnemyCounterChain('pet',pet,lastActual,lastResult)"));

const sacrificeStart=game.indexOf('function sourcePerformPetSacrificeSkill',speedyStart);
assert.ok(sacrificeStart>speedyStart);
const speedyBody=game.slice(speedyStart,sacrificeStart);
assert.ok(speedyBody.includes("enemySignedSkillPercent(meta?.o,'防%')"));
assert.ok(speedyBody.includes('baseDefense+Math.trunc(baseDefense*defensePct/100)'));
assert.ok(speedyBody.includes('battlePetPowerMods.set(pet.id'));
assert.ok(speedyBody.includes('sourceDexOrderAlreadyFixed:true'));
assert.equal(speedyBody.includes("enemySignedSkillPercent(meta?.o,'敏%')"),false);
assert.equal(speedyBody.includes("roundDexMode='speedy'"),false);
assert.ok(speedyBody.includes("resolvePetEnemyCounterChain('pet',pet,actual,r)"));

const sacrificeEnd=game.indexOf('function sourcePerformPetGuardianSkill',sacrificeStart);
assert.ok(sacrificeEnd>sacrificeStart);
const sacrificeBody=game.slice(sacrificeStart,sacrificeEnd);
assert.ok(sacrificeBody.includes('beforeCaster>maxCaster*.2'));
assert.ok(sacrificeBody.includes('sourceUseFailed:true'));
assert.ok(sacrificeBody.includes('Math.trunc(beforeCaster*.5)'));
assert.ok(sacrificeBody.includes('const transfer=Math.max(0,Math.trunc(n(pet.hp)))'));
assert.ok(sacrificeBody.includes('target.hp=Math.min(maxTarget,beforeTarget+transfer)'));
assert.equal(sacrificeBody.includes('resolvePetEnemyCounterChain'),false);
assert.equal(sacrificeBody.includes('sourceSetMagicPetMultiList'),false);

// Low-loyalty RANDOMACT order is already fixed before sourcePerformPetLoyalAction.
// The player Speedy implementation therefore must not invent a late +30% reorder.
const orderStart=game.indexOf('function normalBattleOrder');
const orderEnd=game.indexOf('function sourceDeadBattleEntry',orderStart);
const order=game.slice(orderStart,orderEnd);
assert.ok(orderStart>=0&&orderEnd>orderStart);
assert.ok(order.includes('const order=[]'));
assert.ok(order.includes('sourcePetPreCommandAction'));

// Dispatcher resolves all three functions before the pending fallback.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
for(const f of ['PETSKILL_WildViolentAttack','PETSKILL_SpeedyAttack','PETSKILL_Sacrifice']){
  assert.ok(loyal.includes("meta?.f==='"+f+"'"),f+' dispatcher');
  assert.ok(loyal.indexOf("meta?.f==='"+f+"'")<loyal.indexOf('sourceRuntimePending:true'),f+' before pending');
}

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.85',
  focus:'player-randomact-wild-speedy-sacrifice',
  skills:[541,542,573,652,665,671],
  assertions:'runtime + wild multi-hit + speedy post-sort + sacrifice enemy-heal lifecycle'
}));
