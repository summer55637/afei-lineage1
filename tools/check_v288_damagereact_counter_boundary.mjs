import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const readme=fs.readFileSync('README.md','utf8');

function sliceFunction(name){
  const start=game.indexOf('function '+name+'(');
  assert.ok(start>=0,'missing '+name);
  const end=game.indexOf('\nfunction ',start+10);
  return game.slice(start,end>start?end:start+12000);
}

const react=sliceFunction('sourcePrepareAcupunctureReaction');
const trap=sliceFunction('sourcePrepareProfessionTrapReaction');
const petCounter=sliceFunction('resolvePetEnemyCounterChain');
const playerCounter=sliceFunction('resolvePlayerEnemyCounterChain');
const confusionCounter=sliceFunction('resolveConfusionCounterChain');

assert.match(react,/r\.sourceCounterBlockedByDamageReact=true/);
assert.ok(react.indexOf('r.sourceCounterBlockedByDamageReact=true')
  < react.indexOf('if(attackerView?.throwWeapon)'),
  'Acupuncture Counter block must be recorded before throw-weapon early return');

assert.match(trap,/r\.sourceCounterBlockedByDamageReact=true/);
assert.ok(trap.indexOf('r.sourceCounterBlockedByDamageReact=true')
  < trap.indexOf('if(attackerView?.throwWeapon)'),
  'TRAP Counter block must be recorded before throw-weapon early return');

for(const [name,body] of [
  ['resolvePetEnemyCounterChain',petCounter],
  ['resolvePlayerEnemyCounterChain',playerCounter],
  ['resolveConfusionCounterChain',confusionCounter]
]){
  assert.ok(body.includes('primaryResult?.sourceCounterBlockedByDamageReact'),name+' primary Counter gate');
  assert.ok(body.includes('if(r.sourceCounterBlockedByDamageReact||r.sourceCounterBlockedByTrap)'),name+' inner Counter gate');
}

const physical=sliceFunction('battleApplyPhysicalHit');
assert.ok(physical.includes('const acupuncture='));
assert.ok(physical.includes('sourceFinishAcupunctureReaction(acupuncture)'));
assert.ok(physical.includes('sourceLogAcupunctureReaction(acupuncture)'));

assert.match(game,/BATTLE_Attack sets ContFlg\/iRet FALSE/);
assert.match(html,/PLAYABLE CORE V2\.90/);
assert.match(readme,/PLAYABLE CORE V2\.90/);
assert.match(readme,/V2\.88 — pre-DamageReact Counter boundary/);

console.log(JSON.stringify({
  pass:true,
  version:'V2.90',
  boundary:'BATTLE_GetDamageReact pre-DamageSub Counter block',
  primaryCounterGates:3,
  innerCounterGates:3,
  throwWeaponProtected:true
}));
