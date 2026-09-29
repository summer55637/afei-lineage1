import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const readme=fs.readFileSync('README.md','utf8');

function sliceFunction(name){
  const start=game.indexOf('function '+name+'(');
  assert.ok(start>=0,'missing '+name);
  const end=game.indexOf('\nfunction ',start+10);
  return game.slice(start,end>start?end:start+14000);
}

const markFn=sliceFunction('sourcePreAttackDamageReactCounterBlock');
assert.ok(markFn.includes('sourceBattleDamageReactActive(attackerDesc)'));
assert.ok(markFn.includes('sourceBattleDamageReactActive(targetDesc)'));

const physical=sliceFunction('battleApplyPhysicalHit');
const mark='sourcePreAttackDamageReactCounterBlock(r,attackerDesc,targetDesc);';
assert.ok(physical.includes(mark),'shared physical hit must pass the original target into the pre-AttackSeq DamageReact gate');
assert.equal(physical.includes('sourcePreAttackDamageReactCounterBlock(r,attackerDesc,null);'),false);
assert.ok(physical.indexOf(mark)<physical.indexOf('if(r.dodged)'),'DamageReact gate must precede dodge early return');
assert.ok(physical.indexOf(mark)<physical.indexOf('if(r.miss)'),'DamageReact gate must precede miss early return');

const counter=sliceFunction('counterScaledResult');
assert.ok(counter.includes('Number(attacker?.damageReact)>0||Number(defender?.damageReact)>0'));
assert.ok(counter.includes('r.sourceCounterBlockedByDamageReact=true'));

assert.match(html,/PLAYABLE CORE V2\.91/);
assert.match(readme,/PLAYABLE CORE V2\.91/);
assert.match(readme,/V2\.91 — target-side DamageReact pre-Duck boundary/);

console.log(JSON.stringify({pass:true,version:'V2.91',targetSidePreDuckBoundary:true,earlyReturns:['dodge','miss']}));
