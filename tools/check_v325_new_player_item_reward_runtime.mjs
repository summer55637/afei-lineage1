#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { createSourceItemAllocator, resolveSourceItemTemplate } from '../src/stoneage_item_source_runtime.mjs';
import {
  NEW_PLAYER_ITEM_REWARD_RUNTIME_FORMAT,
  createNewPlayerItemRewardHandler,
  applyNewPlayerItemRewardList
} from '../src/stoneage_new_player_item_reward_runtime.mjs';

const rewardCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_item_reward_runtime.json','utf8'));
const itemMakeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
assert.equal(NEW_PLAYER_ITEM_REWARD_RUNTIME_FORMAT,'stoneage-new-player-item-reward-runtime-v1');
assert.equal(rewardCatalog.stats.requestedItemIds,16);
assert.equal(rewardCatalog.stats.resolvedItemIds,16);
assert.equal(rewardCatalog.fixedSource.gitBlobSha,'eac985796b59286c547db2abce7b3d604a5e6226');
assert.equal(itemMakeCatalog.stats.templates,10737);
for(const itemId of rewardCatalog.itemIds){
  const resolved=resolveSourceItemTemplate(itemMakeCatalog,itemId);
  assert.equal(resolved.ok,true);
  assert.equal(resolved.baseData[0],itemId);
}

const state=freshPersistentState({playerId:'new-player-items'});
const rolls=[];
const allocator=createSourceItemAllocator({
  catalog:itemMakeCatalog,
  itemCapacity:1000,
  cursor:20,
  randInclusive:(a,b)=>{rolls.push([a,b]);return 0;}
});
const handler=createNewPlayerItemRewardHandler({
  rewardCatalog,
  itemMakeCatalog,
  allocator
});
const one=handler(state,{itemId:20145,actionIndex:0});
assert.equal(one.ok,true);
assert.equal(one.slot,9);
assert.equal(one.existingIndex,20);
assert.equal(state.inventory.itemRuntime.slots['20'].owner,'player');
assert.equal(state.inventory.itemRuntime.slots['20'].data[0],20145);
assert.equal(one.rngCalls,66);

const all=freshPersistentState({playerId:'new-player-items-all'});
const allAllocator=createSourceItemAllocator({
  catalog:itemMakeCatalog,
  itemCapacity:1000,
  cursor:30,
  randInclusive:(a,b)=>0
});
const ids=rewardCatalog.itemIds.slice(0,4);
const applied=applyNewPlayerItemRewardList(all,ids,{
  rewardCatalog,
  itemMakeCatalog,
  allocator:allAllocator
});
assert.equal(applied.ok,true);
assert.equal(applied.created.length,4);
assert.deepEqual(applied.created.map(x=>x.slot),[9,10,11,12]);
assert.deepEqual(applied.created.map(x=>x.existingIndex),[30,31,32,33]);
assert.deepEqual(Object.values(all.inventory.itemRuntime.slots).map(x=>x.itemId),ids);

const full=freshPersistentState({playerId:'new-player-item-full'});
for(let i=9;i<=23;i++)full.inventory.playerItemSlots[i]=900+i;
const fullResult=handler(full,{itemId:20145});
assert.equal(fullResult.ok,false);
assert.equal(fullResult.reason,'player-backpack-full');

const unauthorized=handler(freshPersistentState(),{itemId:999999});
assert.equal(unauthorized.ok,false);
assert.equal(unauthorized.reason,'new-player-item-reward-not-allowed');

const rollback=freshPersistentState({playerId:'new-player-item-rollback'});
const badItemCatalog={...rewardCatalog,itemIds:[20145,999],byItemId:{...rewardCatalog.byItemId}};
const badHandler=createNewPlayerItemRewardHandler({rewardCatalog:badItemCatalog,itemMakeCatalog,allocator});
const listResult=applyNewPlayerItemRewardList(rollback,[20145,999],{
  rewardCatalog:badItemCatalog,
  itemMakeCatalog,
  allocator
});
assert.equal(listResult.ok,false);
assert.equal(listResult.failedItemId,999);
assert.equal(rollback.inventory.playerItemSlots.filter(v=>v!==null).length,1);
assert.equal(rollback.inventory.itemRuntime.slots['21']?.itemId,20145);
assert.equal(rolls.length,132);

console.log(JSON.stringify({
  pass:true,
  format:NEW_PLAYER_ITEM_REWARD_RUNTIME_FORMAT,
  requestedItemIds:rewardCatalog.stats.requestedItemIds,
  resolvedItemIds:rewardCatalog.stats.resolvedItemIds,
  sourceItemMakeRngCallsPerItem:66,
  firstBackpackSlot:9,
  fourItemSlots:[9,10,11,12],
  atomicEventLayerStillRequired:true
}));
