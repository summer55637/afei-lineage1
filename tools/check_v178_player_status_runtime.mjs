import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const skill=id=>runtime.byId[String(id)];

// Fixed rows used by the V1.78 player low-loyalty RANDOMACT path.
const expected=[
  [326,'PETSKILL_Refresh','全',3],
  [575,'PETSKILL_Weaken','虚 turn 3 成 50',6],
  [576,'PETSKILL_Weaken','虚 turn 3 成 50',3],
  [577,'PETSKILL_Deeppoison','剧 turn 5 成 50',6],
  [578,'PETSKILL_Deeppoison','剧 turn 5 成 50',3],
  [579,'PETSKILL_Barrier','障 turn 1 成 50',3],
  [580,'PETSKILL_Nocast','默 turn 3 成 50',3],
  [583,'PETSKILL_Refresh','默',2],
  [584,'PETSKILL_Refresh','剧',2],
  [591,'PETSKILL_Refresh','障',1],
  [592,'PETSKILL_Refresh','全',2],
  [593,'PETSKILL_Refresh','虚',2],
  [594,'PETSKILL_Barrier','障 turn 3 成 50',3],
  [672,'PETSKILL_Nocast','默 turn 3 成 50',3],
  [673,'PETSKILL_Barrier','障 turn 2 成 50',3],
  [836,'PETSKILL_Barrier','障 turn 5 成 99',3],
  [837,'PETSKILL_Nocast','默 turn 5 成 99',3],
  [840,'PETSKILL_Deeppoison','剧 turn 5 成 99',3]
];
for(const [id,f,o,target] of expected){
  assert.equal(skill(id)?.f,f,'skill '+id+' function');
  assert.equal(skill(id)?.o,o,'skill '+id+' option');
  assert.equal(skill(id)?.target,target,'skill '+id+' target metadata');
}

// Fixed BATTLE_PetRandomSkill chooses one DefaultAttacker target before PETSKILL_Use.
// PETSKILL_Use passes that toindex through unchanged; target metadata does not expand it.
const randomStart=game.indexOf('function sourcePetRandomSkillPlan');
const randomEnd=game.indexOf('function sourcePetChargeSpec',randomStart);
assert.ok(randomStart>=0&&randomEnd>randomStart);
const randomPlan=game.slice(randomStart,randomEnd);
assert.ok(randomPlan.includes('const targetDesc=sourcePetRandomEnemyTarget()'));
assert.ok(randomPlan.includes("return {kind:'skill',skillSlot:iNum,skillId,meta,targetDesc}"));

const specialStart=game.indexOf('function sourcePetSpecialStatusTarget');
const specialEnd=game.indexOf('function sourcePerformPetGuardianSkill',specialStart);
assert.ok(specialStart>=0&&specialEnd>specialStart);
const special=game.slice(specialStart,specialEnd);
assert.ok(special.includes("action?.targetDesc?.kind==='enemy'?action.targetDesc.unit:null"));
assert.equal(special.includes('meta?.target'),false);

// Refresh follows BATTLE_MultiStatusRecovery: last positive StatusTbl entry wins,
// "全" clears only that one, and specific recovery must match that selected status.
assert.ok(special.includes('const SOURCE_REFRESH_STATUS_ORDER=Object.freeze(['));
const orderText=game.slice(
  game.indexOf('const SOURCE_REFRESH_STATUS_ORDER'),
  game.indexOf('function sourceRefreshLastStatus')
);
for(const token of [
  "'poison'","'paralysis'","'sleep'","'stone'","'drunk'","'confusion'",
  "'weaken'","'deepPoison'","'barrier'","'nocast'","'sars'","'dizzy'"
])assert.ok(orderText.includes(token));
assert.ok(special.includes("const all=option.includes('全')"));
assert.ok(special.includes('if(current&&(all||requested===current))'));
assert.ok(special.includes("if(type==='sars')return battleSarsClear(targetDesc)"));

// StatusAttackCheck exact parameter family for these four commands.
assert.ok(special.includes('{perOffset:spec.success,range:30,bai:1,forceGeneral:true}'));
assert.ok(special.includes("if(type==='deepPoison')"));
assert.ok(special.includes('storedTurns=spec.turns+2'));
assert.ok(special.includes("if(type==='nocast')"));
assert.ok(special.includes('storedTurns=spec.turns;'));
assert.ok(special.includes('storedTurns=spec.turns+1'));
assert.ok(special.includes('battleStatusApply(targetDesc,type,spec.turns)'));

// Standalone special commands have no physical hit / counter path.
assert.equal(special.includes('resolveNormalAttack'),false);
assert.equal(special.includes('resolvePetEnemyCounterChain'),false);

// All five functions are dispatched before the sourceRuntimePending fallback.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
for(const f of ['PETSKILL_Refresh','PETSKILL_Weaken','PETSKILL_Deeppoison','PETSKILL_Barrier','PETSKILL_Nocast']){
  assert.ok(loyal.includes("meta?.f==='"+f+"'"),f+' dispatch');
}
const pendingPos=loyal.indexOf('sourceRuntimePending:true');
for(const f of ['PETSKILL_Refresh','PETSKILL_Weaken','PETSKILL_Deeppoison','PETSKILL_Barrier','PETSKILL_Nocast']){
  assert.ok(loyal.indexOf("meta?.f==='"+f+"'")<pendingPos,f+' dispatch before pending');
}

assert.ok(html.includes('PLAYABLE CORE V1.78'));

console.log(JSON.stringify({
  pass:true,
  version:'V1.78',
  focus:'player-randomact-refresh-weaken-deeppoison-barrier-nocast',
  rows:expected.length
}));