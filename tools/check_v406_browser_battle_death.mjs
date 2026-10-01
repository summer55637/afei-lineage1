#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  ACTION_BATTLE_DEATH_PLAN,
  BCF_DEATH,
  BCF_ULTIMATE_1,
  BCF_ULTIMATE_2,
  deathPlan
} from '../src/stoneage_browser_battle_death_runtime.mjs';

const entry=(bid,side,overrides={})=>({
  bid,
  battleSlot:bid>=10?bid-10:bid,
  battleSide:side,
  sourceType:side===0?'player':'enemy',
  hp:100,
  battleFlg:0,
  ...overrides
});

const ctx={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{sides:[
    {side:0,type:0,entries:Array(10).fill(null)},
    {side:1,type:1,entries:Array(10).fill(null)}
  ]}
};
ctx.context.sides[0].entries[0]=entry(0,0);
ctx.context.sides[1].entries[0]=entry(10,1);

let result=deathPlan(ctx,{targetBid:10,hp:20});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.dead,false);
assert.equal(result.clientFlags,0);
assert.equal(result.rngConsumed,0);

result=deathPlan(ctx,{targetBid:10,hp:0});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.action,ACTION_BATTLE_DEATH_PLAN);
assert.equal(result.dead,true);
assert.equal(result.clientFlags&BCF_DEATH,BCF_DEATH);
assert.equal(result.battleReturnFlag,false);

const abio=structuredClone(ctx);
abio.context.sides[1].entries[0].battleFlg=64;
result=deathPlan(abio,{targetBid:10,hp:0});
assert.equal(result.ultimate,1);
assert.equal(result.clientFlags&BCF_ULTIMATE_1,BCF_ULTIMATE_1);
assert.equal(result.rngConsumed,0);

const crit=deathPlan(ctx,{targetBid:10,hp:0,critical:true,deathRoll:49});
assert.equal(crit.ok,true,JSON.stringify(crit));
assert.equal(crit.ultimate,1);
assert.equal(crit.clientFlags&BCF_ULTIMATE_1,BCF_ULTIMATE_1);
assert.equal(crit.rngConsumed,1);

const crit50=deathPlan(ctx,{targetBid:10,hp:0,critical:true,deathRoll:50});
assert.equal(crit50.ok,true,JSON.stringify(crit50));
assert.equal(crit50.ultimate,0);

const playerDeath=deathPlan(ctx,{targetBid:0,hp:0,critical:true});
assert.equal(playerDeath.ok,true,JSON.stringify(playerDeath));
assert.equal(playerDeath.ultimate,0);
assert.equal(playerDeath.rngConsumed,0);

const ultimate2=deathPlan(ctx,{targetBid:10,hp:0,ultimateFromDamage:2});
assert.equal(ultimate2.ultimate,2);
assert.equal(ultimate2.clientFlags&BCF_ULTIMATE_2,BCF_ULTIMATE_2);

const ler=deathPlan(ctx,{targetBid:10,hp:0,critical:true,deathRoll:1,lerImmune:true});
assert.equal(ler.ok,true,JSON.stringify(ler));
assert.equal(ler.ultimate,0);
assert.equal(ler.clientFlags,BCF_DEATH);

const missing=deathPlan(ctx,{targetBid:10,hp:0,critical:true});
assert.equal(missing.ok,false);
assert.equal(missing.reason,'critical-death-rng-required-or-out-of-range');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v406-browser-battle-death-v1',
  condition:'HP <= 0',
  flags:['BCF_DEATH','BCF_ULTIMATE_1','BCF_ULTIMATE_2'],
  enemyCriticalUltimate:'RAND(1,100) < 50',
  hpMutation:false,
  charIsDieMutation:false,
  rewardMutation:false
},null,2));
