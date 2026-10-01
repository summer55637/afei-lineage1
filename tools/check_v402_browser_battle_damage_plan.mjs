#!/usr/bin/env node
import assert from 'node:assert/strict';
import { damagePlan } from '../src/stoneage_browser_battle_damage_plan_runtime.mjs';

const makeEntry=(bid,side,overrides={})=>({
  bid,
  battleSlot:bid>=10?bid-10:bid,
  battleSide:side,
  sourceType:side===0?'player':'enemy',
  characterId:'c'+bid,
  hp:100,
  attackPower:100,
  defencePower:50,
  quick:20,
  fixVital:10,
  elements:{earth:0,water:0,fire:0,wind:0},
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

let result=damagePlan(ctx,{attackerBid:0,targetBid:10,damageRollWide:6.25,includeAttr:true});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.branch,'power');
assert.equal(result.attack,100);
assert.equal(result.defence,27.5);
assert.equal(result.rawDamage,145);
assert.equal(result.damageBeforeAttribute,145);
assert.equal(result.damage,145);
assert.deepEqual(result.attackerAttributes,[0,0,0,0,100]);
assert.deepEqual(result.defenderAttributes,[0,0,0,0,100]);
assert.equal(result.field.attackerPower,0.5);
assert.equal(result.field.defenderPower,0.5);
assert.equal(result.rngConsumed,1);
assert.equal(result.damageExecuted,false);
assert.equal(result.hpMutation,false);
assert.equal(result.persistentMutation,false);

const noAttr=damagePlan(ctx,{attackerBid:0,targetBid:10,damageRollWide:6.25,includeAttr:false});
assert.equal(noAttr.ok,true,JSON.stringify(noAttr));
assert.equal(noAttr.damage,145);
assert.equal(noAttr.attributeApplied,false);

const nearCtx=structuredClone(ctx);
nearCtx.context.sides[0].entries[0].attackPower=30;
nearCtx.context.sides[1].entries[0].defencePower=50;
nearCtx.context.sides[1].entries[0].quick=0;
nearCtx.context.sides[1].entries[0].fixVital=0;
result=damagePlan(nearCtx,{attackerBid:0,targetBid:10,damageRollNear:1,includeAttr:true});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.branch,'near');
assert.equal(result.rawDamage,1);

const lowCtx=structuredClone(ctx);
lowCtx.context.sides[0].entries[0].attackPower=10;
lowCtx.context.sides[1].entries[0].defencePower=50;
lowCtx.context.sides[1].entries[0].quick=0;
lowCtx.context.sides[1].entries[0].fixVital=0;
result=damagePlan(lowCtx,{attackerBid:0,targetBid:10,damageRollNear:1,includeAttr:true});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.branch,'defence-greater');
assert.equal(result.rawDamage,1);

const attrCtx=structuredClone(ctx);
attrCtx.context.sides[0].entries[0].elements={earth:100,water:0,fire:0,wind:0};
attrCtx.context.sides[1].entries[0].elements={earth:0,water:0,fire:100,wind:0};
result=damagePlan(attrCtx,{attackerBid:0,targetBid:10,damageRollWide:6.25,includeAttr:true});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.damageBeforeAttribute,145);
assert.equal(result.damage,217);

const bad=damagePlan(ctx,{attackerBid:0,targetBid:10,includeAttr:true});
assert.equal(bad.ok,false);
assert.equal(bad.reason,'wide-damage-rng-required-or-out-of-range');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v402-browser-battle-damage-plan-v1',
  baseDamage:{
    attack:100,
    defence:27.5,
    branch:'power',
    raw:145
  },
  neutralFinal:145,
  earthVsFireFinal:217,
  rngCallerInjected:true,
  hpMutation:false,
  persistentMutation:false,
  damageExecuted:false
},null,2));
