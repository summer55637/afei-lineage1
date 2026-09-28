import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const readme=fs.readFileSync('README.md','utf8');

function extractFunction(source,name){
  const marker='function '+name+'(';
  const start=source.indexOf(marker);
  assert.ok(start>=0,'missing '+name);
  const end=source.indexOf('\nfunction ',start+10);
  return source.slice(start,end>start?end:start+18000);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const dodge=extractFunction(game,'sourceInitialDodgeOnly');
const dmgAt=dodge.indexOf('const sourceDamageReactBlocksDuck=Math.trunc(n(defender?.damageReact))>0;');
const skillAt=dodge.indexOf('if(!disableDodge&&!sourceDamageReactBlocksDuck&&n(defender?.skillDuckPower)>0){');
const duckAt=dodge.indexOf('const duck=(disableDodge||sourceDamageReactBlocksDuck)?0:sourceBattleDuckTotal(attacker,defender,options);');
const suitAt=dodge.indexOf('const suitDuck=sourceSuitDuckCheck(defender,options);');
assert.ok(dmgAt>=0,'missing DamageReact gate');
assert.ok(skillAt>dmgAt,'skill Duck must be after DamageReact gate');
assert.ok(duckAt>skillAt,'ordinary Duck must be after DamageReact gate');
assert.ok(suitAt>duckAt,'independent suit dodge must remain after the gate');

const ctx={
  Math,Number,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  rng:[],
  cRand:(a,b)=>{ctx.rng.push([a,b]);return 0;},
  sourceBattleDuckTotal:()=>9999,
  sourceProfessionPlayerNormalDodgeEvent:()=>null,
  sourceSuitDuckCheck:()=>({dodged:true,power:5,roll:0}),
  state:{}
};
vm.createContext(ctx);
vm.runInContext(dodge,ctx);
const blocked=ctx.sourceInitialDodgeOnly({type:'enemy'},{damageReact:1,skillDuckPower:99,suitDuckPower:5},{});
assert.equal(blocked.dodged,true);
assert.equal(blocked.suitDuck,true);
assert.equal(blocked.sourceDamageReactBlocksDuck,true);
assert.deepEqual(ctx.rng,[],'DamageReact path must not consume first-layer Duck RNG');

ctx.rng=[];
ctx.sourceSuitDuckCheck=()=>({dodged:false,power:0,roll:null});
const ordinary=ctx.sourceInitialDodgeOnly({type:'enemy'},{damageReact:0,skillDuckPower:0,suitDuckPower:0},{});
assert.equal(ordinary.dodged,true);
assert.deepEqual(ctx.rng,[[1,10000]],'ordinary Duck must consume exactly one RNG');

const guardian=extractFunction(game,'resolveAttackToEnemyWithGuardian');
assert.ok(guardian.includes('sourceInitialDodgeOnly(attacker,originalView,Object.assign({},options,{'));
assert.ok(guardian.includes('skipSuitDodge:!!guardian'));
assert.equal(guardian.includes('sourceSuitDuckCheck('),false);
assert.equal(guardian.includes('sourceBattleDuckTotal(attacker,originalView,options)'),false);

const normal=extractFunction(game,'resolveNormalAttack');
assert.ok(normal.includes('const sourceDamageReactBlocksDuck=Math.trunc(n(defender?.damageReact))>0;'));
assert.ok(normal.indexOf('sourceDamageReactBlocksDuck')<normal.indexOf('const suitDuck=sourceSuitDuckCheck(defender,options);'));

assert.match(html,/PLAYABLE CORE V2\.98/);
assert.match(readme,/PLAYABLE CORE V2\.98/);

console.log(JSON.stringify({
  pass:true,
  version:'V2.98',
  focus:'first DuckCheck DamageReact ordering + pre-Guardian suit dodge'
}));
