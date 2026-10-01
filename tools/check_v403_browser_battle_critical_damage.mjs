#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  ACTION_BATTLE_CRITICAL_DAMAGE_PLAN,
  BATTLE_COM_GUARD,
  guardAdjust,
  runCriticalDamagePlan
} from '../src/stoneage_browser_battle_critical_damage_runtime.mjs';

const makeEntry=(bid,side,overrides={})=>({
  bid,
  battleSlot:bid>=10?bid-10:bid,
  battleSide:side,
  sourceType:side===0?'player':'enemy',
  characterId:'c'+bid,
  level:side===0?10:20,
  hp:100,
  attackPower:100,
  defencePower:50,
  quick:20,
  fixVital:10,
  elements:{earth:0,water:0,fire:0,wind:0},
  battleCommands:[1,-1,-1],
  confusion:0,
  ...overrides
});

const ctx={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    fieldAtt:4,
    attPow:0,
    sides:[
      {side:0,type:0,entries:Array(10).fill(null)},
      {side:1,type:1,entries:Array(10).fill(null)}
    ]
  }
};
ctx.context.sides[0].entries[0]=makeEntry(0,0);
ctx.context.sides[1].entries[0]=makeEntry(10,1);

let result=runCriticalDamagePlan(ctx,{
  attackerBid:0,
  targetBid:10,
  damageRollWide:6.25,
  includeAttr:true,
  critical:true,
  weaponType:'none',
  battleDamageModify:1
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.action,ACTION_BATTLE_CRITICAL_DAMAGE_PLAN);
assert.equal(result.baseDamage,120);
assert.equal(result.criticalApplied,true);
assert.equal(result.criticalBonus,12.5);
assert.equal(result.damageBeforeGuard,132);
assert.equal(result.damage,132);
assert.equal(result.guardApplied,false);
assert.equal(result.rngConsumed,1);

const bow=runCriticalDamagePlan(ctx,{
  attackerBid:0,
  targetBid:10,
  damageRollWide:6.25,
  includeAttr:true,
  critical:true,
  weaponType:'bow'
});
assert.equal(bow.ok,true,JSON.stringify(bow));
assert.equal(bow.criticalApplied,false);
assert.equal(bow.damage,120);

const normal=runCriticalDamagePlan(ctx,{
  attackerBid:0,
  targetBid:10,
  damageRollWide:6.25,
  includeAttr:true,
  critical:false,
  weaponType:'none',
  battleDamageModify:1.2
});
assert.equal(normal.ok,true,JSON.stringify(normal));
assert.equal(normal.damageBeforeModifier,120);
assert.equal(normal.damage,144);

const guardCtx=structuredClone(ctx);
guardCtx.context.sides[1].entries[0].battleCommands[0]=BATTLE_COM_GUARD;
let guarded=runCriticalDamagePlan(guardCtx,{
  attackerBid:0,
  targetBid:10,
  damageRollWide:6.25,
  includeAttr:true,
  critical:false,
  guardRoll:20,
  lowDamageRoll:1
});
assert.equal(guarded.ok,true,JSON.stringify(guarded));
assert.equal(guarded.guardApplied,true);
assert.equal(guarded.guard.rate,0);
assert.equal(guarded.damageBeforeModifier,1);
assert.equal(guarded.damage,1);
assert.equal(guarded.rngConsumed,3);

guarded=runCriticalDamagePlan(guardCtx,{
  attackerBid:0,
  targetBid:10,
  damageRollWide:6.25,
  includeAttr:true,
  critical:false,
  guardRoll:96
});
assert.equal(guarded.ok,true,JSON.stringify(guarded));
assert.equal(guarded.guard.rate,0.5);
assert.equal(guarded.damage,60);
assert.equal(guarded.rngConsumed,2);

const guardConfused=structuredClone(guardCtx);
guardConfused.context.sides[1].entries[0].confusion=1;
const confused=runCriticalDamagePlan(guardConfused,{
  attackerBid:0,
  targetBid:10,
  damageRollWide:6.25,
  includeAttr:true,
  guardRoll:20
});
assert.equal(confused.ok,true,JSON.stringify(confused));
assert.equal(confused.guardApplied,false);
assert.equal(confused.damage,120);

const needLow=structuredClone(ctx);
needLow.context.sides[0].entries[0].attackPower=0;
const bad=runCriticalDamagePlan(needLow,{
  attackerBid:0,
  targetBid:10,
  damageRollWide:0,
  includeAttr:true
});
assert.equal(bad.ok,false);
assert.equal(bad.reason,'low-damage-rng-required-or-out-of-range');

const invalidGuard=guardAdjust(100,{guardRoll:101});
assert.equal(invalidGuard.ok,false);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v403-browser-battle-critical-damage-v1',
  action:'BATTLE_CRITICAL_DAMAGE_PLAN',
  baseDamage:120,
  critical:{applied:132,bonus:12.5,criticalRollAlreadyConsumed:true},
  bowBypass:120,
  guard:{roll20:1,roll96:60},
  modifier:1.2,
  hpMutation:false,
  persistentMutation:false
},null,2));
