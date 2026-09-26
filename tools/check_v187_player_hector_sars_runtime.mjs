import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const skill=id=>runtime.byId[String(id)];

assert.equal(skill(617)?.f,'PETSKILL_Sars');
assert.equal(skill(617)?.o,'煞');
assert.equal(Number(skill(617)?.illegal),0);
assert.equal(skill(620)?.f,'PETSKILL_Hector');
assert.equal(skill(620)?.o,'麻 turn 1 攻%-30 敏%-30');
assert.equal(Number(skill(620)?.illegal),0);

// petBattleView must allow same-round WORKQUICK overrides without changing FIXDEX.
const petViewStart=game.indexOf('function petBattleView');
const petViewEnd=game.indexOf('function enemyBattleView',petViewStart);
const petView=game.slice(petViewStart,petViewEnd);
assert.ok(petView.includes("powerMod&&Number.isFinite(Number(powerMod.quick))"));
assert.ok(petView.includes('fixedDex=frozen?Number(frozen.fixedDex):normalQuickBase'));

// Existing Enemy Sars path must no longer reject sars.
const enemyStatusStart=game.indexOf('function sourceEnemyApplyStatusAttackHit');
const enemyStatusEnd=game.indexOf('function performEnemyStatusChange',enemyStatusStart);
const enemyStatus=game.slice(enemyStatusStart,enemyStatusEnd);
assert.ok(enemyStatus.includes("type==='sars'"));
assert.ok(enemyStatus.includes("if(type==='sars')"));
assert.ok(enemyStatus.includes('battleSarsApplyRaw(targetDesc,storedTurns,true)'));

const hectorHelperStart=game.indexOf('function sourcePerformPetHectorParalysis');
const hectorStart=game.indexOf('function sourcePerformPetHectorSkill',hectorHelperStart);
const sarsStart=game.indexOf('function sourcePerformPetSarsSkill',hectorStart);
const gyrateStart=game.indexOf('function sourcePerformPetGyrateSkill',sarsStart);
assert.ok(hectorHelperStart>=0&&hectorStart>hectorHelperStart&&sarsStart>hectorStart&&gyrateStart>sarsStart);

const hectorHelper=game.slice(hectorHelperStart,hectorStart);
assert.ok(hectorHelper.includes('const roll=cRand(1,100)'));
assert.ok(hectorHelper.indexOf('const roll=cRand(1,100)')<hectorHelper.indexOf('if(n(target.hp)<=0)'));
assert.ok(hectorHelper.indexOf('const roll=cRand(1,100)')<hectorHelper.indexOf('if(battleHasAnyStatus(targetDesc))'));
assert.ok(hectorHelper.includes('if(roll>=60)'));
assert.ok(hectorHelper.includes("battleStatuses.set(key,{type:'paralysis',turns:1,sourceHector:true})"));

const hector=game.slice(hectorStart,sarsStart);
assert.ok(hector.includes("enemySignedSkillPercent(meta?.o,'攻%')"));
assert.ok(hector.includes("enemySignedSkillPercent(meta?.o,'敏%')"));
assert.ok(hector.includes('baseAttack+Math.trunc(baseAttack*attackPct/100)'));
assert.ok(hector.includes('baseQuick+Math.trunc(baseQuick*quickPct/100)'));
assert.ok(hector.includes('battlePetPowerMods.set(pet.id'));
assert.ok(hector.includes('attack,quick'));
assert.ok(hector.indexOf('sourcePerformPetHectorParalysis')<hector.indexOf('sourcePetEnemyTargetFromAction(action)'));
assert.ok(hector.includes('sourceNoGeneralStatusRoll:true'));
assert.ok(hector.includes('sourceOrderAlreadyFixed:true'));
assert.ok(hector.includes("resolvePetEnemyCounterChain('pet',pet,target,r)"));

// Sars: default turn 3, general status after damage/wakeup but before ItemCrush,
// direct infection marks WORKMODSARS-equivalent carrier state.
const sars=game.slice(sarsStart,gyrateStart);
assert.ok(sars.includes('const turn=3'));
assert.ok(sars.includes('sourcePetEnemyTargetFromAction(action)'));
assert.ok(sars.includes("{deferItemCrush:true}"));
assert.ok(sars.includes("sourcePetApplyStatusAttackHit(pet,actualDesc,r,'sars',turn,label)"));
assert.ok(sars.indexOf("sourcePetApplyStatusAttackHit(pet,actualDesc,r,'sars',turn,label)")<sars.indexOf('sourceBattleFinalizeItemCrushRng(r)'));
assert.ok(sars.indexOf('sourceBattleFinalizeItemCrushRng(r)')<sars.indexOf('sourceProcessBattleDeathsAtAddProfit()'));
assert.ok(sars.includes("resolvePetEnemyCounterChain('pet',pet,target,r)"));

// Shared player SARS helper stores turn+1 and carrier flag.
const petStatusStart=game.indexOf('function sourcePetApplyStatusAttackHit');
const petStatusEnd=game.indexOf('function sourcePerformPetStatusSkill',petStatusStart);
const petStatus=game.slice(petStatusStart,petStatusEnd);
assert.ok(petStatus.includes("if(type==='sars')"));
assert.ok(petStatus.includes('storedTurns=Math.max(1,Math.trunc(n(turn))+1)'));
assert.ok(petStatus.includes('battleSarsApplyRaw(targetDesc,storedTurns,true)'));

// Dispatcher is live before pending fallback.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
for(const f of ['PETSKILL_Hector','PETSKILL_Sars']){
  assert.ok(loyal.includes("meta?.f==='"+f+"'"),f+' dispatcher');
  assert.ok(loyal.indexOf("meta?.f==='"+f+"'")<loyal.indexOf('sourceRuntimePending:true'),f+' before pending');
}

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.87',
  focus:'player-randomact-hector-sars-plus-enemy-sars-repair',
  skills:[617,620]
}));
