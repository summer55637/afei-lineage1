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

const counter=sliceFunction('counterScaledResult');
assert.ok(counter.includes('guarding:!!defender?.counterGuarding'),
  'Counter must pass source guard state into BATTLE_AttackSeq equivalent');
assert.ok(counter.includes('r.damage*.75'),
  'Counter 75% scaling must remain after GuardAdjust');

const player=sliceFunction('playerBattleView');
assert.ok(player.includes("counterGuarding:!!battlePlayerRawGuardCommand&&!battleStatusActive(desc,'confusion')"));

const pet=sliceFunction('petBattleView');
assert.ok(pet.includes('counterGuarding:sourcePlayerPetGuardAdjust(pet)'));

const enemy=sliceFunction('enemyBattleView');
assert.ok(enemy.includes("counterGuarding:!!unit?.guardThisTurn&&!battleStatusActive(desc,'confusion')"));

const guard=sliceFunction('battleGuardAdjust');
assert.match(guard,/roll=cRand\(1,100\)/);
assert.match(guard,/roll<=25/);
assert.match(guard,/roll<=50/);
assert.match(guard,/roll<=70/);
assert.match(guard,/roll<=85/);
assert.match(guard,/roll<=95/);

assert.match(html,/PLAYABLE CORE V2\.91/);
assert.match(readme,/PLAYABLE CORE V2\.91/);
assert.match(readme,/V2\.89 — Counter GuardAdjust boundary/);

console.log(JSON.stringify({
  pass:true,
  version:'V2.90',
  boundary:'BATTLE_Counter -> BATTLE_AttackSeq GuardAdjust',
  defenderViews:3,
  counterDamageScale:0.75
}));
