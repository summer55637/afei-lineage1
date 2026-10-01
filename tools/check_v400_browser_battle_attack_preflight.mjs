#!/usr/bin/env node
import assert from 'node:assert/strict';
import { resolveAttackExecutionTarget } from '../src/stoneage_browser_battle_attack_preflight_runtime.mjs';

const entry=(bid,overrides={})=>({
  bid,battleSlot:bid%10,battleSide:bid>=10?1:0,characterId:'c'+bid,
  sourceBattleCharMode:2,hp:100,isAttacked:1,damageReact:0,...overrides
});
const context={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',sourceMode:2,type:1,
    sides:[
      {side:0,type:0,entries:Array(10).fill(null)},
      {side:1,type:1,entries:Array(10).fill(null)}
    ]
  }
};
context.context.sides[0].entries[0]=entry(0);
context.context.sides[1].entries[0]=entry(10);
context.context.sides[1].entries[2]=entry(12);
context.context.sides[1].entries[4]=entry(14);

let result=resolveAttackExecutionTarget(context,{attackerBid:0,targetBid:12});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.stage,'battle-attack-preflight-ready');
assert.equal(result.finalTargetBid,12);
assert.equal(result.targetSource,'explicit-target');
assert.equal(result.damageReactSuppressed,false);
assert.equal(result.rngConsumed,false);
assert.equal(result.damageExecuted,false);
assert.equal(result.persistentMutation,false);

const invalid=structuredClone(context);
invalid.context.sides[1].entries[2].hp=0;
result=resolveAttackExecutionTarget(invalid,{attackerBid:0,targetBid:12,defaultTargetRoll:0});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.stage,'battle-attack-preflight-ready');
assert.equal(result.finalTargetBid,10);
assert.equal(result.targetSource,'default-attacker');
assert.equal(result.defaultTarget.selection,0);
assert.equal(result.rngConsumed,true);
assert.equal(result.damageExecuted,false);

result=resolveAttackExecutionTarget(invalid,{attackerBid:0,targetBid:12});
assert.equal(result.ok,false);
assert.equal(result.reason,'default-target-rng-required-or-out-of-range');

const noTargets=structuredClone(context);
noTargets.context.sides[1].entries[0]=null;
noTargets.context.sides[1].entries[2]=null;
noTargets.context.sides[1].entries[4]={...entry(14),hp:0};
result=resolveAttackExecutionTarget(noTargets,{attackerBid:0,targetBid:12,defaultTargetRoll:0});
assert.equal(result.ok,true);
assert.equal(result.stage,'battle-attack-preflight-no-target');
assert.equal(result.finalTargetBid,-1);
assert.equal(result.defaultAttackerRequired,true);

const deadAttacker=structuredClone(context);
deadAttacker.context.sides[0].entries[0].hp=0;
result=resolveAttackExecutionTarget(deadAttacker,{attackerBid:0,targetBid:10});
assert.equal(result.ok,false);
assert.equal(result.reason,'attacker-hp-not-positive');

const react=structuredClone(context);
react.context.sides[1].entries[0].damageReact=1;
result=resolveAttackExecutionTarget(react,{attackerBid:0,targetBid:10});
assert.equal(result.ok,true);
assert.equal(result.damageReactSuppressed,true);
assert.equal(result.fixedC.damageReactSetsIRetFalseButAttackSeqStillRuns,true);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v400-browser-battle-attack-preflight-v1',
  action:'BATTLE_ATTACK_PREFLIGHT',
  explicitTarget:12,
  fallbackTarget:10,
  fallbackRngRoll:0,
  attackerHpGate:true,
  targetHpGate:true,
  damageReactSemantics:'iRet=false but AttackSeq remains reachable',
  damageExecuted:false,
  persistentMutation:false
},null,2));
