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
  return game.slice(start,end>start?end:start+18000);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const real=sliceFunction('resolveAttackToEnemyWithGuardian');
assert.ok(real.includes('disableDodge:true,skipSuitDodge:!!guardian'));
assert.ok(real.includes('const guardian=attacker?.throwWeapon?null:enemyGuardianFor(target,options.attackerUnit||null);'));
assert.ok(real.includes('sourceBattleDuckTotal(attacker,originalView,options)'));
assert.equal(real.includes('skipSuitDodge:true')); // the real path may only use the conditional guardian gate.

const calc=sliceFunction('sourceProfessionPhysicalCalcOnlyResult');
assert.ok(calc.includes('skipSuitDodge:!!guardian'));
assert.ok(calc.includes('const guardian=attacker?.throwWeapon?null:enemyGuardianFor(target,null);'));

const directPlayer=sliceFunction('resolveEnemyDirectAttackToPlayer');
assert.ok(directPlayer.includes('disableDodge:true,skipSuitDodge:true'));

const directPet=sliceFunction('resolveEnemyDirectAttackToPet');
assert.ok(directPet.includes('disableDodge:true,skipSuitDodge:true'));

assert.match(html,/PLAYABLE CORE V2\.95/);
assert.match(html,/PLAYABLE CORE V2\.91/);
assert.match(html,/PLAYABLE CORE V2\.90/);
assert.match(readme,/PLAYABLE CORE V2\.95/);
assert.match(readme,/V2\.95 — Guardian substitution must not re-run suit dodge/);
assert.match(changelog,/V2\.95：Guardian substitution 不重跑第二次 suit dodge/);

console.log(JSON.stringify({
  pass:true,
  version:'V2.95',
  guardianSecondSuitDodge:'disabled-after-substitution',
  originalTargetFirstSuitDodge:'preserved'
}));
