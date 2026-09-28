import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const readme=fs.readFileSync('README.md','utf8');

function sliceFunction(name){
  const start=game.indexOf('function '+name+'(');
  assert.ok(start>=0,'missing '+name);
  const end=game.indexOf('\nfunction ',start+10);
  return game.slice(start,end>start?end:start+18000);
}

const weapon=sliceFunction('enemyWeaponApplyHit');
assert.ok(weapon.includes("resolveEnemyDirectAttackToPlayer(unit,Object.assign({},attackOptions,{guarding:playerGuarding}))"));
assert.ok(weapon.includes("const targetDesc=enemyDirectActualTarget({kind:'player'},r)||{kind:'player'};"));
assert.ok(weapon.includes('battleApplyPhysicalHit('));
assert.ok(weapon.includes('{deferItemCrush:true,deferAddProfit:true}'));
assert.equal(weapon.includes('enemyAttackResult(unit,Object.assign({},attackOptions,{guarding:playerGuarding}))'),false);

const direct=sliceFunction('resolveEnemyDirectAttackToPlayer');
assert.ok(direct.includes('sourcePlayerGuardianPetForAttack(unit)'));
assert.ok(direct.indexOf('sourceInitialDodgeOnly')<direct.indexOf('sourcePlayerGuardianPetForAttack'));

assert.match(html,/PLAYABLE CORE V2\.92/);
assert.match(readme,/PLAYABLE CORE V2\.92/);
assert.match(readme,/V2\.92 — Enemy→Player weapon Guardian boundary/);

console.log(JSON.stringify({pass:true,version:'V2.92',enemyWeaponPlayerGuardianBoundary:true,sharedPhysicalExecutor:true}));
