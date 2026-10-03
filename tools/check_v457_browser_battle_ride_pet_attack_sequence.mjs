#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createBrowserBattleEnemyExpRuntime } from '../src/stoneage_browser_battle_enemy_exp_runtime.mjs';
import { createBrowserBattleProfitCreditRuntime } from '../src/stoneage_browser_battle_profit_credit_runtime.mjs';
import { createBrowserBattleCarriedLootRuntime } from '../src/stoneage_browser_battle_carried_loot_runtime.mjs';
import { createBrowserBattleEnemyExpRuntime } from '../src/stoneage_browser_battle_enemy_exp_runtime.mjs';
import { createBrowserBattleRelifeRuntime } from '../src/stoneage_browser_battle_relife_runtime.mjs';
import { createBrowserBattleCarriedLootRuntime } from '../src/stoneage_browser_battle_carried_loot_runtime.mjs';
import { createBrowserBattleAttackSequenceRuntime } from '../src/stoneage_browser_battle_attack_sequence_runtime.mjs';
import { createBrowserBattleAttackPreflightRuntime } from '../src/stoneage_browser_battle_attack_preflight_runtime.mjs';
import { createBrowserBattleAttackSeqPreludeRuntime } from '../src/stoneage_browser_battle_attack_seq_prelude_runtime.mjs';
import { createBrowserBattleDamagePlanRuntime } from '../src/stoneage_browser_battle_damage_plan_runtime.mjs';
import { createBrowserBattleCriticalDamageRuntime } from '../src/stoneage_browser_battle_critical_damage_runtime.mjs';
import { createBrowserBattleDamageReactRuntime } from '../src/stoneage_browser_battle_damage_react_runtime.mjs';
import { createBrowserBattleDamageReactCommitRuntime } from '../src/stoneage_browser_battle_damage_react_commit_runtime.mjs';
import { createBrowserBattleDamageDeathChainRuntime } from '../src/stoneage_browser_battle_damage_death_chain_runtime.mjs';

const p={
  bid:0,sourceType:'player',battleSide:0,battleSlot:0,hp:1000,maxHp:1000,level:10,
  workGetExp:0,killPetCount:0,fixDex:100,quick:100,fixVital:1,attackPower:30,defencePower:1,
  fixStr:30,fixTgh:1,battleFlg:0,battleCommands:[1,10,-1],sourceBattleCharMode:3,battleMode:'c_ok',
  isAttacked:1,isDie:false,dead:false,damageVanish:0,damageAbsorb:0,damageReflect:0,damageReact:0,
  elements:{fire:0,water:0,earth:0,wind:0},fixLuck:0,getitem:[-1,-1,-1]
};
const pet={
  bid:5,sourceType:'pet',battleSide:0,battleSlot:5,hp:100,maxHp:100,level:10,
  workGetExp:0,killPetCount:0,fixDex:80,quick:80,fixVital:1,attackPower:20,defencePower:1,
  fixStr:20,fixTgh:1,battleFlg:0,battleCommands:[0,-1,-1],sourceBattleCharMode:3,battleMode:'c_ok',
  isAttacked:1,isDie:false,dead:false,damageVanish:0,damageAbsorb:0,damageReflect:0,damageReact:0,
  elements:{fire:0,water:0,earth:0,wind:0},fixLuck:0,getitem:[-1,-1,-1]
};
const enemy={
  bid:10,sourceType:'enemy',battleSide:1,battleSlot:0,hp:1,maxHp:1,level:10,sourceEnemyExp:100,
  fixDex:1,quick:1,fixVital:1,attackPower:1,defencePower:1,fixStr:1,fixTgh:1,battleFlg:0,
  battleCommands:[0,-1,-1],sourceBattleCharMode:3,battleMode:'c_ok',isAttacked:1,isDie:false,dead:false,
  damageVanish:0,damageAbsorb:0,damageReflect:0,damageReact:0,elements:{fire:0,water:0,earth:0,wind:0},
  fixLuck:0,getitem:[-1,-1,-1]
};
const ctx={format:'stoneage-browser-battle-context-runtime-v1',context:{
  mode:'battle',sourceMode:2,turn:0,damageCommitRevision:0,fieldAtt:4,attPow:0,
  sides:[
    {side:0,type:0,entries:[p,null,null,null,null,pet,null,null,null,null]},
    {side:1,type:1,entries:[enemy,null,null,null,null,null,null,null,null,null]}
  ]
}};

const profitCreditRuntime=createBrowserBattleProfitCreditRuntime();
const carriedLootRuntime=createBrowserBattleCarriedLootRuntime();
const enemyExpRuntime=createBrowserBattleEnemyExpRuntime();
const relifeRuntime=createBrowserBattleRelifeRuntime();
const carriedLootRuntime=createBrowserBattleCarriedLootRuntime();
const enemyExpRuntime=createBrowserBattleEnemyExpRuntime();
const attackPreflightRuntime=createBrowserBattleAttackPreflightRuntime();
const attackSeqPreludeRuntime=createBrowserBattleAttackSeqPreludeRuntime();
const damagePlanRuntime=createBrowserBattleDamagePlanRuntime();
const criticalDamageRuntime=createBrowserBattleCriticalDamageRuntime();
const damageReactRuntime=createBrowserBattleDamageReactRuntime();
const damageReactCommitRuntime=createBrowserBattleDamageReactCommitRuntime();
const damageDeathChainRuntime=createBrowserBattleDamageDeathChainRuntime();
const sequence=createBrowserBattleAttackSequenceRuntime({
  attackPreflightRuntime,attackSeqPreludeRuntime,damagePlanRuntime,criticalDamageRuntime,
  damageReactRuntime,damageReactCommitRuntime,damageDeathChainRuntime,
  profitCreditRuntime,carriedLootRuntime,enemyExpRuntime
});
assert.equal(sequence.ok,true);

const bundle={
  weaponType:'none',weaponCritical:0,throwWeapon:false,duckRoll:10000,criticalRoll:10000,
  damageRollNear:1,damageRollWide:1,guardRoll:96,lowDamageRoll:1,battleDamageModify:1,
  includeAttr:false,defaultTargetRoll:0
};
const result=await sequence.resolve(ctx,{
  attackerBid:0,requestedTargetBid:10,weaponType:'none',attackCount:1,
  targets:[10],hitRollBundles:[bundle],transactionPrefix:'v457-ride',
  ridePetBidByParticipantBid:{0:5}
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.hits.length,1);
assert.equal(result.hits[0].enemyExpCredit.newCredits[0].exp,100);
assert.equal(result.hits[0].enemyExpCredit.newCredits[0].ridePetCredit.exp,60);
assert.equal(result.context.sides[0].entries[0].workGetExp,100);
assert.equal(result.context.sides[0].entries[5].workGetExp,60);
assert.equal(result.context.sides[0].entries[5].killPetCount,1);
assert.equal(result.persistentMutation,false);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v457-browser-battle-attack-sequence-v1',
  order:['damage commit','BATTLE_AddProfit credit','carried loot queue','player EXP/KillPetCount','Ride Pet EXP x0.6'],
  playerExp:100,
  ridePetExp:60,
  persistentMutation:false
},null,2));
