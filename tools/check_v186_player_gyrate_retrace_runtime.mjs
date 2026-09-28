import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const skill=id=>runtime.byId[String(id)];

for(const [id,o] of [[619,'攻%-50'],[653,'攻%+20'],[667,'攻%+50'],[831,'攻%+80']]){
  assert.equal(skill(id)?.f,'PETSKILL_Gyrate','gyrate '+id+' function');
  assert.equal(skill(id)?.o,o,'gyrate '+id+' option');
  assert.equal(Number(skill(id)?.illegal),0,'gyrate '+id+' legal');
}
for(const [id,o] of [[621,'攻%+20'],[713,'攻%+100'],[735,'攻%+50']]){
  assert.equal(skill(id)?.f,'PETSKILL_Retrace','retrace '+id+' function');
  assert.equal(skill(id)?.o,o,'retrace '+id+' option');
  assert.equal(Number(skill(id)?.illegal),0,'retrace '+id+' legal');
}

const gyrateStart=game.indexOf('function sourcePerformPetGyrateSkill');
const retraceStart=game.indexOf('function sourcePerformPetRetraceSkill',gyrateStart);
const wildStart=game.indexOf('function sourcePerformPetWildViolentSkill',retraceStart);
assert.ok(gyrateStart>=0&&retraceStart>gyrateStart&&wildStart>retraceStart);
const gyrate=game.slice(gyrateStart,retraceStart);
const retrace=game.slice(retraceStart,wildStart);

// Gyrate uses raw COM2 row, not TargetAdjust, and snapshots the five-slot row.
assert.ok(gyrate.includes('const rawDefNo=sourceBattleStatusSlot(action?.targetDesc)'));
assert.ok(gyrate.includes('if(rawDefNo<5)rowStart=0'));
assert.ok(gyrate.includes('else if(rawDefNo<10)rowStart=5'));
assert.ok(gyrate.includes('else if(rawDefNo<15)rowStart=10'));
assert.ok(gyrate.includes('else rowStart=15'));
assert.ok(gyrate.includes('for(let slot=rowStart;slot<rowStart+5;slot++)'));
assert.ok(gyrate.includes("sourceBattleStatusSlot({kind:'enemy',unit})===slot"));
assert.ok(gyrate.includes('battlePetPowerMods.set(pet.id'));
assert.ok(gyrate.includes('sourceGyrate:true'));
assert.equal(gyrate.includes('sourcePetEnemyTargetFromAction(action)'),false);
assert.equal(gyrate.includes('resolvePetEnemyCounterChain'),false);
assert.equal(gyrate.includes('sourceProcessBattleDeathsAtAddProfit'),false);
assert.ok(gyrate.includes('sourceNoCounter:true'));
assert.ok(gyrate.includes('sourceNoImmediateAddProfit:true'));

// Retrace: Pet has no CHAR_ARM so attack_max is source-fixed to 1.
// Follow-up only happens on DODGE and strict RAND(1,100)<80.
assert.ok(retrace.includes('attackMax:1'));
assert.ok(retrace.includes('if(primary?.dodged)'));
assert.ok(retrace.includes('retraceRoll=cRand(1,100)'));
assert.ok(retrace.includes('if(retraceRoll<80)'));
assert.ok(retrace.includes('boostedAttack=fixAttack+Math.trunc(fixAttack*.2)'));
assert.ok(retrace.includes('sourceRetrace:true'));
assert.ok(retrace.includes('sourceOptionIgnored:true'));
assert.equal(retrace.includes("enemySignedSkillPercent(meta?.o,'攻%')"),false);

// ItemCrush is per BATTLE_Attack, AddProfit only once after optional follow-up.
// Counter uses primary result, not follow-up result.
assert.ok(retrace.includes("{deferItemCrush:true}"));
assert.ok(retrace.includes('sourceBattleFinalizeItemCrushRng(primary)'));
assert.ok(retrace.includes('sourceBattleFinalizeItemCrushRng(follow)'));
assert.ok(retrace.indexOf('sourceProcessBattleDeathsAtAddProfit()')>retrace.indexOf('sourceBattleFinalizeItemCrushRng(follow)'));
assert.ok(retrace.includes("resolvePetEnemyCounterChain('pet',pet,target,primary)"));
assert.ok(retrace.includes('sourceCounterUsesPrimary:true'));

// Dispatcher is live before pending fallback.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
for(const f of ['PETSKILL_Gyrate','PETSKILL_Retrace']){
  assert.ok(loyal.includes("meta?.f==='"+f+"'"),f+' dispatcher');
  assert.ok(loyal.indexOf("meta?.f==='"+f+"'")<loyal.indexOf('sourceRuntimePending:true'),f+' before pending');
}

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.86',
  focus:'player-randomact-gyrate-retrace',
  gyrate:[619,653,667,831],
  retrace:[621,713,735]
}));
