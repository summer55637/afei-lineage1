#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createBrowserBattleEnemyExpRuntime } from '../src/stoneage_browser_battle_enemy_exp_runtime.mjs';

const runtime=createBrowserBattleEnemyExpRuntime();
assert.equal(runtime.ok,true);

const context={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',sourceMode:2,
    sides:[
      {side:0,type:0,entries:[
        {bid:0,sourceType:'player',level:10,hp:100,maxHp:100,workGetExp:0,killPetCount:0},
        null,null,null,null,
        {bid:5,sourceType:'pet',level:10,hp:100,maxHp:100,workGetExp:0,killPetCount:0}
      ]},
      {side:1,type:1,entries:[
        {bid:10,sourceType:'enemy',level:10,sourceEnemyExp:100,hp:0,isDie:true,dead:false,sourceExpCreditProcessed:false}
      ]}
    ]
  }
};

const same=runtime.credit(context,{
  enemyBid:10,
  participantBids:[0],
  ridePetBidByParticipantBid:{0:5},
  source:'attack',
  hitIndex:0
});
assert.equal(same.ok,true,JSON.stringify(same));
assert.equal(same.rngConsumed,0);
assert.equal(same.newCredits.length,1);
assert.equal(same.newCredits[0].exp,100);
assert.equal(same.newCredits[0].ridePetCredit.exp,60);
assert.equal(same.newCredits[0].ridePetCredit.multiplier,0.6);
assert.equal(same.context.sides[0].entries[0].workGetExp,100);
assert.equal(same.context.sides[0].entries[0].killPetCount,1);
assert.equal(same.context.sides[0].entries[5].workGetExp,60);
assert.equal(same.context.sides[0].entries[5].killPetCount,1);
assert.equal(same.context.sides[0].entries[5].variableAi,1);

const highContext={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',sourceMode:2,
    sides:[
      {side:0,type:0,entries:[
        {bid:0,sourceType:'player',level:16,hp:100,maxHp:100,workGetExp:0,killPetCount:0},
        null,null,null,null,
        {bid:5,sourceType:'pet',level:16,hp:100,maxHp:100,workGetExp:0,killPetCount:0}
      ]},
      {side:1,type:1,entries:[
        {bid:10,sourceType:'enemy',level:10,sourceEnemyExp:100,hp:0,isDie:true,dead:false,sourceExpCreditProcessed:false}
      ]}
    ]
  }
};
const high=runtime.credit(highContext,{
  enemyBid:10,participantBids:[0],ridePetBidByParticipantBid:{0:5},hitIndex:0
});
assert.equal(high.ok,true,JSON.stringify(high));
assert.equal(high.newCredits[0].exp,93);
assert.equal(high.newCredits[0].ridePetCredit.exp,55);
assert.equal(high.newCredits[0].petAiCredit,null);

const bad=runtime.credit({format:'stoneage-browser-battle-context-runtime-v1',context:same.context},{
  enemyBid:10,participantBids:[0],ridePetBidByParticipantBid:{0:7},hitIndex:0
});
assert.equal(bad.ok,true,'processed enemy should remain idempotent');
const freshBad=runtime.credit({
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',sourceMode:2,
    sides:[
      {side:0,type:0,entries:[{bid:0,sourceType:'player',level:10,hp:100,maxHp:100,workGetExp:0,killPetCount:0}]},
      {side:1,type:1,entries:[{bid:10,sourceType:'enemy',level:10,sourceEnemyExp:100,hp:0,isDie:true,dead:false,sourceExpCreditProcessed:false}]}
    ]
  }
},{enemyBid:10,participantBids:[0],ridePetBidByParticipantBid:{0:7},hitIndex:0});
assert.equal(freshBad.ok,false);
assert.equal(freshBad.reason,'ride-pet-entry-required');

const petHigherContext={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',sourceMode:2,norisk:0,
    sides:[
      {side:0,type:0,entries:[
        {bid:0,sourceType:'pet',level:16,hp:100,maxHp:100,workGetExp:0,killPetCount:0,variableAi:0}
      ]},
      {side:1,type:1,entries:[
        {bid:10,sourceType:'enemy',level:10,sourceEnemyExp:100,hp:0,isDie:true,dead:false,sourceExpCreditProcessed:false}
      ]}
    ]
  }
};
const petWin=runtime.credit(petHigherContext,{enemyBid:10,participantBids:[0],hitIndex:0});
assert.equal(petWin.ok,true,JSON.stringify(petWin));
assert.equal(petWin.newCredits[0].petAiCredit.gain,1);
assert.equal(petWin.newCredits[0].petAiCredit.kind,'pet-win');
assert.equal(petWin.context.sides[0].entries[0].variableAi,1);

const petGold=runtime.credit({
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',sourceMode:2,norisk:0,
    sides:[
      {side:0,type:0,entries:[{bid:0,sourceType:'pet',level:5,hp:100,maxHp:100,workGetExp:0,killPetCount:0,variableAi:0}]},
      {side:1,type:1,entries:[{bid:10,sourceType:'enemy',level:10,sourceEnemyExp:100,hp:0,isDie:true,dead:false,sourceExpCreditProcessed:false}]}
    ]
  }
},{enemyBid:10,participantBids:[0],hitIndex:0});
assert.equal(petGold.newCredits[0].petAiCredit.gain,20);
assert.equal(petGold.context.sides[0].entries[0].variableAi,20);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v460-browser-battle-enemy-exp-pet-ai-credit-v1',
  sameLevel:{playerExp:100,ridePetExp:60,rideMultiplier:0.6},
  sixLevel:{playerExp:93,ridePetExp:55},
  rngConsumed:0,
  missingRidePet:'fail-closed'
},null,2));
