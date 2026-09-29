import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const readme=fs.readFileSync('README.md','utf8');

function sliceFunction(name){
  const start=game.indexOf('function '+name+'(');
  assert.ok(start>=0,'missing '+name);
  const end=game.indexOf('\nfunction ',start+10);
  return game.slice(start,end>start?end:start+30000);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const choose=sliceFunction('battleConfusionChooseTarget');
assert.ok(choose.includes('const side=cRand(0,1);'));
assert.ok(choose.includes('const startPos=cRand(0,9);'));
assert.ok(choose.includes('battleConfusionSideTargets(side,attackerDesc,startPos)'));
assert.equal((choose.match(/cRand\(/g)||[]).length,2,'choose helper itself must consume only side + start-pos RNG; empty-side fallback delegates to the source-backed default-target owner');

const side=sliceFunction('battleConfusionSideTargets');
assert.ok(side.includes('if(++pos>=10)pos=0;'));
assert.ok(side.includes('const slot=(side?10:0)+pos;'));
assert.ok(side.includes('sourceBattleStatusDescFromSlot(slot)'));
assert.ok(side.includes('battleStatusKey(target)===selfKey'));

const same=sliceFunction('sourceBattleSameSideDesc');
assert.ok(same.includes('const attackerSlot=sourceBattleStatusSlot(attackerDesc);'));
assert.ok(same.includes('const targetSlot=sourceBattleStatusSlot(targetDesc);'));
assert.ok(same.includes('(attackerSlot<10)===(targetSlot<10)'));

const perform=sliceFunction('performConfusionAttack');
const gateAt=perform.indexOf('if(sourceBattleSameSideDesc(attackerDesc,targetDesc))');
assert.ok(gateAt>perform.indexOf('const targetDesc=pick.target'));
assert.ok(gateAt<perform.indexOf('sourcePerformPlayerRangedConfusionAttack('));
assert.ok(gateAt<perform.indexOf('resolveAttackToEnemyWithGuardian('));
assert.ok(gateAt<perform.indexOf('resolveNormalAttack('));

const ctx={
  Math,Number,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  rng:[],
  cRand:(a,b)=>{ctx.rng.push([a,b]);return 0;},
  battleStatusKey:d=>d?.kind==='player'?'player':d?.kind==='pet'?'pet:'+d.petId:'enemy:'+d.unitId,
  battleStatusDescAlive:d=>!!d,
  sourceBattleStatusDescFromSlot:slot=>{
    if(slot===0)return {kind:'player'};
    if(slot===5)return {kind:'pet',petId:'p'};
    if(slot===10)return {kind:'enemy',unitId:'e0'};
    if(slot===11)return {kind:'enemy',unitId:'e1'};
    return null;
  },
  sourceProfessionInstigateDefaultTarget:desc=>({kind:desc?.kind==='enemy'?'player':'enemy',unitId:'e0'}),
  sourceBattleStatusSlot:d=>d?.kind==='player'?0:d?.kind==='pet'?5:10+(d?.unitId==='e1'?1:0)
};
vm.createContext(ctx);
vm.runInContext(side,ctx);
vm.runInContext(choose,ctx);

const picked=ctx.battleConfusionChooseTarget({kind:'player'});
assert.equal(picked.side,0);
assert.equal(picked.startPos,0);
assert.equal(picked.target.kind,'pet');
assert.equal(picked.targetSlot,5);
assert.deepEqual(ctx.rng,[[0,1],[0,9]]);

ctx.rng=[];
const fallback=ctx.battleConfusionChooseTarget({kind:'enemy',unitId:'e0'});
assert.equal(fallback.fallback,false);
assert.deepEqual(ctx.rng,[[0,1],[0,9]]);

vm.runInContext(same,ctx);
assert.equal(ctx.sourceBattleSameSideDesc({kind:'player'},{kind:'pet',petId:'p'}),true);
assert.equal(ctx.sourceBattleSameSideDesc({kind:'player'},{kind:'enemy',unitId:'e0'}),false);
assert.equal(ctx.sourceBattleSameSideDesc({kind:'enemy',unitId:'e0'},{kind:'enemy',unitId:'e1'}),true);

assert.match(html,/PLAYABLE CORE V3\.00/);
assert.match(readme,/PLAYABLE CORE V3\.00/);

console.log(JSON.stringify({
  pass:true,
  version:'V3.00',
  targetRng:'RAND(0,1) + RAND(0,9) + circular slot scan',
  sameSideGate:'before AttackSeq / Duck / Critical / Damage RNG'
}));
