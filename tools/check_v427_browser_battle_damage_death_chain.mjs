#!/usr/bin/env node
import assert from 'node:assert/strict';
import {buildReactionPlan} from '../src/stoneage_browser_battle_damage_react_runtime.mjs';
import {commitBattleDamageDeathChain} from '../src/stoneage_browser_battle_damage_death_chain_runtime.mjs';

function makeContext({attackerHp=100,targetHp=100,targetMaxHp=100,targetWorkUltimate=0,targetSide=1,targetBid=null,targetBattleFlg=0}={}){
  const sides=[
    {side:0,type:0,entries:Array(10).fill(null)},
    {side:1,type:1,entries:Array(10).fill(null)}
  ];
  const chosenBid=targetBid??(targetSide===0?0:10);
  const targetSideIndex=chosenBid>=10?1:0;
  const targetSlot=chosenBid>=10?chosenBid-10:chosenBid;
  sides[0].entries[0]={
    bid:0,battleSlot:0,battleSide:0,sourceType:'player',hp:attackerHp,maxHp:100,
    isDie:false,deadCount:0,battleFlg:0,workUltimate:0,battleOutcomeFlags:0,ultimate:0
  };
  sides[targetSideIndex].entries[targetSlot]={
    bid:chosenBid,battleSlot:targetSlot,battleSide:targetSideIndex,
    sourceType:targetSideIndex===0?'player':'enemy',hp:targetHp,maxHp:targetMaxHp,
    workUltimate:targetWorkUltimate,isDie:false,deadCount:0,battleFlg:targetBattleFlg,
    battleOutcomeFlags:0,ultimate:0,defencePower:20,damageVanish:0,damageAbsorb:0,damageReflect:0,battleStatus:{}
  };
  return {format:'stoneage-browser-battle-context-runtime-v1',context:{
    mode:'battle',sourceMode:2,damageCommitRevision:0,damageCommitReceipts:{},sides
  }};
}
function damagePlan(context,damage,targetBid=10){
  return buildReactionPlan(context,{attackerBid:0,targetBid,damage});
}

const nonlethal=makeContext();
const nonlethalResult=commitBattleDamageDeathChain(nonlethal,{
  damageReactPlan:damagePlan(nonlethal,30),transactionId:'v427-nonlethal'
});
assert.equal(nonlethalResult.ok,true,JSON.stringify(nonlethalResult));
assert.equal(nonlethalResult.stage,'battle-damage-death-nonlethal');
assert.equal(nonlethalResult.lethal,false);
assert.equal(nonlethalResult.battleContext.context.sides[1].entries[0].hp,70);
assert.equal(nonlethalResult.battleContext.context.sides[1].entries[0].isDie,false);
assert.equal(nonlethal.context.sides[1].entries[0].hp,100,'input remains immutable');

const lethal=makeContext({targetHp:10});
const lethalPlan=damagePlan(lethal,20);
const lethalResult=commitBattleDamageDeathChain(lethal,{
  damageReactPlan:lethalPlan,transactionId:'v427-lethal'
});
assert.equal(lethalResult.ok,true,JSON.stringify(lethalResult));
assert.equal(lethalResult.stage,'battle-damage-death-committed');
assert.equal(lethalResult.hpAfter,0);
assert.equal(lethalResult.deathCommitted,true);
assert.equal(lethalResult.battleContext.context.sides[1].entries[0].isDie,true);
assert.equal(lethalResult.battleContext.context.sides[1].entries[0].deadCount,1);
assert.equal(lethal.context.sides[1].entries[0].hp,10,'input remains immutable');

const critical=makeContext({targetHp:10});
const criticalPlan=damagePlan(critical,20);
const missingRoll=commitBattleDamageDeathChain(critical,{
  damageReactPlan:criticalPlan,transactionId:'v427-critical',critical:true
});
assert.equal(missingRoll.ok,false);
assert.equal(missingRoll.reason,'critical-death-rng-required-or-out-of-range');
assert.equal(missingRoll.battleContext.context.sides[1].entries[0].hp,10,'missing RNG is atomic');
const criticalResult=commitBattleDamageDeathChain(critical,{
  damageReactPlan:criticalPlan,transactionId:'v427-critical',critical:true,deathRoll:49
});
assert.equal(criticalResult.ok,true,JSON.stringify(criticalResult));
assert.equal(criticalResult.deathPlan.ultimate,1);
assert.equal(criticalResult.battleContext.context.sides[1].entries[0].ultimate,1);

const immediate=makeContext({targetHp:10,targetMaxHp:100});
const immediateResult=commitBattleDamageDeathChain(immediate,{
  damageReactPlan:damagePlan(immediate,150),transactionId:'v427-immediate'
});
assert.equal(immediateResult.ok,true,JSON.stringify(immediateResult));
assert.equal(immediateResult.deathPlan.ultimate,2);
assert.equal(immediateResult.battleContext.context.sides[1].entries[0].ultimate,2);

const replay=commitBattleDamageDeathChain(lethalResult.battleContext,{
  damageReactPlan:lethalPlan,transactionId:'v427-lethal'
});
assert.equal(replay.ok,true,JSON.stringify(replay));
assert.equal(replay.idempotent,true);
assert.equal(replay.deathCommitted,true);
assert.equal(replay.battleContext.context.sides[1].entries[0].deadCount,1);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v427-browser-battle-damage-death-chain-v1',
  cases:['nonlethal damage commit','lethal damage and death commit','critical death RNG fail-closed and retry','immediate ultimate propagation','transaction replay after death'],
  atomicOnMissingRng:true,
  persistentMutation:false
},null,2));
