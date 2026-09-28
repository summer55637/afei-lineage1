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

assert.match(game,/function sourceBattleDamageReactActive\(desc\)/);
const markFn=sliceFunction('sourcePreAttackDamageReactCounterBlock');
assert.ok(markFn.includes('sourceBattleDamageReactActive(attackerDesc)'));
assert.ok(markFn.includes('sourceBattleDamageReactActive(targetDesc)'));

const friendly=sliceFunction('applyFriendlyEnemyHit');
assert.ok(friendly.includes('const originalTargetDesc={kind:\'enemy\',unit:target,unitId:target.id};'));
assert.ok(friendly.includes('sourcePreAttackDamageReactCounterBlock(r,attackerDesc,originalTargetDesc);'));
assert.ok(friendly.indexOf('sourcePreAttackDamageReactCounterBlock')<friendly.indexOf('if(r.dodged)'));

const physical=sliceFunction('battleApplyPhysicalHit');
assert.ok(physical.includes('sourcePreAttackDamageReactCounterBlock(r,attackerDesc,null);'));
assert.ok(physical.indexOf('sourcePreAttackDamageReactCounterBlock')<physical.indexOf('if(r.dodged)'));

const enemyPlayer=sliceFunction('resolveEnemyDirectAttackToPlayer');
assert.ok(enemyPlayer.includes('const originalTargetDesc={kind:\'player\'};'));
assert.ok(enemyPlayer.includes('if(preReact.sourceCounterBlockedByDamageReact)dodge.sourceCounterBlockedByDamageReact=true;'));
assert.ok(enemyPlayer.includes('if(preReact.sourceCounterBlockedByDamageReact)r.sourceCounterBlockedByDamageReact=true;'));

const counter=sliceFunction('counterScaledResult');
assert.ok(counter.includes('Number(attacker?.damageReact)>0||Number(defender?.damageReact)>0'));
assert.ok(counter.includes('r.sourceCounterBlockedByDamageReact=true'));

for(const fn of ['playerBattleView','petBattleView','enemyBattleView']){
  const body=sliceFunction(fn);
  assert.ok(body.includes('damageReact:sourceBattleDamageReactActive(desc)?1:0'),fn+' source DamageReact view');
}

assert.match(html,/PLAYABLE CORE V2\.90/);
assert.match(readme,/PLAYABLE CORE V2\.90/);
assert.match(readme,/V2\.90 — attacker-side DamageReact Counter boundary/);

console.log(JSON.stringify({pass:true,version:'V2.90',attackerReactBoundary:true,counterParticipantViews:3}));
