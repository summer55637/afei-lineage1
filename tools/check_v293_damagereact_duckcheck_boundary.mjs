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

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const normal=sliceFunction('resolveNormalAttack');
const damageReactVar=normal.indexOf('const sourceDamageReactBlocksDuck=Math.trunc(n(defender?.damageReact))>0;');
const skillDuckGuard=normal.indexOf('if(!disableDodge&&!sourceDamageReactBlocksDuck&&n(defender?.skillDuckPower)>0){');
const ordinaryDuck=normal.indexOf('const duck=(disableDodge||sourceDamageReactBlocksDuck)?0:sourceBattleDuckTotal(attacker,defender,options);');
const suitDuck=normal.indexOf('const suitDuck=sourceSuitDuckCheck(defender,options);');

assert.ok(damageReactVar>=0,'resolveNormalAttack must expose target DamageReact before DuckCheck');
assert.ok(skillDuckGuard>damageReactVar,'CHAR_MYSKILLDUCK must be gated by pre-Duck DamageReact');
assert.ok(ordinaryDuck>skillDuckGuard,'ordinary DuckCheck must be gated by pre-Duck DamageReact');
assert.ok(suitDuck>ordinaryDuck,'independent suit dodge must remain after the DuckCheck block');
assert.equal(/sourceDamageReactBlocksDuck[^\n]*&&.*sourceSuitDuckCheck/.test(normal),false,'suit dodge must not be incorrectly disabled by DamageReact');

const physical=sliceFunction('battleApplyPhysicalHit');
const prereact='sourcePreAttackDamageReactCounterBlock(r,attackerDesc,targetDesc);';
assert.ok(physical.includes(prereact),'shared physical executor must preserve V2.91 original-target DamageReact boundary');
assert.ok(physical.indexOf(prereact)<physical.indexOf('if(r.dodged)'),'V2.91 boundary must precede dodge early return');

assert.match(html,/PLAYABLE CORE V2\.93/);
assert.match(readme,/PLAYABLE CORE V2\.93/);
assert.match(readme,/V2\.93 — DamageReact blocks DuckCheck but not independent suit dodge/);

console.log(JSON.stringify({
  pass:true,
  version:'V2.93',
  damageReactBlocks:['CHAR_MYSKILLDUCK','ordinary-DuckCheck'],
  independentDodgePreserved:'_SUIT_ADDPART3'
}));
