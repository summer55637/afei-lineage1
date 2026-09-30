#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { normalizeRewardPacket, rewardTransactionValidation, applyRewardTransaction, MAX_CARRIED_ITEMS } from '../src/stoneage_reward_transaction.mjs';

const state=freshPersistentState({now:()=> '2026-09-30T01:00:00.000Z'});
state.player.gold=100;
state.inventory.playerItemSlots[0]=1;
state.inventory.itemRuntime.slots['201']={use:true,itemId:201,owner:'enemy:unit-1',pile:1};
state.pets.petBox=[{id:'pet-1',petId:101,level:5,exp:10}];

const packet=normalizeRewardPacket({transactionId:'battle-1',source:'battle-result:b1',playerExp:40,gold:25,items:[{existingIndex:201,count:1}],petCredits:[{petId:'pet-1',exp:7}]});
assert.equal(packet.items.length,1);
assert.equal(packet.playerExp,40);
assert.equal(packet.gold,25);
assert.equal(MAX_CARRIED_ITEMS,3);

const validation=rewardTransactionValidation(packet,{inventorySlots:state.inventory.playerItemSlots,knownExistingItemIds:new Set([201])});
assert.equal(validation.ok,true);

const oversized=rewardTransactionValidation({transactionId:'too-many',source:'x',items:[1,2,3,4].map(existingIndex=>({existingIndex,count:1}))},{inventorySlots:Array(24).fill(null),knownExistingItemIds:new Set([1,2,3,4])});
assert.equal(oversized.ok,false);
assert.ok(oversized.errors.some(x=>x.includes('exceeds source pool max 3')));

const applied=applyRewardTransaction(state,packet,{knownExistingItemIds:new Set([201]),now:()=> '2026-09-30T01:01:00.000Z'});
assert.equal(applied.applied,true);
assert.equal(applied.state.player.exp,40);
assert.equal(applied.state.player.gold,125);
assert.equal(applied.state.inventory.playerItemSlots[1],null);
assert.equal(applied.state.inventory.playerItemSlots[9],201);
assert.equal(applied.state.inventory.itemRuntime.slots['201'].owner,'player');
assert.equal(applied.state.inventory.piles['201'],1);
assert.equal(applied.state.pets.petBox[0].exp,17);
assert.equal(applied.state.revision,1);

const duplicate=applyRewardTransaction(applied.state,packet,{knownExistingItemIds:new Set([201]),now:()=> '2026-09-30T01:02:00.000Z'});
assert.equal(duplicate.applied,false);
assert.equal(duplicate.idempotent,true);
assert.equal(duplicate.state.player.gold,125);

const unknown=rewardTransactionValidation({transactionId:'battle-2',source:'x',playerExp:1,items:[{existingIndex:999999,count:1}]},{inventorySlots:Array(24).fill(null),knownExistingItemIds:new Set([201])});
assert.equal(unknown.ok,false);
assert.ok(unknown.errors.some(x=>x.includes('unknown existing item index')));

const full=freshPersistentState({now:()=> '2026-09-30T02:00:00.000Z'});
full.inventory.itemRuntime.slots['201']={use:true,itemId:201,owner:'enemy:unit-2',pile:1};
full.inventory.playerItemSlots=Array(24).fill(1);
const noPartial=applyRewardTransaction(full,{transactionId:'battle-3',source:'x',playerExp:10,gold:5,items:[{existingIndex:201,count:1}]},{knownExistingItemIds:new Set([201])});
assert.equal(noPartial.applied,false);
assert.equal(noPartial.reason,'inventory-full-before-transaction-commit');
assert.equal(full.player.exp,0);
assert.equal(full.player.gold,0);

console.log(JSON.stringify({pass:true,format:'stoneage-reward-transaction-v1',idempotent:true,atomicInventoryFull:true,maxCarriedItems:MAX_CARRIED_ITEMS}));
