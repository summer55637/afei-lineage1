#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  battleTargetCheck,
  resolveBattleTarget,
  BATTLE_CHARMODE_RESCUE
} from '../src/stoneage_browser_battle_target_runtime.mjs';
import {
  ACTION_BATTLE_TARGET_RESOLVE,
  BROWSER_BATTLE_TARGET_RUNTIME_FORMAT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';

const makeEntry=(bid,overrides={})=>({
  bid,
  battleSlot:bid%10,
  battleSide:bid>=10?1:0,
  characterId:'entry-'+bid,
  sourceBattleCharMode:2,
  battleMode:'c_wait',
  hp:100,
  isAttacked:1,
  ...overrides
});

const context={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    sides:[
      {side:0,type:0,entries:Array.from({length:10},(_,i)=>i===0?makeEntry(0):null)},
      {side:1,type:1,entries:Array.from({length:10},(_,i)=>i===0?makeEntry(10):null)}
    ]
  }
};

let result=resolveBattleTarget(context,{attackerBid:0,targetBid:10});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.stage,'battle-target-resolved');
assert.equal(result.action,ACTION_BATTLE_TARGET_RESOLVE);
assert.equal(result.format,BROWSER_BATTLE_TARGET_RUNTIME_FORMAT);
assert.equal(result.targetResolved,true);
assert.deepEqual(result.targetList,[10,-1]);
assert.equal(result.executionTargetBid,10);
assert.equal(result.defaultAttackerRequired,false);
assert.equal(result.rngConsumed,false);
assert.equal(result.persistentMutation,false);

const dead=structuredClone(context);
dead.context.sides[1].entries[0].hp=0;
result=resolveBattleTarget(dead,{attackerBid:0,targetBid:10});
assert.equal(result.ok,true);
assert.equal(result.targetResolved,false);
assert.equal(result.targetCheck.reason,'target-hp-not-positive');
assert.equal(result.defaultAttackerRequired,true);
assert.equal(result.fallbackExecuted,false);

for(const override of [
  {isAttacked:0},
  {isDead:true},
  {sourceBattleCharMode:BATTLE_CHARMODE_RESCUE}
]){
  const invalid=structuredClone(context);
  Object.assign(invalid.context.sides[1].entries[0],override);
  result=resolveBattleTarget(invalid,{attackerBid:0,targetBid:10});
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.targetResolved,false);
  assert.equal(result.defaultAttackerRequired,true);
}

assert.equal(resolveBattleTarget(context,{attackerBid:0,targetBid:20}).reason,'target-bid-invalid');
assert.equal(resolveBattleTarget(context,{attackerBid:20,targetBid:10}).reason,'attacker-entry-missing-or-bid-invalid');
assert.deepEqual(battleTargetCheck(context.context.sides[1].entries[0]),{ok:true});

const controller=createBrowserStateController({state:{revision:0},battleFieldRuntimeOptions:{}});
result=await controller.dispatch({type:ACTION_BATTLE_TARGET_RESOLVE,attackerBid:0,targetBid:10});
assert.equal(result.ok,false);
assert.equal(result.reason,'battle-context-required');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v398-browser-battle-target-runtime-v1',
  action:'BATTLE_TARGET_RESOLVE',
  validTargetChecks:['mode!=0','not-dead','hp>0','isAttacked','not-rescue'],
  invalidTargetFallback:{required:true,executed:false},
  targetList:[10,-1],
  persistentMutation:false,
  rngConsumed:false,
  damageExecuted:false
},null,2));
