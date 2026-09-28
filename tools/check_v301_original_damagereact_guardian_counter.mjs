import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const readme=fs.readFileSync('README.md','utf8');
const changelog=fs.readFileSync('CHANGELOG.md','utf8');

function sliceFunction(name){
  const start=game.indexOf('function '+name+'(');
  assert.ok(start>=0,'missing '+name);
  const end=game.indexOf('\nfunction ',start+10);
  return game.slice(start,end>start?end:start+26000);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const resolver=sliceFunction('resolveAttackToEnemyWithGuardian');
const guardianAt=resolver.indexOf('const guardian=attacker?.throwWeapon?null:enemyGuardianFor');
const preserveAt=resolver.indexOf('if(sourceBattleDamageReactActive(targetDesc))');
const returnAt=resolver.lastIndexOf('return r;');
assert.ok(guardianAt>=0,'GuardianCheck boundary must remain visible');
assert.ok(preserveAt>guardianAt,'original-target DamageReact preservation must happen after Guardian substitution');
assert.ok(preserveAt<returnAt,'Counter gate must be preserved before the resolver returns');
assert.ok(resolver.includes('r.sourceCounterBlockedByDamageReact=true;'),
  'original defender DamageReact must survive Guardian substitution');

const ctx={
  Math,Number,Object,
  sourceInitialDodgeOnly:()=>({dodged:false,duckRaw:0}),
  enemyBattleView:u=>u,
  battleStatusActive:()=>false,
  enemyGuardianFor:()=>({id:'guardian',name:'Guardian'}),
  resolveNormalAttack:()=>({damage:10,dodged:false,miss:false,guarded:false}),
  sourceBattleDamageReactActive:d=>!!d?.unit?.damageReactActive
};
vm.createContext(ctx);
vm.runInContext(resolver,ctx);

const attacker={type:'player'};
const original={
  id:'enemy-original',
  damageReactActive:true,
  guardThisTurn:false
};
const result=ctx.resolveAttackToEnemyWithGuardian(attacker,original,{});
assert.equal(result.guardian.id,'guardian');
assert.equal(result.actualTarget.id,'guardian');
assert.equal(result.originalTarget.id,'enemy-original');
assert.equal(result.sourceCounterBlockedByDamageReact,true,
  'Guardian must not erase the original defender pre-AttackSeq Counter block');

const noReact={
  id:'enemy-normal',
  damageReactActive:false,
  guardThisTurn:false
};
const normal=ctx.resolveAttackToEnemyWithGuardian(attacker,noReact,{});
assert.equal(normal.sourceCounterBlockedByDamageReact,undefined);

assert.match(html,/PLAYABLE CORE V3\.01/);
assert.match(readme,/PLAYABLE CORE V3\.01/);
assert.match(readme,/V3\.01 — original Defender DamageReact survives Guardian substitution/);
assert.match(changelog,/V3\.01：original defender DamageReact／Guardian substitution 後仍保留 Counter FALSE boundary/);

console.log(JSON.stringify({
  pass:true,
  version:'V3.01',
  fixedBoundary:'original defindex DamageReact gate survives Guardian substitution',
  noNewRng:'true'
}));
