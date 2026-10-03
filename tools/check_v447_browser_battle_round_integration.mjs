#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createBrowserBattleRoundRuntime } from '../src/stoneage_browser_battle_round_runtime.mjs';
import { createBrowserBattleAttackCountRuntime } from '../src/stoneage_browser_battle_attack_count_runtime.mjs';
import { createBrowserBattleTargetListRuntime } from '../src/stoneage_browser_battle_target_list_runtime.mjs';
import { createBrowserBattleAttackSequenceRuntime } from '../src/stoneage_browser_battle_attack_sequence_runtime.mjs';
import { createBrowserBattleCounterChainRuntime } from '../src/stoneage_browser_battle_counter_chain_runtime.mjs';
import { createBrowserBattleCounterRuntime } from '../src/stoneage_browser_battle_counter_runtime.mjs';
import { createBrowserBattleAttackPreflightRuntime } from '../src/stoneage_browser_battle_attack_preflight_runtime.mjs';
import { createBrowserBattleAttackSeqPreludeRuntime } from '../src/stoneage_browser_battle_attack_seq_prelude_runtime.mjs';
import { createBrowserBattleDamagePlanRuntime } from '../src/stoneage_browser_battle_damage_plan_runtime.mjs';
import { createBrowserBattleCriticalDamageRuntime } from '../src/stoneage_browser_battle_critical_damage_runtime.mjs';
import { createBrowserBattleDamageReactRuntime } from '../src/stoneage_browser_battle_damage_react_runtime.mjs';
import { createBrowserBattleDamageReactCommitRuntime } from '../src/stoneage_browser_battle_damage_react_commit_runtime.mjs';
import { createBrowserBattleDamageDeathChainRuntime } from '../src/stoneage_browser_battle_damage_death_chain_runtime.mjs';
import { createBrowserBattleProfitCreditRuntime } from '../src/stoneage_browser_battle_profit_credit_runtime.mjs';
import { createBrowserBattleCarriedLootRuntime } from '../src/stoneage_browser_battle_carried_loot_runtime.mjs';
import { createBrowserBattleEnemyExpRuntime } from '../src/stoneage_browser_battle_enemy_exp_runtime.mjs';
import { createBrowserBattleRelifeRuntime } from '../src/stoneage_browser_battle_relife_runtime.mjs';
import { createBrowserBattleStatusRuntime } from '../src/stoneage_browser_battle_status_runtime.mjs';
import { createBrowserBattleEndRuntime } from '../src/stoneage_browser_battle_end_runtime.mjs';

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
  damageReact:0,
  isDie:false,
  deadCount:0,
  relife:0,
  battleOutcomeFlags:0
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

const profitCreditRuntime=createBrowserBattleProfitCreditRuntime();
const carriedLootRuntime=createBrowserBattleCarriedLootRuntime();
const enemyExpRuntime=createBrowserBattleEnemyExpRuntime();
const relifeRuntime=createBrowserBattleRelifeRuntime();
const attackCountRuntime=createBrowserBattleAttackCountRuntime();
const targetListRuntime=createBrowserBattleTargetListRuntime();
const counterRuntime=createBrowserBattleCounterRuntime();
const attackPreflightRuntime=createBrowserBattleAttackPreflightRuntime();
const attackSeqPreludeRuntime=createBrowserBattleAttackSeqPreludeRuntime();
const damagePlanRuntime=createBrowserBattleDamagePlanRuntime();
const criticalDamageRuntime=createBrowserBattleCriticalDamageRuntime();
const damageReactRuntime=createBrowserBattleDamageReactRuntime();
const damageReactCommitRuntime=createBrowserBattleDamageReactCommitRuntime();
const damageDeathChainRuntime=createBrowserBattleDamageDeathChainRuntime();
const attackSequenceRuntime=createBrowserBattleAttackSequenceRuntime({
  profitCreditRuntime,
  attackPreflightRuntime,
  attackSeqPreludeRuntime,
  damagePlanRuntime,
  criticalDamageRuntime,
  damageReactRuntime,
  damageReactCommitRuntime,
  damageDeathChainRuntime,
  carriedLootRuntime,
  enemyExpRuntime,
  relifeRuntime
});
const statusRuntime=createBrowserBattleStatusRuntime();
const endRuntime=createBrowserBattleEndRuntime();

const counterChainRuntime=createBrowserBattleCounterChainRuntime({
  profitCreditRuntime,
  counterRuntime,
  attackSeqPreludeRuntime,
  damagePlanRuntime,
  criticalDamageRuntime,
  damageReactRuntime,
  damageReactCommitRuntime,
  damageDeathChainRuntime
});
const roundRuntime=createBrowserBattleRoundRuntime({
  attackCountRuntime,
  targetListRuntime,
  attackSequenceRuntime,
  attackPreflightRuntime,
  attackSeqPreludeRuntime,
  damagePlanRuntime,
  criticalDamageRuntime,
  damageReactRuntime,
  damageReactCommitRuntime,
  damageDeathChainRuntime,
  counterChainRuntime,
  statusRuntime,
  endRuntime
});

assert.equal(roundRuntime.ok,true);

const bundle=()=>({
  weaponType:'none',
  weaponCritical:0,
  throwWeapon:false,
  duckRoll:10000,
  criticalRoll:10000,
  damageRollNear:1,
  damageRollWide:1,
  guardRoll:96,
  lowDamageRoll:1,
  battleDamageModify:1,
  includeAttr:false,
  defaultTargetRoll:0
});

const round=await roundRuntime.resolve(context,{
  roundId:'v447-round-integration',
  counterPolicy:'execute',
  attackRolls:[{attackerBid:0,...bundle()},{attackerBid:10,...bundle()}],
  counterRollsByActorBid:{
    0:[1,1,1,1,1],
    10:[1,1,1,1,1]
  },
  counterAttackRollsByActorBid:{
    0:Array.from({length:5},bundle),
    10:Array.from({length:5},bundle)
  },
  weaponClassByBid:{0:'claw',10:'claw'}
});

assert.equal(round.ok,true,JSON.stringify(round));
assert.equal(round.stage,'battle-round-resolved');
assert.equal(round.turn,1);
assert.equal(round.counterPolicy,'execute');
assert.equal(round.counterChains.length,2);
assert.deepEqual(round.counterChains.map(x=>x.chainCount),[5,5]);
assert.equal(round.counterExecutedCount,10);
assert.equal(round.deferred.length,0);
assert.equal(round.counterDeferredCount,0);
assert.equal(round.scope.counterDeferred,false);
assert.equal(round.damageExecuted,true);
assert.equal(round.context.sides[0].entries[0].hp,923);
assert.equal(round.context.sides[1].entries[0].hp,923);

for(const row of [...round.context.sides[0].entries,...round.context.sides[1].entries]){
  if(!row||Number(row.hp)<=0)continue;
  assert.equal(row.sourceBattleCharMode,2);
  assert.equal(row.battleMode,'c_wait');
  assert.equal(row.battleCommands?.[0],0);
}

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v447-browser-battle-round-runtime-v1',
  turn:round.turn,
  mainAttackCount:round.attacks.length,
  counterChainCount:round.counterChains.length,
  counterExecutedCount:round.counterExecutedCount,
  finalHp:{player:round.context.sides[0].entries[0].hp,enemy:round.context.sides[1].entries[0].hp},
  nextCommandPhase:round.nextCommandPhase,
  persistentMutation:round.persistentMutation
},null,2));
