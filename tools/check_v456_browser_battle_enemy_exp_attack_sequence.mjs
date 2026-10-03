#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createBrowserBattleAttackSequenceRuntime } from '../src/stoneage_browser_battle_attack_sequence_runtime.mjs';
import { createBrowserBattleProfitCreditRuntime } from '../src/stoneage_browser_battle_profit_credit_runtime.mjs';
import { createBrowserBattleCarriedLootRuntime } from '../src/stoneage_browser_battle_carried_loot_runtime.mjs';
import { createBrowserBattleEnemyExpRuntime } from '../src/stoneage_browser_battle_enemy_exp_runtime.mjs';
import { createBrowserBattleAttackPreflightRuntime } from '../src/stoneage_browser_battle_attack_preflight_runtime.mjs';
import { createBrowserBattleAttackSeqPreludeRuntime } from '../src/stoneage_browser_battle_attack_seq_prelude_runtime.mjs';
import { createBrowserBattleDamagePlanRuntime } from '../src/stoneage_browser_battle_damage_plan_runtime.mjs';
import { createBrowserBattleCriticalDamageRuntime } from '../src/stoneage_browser_battle_critical_damage_runtime.mjs';
import { createBrowserBattleDamageReactRuntime } from '../src/stoneage_browser_battle_damage_react_runtime.mjs';
import { createBrowserBattleDamageReactCommitRuntime } from '../src/stoneage_browser_battle_damage_react_commit_runtime.mjs';
import { createBrowserBattleDamageDeathChainRuntime } from '../src/stoneage_browser_battle_damage_death_chain_runtime.mjs';

const enemy=(bid,hp)=>({
  bid,sourceType:bid<10?'player':'enemy',battleSide:bid<10?0:1,battleSlot:bid<10?bid:bid-10,
  hp,maxHp:hp,level:10,sourceEnemyExp:100,fixDex:100,quick:100,fixVital:1,
  attackPower:30,defencePower:1,fixStr:30,fixTgh:1,
  battleFlg:0,battleCommands:[1,bid<10?10:0,-1],sourceBattleCharMode:3,battleMode:'c_ok',
  isAttacked:1,isDie:false,dead:false,damageVanish:0,damageAbsorb:0,damageReflect:0,damageReact:0,
  elements:{fire:0,water:0,earth:0,wind:0},fixLuck:0,getitem:[-1,-1,-1],workGetExp:0,killPetCount:0
});

const context={format:'stoneage-browser-battle-context-runtime-v1',context:{
  mode:'battle',sourceMode:2,turn:0,damageCommitRevision:0,fieldAtt:4,attPow:0,
  sides:[
    {side:0,type:0,entries:[enemy(0,1000),...Array(9).fill(null)]},
    {side:1,type:1,entries:[enemy(10,1),...Array(9).fill(null)]}
  ]
}};
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

const runtime=createBrowserBattleAttackSequenceRuntime({
  attackPreflightRuntime,attackSeqPreludeRuntime,damagePlanRuntime,
  criticalDamageRuntime,damageReactRuntime,damageReactCommitRuntime,
  damageDeathChainRuntime,profitCreditRuntime,carriedLootRuntime,enemyExpRuntime
});
assert.equal(runtime.ok,true);

const bundle={
  attackerBid:0,weaponType:'none',weaponCritical:0,throwWeapon:false,
  duckRoll:10000,criticalRoll:10000,damageRollNear:1,damageRollWide:1,
  guardRoll:96,lowDamageRoll:1,battleDamageModify:1,includeAttr:false,defaultTargetRoll:0
};

const result=await runtime.resolve(context,{
  attackerBid:0,requestedTargetBid:10,weaponType:'none',
  attackCount:1,targets:[10],hitRollBundles:[bundle],transactionPrefix:'v456-sequence',
  carriedLootItemsByEnemyBid:{10:[{existingIndex:201,itemId:1234}]},
  carriedLootOwnerRollsByEnemyBid:{10:[0]}
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.executedHitCount,1);
assert.equal(result.hits[0].profitCredit.newCredits.length,1);
assert.equal(result.hits[0].carriedLoot.newTransfers.length,1);
assert.equal(result.hits[0].carriedLoot.newTransfers[0].existingIndex,201);
assert.equal(result.hits[0].enemyExpCredit.newCredits.length,1);
assert.equal(result.hits[0].enemyExpCredit.newCredits[0].exp,100);
assert.equal(result.context.sides[0].entries[0].getitem[0],201);
assert.equal(result.context.sides[0].entries[0].workGetExp,100);
assert.equal(result.context.sides[0].entries[0].killPetCount,1);
assert.equal(result.context.sides[1].entries[0].sourceRewardProcessed,true);
assert.equal(result.context.sides[1].entries[0].sourceCarriedLootProcessed,true);
assert.equal(result.context.sides[1].entries[0].sourceExpCreditProcessed,true);
assert.equal(result.persistentMutation,false);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v456-browser-battle-attack-sequence-v1',
  order:['damage commit','BATTLE_AddProfit credit','carried loot queue','EXP/KillPetCount credit'],
  enemyBid:10,carriedItem:201,exp:100,killPetCount:1,
  persistentMutation:false
},null,2));
