import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

const row=runtime.byId['595'];
assert.equal(row?.f,'PETSKILL_SetDuck');
assert.equal(row?.o,'3|60');
assert.equal(Number(row?.target),0);
assert.equal(Number(row?.illegal),0);

// Low-loyalty RANDOMACT chooses the opposing Enemy target before PETSKILL_Use.
const planStart=game.indexOf('function sourcePetRandomSkillPlan');
const planEnd=game.indexOf('function sourcePetChargeSpec',planStart);
const plan=game.slice(planStart,planEnd);
assert.ok(plan.includes('const targetDesc=sourcePetRandomEnemyTarget()'));
assert.ok(plan.includes("return {kind:'skill',slot:iNum,skillId,meta,targetDesc}"));

// SetDuck's battle execution must fail its self-target gate in this path.
const start=game.indexOf('function sourcePerformPetSetDuckRandomSkill');
const end=game.indexOf('function sourcePerformPetGuardianSkill',start);
assert.ok(start>=0&&end>start);
const body=game.slice(start,end);
assert.ok(body.includes('sourceExecutionFailed:true'));
assert.ok(body.includes('sourceSetDuckSelfTargetGate:true'));
assert.ok(body.includes('magicPetMpResetBehaviorallyZero:true'));

// It must not invent the normally valid self-cast effect.
assert.equal(body.includes('skillDuckTurns='),false);
assert.equal(body.includes('skillDuckPower='),false);
assert.equal(body.includes('cRand('),false);
assert.equal(body.includes('battleStatusApply'),false);

// Dispatcher now resolves 595 instead of leaving it sourceRuntimePending.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
assert.ok(loyal.includes("meta?.f==='PETSKILL_SetDuck'"));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_SetDuck'")<loyal.indexOf('sourceRuntimePending:true'));

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.83',
  focus:'player-randomact-setduck-self-target-failure',
  skill:595
}));