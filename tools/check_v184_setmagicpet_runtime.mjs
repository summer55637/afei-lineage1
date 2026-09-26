import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

const expected=new Map([
  [601,['3|15|TGH',2]],[602,['3|300|HP',2]],[603,['3|10|STR',2]],[604,['3|15|DEX',2]],
  [660,['4|50|TGH',1]],[661,['3|800|HP',1]],[662,['4|50|STR',1]],[663,['4|40|DEX',1]],
  [693,['4|30|TGH',1]],[694,['3|800|HP',1]],[695,['4|30|STR',1]],[696,['4|20|DEX',1]],
  [720,['3|30|TGH',2]],[721,['3|1000|HP',2]],[722,['3|25|STR',2]],[723,['3|30|DEX',2]],
  [726,['3|1000|HP',2]],[838,['3|5000|HP',2]],[841,['3|2000|HP',2]]
]);

for(const [id,[option,target]] of expected){
  const row=runtime.byId[String(id)];
  assert.equal(row?.f,'PETSKILL_SetMagicPet',String(id)+' function');
  assert.equal(row?.o,option,String(id)+' option');
  assert.equal(Number(row?.target),target,String(id)+' target metadata');
  assert.equal(Number(row?.illegal),0,String(id)+' legal');
}

// Low-loyalty RANDOMACT consumes DefaultAttacker first and preserves that Enemy target into PETSKILL_Use.
const planStart=game.indexOf('function sourcePetRandomSkillPlan');
const planEnd=game.indexOf('function sourcePetChargeSpec',planStart);
const plan=game.slice(planStart,planEnd);
assert.ok(plan.includes('const targetDesc=sourcePetRandomEnemyTarget()'));
assert.ok(plan.includes("return {kind:'skill',slot:iNum,skillId,meta,targetDesc}"));

// SetMagicPet now consumes raw COM2 rather than rewriting through PETSKILL_TARGET.
const multiStart=game.indexOf('function sourceSetMagicPetMultiList');
const multiEnd=game.indexOf('function sourceSetMagicPetRecoveryRate',multiStart);
const multi=game.slice(multiStart,multiEnd);
assert.ok(multiStart>=0&&multiEnd>multiStart);
assert.ok(multi.includes('if(no>=0&&no<=19)'));
assert.ok(multi.includes('const roll=cRand(0,9)'));
assert.ok(multi.includes('compact[roll]'));
assert.ok(multi.includes('if(no===20)'));
assert.ok(multi.includes('if(no===21)'));
assert.ok(multi.includes('if(no===22)'));

// Enemy AI also forwards its opposite-side raw COM2; do not fake ALLMYSIDE.
const enemyStart=game.indexOf('function performEnemySetMagicPet');
const enemyEnd=game.indexOf('function performEnemySetDuck',enemyStart);
const enemyBody=game.slice(enemyStart,enemyEnd);
assert.ok(enemyBody.includes('sourceEnemyCommandTargetBattleSlot(actor,null)'));
assert.ok(enemyBody.includes('sourcePerformSetMagicPetBattle'));
assert.equal(enemyBody.includes('livingEnemyUnits()'),false);

// STR/TGH/DEX share the source mutual-exclusion gate with Duck and use the mtgh bug.
const helperStart=game.indexOf('function sourceMagicPetState');
const helperEnd=game.indexOf('function sourceUltimateMaxHp',helperStart);
const helpers=game.slice(helperStart,helperEnd);
assert.ok(helpers.includes('sourceMagicPetDuckActive(desc)||!!sourceMagicPetState(desc)'));
assert.ok(helpers.includes("if(stat==='STR')out.attack+=add"));
assert.ok(helpers.includes("else if(stat==='TGH')out.defense+=add"));
assert.ok(helpers.includes("else if(stat==='DEX')out.quick+=add"));
assert.ok(helpers.includes('Math.trunc(Math.trunc(n(mtghBase))*power/100)'));

// Source lifecycle: apply now, snapshot at next PreCommand, decrement later in target StatusSeq.
assert.ok(helpers.includes('appliedBattleTurn'));
assert.ok(helpers.includes('sourcePrepareMagicPetRoundStates'));
assert.ok(helpers.includes('current<=Math.trunc(n(st.appliedBattleTurn))'));
const orderStart=game.indexOf('function normalBattleOrder');
const orderEnd=game.indexOf('function sourceDeadBattleEntry',orderStart);
const order=game.slice(orderStart,orderEnd);
assert.ok(order.indexOf('sourcePreCommandStatusTick()')<order.indexOf('sourcePrepareMagicPetRoundStates()'));
const statusStart=game.indexOf('function processBattleStatusTurn');
const statusEnd=game.indexOf('function battleStatusNameFromOption',statusStart);
const status=game.slice(statusStart,statusEnd);
assert.ok(status.includes('sourceMagicPetStatusSeq(desc)'));

// HP branch: one 90%-110% roll per target, then source GetRecoveryRate formula, then MaxHP cap.
const healStart=game.indexOf('function sourceSetMagicPetRecoveryRate');
const healEnd=game.indexOf('function sourcePerformSetMagicPetBattle',healStart);
const heal=game.slice(healStart,healEnd);
assert.ok(heal.includes("desc?.kind==='player'?0.00010:0.00005"));
assert.ok(heal.includes('Math.trunc(n(power)*0.9)'));
assert.ok(heal.includes('Math.trunc(n(power)*1.1)'));
assert.ok(heal.includes('const roll=cRand('));
assert.ok(heal.includes('Math.trunc(roll*rate)'));
assert.ok(heal.includes('Math.min(maxHp,before+amount)'));

const performStart=game.indexOf('function sourcePerformSetMagicPetBattle');
const performEnd=game.indexOf('function performEnemySetMagicPet',performStart);
const perform=game.slice(performStart,performEnd);
assert.ok(perform.includes("if(stat==='HP')"));
assert.ok(perform.includes("stat!=='STR'&&stat!=='TGH'&&stat!=='DEX'"));
assert.ok(perform.includes('sourceMagicPetBusy(desc)'));
assert.ok(perform.includes('magicPetMpBehaviorallyUnchanged:true'));

// Player RANDOMACT dispatcher must resolve all SetMagicPet rows before pending fallback.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
assert.ok(loyal.includes("meta?.f==='PETSKILL_SetMagicPet'"));
assert.ok(loyal.includes("action?.targetDesc?.kind==='enemy'?sourceBattleStatusSlot(action.targetDesc):-1"));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_SetMagicPet'")<loyal.indexOf('sourceRuntimePending:true'));

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.84',
  focus:'setmagicpet-raw-com2-str-tgh-dex-hp-lifecycle',
  rows:expected.size,
  assertions:'runtime + raw COM2 + MultiList + stat lifecycle + HP RNG'
}));