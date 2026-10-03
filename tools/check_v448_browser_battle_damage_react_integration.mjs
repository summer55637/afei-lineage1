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
import { createBrowserBattleStatusRuntime } from '../src/stoneage_browser_battle_status_runtime.mjs';
import { createBrowserBattleEndRuntime } from '../src/stoneage_browser_battle_end_runtime.mjs';

const makeEntry=(bid,sourceType)=>({
  bid,battleSlot:bid>=10?bid-10:bid,battleSide:bid>=10?1:0,sourceType,
  hp:100,maxHp:100,fixDex:100,quick:100,fixVital:1,
  attackPower:30,defencePower:1,fixStr:30,fixTgh:1,
  battleFlg:0,battleCommands:[1,bid>=10?0:10,-1],
  sourceBattleCharMode:3,battleMode:'c_ok',isDie:false,deadCount:0,relife:0,
  battleOutcomeFlags:0,workUltimate:0,fixLuck:0,
  damageVanish:0,damageAbsorb:0,damageReflect:0,damageReact:0,
  elements:{fire:0,water:0,earth:0,wind:0}
});

const runtimeSet=()=>{
  const attackCountRuntime=createBrowserBattleAttackCountRuntime();
const targetListRuntime=createBrowserBattleTargetListRuntime();
const counterRuntime=createBrowserBattleCounterRuntime();
const attackSequenceRuntime=createBrowserBattleAttackSequenceRuntime({
  attackPreflightRuntime,
  attackSeqPreludeRuntime,
  damagePlanRuntime,
  criticalDamageRuntime,
  damageReactRuntime,
  damageReactCommitRuntime,
  damageDeathChainRuntime
});
  const attackPreflightRuntime=createBrowserBattleAttackPreflightRuntime();
  const attackSeqPreludeRuntime=createBrowserBattleAttackSeqPreludeRuntime();
  const damagePlanRuntime=createBrowserBattleDamagePlanRuntime();
  const criticalDamageRuntime=createBrowserBattleCriticalDamageRuntime();
  const damageReactRuntime=createBrowserBattleDamageReactRuntime();
  const damageReactCommitRuntime=createBrowserBattleDamageReactCommitRuntime();
  const damageDeathChainRuntime=createBrowserBattleDamageDeathChainRuntime();
  const statusRuntime=createBrowserBattleStatusRuntime();
  const endRuntime=createBrowserBattleEndRuntime();
  const counterChainRuntime=createBrowserBattleCounterChainRuntime({
    counterRuntime,attackSeqPreludeRuntime,damagePlanRuntime,criticalDamageRuntime,
    damageReactRuntime,damageReactCommitRuntime,damageDeathChainRuntime
  });
  const roundRuntime=createBrowserBattleRoundRuntime({
    attackCountRuntime,
    targetListRuntime,
    attackSequenceRuntime,
    attackPreflightRuntime,attackSeqPreludeRuntime,damagePlanRuntime,
    criticalDamageRuntime,damageReactRuntime,damageReactCommitRuntime,
    damageDeathChainRuntime,counterChainRuntime,statusRuntime,endRuntime
  });
  return {counterRuntime,attackSeqPreludeRuntime,damagePlanRuntime,criticalDamageRuntime,damageReactRuntime,damageReactCommitRuntime,damageDeathChainRuntime,counterChainRuntime,roundRuntime};
};

const bundle=()=>({
  weaponType:'none',weaponCritical:0,throwWeapon:false,
  duckRoll:10000,criticalRoll:10000,damageRollNear:1,damageRollWide:1,
  guardRoll:96,lowDamageRoll:1,battleDamageModify:1,includeAttr:false,defaultTargetRoll:0
});

const fresh=({playerReflect=false,enemyReflect=false}={})=>{
  const p=makeEntry(0,'player'),e=makeEntry(10,'enemy');
  if(playerReflect)p.damageReflect=1;
  if(enemyReflect)e.damageReflect=1;
  return {format:'stoneage-browser-battle-context-runtime-v1',context:{
    mode:'battle',sourceMode:2,turn:0,damageCommitRevision:0,fieldAtt:4,attPow:0,
    sides:[
      {side:0,type:0,flg:0,entries:[p,...Array(9).fill(null)]},
      {side:1,type:1,flg:0,entries:[e,...Array(9).fill(null)]}
    ]
  }};
};

// Main attack -> defender reflect -> attacker takes reflected damage -> no counter.
{
  const runtimes=runtimeSet();
  const ctx=fresh({enemyReflect:true});
  ctx.context.sides[1].entries[0].battleCommands=[11,-1,-1];
  const round=await runtimes.roundRuntime.resolve(ctx,{
    roundId:'v448-round-reflect',
    counterPolicy:'execute',
    attackRolls:[{attackerBid:0,...bundle()}],
    counterRollsByActorBid:{0:Array(5).fill(1),10:Array(5).fill(1)},
    counterAttackRollsByActorBid:{0:Array.from({length:5},bundle),10:Array.from({length:5},bundle)},
    weaponClassByBid:{0:'claw',10:'claw'}
  });
  assert.equal(round.ok,true,JSON.stringify(round));
  assert.equal(round.counterChains.length,0);
  assert.equal(round.attacks.length,1);
  assert.equal(round.attacks[0].damageReactPlan.reaction.code,2);
  assert.equal(round.attacks[0].damageExecuted,true);
  assert.equal(round.context.sides[0].entries[0].hp,83);
  assert.equal(round.context.sides[1].entries[0].hp,100);
  assert.equal(round.nextCommandPhase,true);
}

// Counter -> defender reflect -> reflected damage lands on counter attacker -> chain stops.
{
  const runtimes=runtimeSet();
  const ctx=fresh({playerReflect:true});
  const result=await runtimes.counterChainRuntime.resolve(ctx,{
    originAttackerBid:0,
    originTargetBid:10,
    counterRolls:[1,1,1,1,1],
    counterAttackRolls:Array.from({length:5},bundle),
    weaponClassByBid:{0:'claw',10:'claw'},
    transactionPrefix:'v448-counter-reflect'
  });
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.chainCount,1);
  assert.equal(result.counterTriggeredCount,1);
  assert.equal(result.chain[0].check.reactSuppressed,true);
  assert.equal(result.chain[0].check.sourceReturnFlag,false);
  assert.equal(result.chain[0].check.triggered,true);
  assert.equal(result.chain[0].check.attackerBid,10);
  assert.equal(result.chain[0].commit.reaction.code,2);
  assert.equal(result.chain[0].commit.damageExecuted,true);
  assert.equal(result.chain[0].commit.hpMutations[0].bid,10);
  assert.equal(result.context.sides[0].entries[0].hp,100);
  assert.equal(result.context.sides[1].entries[0].hp,88);
}

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v448-browser-battle-damage-react-integration-v1',
  mainRoundReflect:{attackerHp:83,defenderHp:100,counterChains:0},
  counterReflect:{chainCount:1,counterTriggeredCount:1,counterAttackerHp:83},
  supportedReactions:['vanish','absorb','reflect','trap','acupuncture'],
  persistentMutation:false
},null,2));
