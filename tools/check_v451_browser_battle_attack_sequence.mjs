#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createBrowserBattleAttackSequenceRuntime } from '../src/stoneage_browser_battle_attack_sequence_runtime.mjs';
import { createBrowserBattleAttackPreflightRuntime } from '../src/stoneage_browser_battle_attack_preflight_runtime.mjs';
import { createBrowserBattleAttackSeqPreludeRuntime } from '../src/stoneage_browser_battle_attack_seq_prelude_runtime.mjs';
import { createBrowserBattleDamagePlanRuntime } from '../src/stoneage_browser_battle_damage_plan_runtime.mjs';
import { createBrowserBattleCriticalDamageRuntime } from '../src/stoneage_browser_battle_critical_damage_runtime.mjs';
import { createBrowserBattleDamageReactRuntime } from '../src/stoneage_browser_battle_damage_react_runtime.mjs';
import { createBrowserBattleDamageReactCommitRuntime } from '../src/stoneage_browser_battle_damage_react_commit_runtime.mjs';
import { createBrowserBattleDamageDeathChainRuntime } from '../src/stoneage_browser_battle_damage_death_chain_runtime.mjs';

const makeEntry=(bid,sourceType,hp=100)=>({
  bid,
  battleSlot:bid>=10?bid-10:bid,
  battleSide:bid>=10?1:0,
  sourceType,
  hp,maxHp:100,
  fixDex:100,quick:100,fixVital:1,
  attackPower:30,defencePower:1,fixStr:30,fixTgh:1,
  battleFlg:0,battleCommands:[1,bid>=10?0:10,-1],
  sourceBattleCharMode:3,battleMode:'c_ok',
  isDie:false,deadCount:0,relife:0,
  battleOutcomeFlags:0,workUltimate:0,fixLuck:0,
  damageVanish:0,damageAbsorb:0,damageReflect:0,damageReact:0,
  elements:{fire:0,water:0,earth:0,wind:0}
});

const base=()=>{
  const p=makeEntry(0,'player');
  const e0=makeEntry(10,'enemy');
  const e1=makeEntry(11,'enemy');
  return {
    format:'stoneage-browser-battle-context-runtime-v1',
    context:{
      mode:'battle',sourceMode:2,turn:1,damageCommitRevision:0,fieldAtt:4,attPow:0,
      sides:[
        {side:0,type:0,flg:0,entries:[p,...Array(9).fill(null)]},
        {side:1,type:1,flg:0,entries:[e0,e1,...Array(8).fill(null)]}
      ]
    }
  };
};

const deps={
  attackPreflightRuntime:createBrowserBattleAttackPreflightRuntime(),
  attackSeqPreludeRuntime:createBrowserBattleAttackSeqPreludeRuntime(),
  damagePlanRuntime:createBrowserBattleDamagePlanRuntime(),
  criticalDamageRuntime:createBrowserBattleCriticalDamageRuntime(),
  damageReactRuntime:createBrowserBattleDamageReactRuntime(),
  damageReactCommitRuntime:createBrowserBattleDamageReactCommitRuntime(),
  damageDeathChainRuntime:createBrowserBattleDamageDeathChainRuntime()
};
const runtime=createBrowserBattleAttackSequenceRuntime(deps);
assert.equal(runtime.ok,true);

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
  includeAttr:false
});

{
  const ctx=base();
  const result=await runtime.resolve(ctx,{
    attackerBid:0,
    requestedTargetBid:10,
    weaponType:'fist',
    attackCount:3,
    targets:[10,10,10],
    hitRollBundles:[bundle(),bundle(),bundle()],
    transactionPrefix:'v451-fist'
  });
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.stage,'battle-attack-sequence-resolved');
  assert.equal(result.attackCount,3);
  assert.equal(result.executedHitCount,3);
  assert.deepEqual(result.hits.map(x=>x.damageDiv),[3,3,3]);
  assert.deepEqual(result.hits.map(x=>x.damage),[5,5,5]);
  assert.deepEqual(result.hits.map(x=>x.sourceDamage),[17,17,17]);
  assert.equal(result.context.sides[1].entries[0].hp,85);
  assert.equal(result.context.damageCommitRevision,3);
  assert.equal(result.persistentMutation,false);
  assert.equal(result.counterDeferred,true);
}

{
  const ctx=base();
  const result=await runtime.resolve(ctx,{
    attackerBid:0,
    requestedTargetBid:10,
    weaponType:'bow',
    attackCount:2,
    targets:[10,11],
    hitRollBundles:[bundle(),bundle()],
    transactionPrefix:'v451-bow'
  });
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.attackCount,2);
  assert.equal(result.executedHitCount,2);
  assert.deepEqual(result.hits.map(x=>x.finalTargetBid),[10,11]);
  assert.deepEqual(result.hits.map(x=>x.damageDiv),[1,1]);
  assert.deepEqual(result.hits.map(x=>x.damage),[17,17]);
  assert.equal(result.context.sides[1].entries[0].hp,83);
  assert.equal(result.context.sides[1].entries[1].hp,83);
  assert.equal(result.context.damageCommitRevision,2);
}

{
  const ctx=base();
  ctx.context.sides[1].entries[0].hp=4;
  const result=await runtime.resolve(ctx,{
    attackerBid:0,
    requestedTargetBid:10,
    weaponType:'fist',
    attackCount:3,
    targets:[10,10,10],
    hitRollBundles:[bundle(),bundle(),bundle()],
    transactionPrefix:'v451-lethal'
  });
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.executedHitCount,1);
  assert.equal(result.hits[0].remainingHitsBlocked,true);
  assert.equal(result.context.sides[1].entries[0].hp,0);
  assert.equal(result.context.sides[1].entries[0].isDie,true);
}

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v451-browser-battle-attack-sequence-v1',
  fist3Hit:{sourceDamage:[17,17,17],damage:[5,5,5],finalEnemyHp:85,damageDivisor:3},
  bow2Hit:{targets:[10,11],damage:[17,17],finalEnemyHp:[83,83]},
  lethalStopsRemainingHits:true,
  persistentMutation:false,
  counterDeferred:true
},null,2));
