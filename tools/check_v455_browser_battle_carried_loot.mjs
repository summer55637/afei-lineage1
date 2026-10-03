#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createBrowserBattleCarriedLootRuntime } from '../src/stoneage_browser_battle_carried_loot_runtime.mjs';

const runtime=createBrowserBattleCarriedLootRuntime();
assert.equal(runtime.ok,true);

const makeContext=(getitem=[-1,-1,-1])=>({
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',sourceMode:2,
    sides:[
      {side:0,type:0,entries:[{bid:0,sourceType:'player',hp:100,maxHp:100,getitem:getitem.slice()}]},
      {side:1,type:1,entries:[{bid:10,sourceType:'enemy',hp:0,isDie:true,dead:false,sourceCarriedLootProcessed:false}]}
    ]
  }
});

const first=runtime.queue(makeContext(),{
  enemyBid:10,ownerBids:[0],
  items:[{existingIndex:201,itemId:1234},{existingIndex:202,itemId:1235},{existingIndex:203,itemId:1236}],
  ownerRolls:[0,0,0],transactionPrefix:'v455-fill'
});
assert.equal(first.ok,true,JSON.stringify(first));
assert.equal(first.rngConsumed,3);
assert.deepEqual(first.context.sides[0].entries[0].getitem,[201,202,203]);
assert.equal(first.context.sides[1].entries[0].sourceCarriedLootProcessed,true);
assert.equal(first.newTransfers.length,3);
assert.equal(first.discarded.length,0);

const duplicate=runtime.queue({format:'stoneage-browser-battle-context-runtime-v1',context:first.context},{
  enemyBid:10,ownerBids:[0],items:[{existingIndex:204,itemId:1237}],ownerRolls:[0],transactionPrefix:'v455-fill'
});
assert.equal(duplicate.ok,true,JSON.stringify(duplicate));
assert.equal(duplicate.idempotent,true);
assert.equal(duplicate.rngConsumed,0);
assert.deepEqual(duplicate.context.sides[0].entries[0].getitem,[201,202,203]);

const replace=runtime.queue({
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',sourceMode:2,
    sides:[
      {side:0,type:0,entries:[{bid:0,sourceType:'player',hp:100,maxHp:100,getitem:[301,302,303]}]},
      {side:1,type:1,entries:[{bid:10,sourceType:'enemy',hp:0,isDie:true,dead:false,sourceCarriedLootProcessed:false}]}
    ]
  }
},{
  enemyBid:10,ownerBids:[0],
  items:[{existingIndex:304,itemId:1238}],
  ownerRolls:[0],replaceRolls:[1],replaceSlotRolls:[2],transactionPrefix:'v455-replace'
});
assert.equal(replace.ok,true,JSON.stringify(replace));
assert.equal(replace.rngConsumed,3);
assert.deepEqual(replace.context.sides[0].entries[0].getitem,[301,302,304]);
assert.equal(replace.accepted[0].reason,'full-pool-replaced');
assert.equal(replace.accepted[0].replacedExistingIndex,303);
assert.equal(replace.discarded.some(x=>x.existingIndex===303),true);

const reject=runtime.queue({
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',sourceMode:2,
    sides:[
      {side:0,type:0,entries:[{bid:0,sourceType:'player',hp:100,maxHp:100,getitem:[401,402,403]}]},
      {side:1,type:1,entries:[{bid:10,sourceType:'enemy',hp:0,isDie:true,dead:false,sourceCarriedLootProcessed:false}]}
    ]
  }
},{
  enemyBid:10,ownerBids:[0],items:[{existingIndex:404,itemId:1239}],
  ownerRolls:[0],replaceRolls:[0],transactionPrefix:'v455-reject'
});
assert.equal(reject.ok,true,JSON.stringify(reject));
assert.equal(reject.rngConsumed,2);
assert.deepEqual(reject.context.sides[0].entries[0].getitem,[401,402,403]);
assert.equal(reject.discarded[0].reason,'full-pool-rejected');

const noOwner=runtime.queue(makeContext(),{
  enemyBid:10,ownerBids:[],items:[{existingIndex:205}],ownerRolls:[]
});
assert.equal(noOwner.ok,true,JSON.stringify(noOwner));
assert.equal(noOwner.newTransfers.length,0);
assert.equal(noOwner.persistentMutation,false);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v455-browser-battle-carried-loot-v1',
  fill:{getitem:first.context.sides[0].entries[0].getitem,rngConsumed:first.rngConsumed},
  replace:{getitem:replace.context.sides[0].entries[0].getitem,replaced:replace.accepted[0].replacedExistingIndex},
  reject:{getitem:reject.context.sides[0].entries[0].getitem,discardReason:reject.discarded[0].reason},
  duplicateIdempotent:duplicate.idempotent===true,
  noOwnerTransferCount:noOwner.newTransfers.length,
  persistentMutation:false
},null,2));
