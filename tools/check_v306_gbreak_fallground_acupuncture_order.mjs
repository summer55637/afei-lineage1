import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const readme=fs.readFileSync('README.md','utf8');
const changelog=fs.readFileSync('CHANGELOG.md','utf8');

function sliceFunction(name){
  const start=game.indexOf('function '+name+'(');
  assert.ok(start>=0,'missing '+name);
  const end=game.indexOf('\nfunction ',start+10);
  return game.slice(start,end>start?end:start+30000);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const petGB=sliceFunction('sourcePerformPetGuardBreakSkill');
assert.ok(petGB.includes("r.sourceAcupunctureWakeTarget='attacker';"),
  'Pet GBreak Acupuncture WakeUp must follow fixed special-caller defindex order');

const petGB2=sliceFunction('sourcePerformPetGuardBreak2Skill');
assert.ok(petGB2.includes("r.sourceAcupunctureWakeTarget='attacker';"),
  'Pet GBreak2 Acupuncture WakeUp must follow fixed special-caller defindex order');

const petFall=sliceFunction('sourcePerformPetFallGroundSkill');
assert.ok(petFall.includes("sourceAcupunctureWakeTarget:'attacker'"),
  'Pet FallGround Acupuncture WakeUp must follow fixed special-caller defindex order');

const enemyGB=sliceFunction('performEnemyGuardBreak');
assert.ok(enemyGB.includes("r.sourceAcupunctureWakeTarget='attacker';"),
  'Enemy GBreak -> Pet special caller must preserve attacker WakeUp');

const enemyGB2=sliceFunction('performEnemyGuardBreak2');
assert.ok(enemyGB2.includes("r.sourceAcupunctureWakeTarget='attacker';"),
  'Enemy GBreak2 -> Pet special caller must preserve attacker WakeUp');

const enemyPet=sliceFunction('resolveEnemyAttackSeqBugToPet');
assert.ok(enemyPet.includes("r.originalTargetDesc={kind:'pet',pet,petId:pet.id};"));
assert.ok(enemyPet.includes("const guardian=attacker?.throwWeapon?null:sourceProfessionScapegoatGuardianForPet(unit,pet);"));
assert.ok(enemyPet.includes("r.sourceAcupunctureWakeTarget='attacker';"),
  'Enemy FallGround -> Pet must use calc-only Guardian and attacker WakeUp');
assert.ok(sliceFunction('performEnemyFallGround').includes('resolveEnemyAttackSeqBugToPet(unit,chosen.pet'),
  'Enemy FallGround -> Pet must not use ordinary real-Guardian attack helper');

const shared=sliceFunction('applyFriendlyEnemyHit');
assert.ok(shared.includes("options.sourceAcupunctureWakeTarget==='attacker'"));
assert.ok(shared.includes("r?.sourceAcupunctureWakeTarget==='attacker'"));

assert.match(html,/PLAYABLE CORE V3\.06/);
assert.match(readme,/PLAYABLE CORE V3\.06/);
assert.match(readme,/V3\.06 — GBreak／GBreak2／FallGround caller-sensitive Acupuncture WakeUp/);
assert.match(changelog,/V3\.06：GBreak／GBreak2／FallGround ACUPUNCTURE caller-sensitive WakeUp/);

console.log(JSON.stringify({
  pass:true,
  version:'V3.06',
  specialCallers:['GBreak','GBreak2','FallGround'],
  acupunctueWakeUpTarget:'attacker',
  enemyFallGroundPetGuardian:'calc-only',
  noGlobalRuleChange:true
}));
