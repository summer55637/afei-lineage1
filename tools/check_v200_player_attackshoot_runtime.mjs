import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

for(const [id,option] of [['614','3|5'],['647','6|8']]){
  const row=runtime.byId[id];
  assert.equal(row?.f,'PETSKILL_AttackShoot');
  assert.equal(row?.o,option);
  assert.equal(Number(row?.target),1);
  assert.equal(Number(row?.field),1);
  assert.equal(Number(row?.illegal),0);
}

const fnStart=game.indexOf('function sourcePerformPetAttackShootSkill');
const nextStart=game.indexOf('function sourcePerformPetWildViolentSkill',fnStart);
assert.ok(fnStart>=0&&nextStart>fnStart);
const fn=game.slice(fnStart,nextStart);

// PETSKILL_AttackShoot parses the source min|max option and consumes count RNG first.
assert.ok(fn.includes("const parts=String(meta?.o||'').split('|')"));
assert.ok(fn.includes('const min=sourceCAtoi(parts[0])'));
assert.ok(fn.includes('const max=sourceCAtoi(parts[1])'));
assert.ok(fn.includes('const attackMax=cRand(min,max)'));

// RANDOMACT is reachable only for FIXAI 20..39, so loyal>=100 burst RNG is unreachable.
assert.ok(fn.includes('sourceRandomActFixAiBelow40:true'));
assert.ok(fn.includes('loyaltyBurstEligible:false'));
assert.equal(fn.includes('cRand(1,300)'),false);
assert.equal(fn.includes('cRand(1,50)'),false);

// The commented source attack/defense rewrite must stay inert.
assert.equal(fn.includes('battlePetPowerMods.set'),false);

// Same TargetListSet source bug as ATTCRAZED: Enemy slot 19 is excluded from pre-roll.
assert.ok(fn.includes('slot>=0&&slot<9'));
const countRoll=fn.indexOf('const attackMax=cRand(min,max)');
const targetRoll=fn.indexOf('const roll=cRand(0,sourcePool.length-1)');
const firstAttack=fn.indexOf('resolveAttackToEnemyWithGuardian');
assert.ok(countRoll>=0&&targetRoll>countRoll&&firstAttack>targetRoll);

// Empty pre-roll pool keeps the original COM2-filled list and consumes no target-list RNG.
assert.ok(fn.includes("}else{\n    for(let i=0;i<attackMax;i++)plannedTargets.push(originalTarget);"));

// Non-BOW first hit ignores the already-consumed plannedTargets[0].
assert.ok(fn.includes('if(i===0)'));
assert.ok(fn.includes('target=sourcePetEnemyTargetFromAction(action)'));
assert.ok(fn.indexOf('target=sourcePetEnemyTargetFromAction(action)')>targetRoll);

// BATTLE_COM_S_ATTSHOOT sets gDamageDiv=attack_max.
assert.ok(fn.includes('damageDivisor:attackMax'));

// Exact positive-hit RNG order: Attack -> sleep RAND(1,5) -> ItemCrush -> AddProfit.
assert.ok(fn.includes("{deferItemCrush:true}"));
const applyHit=fn.indexOf("applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id,{deferItemCrush:true})");
const sleepRoll=fn.indexOf('sleepRoll=cRand(1,5)');
const sleepApply=fn.indexOf('sourceAttackShootApplySleep');
const crush=fn.indexOf('sourceBattleFinalizeItemCrushRng(r)');
const addProfit=fn.indexOf('sourceProcessBattleDeathsAtAddProfit()');
assert.ok(applyHit>=0&&sleepRoll>applyHit&&sleepApply>sleepRoll&&crush>sleepApply&&addProfit>crush);
assert.ok(fn.includes('if(n(r?.damage)>0)'));
assert.ok(fn.includes('if(sleepRoll>4&&actual)'));

// ATTSHOOT is explicitly rejected by fixed CounterCheck / Counter; no Counter RNG here.
assert.equal(fn.includes('resolvePetEnemyCounterChain'),false);
assert.ok(fn.includes('counterBlocked:true'));

// Player RANDOMACT dispatch is wired before the generic pending fallback.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
const dispatch=loyal.indexOf("meta?.f==='PETSKILL_AttackShoot'");
const fallback=loyal.indexOf('sourceRuntimePending:true');
assert.ok(dispatch>=0&&fallback>dispatch);

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V2.00',
  focus:'player-randomact-attackshoot-count-preroll-gDamageDiv-sleep-before-itemcrush-no-counter',
  skills:[614,647]
}));
