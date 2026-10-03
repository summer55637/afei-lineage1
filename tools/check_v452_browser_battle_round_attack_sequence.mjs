#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createBrowserBattleProfitCreditRuntime } from '../src/stoneage_browser_battle_profit_credit_runtime.mjs';
import { createBrowserBattleCarriedLootRuntime } from '../src/stoneage_browser_battle_carried_loot_runtime.mjs';
import { createBrowserBattleEnemyExpRuntime } from '../src/stoneage_browser_battle_enemy_exp_runtime.mjs';
import { createBrowserBattleRelifeRuntime } from '../src/stoneage_browser_battle_relife_runtime.mjs';
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
import { createBrowserBattleStatusRuntime } from '../src/stoneage_browser_battle_status_runtime.mjs';
import { createBrowserBattleEndRuntime } from '../src/stoneage_browser_battle_end_runtime.mjs';

const entry=(bid,command,target=-1)=>({
  bid,
  battleSlot:bid>=10?bid-10:bid,
  battleSide:bid>=10?1:0,
  sourceType:bid>=10?'enemy':'player',
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
  battleCommands:[command,target,-1],
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
      {side:0,type:0,flg:0,entries:[entry(0,1,10),...Array(9).fill(null)]},
      {side:1,type:1,flg:0,entries:[
        entry(10,2,0),
        null,null,null,null,
        entry(15,2,0),
        ...Array(4).fill(null)
      ]}
    ]
  }
};

const attackCountRuntime=createBrowserBattleAttackCountRuntime();
const targetListRuntime=createBrowserBattleTargetListRuntime();
const profitCreditRuntime=createBrowserBattleProfitCreditRuntime();
const carriedLootRuntime=createBrowserBattleCarriedLootRuntime();
const enemyExpRuntime=createBrowserBattleEnemyExpRuntime();
const relifeRuntime=createBrowserBattleRelifeRuntime();
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
const counterRuntime=createBrowserBattleCounterRuntime();
const counterChainRuntime=createBrowserBattleCounterChainRuntime({
  profitCreditRuntime,
  counterRuntime,
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
  roundId:'v452-round-source-integration',
  counterPolicy:'defer',
  attackRolls:[{attackerBid:0,weaponType:'bow',...bundle()}],
  attackCountInputsByBid:{
    0:{itemPresent:true,attackNumMin:1,attackNumMax:2,roll:2,weaponType:'bow'},
    10:{itemPresent:true,attackNumMin:1,attackNumMax:1,roll:1,weaponType:'bow'}
  },
  bowTargetListRollByBid:{0:0,10:1}
});

assert.equal(round.ok,true,JSON.stringify(round));
assert.equal(round.stage,'battle-round-resolved');
assert.equal(round.turn,1);
assert.equal(round.attackCountPrimes.length,3);
assert.deepEqual(round.attackCountPrimes.map(x=>x.actorBid),[0,10,15]);
assert.deepEqual(round.attackCountPrimes.map(x=>x.attackCount),[2,1,1]);
assert.deepEqual(round.attackCountPrimes.map(x=>x.rngConsumed),[1,1,0]);

assert.equal(round.targetListPrimes.length,2);
assert.deepEqual(round.targetListPrimes.map(x=>x.actorBid),[0,10]);
assert.deepEqual(round.targetListPrimes[0].targets.slice(0,2),[10,15]);
assert.equal(round.targetListPrimes.every(x=>x.rngConsumed===1),true);

assert.equal(round.attacks.length,1);
assert.equal(round.attacks[0].attackCount,2);
assert.equal(round.attacks[0].sourceAttackCount.attackCount,2);
assert.deepEqual(round.attacks[0].sourceTargetList.targets.slice(0,2),[10,15]);
assert.equal(round.attacks[0].attackSequence.executedHitCount,2);
assert.equal(round.attacks[0].attackSequence.counterDeferred,true);
assert.equal(round.counterDeferredCount,1);
assert.equal(round.persistentMutation,false);

const target10=round.context.sides[1].entries.find(e=>e?.bid===10);
const target15=round.context.sides[1].entries.find(e=>e?.bid===15);
assert.ok(target10.hp<1000);
assert.ok(target15.hp<1000);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v452-browser-battle-round-runtime-v1',
  attackCountPrimes:round.attackCountPrimes.map(x=>({actorBid:x.actorBid,attackCount:x.attackCount,rngConsumed:x.rngConsumed})),
  bowTargetSequence:round.targetListPrimes.find(x=>x.actorBid===0).targets.slice(0,2),
  executedHitCount:round.attacks[0].attackSequence.executedHitCount,
  counterDeferredCount:round.counterDeferredCount,
  hp:{10:target10.hp,15:target15.hp},
  persistentMutation:round.persistentMutation
},null,2));
