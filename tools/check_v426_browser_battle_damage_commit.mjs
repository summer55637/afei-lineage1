#!/usr/bin/env node
import assert from 'node:assert/strict';
import { buildReactionPlan, BATTLE_MD_REFLEC } from '../src/stoneage_browser_battle_damage_react_runtime.mjs';
import { commitBattleDamage } from '../src/stoneage_browser_battle_damage_commit_runtime.mjs';

const entry=(bid,side,{hp=100,maxHp=100,workUltimate=0,damageVanish=0,damageReflect=0,...rest}={})=>({
  bid,battleSlot:bid>=10?bid-10:bid,battleSide:side,
  sourceType:side===0?'player':'enemy',hp,maxHp,workUltimate,
  defencePower:20,damageVanish,damageReflect,battleStatus:{},...rest
});
function context({targetHp=100,targetMaxHp=100,targetWorkUltimate=0,targetVanish=0,targetReflect=0}={}){
  const sides=[
    {side:0,type:0,entries:Array(10).fill(null)},
    {side:1,type:1,entries:Array(10).fill(null)}
  ];
  sides[0].entries[0]=entry(0,0);
  sides[1].entries[0]=entry(10,1,{hp:targetHp,maxHp:targetMaxHp,workUltimate:targetWorkUltimate,damageVanish:targetVanish,damageReflect:targetReflect});
  return {format:'stoneage-browser-battle-context-runtime-v1',context:{mode:'battle',sourceMode:2,damageCommitRevision:0,damageCommitReceipts:{},sides}};
}
const plan=(ctx,damage,options={})=>buildReactionPlan(ctx,{attackerBid:0,targetBid:10,damage,...options});

const base=context();
const normal=plan(base,30);
assert.equal(normal.ok,true,JSON.stringify(normal));
assert.equal(normal.damageCommitRevision,0);
assert.equal(normal.hpMutation,false);
assert.equal(base.context.sides[1].entries[0].hp,100);
const applied=commitBattleDamage(base,{damageReactPlan:normal,transactionId:'v426-normal'});
assert.equal(applied.ok,true,JSON.stringify(applied));
assert.equal(applied.applied,true);
assert.equal(applied.damageExecuted,true);
assert.equal(applied.hpBefore,100);
assert.equal(applied.hpAfter,70);
assert.equal(applied.battleContext.context.sides[1].entries[0].hp,70);
assert.equal(applied.battleContext.context.damageCommitRevision,1);
assert.equal(base.context.sides[1].entries[0].hp,100,'source context must remain immutable');
assert.equal(applied.persistentMutation,false);

const replay=commitBattleDamage(applied.battleContext,{damageReactPlan:normal,transactionId:'v426-normal'});
assert.equal(replay.ok,true,JSON.stringify(replay));
assert.equal(replay.idempotent,true);
assert.equal(replay.applied,false);
assert.equal(replay.battleContext.context.sides[1].entries[0].hp,70);
assert.equal(replay.battleContext.context.damageCommitRevision,1);

const conflicting=plan(base,20);
const conflict=commitBattleDamage(applied.battleContext,{damageReactPlan:conflicting,transactionId:'v426-normal'});
assert.equal(conflict.ok,false);
assert.equal(conflict.reason,'damage-commit-transaction-conflict');

const stale=commitBattleDamage(applied.battleContext,{damageReactPlan:conflicting,transactionId:'v426-stale'});
assert.equal(stale.ok,false);
assert.equal(stale.reason,'damage-commit-stale-plan');

const deadTarget=structuredClone(base);
deadTarget.context.sides[1].entries[0].isDie=true;
const targetAlreadyDead=commitBattleDamage(deadTarget,{damageReactPlan:normal,transactionId:'v426-dead-target'});
assert.equal(targetAlreadyDead.ok,false);
assert.equal(targetAlreadyDead.reason,'target-already-dead');

const wrongRevision=commitBattleDamage(base,{damageReactPlan:normal,transactionId:'v426-wrong-revision',expectedDamageRevision:1});
assert.equal(wrongRevision.ok,false);
assert.equal(wrongRevision.reason,'damage-commit-expected-revision-mismatch');

const immediateCtx=context({targetHp:30,targetMaxHp:100,targetWorkUltimate:120});
const immediate=commitBattleDamage(immediateCtx,{damageReactPlan:plan(immediateCtx,150),transactionId:'v426-ultimate-immediate'});
assert.equal(immediate.ok,true,JSON.stringify(immediate));
assert.equal(immediate.hpAfter,0);
assert.equal(immediate.overkill,120);
assert.equal(immediate.ultimateFromDamage,2);
assert.equal(immediate.workUltimateAfter,0);

const accumulatedCtx=context({targetHp:5,targetMaxHp:100,targetWorkUltimate:135});
const accumulated=commitBattleDamage(accumulatedCtx,{damageReactPlan:plan(accumulatedCtx,15),transactionId:'v426-ultimate-accumulated'});
assert.equal(accumulated.ok,true,JSON.stringify(accumulated));
assert.equal(accumulated.hpAfter,0);
assert.equal(accumulated.overkill,10);
assert.equal(accumulated.ultimateFromDamage,1);
assert.equal(accumulated.workUltimateAfter,0);

const zeroCtx=context({targetVanish:1});
const zeroPlan=plan(zeroCtx,0);
assert.equal(zeroPlan.ok,true,JSON.stringify(zeroPlan));
assert.equal(zeroPlan.reaction.code,0);
assert.equal(zeroPlan.stateConsumption.length,0);
assert.equal(zeroPlan.stage,'battle-damage-react-noop');
const zero=commitBattleDamage(zeroCtx,{damageReactPlan:zeroPlan,transactionId:'v426-zero'});
assert.equal(zero.ok,true,JSON.stringify(zero));
assert.equal(zero.applied,false);
assert.equal(zero.battleContext.context.damageCommitRevision,0);
assert.equal(zero.battleContext.context.sides[1].entries[0].hp,100);

const reflectCtx=context({targetReflect:1});
const reflectPlan=plan(reflectCtx,30);
assert.equal(reflectPlan.reaction.code,BATTLE_MD_REFLEC);
const unsupported=commitBattleDamage(reflectCtx,{damageReactPlan:reflectPlan,transactionId:'v426-reflect'});
assert.equal(unsupported.ok,false);
assert.equal(unsupported.reason,'special-reaction-or-ride-pet-commit-deferred');
assert.equal(reflectCtx.context.sides[1].entries[0].hp,100);

const rideCtx=context();
const ridePlan=plan(rideCtx,30,{defenderRidePet:true,defenderPetDefencePower:20});
const ride=commitBattleDamage(rideCtx,{damageReactPlan:ridePlan,transactionId:'v426-ride'});
assert.equal(ride.ok,false);
assert.equal(ride.reason,'special-reaction-or-ride-pet-commit-deferred');

const finish={...base,context:{...base.context,mode:'finish',sourceMode:3}};
const wrongPhase=commitBattleDamage(finish,{damageReactPlan:normal,transactionId:'v426-finish'});
assert.equal(wrongPhase.ok,false);
assert.equal(wrongPhase.reason,'battle-active-phase-required');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v426-browser-battle-damage-commit-v1',
  cases:['normal HP mutation','input immutability','transaction replay','transaction conflict','stale plan','revision mismatch','immediate ultimate','overflow ultimate accumulation','zero damage no-op','reaction fail-closed','ride-pet fail-closed','active battle phase gate'],
  persistentMutation:false
},null,2));
