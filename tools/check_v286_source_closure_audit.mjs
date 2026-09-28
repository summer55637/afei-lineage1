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
  'PETSKILL_Merge',
  'PETSKILL_Fixitem',
  'PETSKILL_Inslay'
].sort();

const battleEligibleFamilies=[...familyFields.entries()]
  .filter(([,fields])=>[...fields].some(v=>v===0||v===1))
  .map(([f])=>f)
  .sort();
const field2OnlyFamilies=[...familyFields.entries()]
  .filter(([,fields])=>[...fields].every(v=>v===2))
  .map(([f])=>f)
  .sort();

assert.equal(familyFields.size,64,'current legal PetSkill function-family count');
assert.equal(battleEligibleFamilies.length,61,'current battle/all declared PetSkill family count');
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
assert.deepEqual(
  field2OnlyFamilies,
  ['PETSKILL_Fixitem','PETSKILL_Inslay','PETSKILL_Merge'],
  'field=2-only family set changed'
);
assert.equal(
  loyalDispatch.length+sourceUnregistered.length+sourceBattleFalse.length,
  familyFields.size,
  'every legal player PetSkill family must be classified as dispatcher, source-unregistered, or source-battle-false'
);
assert.ok(legalRows.length>0,'legal PetSkill rows must exist');

for(const id of ['200','201']){
  assert.equal(pet.byId[id]?.f,'PETSKILL_Merge','PETSKILL_Merge runtime row '+id);
  assert.equal(Number(pet.byId[id]?.field),2,'PETSKILL_Merge field '+id);
}
assert.ok(
  /const SOURCE_PLAYER_BATTLE_FALSE_PETSKILL_FUNCTIONS=new Set\(\[\s*'PETSKILL_Merge'/.test(game),
  'player battle-false set must start with PETSKILL_Merge'
);

const varyStart=game.indexOf('function sourcePerformPetVarySkill');
const varyEnd=game.indexOf('\nfunction ',varyStart+10);
const varyFn=game.slice(varyStart,varyEnd>varyStart?varyEnd:varyStart+2500);
assert.ok(varyFn.includes('SOURCE_VARY_WOLF_PETIDS.has'),'Vary must keep fixed CHAR_PETID 981..984 gate before transform state');

const setDuckStart=game.indexOf('function sourcePerformPetSetDuckRandomSkill');
const setDuckEnd=game.indexOf('\nfunction ',setDuckStart+10);
const setDuckFn=game.slice(setDuckStart,setDuckEnd>setDuckStart?setDuckEnd:setDuckStart+2500);
assert.ok(setDuckFn.includes('sourceSetDuckSelfTargetGate'),'SetDuck RANDOMACT self-target FALSE boundary must remain explicit');

const sacrificeStart=game.indexOf('function sourcePerformPetSacrificeSkill');
const sacrificeEnd=game.indexOf('\nfunction ',sacrificeStart+10);
const sacrificeFn=game.slice(sacrificeStart,sacrificeEnd>sacrificeStart?sacrificeEnd:sacrificeStart+3000);
assert.ok(sacrificeFn.includes('beforeCaster>maxCaster*.2'),'Sacrifice source gate must remain strict HP > 20%');
assert.ok(sacrificeFn.includes('sourceUseFailed:true'),'Sacrifice source-false result must remain explicit');

const roleBoundFns=[
  'PETSKILL_BattleTimid',
  'PETSKILL_BattleProperty',
  'PETSKILL_BattleTearDamage',
  'PETSKILL_Lighttakeed',
  'PETSKILL_AttackCrazed',
  'PETSKILL_AttackShoot'
];
for(const f of roleBoundFns){
  assert.ok(loyal.includes("meta?.f==='"+f+"'"),f+' player Pet dispatcher');
}

const specialNoCounterFns=[
  'sourcePerformPetMagicStatusChangeSkill',
  'sourcePerformPetBattlePropertySkill',
  'sourcePerformPetFallGroundSkill',
  'sourcePerformPetBattleTimidSkill',
  'sourcePerformPet2BattleTimidSkill',
  'sourcePerformPetLighttakeedSkill',
  'sourcePerformPetDamageToHpSkill',
  'sourcePerformPetMpDamageSkill',
  'sourcePerformPetTearSkill',
  'sourcePerformPetSonicSkill',
  'sourcePerformPetRegretSkill',
  'sourcePerformPetFirekillSkill',
  'sourcePerformPetGyrateSkill',
  'sourcePerformPetBattleModelSkill'
];
for(const f of specialNoCounterFns){
  const fnStart=game.indexOf('function '+f);
  assert.ok(fnStart>=0,f+' source handler');
  const fnEnd=game.indexOf('\nfunction ',fnStart+10);
  const body=game.slice(fnStart,fnEnd>fnStart?fnEnd:fnStart+12000);
  assert.ok(body.includes('sourceNoCounter:true'),f+' must preserve fixed special-command no-counter boundary');
}

const setDuckCounterAuditStart=game.indexOf('function sourcePerformPetSetDuckRandomSkill');
const setDuckCounterAuditEnd=game.indexOf('\nfunction ',setDuckCounterAuditStart+10);
const setDuckCounterAuditBody=game.slice(setDuckCounterAuditStart,setDuckCounterAuditEnd>setDuckCounterAuditStart?setDuckCounterAuditEnd:setDuckCounterAuditStart+4000);
assert.ok(setDuckCounterAuditBody.includes('sourceSetDuckSelfTargetGate'),'SetDuck must preserve fixed self-target FALSE boundary');

const commonCounterFns=[
  'sourcePerformPetAcupunctureSkill',
  'sourcePerformPetHectorSkill',
  'sourcePerformPetSarsSkill',
  'sourcePerformPetBecomePigSkill',
  'sourcePerformPetRetraceSkill'
];
for(const f of commonCounterFns){
  const fnStart=game.indexOf('function '+f);
  assert.ok(fnStart>=0,f+' source handler');
  const fnEnd=game.indexOf('\nfunction ',fnStart+10);
  const body=game.slice(fnStart,fnEnd>fnStart?fnEnd:fnStart+12000);
  assert.ok(body.includes('resolvePetEnemyCounterChain'),f+' must retain source common-loop counter path');
}

assert.ok(game.includes('SOURCE_PLAYER_BATTLE_FALSE_PETSKILL_FUNCTIONS.has(String(meta.f||\'\'))'));
assert.ok(game.includes('sourceBattlePreconditionFalse:true'));
const counterHelperStart=game.indexOf('function resolvePetEnemyCounterChain');
const counterHelperEnd=game.indexOf('\nfunction ',counterHelperStart+10);
const counterHelper=game.slice(counterHelperStart,counterHelperEnd>counterHelperStart?counterHelperEnd:counterHelperStart+9000);
assert.ok(counterHelper.includes('attackerHasDamageReact'),'Counter helper must preserve fixed BATTLE_Attack attacker DamageReact FALSE boundary');
assert.ok(counterHelper.includes('targetHasDamageReact'),'Counter helper must preserve fixed BATTLE_Attack original-target DamageReact FALSE boundary');

const randomStart=game.indexOf('function sourcePetRandomSkillPlan');
const randomEnd=game.indexOf('function sourcePetChargeSpec',randomStart);
assert.ok(randomStart>=0&&randomEnd>randomStart,'player random skill planner must exist');
const random=game.slice(randomStart,randomEnd);
assert.ok(random.includes('if(field!==0&&field!==1)continue;'),'battle random scan must keep field filter');
assert.ok(random.includes('SOURCE_PLAYER_UNREGISTERED_PETSKILL_FUNCTIONS'),'player source-unregistered gate must remain');
assert.ok(random.includes('SOURCE_PLAYER_BATTLE_FALSE_PETSKILL_FUNCTIONS'),'player source-battle-false gate must remain');

const noneStart=loyal.indexOf("if(action.kind==='none')");
assert.ok(noneStart>=0,'loyal none result branch missing');
const noneBranch=loyal.slice(noneStart,noneStart+1300);
assert.ok(noneBranch.includes('action.sourceBattlePreconditionFalse'),'battle-false result must be logged before generic sourceUseFailed');
assert.ok(noneBranch.includes('sourceBattlePreconditionFalse:!!action.sourceBattlePreconditionFalse'),'battle-false flag must survive loyal-result wrapping');

const pendingCount=(game.match(/sourceRuntimePending:true/g)||[]).length;
assert.equal(pendingCount,7,'the seven defensive sourceRuntimePending guards remain explicit');

const enemyUnregisteredStart=game.indexOf('const ENEMY_SOURCE_UNREGISTERED_SKILL_IDS=new Set([');
assert.ok(enemyUnregisteredStart>=0,'enemy unregistered set must exist');
const enemyUnregisteredText=game.slice(enemyUnregisteredStart,game.indexOf(');',enemyUnregisteredStart)+2);
assert.match(enemyUnregisteredText,/502,582/);

const enemyBattleFalseStart=game.indexOf('const ENEMY_SOURCE_BATTLE_FALSE_SKILL_IDS=new Set([');
assert.ok(enemyBattleFalseStart>=0,'enemy battle-false set must exist');
const enemyBattleFalseText=game.slice(enemyBattleFalseStart,game.indexOf(');',enemyBattleFalseStart)+2);
assert.match(enemyBattleFalseText,/540,572/);

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
const enemyDispatchFns=new Set([...enemyAction.matchAll(/meta\?\.f===['"]([^'"]+)['"]/g)].map(m=>m[1]));

const boundaryIds=new Set([502,582,540,572]);
const usedSkillIds=new Set();
for(const row of Object.values(enemyAi.byEnemyId||{})){
  for(const rawId of (row?.p||[])){
    const id=Number(rawId);
    if(Number.isInteger(id))usedSkillIds.add(id);
  }
}
for(const id of boundaryIds){
  assert.equal(usedSkillIds.has(id),true,'current Enemy AI must retain source audit row '+id);
}

const unresolvedEnemyFamilies=new Set();
for(const row of Object.values(enemyAi.byEnemyId||{})){
  for(const rawId of (row?.p||[])){
    const id=Number(rawId);
    if(!Number.isInteger(id)||boundaryIds.has(id))continue;
    const f=pet.byId[String(id)]?.f||null;
    if(!f||['PETSKILL_NormalAttack','PETSKILL_NormalGuard','PETSKILL_None'].includes(f))continue;
    if(!enemyDispatchFns.has(f))unresolvedEnemyFamilies.add(f);
  }
}
assert.deepEqual([...unresolvedEnemyFamilies].sort(),[],'all other positive Enemy AI PetSkill families must reach an explicit dispatcher');

assert.match(html,/PLAYABLE CORE V2\.89/);
assert.match(readme,/PLAYABLE CORE V2\.89/);
assert.match(readme,/V2\.86 — PetSkill source closure audit/);

console.log(JSON.stringify({
  pass:true,
  version:'V2.89',
  legalFunctionFamilies:familyFields.size,
  battleAllDeclaredFamilies:battleEligibleFamilies.length,
  playerDispatcherFamilies:loyalDispatch.length,
  field2OnlyFamilies,
  playerSourceUnregistered:[582,642,643],
  playerSourceBattleFalse:[200,201,540,572],
  enemySourceUnregistered:[502,582],
  enemySourceBattleFalse:[540,572],
  sourceRuntimePendingGuards:pendingCount
}));
