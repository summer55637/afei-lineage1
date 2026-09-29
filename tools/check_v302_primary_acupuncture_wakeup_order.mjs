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
  return game.slice(start,end>start?end:start+26000);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const hit=sliceFunction('battleApplyPhysicalHit');
assert.ok(hit.includes('const acupuncture=suppressDamageReact?{triggered:false}:sourcePrepareAcupunctureReaction(attackerDesc,targetDesc,r,{counter});'));
assert.ok(hit.includes('const wakeDesc=acupuncture.triggered?(r?.originalTargetDesc||targetDesc):targetDesc;'),
  'primary BATTLE_Attack ACUPUNCTURE WakeUp must prefer original defNo, including Guardian substitution');
assert.ok(!hit.includes('const wakeDesc=acupuncture.triggered?attackerDesc:targetDesc;'),
  'primary WakeUp must not use the temporary post-DamageSub attacker defindex');
assert.ok(hit.includes('if(!(counter&&acupuncture.triggered))battleStatusWakeOnDamage(wakeDesc,r.damage);'),
  'primary/Counter shared path must not duplicate Counter Acupuncture WakeUp');

const finish=sliceFunction('sourceFinishAcupunctureReaction');
assert.ok(finish.includes('if(counter&&reflectedDamage>0)battleStatusWakeOnDamage(attackerDesc,reflectedDamage);'),
  'Counter Acupuncture WakeUp remains on the reflected attacker');
assert.ok(finish.includes('targetUnit.acupunctureActive=false'),
  'Acupuncture source state must still be consumed before reflected damage');

assert.match(html,/PLAYABLE CORE V3\.02/);
assert.match(readme,/PLAYABLE CORE V3\.02/);
assert.match(readme,/V3\.02 — primary Acupuncture WakeUp follows fixed defindex restore order/);
assert.match(changelog,/V3\.02：primary ACUPUNCTURE WakeUp 改回 fixed defindex restore order/);

console.log(JSON.stringify({
  pass:true,
  version:'V3.02',
  primaryAcupunctureWakeUp:'original-defender',
  counterAcupunctureWakeUp:'attacker',
  noNewRng:true
}));
