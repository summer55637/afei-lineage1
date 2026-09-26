import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

const skill=id=>runtime.byId[String(id)];
assert.equal(skill(582)?.f,'PETSKILL_SelfExplodeAttack');
assert.equal(skill(612)?.f,'PETSKILL_BattleProperty');
assert.equal(skill(639)?.f,'PETSKILL_AntInter');
assert.equal(skill(642)?.f,'PETSKILL_Awaken');
assert.equal(skill(643)?.f,'PETSKILL_Temptation');

// fixed PETSKILL_functbl exact-name failures: the data rows exist, but these names are not registered.
// RandomSkill must preserve its earlier target RNG/scan, then PETSKILL_Use returns FALSE.
for(const fn of ['PETSKILL_SelfExplodeAttack','PETSKILL_Awaken','PETSKILL_Temptation']){
  assert.ok(game.includes("'"+fn+"'"),'missing fixed functbl failure '+fn);
}
assert.ok(game.includes('SOURCE_PLAYER_UNREGISTERED_PETSKILL_FUNCTIONS'));
assert.ok(game.includes('sourceFunctionMissing:true'));
assert.ok(game.includes("else if(action.sourceFunctionMissing)addLog"));

// 612 魔之詛咒: persistent per-battle CHAR_BATTLEPROPERTY callback.
assert.ok(game.includes('battlePropertyKeys=new Set()'));
assert.ok(game.includes('battleReverseKeys=new Set();battlePropertyKeys=new Set();battleElementWork=new Map();'));
assert.ok(game.includes('function sourcePerformPetBattlePropertySkill(pet,action)'));
assert.ok(game.includes("String(meta?.o||'')!=='PET_PetskillPropertyEvent'"));
assert.ok(game.includes('battlePropertyKeys.add(key)'));
assert.ok(game.includes('battleProperty:sourceBattlePropertyActive(desc)'));
assert.ok(game.includes("PETSKILL_BattleProperty')result=sourcePerformPetBattlePropertySkill"));

// PET_PetskillPropertyEvent source mapping:
// defender EARTH -> attacker WIND; WATER -> EARTH; FIRE -> WATER; WIND -> FIRE.
function propertyCounter(d){
  return {
    earth:d.water,
    water:d.fire,
    fire:d.wind,
    wind:d.earth,
    none:100-d.earth-d.water-d.fire-d.wind
  };
}
assert.deepEqual(
  propertyCounter({earth:40,water:30,fire:20,wind:10}),
  {earth:30,water:20,fire:10,wind:40,none:0}
);
assert.deepEqual(
  propertyCounter({earth:100,water:0,fire:0,wind:0}),
  {earth:0,water:0,fire:0,wind:100,none:0}
);
assert.ok(game.includes('earth:d.water'));
assert.ok(game.includes('water:d.fire'));
assert.ok(game.includes('fire:d.wind'));
assert.ok(game.includes('wind:d.earth'));
assert.ok(game.includes('none:100-d.earth-d.water-d.fire-d.wind'));

// BATTLE_AttrAdjust reads both base vectors first, then invokes each side callback independently.
const attrStart=game.indexOf('function battleAttrDamage');
const attrEnd=game.indexOf('const MAGIC_ATTR_KEYS',attrStart);
assert.ok(attrStart>=0&&attrEnd>attrStart);
const attr=game.slice(attrStart,attrEnd);
assert.ok(attr.includes('const baseA=sourceBattleElements(attacker?.elements),baseD=sourceBattleElements(defender?.elements);'));
assert.ok(attr.includes('attacker?.battleProperty?(sourceBattlePropertyCounterElements(baseD)||baseA):baseA'));
assert.ok(attr.includes('defender?.battleProperty?(sourceBattlePropertyCounterElements(baseA)||baseD):baseD'));

// CHAR_BATTLEPROPERTY is cleared when the Pet leaves battle and on full reset.
assert.ok(game.includes('function sourceClearPetBattleProperty(pet)'));
assert.ok((game.match(/sourceClearPetBattleProperty\(/g)||[]).length>=7);

// 639 蟻葬: RANDOMACT DefaultAttacker can only pick a live TargetCheck opponent;
// therefore the dead-Pet special branch is false and battle.c falls through to common physical attack.
assert.ok(game.includes('function sourcePerformPetAntInterSkill(pet,action,options={})'));
assert.ok(game.includes('sourceAntInterFallthrough:true'));
assert.ok(game.includes("PETSKILL_AntInter')result=sourcePerformPetAntInterSkill"));

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.76',
  focus:'player-petskill-functbl-battle-property-antinter',
  sourceFunctionMissing:[582,642,643],
  battlePropertySkill:612,
  antInterSkill:639
}));
