#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createBrowserBattleProfitCreditRuntime } from '../src/stoneage_browser_battle_profit_credit_runtime.mjs';

const runtime=createBrowserBattleProfitCreditRuntime();
assert.equal(runtime.ok,true);

const context={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',
    sourceMode:2,
    sides:[
      {side:0,type:0,entries:[{bid:0,sourceType:'player',hp:100}]},
      {side:1,type:1,entries:[
        {bid:10,sourceType:'enemy',hp:0,isDie:false,dead:false,sourceRewardProcessed:false},
        {bid:11,sourceType:'enemy',hp:0,isDie:false,dead:false,sourceRewardProcessed:true,sourceRewardCredits:[0]}
      ]}
    ]
  }
};

const first=runtime.apply(context,{
  attackerBids:[0],
  allowPlayerCredit:true,
  hitIndex:0,
  source:'attack',
  transactionPrefix:'v454-profit'
});
assert.equal(first.ok,true,JSON.stringify(first));
assert.equal(first.newCredits.length,1);
assert.equal(first.newCredits[0].enemyBid,10);
assert.deepEqual(first.newCredits[0].creditBids,[0]);
assert.equal(first.newCredits[0].credited,true);
assert.equal(first.context.sides[1].entries[0].sourceRewardProcessed,true);
assert.deepEqual(first.context.sides[1].entries[0].sourceRewardCredits,[0]);
assert.equal(first.context.sides[1].entries[1].sourceRewardCredits[0],0);
assert.equal(first.expMutation,false);
assert.equal(first.goldMutation,false);
assert.equal(first.carriedLootRngDeferred,true);
assert.equal(first.persistentMutation,false);

const second=runtime.apply({format:'stoneage-browser-battle-context-runtime-v1',context:first.context},{
  attackerBids:[0],allowPlayerCredit:true,hitIndex:1,source:'attack',transactionPrefix:'v454-profit'
});
assert.equal(second.ok,true,JSON.stringify(second));
assert.equal(second.newCredits.length,0);
assert.equal(second.totalCreditEvents,1);

const enemySide=runtime.apply({format:'stoneage-browser-battle-context-runtime-v1',context:{
  mode:'battle',sourceMode:2,sides:[
    {side:0,type:0,entries:[{bid:0,sourceType:'player',hp:100}]},
    {side:1,type:1,entries:[{bid:10,sourceType:'enemy',hp:0,isDie:false,dead:false,sourceRewardProcessed:false}]}
  ]
}},{
  attackerBids:[10],allowPlayerCredit:false,hitIndex:0,source:'counter'
});
assert.equal(enemySide.ok,true,JSON.stringify(enemySide));
assert.equal(enemySide.newCredits.length,1);
assert.equal(enemySide.newCredits[0].credited,false);
assert.deepEqual(enemySide.newCredits[0].creditBids,[]);
assert.equal(enemySide.context.sides[1].entries[0].sourceRewardProcessed,true);
assert.deepEqual(enemySide.context.sides[1].entries[0].sourceRewardCredits,[]);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v454-browser-battle-profit-credit-v1',
  firstCredit:first.newCredits,
  duplicateCreditCount:second.newCredits.length,
  enemySideCredit:enemySide.newCredits[0],
  rewardNumbersDeferred:true,
  persistentMutation:false
},null,2));
