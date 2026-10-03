#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  createBrowserBattleCounterChainRuntime
} from '../src/stoneage_browser_battle_counter_chain_runtime.mjs';
import { createBrowserBattleCounterRuntime } from '../src/stoneage_browser_battle_counter_runtime.mjs';
import { createBrowserBattleAttackSeqPreludeRuntime } from '../src/stoneage_browser_battle_attack_seq_prelude_runtime.mjs';
import { createBrowserBattleDamagePlanRuntime } from '../src/stoneage_browser_battle_damage_plan_runtime.mjs';
import { createBrowserBattleCriticalDamageRuntime } from '../src/stoneage_browser_battle_critical_damage_runtime.mjs';
import { createBrowserBattleDamageReactRuntime } from '../src/stoneage_browser_battle_damage_react_runtime.mjs';
import { createBrowserBattleDamageDeathChainRuntime } from '../src/stoneage_browser_battle_damage_death_chain_runtime.mjs';

const entry=(bid,sourceType)=>({
  bid,
  battleSlot:bid>=10?bid-10:bid,
  battleSide:bid>=10?1:0,
  sourceType,
  hp:1000,
  maxHp:1000,
  fixDex:100,
  quick:100,
  fixVital:1,
  attackPower:30,
  defencePower:1,
  fixStr:30,
  fixTgh:1,
  battleFlg:0,
  battleCommands:[1,bid>=10?0:10,-1],
  sourceBattleCharMode:3,
  battleMode:'c_ok',
  elements:{fire:0,water:0,earth:0,wind:0},
  fixLuck:0,
  damageVanish:0,
  damageAbsorb:0,
  damageReflect:0,
  damageReact:0
});

const context={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',
    sourceMode:2,
    turn:0,
    damageCommitRevision:0,
    fieldAtt:4,
    attPow:0,
    sides:[
      {side:0,type:0,flg:0,entries:[entry(0,'player'),...Array(9).fill(null)]},
      {side:1,type:1,flg:0,entries:[entry(10,'enemy'),...Array(9).fill(null)]}
    ]
  }
};

const runtimes={
  counterRuntime:createBrowserBattleCounterRuntime(),
  attackSeqPreludeRuntime:createBrowserBattleAttackSeqPreludeRuntime(),
  damagePlanRuntime:createBrowserBattleDamagePlanRuntime(),
  criticalDamageRuntime:createBrowserBattleCriticalDamageRuntime(),
  damageReactRuntime:createBrowserBattleDamageReactRuntime(),
  damageDeathChainRuntime:createBrowserBattleDamageDeathChainRuntime()
};
const chainRuntime=createBrowserBattleCounterChainRuntime(runtimes);
assert.equal(chainRuntime.ok,true);

const counterAttackRolls=Array.from({length:5},()=>({
  weaponType:'none',
  attackerWeaponClass:'claw',
  defenderWeaponClass:'claw',
  duckRoll:10000,
  criticalRoll:10000,
  damageRollNear:1,
  damageRollWide:1,
  guardRoll:96,
  lowDamageRoll:1,
  battleDamageModify:1,
  includeAttr:false
}));

const result=await chainRuntime.resolve(context,{
  originAttackerBid:0,
  originTargetBid:10,
  counterRolls:[1,1,1,1,1],
  counterAttackRolls,
  weaponClassByBid:{0:'claw',10:'claw'},
  transactionPrefix:'v447-test'
});

assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.stage,'battle-counter-chain-resolved');
assert.equal(result.maxChain,5);
assert.equal(result.chainCount,5);
assert.equal(result.counterTriggeredCount,5);
assert.equal(result.persistentMutation,false);
assert.equal(result.scope.maxChain,5);
assert.equal(result.scope.ordinaryBasicCounterOnly,true);
assert.deepEqual(result.chain.map(x=>x.attackerBid),[10,0,10,0,10]);
assert.deepEqual(result.chain.map(x=>x.targetBid),[0,10,0,10,0]);
assert.ok(result.chain.every(x=>x.damageExecuted===true));
assert.equal(result.context.sides[0].entries[0].hp,964);
assert.equal(result.context.sides[1].entries[0].hp,976);
assert.ok(result.chain.every(x=>x.sourceDamage===17));
assert.ok(result.chain.every(x=>x.counterDamage===14));
assert.ok(result.chain.every(x=>x.check.triggered===true));
assert.ok(result.chain.every(x=>x.prelude.outcome==='normal'));

const noRoll=await chainRuntime.resolve(context,{
  originAttackerBid:0,
  originTargetBid:10,
  counterRolls:[],
  counterAttackRolls:[],
  weaponClassByBid:{0:'claw',10:'claw'},
  transactionPrefix:'v447-missing-rng'
});
assert.equal(noRoll.ok,false);
assert.equal(noRoll.stage,'battle-counter-chain-check');
assert.equal(noRoll.reason,'counter-rng-required-or-out-of-range');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v447-browser-battle-counter-chain-v1',
  chainCount:result.chainCount,
  triggerCount:result.counterTriggeredCount,
  order:result.chain.map(x=>[x.attackerBid,x.targetBid]),
  counterDamage:14,
  hpAfter:{player:result.context.sides[0].entries[0].hp,enemy:result.context.sides[1].entries[0].hp},
  persistentMutation:false,
  rng:{counterRolls:5,attackBundles:5}
},null,2));
