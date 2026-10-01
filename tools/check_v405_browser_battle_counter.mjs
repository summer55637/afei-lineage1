#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  ACTION_BATTLE_COUNTER_PLAN,
  WEAPON_CLASS,
  counterCheck
} from '../src/stoneage_browser_battle_counter_runtime.mjs';

const entry=(bid,side,overrides={})=>({
  bid,
  battleSlot:bid>=10?bid-10:bid,
  battleSide:side,
  sourceType:side===0?'player':'enemy',
  hp:100,
  fixDex:40,
  battleFlg:0,
  battleCommands:[1,-1,-1],
  ...overrides
});

const ctx={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{sides:[
    {side:0,type:0,entries:Array(10).fill(null)},
    {side:1,type:1,entries:Array(10).fill(null)}
  ]}
};
ctx.context.sides[0].entries[0]=entry(0,0,{fixDex:40});
ctx.context.sides[1].entries[0]=entry(10,1,{fixDex:20});

let result=counterCheck(ctx,{
  attackerBid:0,
  targetBid:10,
  attackerWeaponClass:'claw',
  defenderWeaponClass:'claw',
  attackerLuck:0,
  counterRoll:1
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.action,ACTION_BATTLE_COUNTER_PLAN);
assert.equal(result.counterMatchValue,10);
assert.ok(Math.abs(result.counterBase-Math.sqrt(250)) < 1e-12);
assert.ok(Math.abs(result.probabilityPercent-Math.sqrt(250)) < 1e-12);
assert.equal(result.triggered,true);
assert.equal(result.rngConsumed,1);
assert.equal(result.downstream.damageScale,0.75);

result=counterCheck(ctx,{
  attackerBid:0,
  targetBid:10,
  attackerWeaponClass:'bow',
  defenderWeaponClass:'claw',
  counterRoll:1000
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.counterMatchValue,6);
assert.equal(result.triggered,true);

const throwResult=counterCheck(ctx,{
  attackerBid:0,
  targetBid:10,
  attackerWeaponClass:'throw',
  defenderWeaponClass:'claw',
  counterRoll:1
});
assert.equal(throwResult.ok,true);
assert.equal(throwResult.canCounter,false);
assert.equal(throwResult.reason,'throw-weapon');

const dead=counterCheck(ctx,{
  attackerBid:0,
  targetBid:10,
  counterRoll:1,
  attackerCommand:1
});
assert.equal(dead.ok,true);

const noGuard=counterCheck(ctx,{
  attackerBid:0,
  targetBid:10,
  attackerWeaponClass:'claw',
  defenderWeaponClass:'claw',
  attackerCommand:3,
  noguardCounterAdjust:10,
  counterRoll:1000
});
assert.equal(noGuard.ok,true,JSON.stringify(noGuard));
assert.equal(noGuard.noguardCounterAdjust,10);

const react=counterCheck(ctx,{
  attackerBid:0,
  targetBid:10,
  attackerWeaponClass:'claw',
  defenderWeaponClass:'claw',
  attackerDamageReact:true,
  counterRoll:1
});
assert.equal(react.ok,true,JSON.stringify(react));
assert.equal(react.triggered,true);
assert.equal(react.sourceReturnFlag,false);

const bad=counterCheck(ctx,{
  attackerBid:0,
  targetBid:10,
  counterRoll:null
});
assert.equal(bad.ok,false);
assert.equal(bad.reason,'counter-rng-required-or-out-of-range');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v405-browser-battle-counter-v1',
  counterPara:0.08,
  clawVsClaw:10,
  bowVsClaw:5,
  throwWeaponBlocks:true,
  counterDamageScale:0.75,
  hpMutation:false,
  persistentMutation:false
},null,2));
