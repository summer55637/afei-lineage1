import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const readme=fs.readFileSync('README.md','utf8');

function sliceFunction(name){
  const start=game.indexOf('function '+name+'(');
  assert.ok(start>=0,'missing '+name);
  const end=game.indexOf('\nfunction ',start+10);
  return game.slice(start,end>start?end:start+24000);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const cases=[
  ['sourceProfessionPhysicalCalcOnlyResult','skipSuitDodge:true'],
  ['resolveAttackToEnemyWithGuardian','skipSuitDodge:true'],
  ['sourcePetAttackDamageCalcOnlyGuardianResult','skipSuitDodge:true'],
  ['sourcePerformPetGuardBreak2Skill','skipSuitDodge:true']
];
for(const [name,needle] of cases){
  const fn=sliceFunction(name);
  assert.ok(fn.includes('sourceInitialDodgeOnly('),name+' must own first-dodge phase');
  assert.ok(fn.includes('resolveNormalAttack('),name+' must use shared damage calculator');
  assert.ok(fn.includes(needle),name+' must not re-run suit dodge');
  assert.equal(fn.includes('skipSuitDodge:!!guardian'),false,name+' must not gate the second suit dodge only on Guardian');
}

const enemyGB2=sliceFunction('performEnemyGuardBreak2');
assert.ok(enemyGB2.includes('if(!guardCommand){'));
assert.ok(enemyGB2.includes('sourceInitialDodgeOnly(attacker,defender,{guarding:false})'));
assert.ok(enemyGB2.includes('skipSuitDodge:!guardCommand'));
assert.equal(
  enemyGB2.includes('skipSuitDodge:!!guardian'),
  false,
  'enemy GBreak2 Pet path must distinguish manual first-dodge from guard-command path'
);

const helper=sliceFunction('sourceInitialDodgeOnly');
assert.ok(helper.includes('const suitDuck=sourceSuitDuckCheck(defender,options);'));
assert.equal(
  (helper.match(/sourceSuitDuckCheck\(/g)||[]).length,
  1,
  'shared first-dodge adapter owns exactly one suit-dodge call'
);

assert.match(html,/PLAYABLE CORE V2\.99/);
assert.match(readme,/PLAYABLE CORE V2\.99/);

console.log(JSON.stringify({
  pass:true,
  version:'V2.99',
  boundary:'manual first-dodge callers set skipSuitDodge:true; guard-command-only path keeps one suit-dodge'
}));
