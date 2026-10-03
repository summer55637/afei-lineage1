#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createBrowserBattleRoundRuntime } from '../src/stoneage_browser_battle_round_runtime.mjs';
import { createBrowserBattleAttackCountRuntime } from '../src/stoneage_browser_battle_attack_count_runtime.mjs';
import { createBrowserBattleTargetListRuntime } from '../src/stoneage_browser_battle_target_list_runtime.mjs';
import { createBrowserBattleAttackSequenceRuntime } from '../src/stoneage_browser_battle_attack_sequence_runtime.mjs';
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
import { createBrowserBattleCounterRuntime } from '../src/stoneage_browser_battle_counter_runtime.mjs';
import { createBrowserBattleCounterChainRuntime } from '../src/stoneage_browser_battle_counter_chain_runtime.mjs';
import { createBrowserBattleStatusRuntime } from '../src/stoneage_browser_battle_status_runtime.mjs';
import { createBrowserBattleEndRuntime } from '../src/stoneage_browser_battle_end_runtime.mjs';

const entry=(bid,{sourceType,hp=1000,maxHp=1000,attackPower=30,defencePower=1,level=10,command=1,target=-1,sourceEnemyExp=-1}={})=>({
  bid,
  battleSlot:bid>=10?bid-10:bid,
  battleSide:bid>=10?1:0,
  sourceType,
  hp,maxHp,
  fixDex:100,
  quick:100,
  fixVital:1,
  attackPower,
  defencePower,
  fixStr:attackPower,
  fixTgh:defencePower,
  level,
  fixLuck:0,
  battleFlg:0,
  battleCommands:[command,target,-1],
  sourceBattleCharMode:3,
  battleMode:'c_ok',
  elements:{fire:0,water:0,earth:0,wind:0},
  damageVanish:0,
  damageAbsorb:0,
  damageReflect:0,
  damageReact:0,
  isDie:false,
  deadCount:0,
  relife:0,
  battleOutcomeFlags:0,
  sourceEnemyExp
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
    norisk:0,
    dpbattle:0,
    finishHookProfile:{
      auditFormat:'stoneage-battle-finish-hook-audit-v1',
      profile:'ordinary-world-encounter',
      winFuncInjected:false,
      pkFuncInjected:false,
      dantai:false,
      linkedBattleCount:0
    },
    sides:[
      {side:0,type:0,flg:0,entries:[
        entry(0,{sourceType:'player',hp:1000,maxHp:1000,attackPower:1000,defencePower:1,command:1,target:10}),
        ...Array(9).fill(null)
      ]},
      {side:1,type:1,flg:0,entries:[
        entry(10,{sourceType:'enemy',hp:1,maxHp:1,attackPower:20,defencePower:1,command:2,target:0,sourceEnemyExp:100}),
        ...Array(9).fill(null)
      ]}
    ]
  }
};

const attackCountRuntime=createBrowserBattleAttackCountRuntime();
const targetListRuntime=createBrowserBattleTargetListRuntime();
const attackPreflightRuntime=createBrowserBattleAttackPreflightRuntime();
const attackSeqPreludeRuntime=createBrowserBattleAttackSeqPreludeRuntime();
const damagePlanRuntime=createBrowserBattleDamagePlanRuntime();
const criticalDamageRuntime=createBrowserBattleCriticalDamageRuntime();
const damageReactRuntime=createBrowserBattleDamageReactRuntime();
const damageReactCommitRuntime=createBrowserBattleDamageReactCommitRuntime();
const damageDeathChainRuntime=createBrowserBattleDamageDeathChainRuntime();
const profitCreditRuntime=createBrowserBattleProfitCreditRuntime();
const carriedLootRuntime=createBrowserBattleCarriedLootRuntime();
const enemyExpRuntime=createBrowserBattleEnemyExpRuntime();
const relifeRuntime=createBrowserBattleRelifeRuntime();
const attackSequenceRuntime=createBrowserBattleAttackSequenceRuntime({
  attackPreflightRuntime,attackSeqPreludeRuntime,damagePlanRuntime,criticalDamageRuntime,
  damageReactRuntime,damageReactCommitRuntime,damageDeathChainRuntime,
  profitCreditRuntime,carriedLootRuntime,enemyExpRuntime,relifeRuntime
});
const counterRuntime=createBrowserBattleCounterRuntime();
const counterChainRuntime=createBrowserBattleCounterChainRuntime({
  counterRuntime,attackSeqPreludeRuntime,damagePlanRuntime,criticalDamageRuntime,
  damageReactRuntime,damageReactCommitRuntime,damageDeathChainRuntime,
  profitCreditRuntime,carriedLootRuntime,enemyExpRuntime,relifeRuntime
});
const statusRuntime=createBrowserBattleStatusRuntime();
const endRuntime=createBrowserBattleEndRuntime();
const roundRuntime=createBrowserBattleRoundRuntime({
  attackCountRuntime,targetListRuntime,attackSequenceRuntime,
  attackPreflightRuntime,attackSeqPreludeRuntime,damagePlanRuntime,criticalDamageRuntime,
  damageReactRuntime,damageReactCommitRuntime,damageDeathChainRuntime,
  counterChainRuntime,statusRuntime,endRuntime,
  profitCreditRuntime,carriedLootRuntime,enemyExpRuntime,relifeRuntime
});

assert.equal(roundRuntime.ok,true);

const bundle={
  weaponType:'fist',
  weaponCritical:0,
  throwWeapon:false,
  duckRoll:10000,
  criticalRoll:10000,
  damageRollNear:1,
  damageRollWide:100,
  guardRoll:96,
  lowDamageRoll:1,
  battleDamageModify:1,
  includeAttr:false,
  defaultTargetRoll:0
};

const result=await roundRuntime.resolve(context,{
  roundId:'v465-single-basic-reward-chain',
  counterPolicy:'defer',
  attackRolls:[{attackerBid:0,...bundle}],
  attackCountInputsByBid:{0:{itemPresent:true,attackNumMin:1,attackNumMax:1,roll:1,weaponType:'fist'}},
  deathExtraRandomRollsByBid:{},
  defaultPetBidByPlayerBid:{0:5}
});

assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.stage,'battle-round-resolved');
assert.equal(result.attacks.length,1);

const attack=result.attacks[0];
assert.equal(attack.attackCount,1);
assert.equal(attack.attackSequence,undefined);
assert.ok(attack.profitCredit,'basic single-hit path must execute AddProfit credit');
assert.equal(attack.profitCredit.newCredits.length,1);
assert.equal(attack.profitCredit.newCredits[0].enemyBid,10);
assert.equal(attack.profitCredit.newCredits[0].credited,true);

assert.equal(attack.carriedLoot,null);
assert.ok(attack.enemyExpCredit,'basic single-hit path must execute Enemy EXP credit');
assert.equal(attack.enemyExpCredit.newCredits.length,1);
assert.equal(attack.enemyExpCredit.newCredits[0].actorBid,0);

assert.ok(attack.relife,'basic single-hit path must execute relife gate before next action');
assert.equal(attack.relife.applied,false);
assert.equal(attack.relife.stage,'battle-relife-skipped-alive');
assert.equal(attack.profitCredit.newCredits[0].credited,true);
assert.equal(result.context.sides[0].entries[0].isDie,false);
assert.equal(result.persistentMutation,false);

const orderContext={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',sourceMode:2,norisk:0,dpbattle:0,
    finishHookProfile:{
      auditFormat:'stoneage-battle-finish-hook-audit-v1',
      profile:'ordinary-world-encounter',
      winFuncInjected:false,pkFuncInjected:false,dantai:false,linkedBattleCount:0
    },
    sourcePlayerItemSlotsSnapshot:[400,...Array(23).fill(null)],
    sourcePlayerRelifeCandidates:[{
      playerSlot:0,existingIndex:400,itemId:20131,itemName:'Relife',
      relifeFunc:'ITEM_DIErelife',equipPlace:1,hpArgument:200
    }],
    sourceRelifeConsumedExistingIndexes:[],
    sourceRelifeEvents:[],
    sides:[
      {side:0,type:0,entries:[
        {bid:0,sourceType:'player',characterId:'p1',level:10,hp:0,maxHp:300,isDie:true,
         charm:20,variableAi:0,deadCount:1,ultimate:0,sourceAddProfitDeathPending:true,sourceDeathExtraProcessed:false}
      ]},
      {side:1,type:1,entries:Array(10).fill(null)}
    ]
  }
};
const relifeFirst=relifeRuntime.apply(orderContext,{trigger:'fixed-c-re-life-before-add-profit'});
assert.equal(relifeFirst.ok,true,JSON.stringify(relifeFirst));
assert.equal(relifeFirst.applied,true);
assert.equal(relifeFirst.context.sides[0].entries[0].hp,200);
assert.equal(relifeFirst.context.sides[0].entries[0].isDie,false);
assert.equal(relifeFirst.context.sourceRelifeEvents.length,1);

const postRelifeProfit=profitCreditRuntime.apply(
  {format:'stoneage-browser-battle-context-runtime-v1',context:relifeFirst.context},
  {attackerBids:[10],allowPlayerCredit:false,allowCommittedDeath:true,hitIndex:0,source:'ordering-check'}
);
assert.equal(postRelifeProfit.ok,true,JSON.stringify(postRelifeProfit));
assert.equal(postRelifeProfit.deathExtra.newEvents.length,0);
assert.equal(postRelifeProfit.context.sides[0].entries[0].charm,20);
assert.equal(postRelifeProfit.context.sides[0].entries[0].variableAi,0);

const lethalContext={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',sourceMode:2,turn:0,damageCommitRevision:0,fieldAtt:4,attPow:0,norisk:0,dpbattle:0,
    finishHookProfile:{auditFormat:'stoneage-battle-finish-hook-audit-v1',profile:'ordinary-world-encounter',winFuncInjected:false,pkFuncInjected:false,dantai:false,linkedBattleCount:0},
    sourcePlayerItemSlotsSnapshot:[400,...Array(23).fill(null)],
    sourcePlayerRelifeCandidates:[{playerSlot:0,existingIndex:400,itemId:20131,itemName:'替身娃娃 Lv1',relifeFunc:'ITEM_DIErelife',equipPlace:3,hpArgument:'200'}],
    sourceRelifeConsumedExistingIndexes:[],sourceRelifeEvents:[],
    sides:[
      {side:0,type:0,flg:0,entries:[{bid:0,battleSlot:0,battleSide:0,sourceType:'player',characterId:'p1',hp:1,maxHp:300,mp:0,maxMp:0,fixDex:1,quick:1,fixVital:1,attackPower:1,defencePower:1,level:10,fixLuck:0,battleFlg:0,battleCommands:[-1,-1,-1],sourceBattleCharMode:3,battleMode:'c_ok',elements:{fire:0,water:0,earth:0,wind:0},damageVanish:0,damageAbsorb:0,damageReflect:0,damageReact:0,isDie:false,deadCount:0,relife:0,battleOutcomeFlags:0,ultimate:0,charm:20,deadPetCount:0,sourceAddProfitDeathPending:false,sourceDeathExtraProcessed:false},...Array(9).fill(null)]},
      {side:1,type:1,flg:0,entries:[{bid:10,battleSlot:0,battleSide:1,sourceType:'enemy',characterId:'e10',hp:1000,maxHp:1000,fixDex:100,quick:100,fixVital:1,attackPower:100,defencePower:1,fixStr:100,fixTgh:1,level:10,fixLuck:0,battleFlg:0,battleCommands:[1,0,-1],sourceBattleCharMode:3,battleMode:'c_ok',elements:{fire:0,water:0,earth:0,wind:0},damageVanish:0,damageAbsorb:0,damageReflect:0,damageReact:0,isDie:false,deadCount:0,relife:0,battleOutcomeFlags:0,ultimate:0,sourceEnemyExp:-1},...Array(9).fill(null)]}
    ]
  }
};
const lethal=await attackSequenceRuntime.resolve(lethalContext,{attackerBid:10,requestedTargetBid:0,weaponType:'fist',attackCount:1,targets:[0],hitRollBundles:[{weaponCritical:0,throwWeapon:false,duckRoll:10000,criticalRoll:10000,damageRollNear:1,damageRollWide:100,guardRoll:96,lowDamageRoll:1,battleDamageModify:1,includeAttr:false,defaultTargetRoll:0}],transactionPrefix:'v465-lethal-player-relife'});
assert.equal(lethal.ok,true,JSON.stringify(lethal));
assert.equal(lethal.hits.length,1);
assert.equal(lethal.hits[0].profitCredit.deathExtra.newEvents[0].kind,'player-normal-death');
assert.equal(lethal.hits[0].relife.applied,true);
assert.equal(lethal.hits[0].relife.event.itemId,20131);
assert.equal(lethal.context.sides[0].entries[0].hp,200);
assert.equal(lethal.context.sides[0].entries[0].isDie,false);
assert.equal(lethal.context.sides[0].entries[0].sourceDeathExtraProcessed,false);
assert.equal(lethal.context.sourceRelifeEvents.length,1);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v465-browser-battle-basic-single-hit-reward-chain-v1',
  executedBasicHit:true,
  profitCreditEvents:attack.profitCredit.newCredits.length,
  carriedLoot:null,
  playerWorkGetExp:attack.enemyExpCredit.newCredits[0].workGetExpAfter,
  relifeStage:attack.relife.stage,
  enemyRewardProcessed:true,
  persistentMutation:false
},null,2));
