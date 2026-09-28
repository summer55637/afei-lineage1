import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const readme=fs.readFileSync('README.md','utf8');
const pet=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const enemyAi=JSON.parse(fs.readFileSync('data/generated/stoneage_enemy_ai.json','utf8'));

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const legalRows=Object.values(pet.byId||{}).filter(row=>Number(row?.illegal)===0);
const familyFields=new Map();
for(const row of legalRows){
  const f=String(row?.f||'');
  if(!f)continue;
  if(!familyFields.has(f))familyFields.set(f,new Set());
  familyFields.get(f).add(Number(row?.field));
}

const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
assert.ok(loyalStart>=0&&loyalEnd>loyalStart,'player loyal dispatcher must exist');
const loyal=game.slice(loyalStart,loyalEnd);
const loyalDispatch=[...new Set([...loyal.matchAll(/meta\?\.f===['"]([^'"]+)['"]/g)].map(m=>m[1]))];

const sourceUnregistered=[
  'PETSKILL_SelfExplodeAttack',
  'PETSKILL_Awaken',
  'PETSKILL_Temptation'
].sort();
const sourceBattleFalse=[
  'PETSKILL_Fixitem',
  'PETSKILL_Inslay'
].sort();

const battleEligibleFamilies=[...familyFields.entries()]
  .filter(([,fields])=>[...fields].some(v=>v===0||v===1))
  .map(([f])=>f);
const uncoveredBattleFamilies=battleEligibleFamilies
  .filter(f=>!loyalDispatch.includes(f)&&!sourceUnregistered.includes(f)&&!sourceBattleFalse.includes(f))
  .sort();
const field2OnlyFamilies=[...familyFields.entries()]
  .filter(([,fields])=>[...fields].every(v=>v===2))
  .map(([f])=>f)
  .sort();

assert.equal(familyFields.size,64,'current legal PetSkill function-family count');
assert.equal(battleEligibleFamilies.length,63,'current battle/all PetSkill family count');
assert.equal(loyalDispatch.length,58,'current player battle loyal dispatcher count');
assert.deepEqual(
  sourceUnregistered.filter(f=>familyFields.has(f)).sort(),
  sourceUnregistered,
  'exact fixed-unregistered player PetSkill family set'
);
assert.deepEqual(
  sourceBattleFalse.filter(f=>familyFields.has(f)).sort(),
  sourceBattleFalse,
  'exact fixed battle-false player PetSkill family set'
);
assert.deepEqual(uncoveredBattleFamilies,[],'every current battle/all family must be dispatched or source-gated');
assert.deepEqual(field2OnlyFamilies,['PETSKILL_Fixitem','PETSKILL_Inslay','PETSKILL_Merge'],'field=2-only families must remain out of battle random dispatch');

const pendingCount=(game.match(/sourceRuntimePending:true/g)||[]).length;
assert.equal(pendingCount,7,'the seven defensive sourceRuntimePending guards remain explicit');

const randomStart=game.indexOf('function sourcePetRandomSkillPlan');
const randomEnd=game.indexOf('function sourcePetChargeSpec',randomStart);
assert.ok(randomStart>=0&&randomEnd>randomStart,'player random skill planner must exist');
const random=game.slice(randomStart,randomEnd);
assert.ok(random.includes('if(field!==0&&field!==1)continue;'),'field=2 skills must be skipped by battle random-skill scan');
assert.ok(random.includes('SOURCE_PLAYER_UNREGISTERED_PETSKILL_FUNCTIONS'),'player source-unregistered gate must remain before normal skill return');
assert.ok(random.includes('SOURCE_PLAYER_BATTLE_FALSE_PETSKILL_FUNCTIONS'),'player battle-false gate must remain before normal skill return');

const enemySetStart=game.indexOf('const ENEMY_SOURCE_UNREGISTERED_SKILL_IDS=new Set([');
const enemySetEnd=game.indexOf(');',enemySetStart)+2;
assert.ok(enemySetStart>=0&&enemySetEnd>enemySetStart,'enemy unregistered set must exist');
assert.match(game.slice(enemySetStart,enemySetEnd),/502,582/);

const enemyBattleFalseStart=game.indexOf('const ENEMY_SOURCE_BATTLE_FALSE_SKILL_IDS=new Set([');
const enemyBattleFalseEnd=game.indexOf(');',enemyBattleFalseStart)+2;
assert.ok(enemyBattleFalseStart>=0&&enemyBattleFalseEnd>enemyBattleFalseStart,'enemy battle-false set must exist');
assert.match(game.slice(enemyBattleFalseStart,enemyBattleFalseEnd),/540,572/);

const enemyChooseStart=game.indexOf('function enemyChooseAction');
const enemyChooseEnd=game.indexOf('function enemySignedSkillPercent',enemyChooseStart);
assert.ok(enemyChooseStart>=0&&enemyChooseEnd>enemyChooseStart,'enemy chooser must exist');
const enemyChoose=game.slice(enemyChooseStart,enemyChooseEnd);
assert.ok(enemyChoose.includes('ENEMY_SOURCE_UNREGISTERED_SKILL_IDS.has(Number(picked.skillId))'));
assert.ok(enemyChoose.includes('ENEMY_SOURCE_BATTLE_FALSE_SKILL_IDS.has(Number(picked.skillId))'));
assert.ok(enemyChoose.includes("sourceCWaitReason:'unregistered-function'"));
assert.ok(enemyChoose.includes("sourceCWaitReason:'battle-function-precondition-false'"));

const enemyActionStart=game.indexOf('function performEnemyAction');
const enemyActionEnd=game.indexOf('function levelCheck',enemyActionStart);
assert.ok(enemyActionStart>=0&&enemyActionEnd>enemyActionStart,'enemy action dispatcher must exist');
const enemyAction=game.slice(enemyActionStart,enemyActionEnd);

const boundaryIds=new Set([502,582,540,572]);
const usedSkillIds=new Set();
for(const row of Object.values(enemyAi.byEnemyId||{})){
  for(const rawId of (row?.p||[])){
    const id=Number(rawId);
    if(Number.isInteger(id))usedSkillIds.add(id);
  }
}
for(const id of boundaryIds)assert.equal(usedSkillIds.has(id),true,'current Enemy AI must retain source audit row '+id);

const dispatchFns=new Set([...enemyAction.matchAll(/meta\?\.f===['"]([^'"]+)['"]/g)].map(m=>m[1]));
const boundaryFunctions=new Map([
  [502,'ENEMYSKILL_EnemyHELP'],
  [582,'PETSKILL_SelfExplodeAttack'],
  [540,'PETSKILL_Fixitem'],
  [572,'PETSKILL_Inslay']
]);
const unresolvedEnemyFamilies=new Set();
for(const row of Object.values(enemyAi.byEnemyId||{})){
  for(const rawId of (row?.p||[])){
    const id=Number(rawId);
    if(!Number.isInteger(id)||boundaryIds.has(id))continue;
    const meta=pet.byId[String(id)]||null;
    const f=meta?.f||null;
    if(!f)continue;
    if(['PETSKILL_NormalAttack','PETSKILL_NormalGuard','PETSKILL_None'].includes(f))continue;
    if(!dispatchFns.has(f))unresolvedEnemyFamilies.add(f);
  }
}
assert.deepEqual([...unresolvedEnemyFamilies].sort(),[],'all other positive Enemy AI PetSkill families must reach an explicit dispatcher');

assert.match(html,/PLAYABLE CORE V2\.86/);
assert.match(readme,/PLAYABLE CORE V2\.86/);
assert.match(readme,/V2\.86 — PetSkill source closure audit/);

console.log(JSON.stringify({
  pass:true,
  version:'V2.86',
  legalFunctionFamilies:familyFields.size,
  battleEligibleFamilies:battleEligibleFamilies.length,
  loyalDispatcherFamilies:loyalDispatch.length,
  field2OnlyFamilies:field2OnlyFamilies,
  sourceUnregisteredPlayer:[582,642,643],
  sourceBattleFalsePlayer:[540,572],
  enemyUnregistered:[502,582],
  enemyBattleFalse:[540,572],
  sourceRuntimePendingGuards:pendingCount
}));
