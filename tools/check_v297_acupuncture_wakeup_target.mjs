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
  return game.slice(start,end>start?end:start+22000);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const hit=sliceFunction('battleApplyPhysicalHit');
assert.ok(hit.includes('const wakeDesc=acupuncture.triggered?(r?.originalTargetDesc||targetDesc):targetDesc;'),
  'primary ACUPUNCTURE WakeUp must use original defNo; prefer originalTargetDesc when Guardian substitution exists');
assert.equal(hit.includes('const wakeDesc=acupuncture.triggered?attackerDesc:targetDesc;'),false,
  'primary ACUPUNCTURE WakeUp must not use the temporary attacker defindex');
assert.ok(hit.includes('if(!(counter&&acupuncture.triggered))battleStatusWakeOnDamage(wakeDesc,r.damage);'),
  'ACUPUNCTURE WakeUp must not duplicate the Counter reflected-attacker WakeUp');
assert.ok(hit.includes('sourceFinishAcupunctureReaction(acupuncture);'),
  'Acupuncture reaction lifecycle must remain before WakeUp');

const finish=sliceFunction('sourceFinishAcupunctureReaction');
assert.ok(finish.includes('if(counter&&reflectedDamage>0)battleStatusWakeOnDamage(attackerDesc,reflectedDamage);'),
  'Counter Acupuncture WakeUp boundary must remain in sourceFinish');
assert.ok(finish.includes('targetUnit.acupunctureActive=false'),
  'Acupuncture source state must still be consumed');

const trap=sliceFunction('sourceFinishProfessionTrapReaction');
assert.ok(trap.includes('battleStatusWakeOnDamage(attackerDesc,trapDamage);'),
  'Trap attacker WakeUp boundary must remain unchanged');

assert.match(html,/PLAYABLE CORE V2\.97/);
assert.match(html,/PLAYABLE CORE V2\.96/);
assert.match(html,/PLAYABLE CORE V2\.95/);
assert.match(html,/PLAYABLE CORE V2\.94/);
assert.match(readme,/PLAYABLE CORE V2\.97/);
assert.match(readme,/V2\.97 — ACUPUNCTURE WakeUp follows fixed DamageSub defindex/);
assert.match(changelog,/V2\.97：ACUPUNCTURE 反傷後 WakeUp 目標對齊 fixed defindex/);

console.log(JSON.stringify({
  pass:true,
  version:'V2.97 regression refreshed by V3.02 source-order correction',
  primaryAcupunctureWakeUp:'original-defender',
  counterAcupunctureWakeUp:'sourceFinishAcupunctureReaction',
  trapWakeUp:'attacker'
}));
