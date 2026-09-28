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

const guardian=sliceFunction('enemyGuardianFor');
assert.ok(guardian.includes("battleStatusCanMove(desc)"),'Guardian must retain existing movement-state gate');
assert.ok(guardian.includes("battleStatusActive(desc,'confusion')"),'Guardian must retain confusion gate');
assert.ok(guardian.includes("battleStatusActive(desc,'instigate')"),'fixed CHAR_WORKINSTIGATE blocker is missing');
assert.ok(guardian.includes('guardian===attackerUnit'),'Guardian self/attacker exclusion missing');
assert.ok(guardian.includes('guardian.guardianReadyThisTurn'),'Guardian readiness boundary missing');

// Do not silently turn the generic Enemy PETSKILL_ChargeAttack state into CHAR_DOOMTIME.
assert.ok(guardian.includes('Do NOT map generic chargeState to CHAR_DOOMTIME'),
  'must keep DoomTime / generic Enemy charge state fail-closed');

const real=sliceFunction('resolveAttackToEnemyWithGuardian');
assert.ok(real.includes('disableDodge:true,skipSuitDodge:true'),'V2.95 Guardian second suit-dodge boundary regressed');

assert.match(html,/PLAYABLE CORE V2\.96/);
assert.match(html,/PLAYABLE CORE V2\.95/);
assert.match(html,/PLAYABLE CORE V2\.94/);
assert.match(html,/PLAYABLE CORE V2\.93/);
assert.match(html,/PLAYABLE CORE V2\.92/);
assert.match(html,/PLAYABLE CORE V2\.91/);
assert.match(html,/PLAYABLE CORE V2\.90/);
assert.match(readme,/PLAYABLE CORE V2\.96/);
assert.match(readme,/PLAYABLE CORE V2\.95/);
assert.match(readme,/V2\.96 — GuardianCheck source block: instigate/);
assert.match(changelog,/V2\.96：GuardianCheck 不允許 instigate 中的 Guardian 代擋/);

console.log(JSON.stringify({
  pass:true,
  version:'V2.96',
  guardianBlocks:['instigate'],
  guardianDoomTime:'fail-closed-no-generic-charge-mapping',
  historicalMarkersPreserved:true
}));
