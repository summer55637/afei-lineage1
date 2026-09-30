#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { buyShopItem } from '../src/stoneage_item_economy_runtime.mjs';
import {
  ITEM_MAKE_RUNTIME_FORMAT,
  ITEM_DATA_INT_COUNT,
  createSourceItemAllocator,
  resolveSourceItemTemplate,
  sourceMakeItemData,
  sourceItemRuntimeFree
} from '../src/stoneage_item_source_runtime.mjs';

const catalog=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));

assert.equal(ITEM_MAKE_RUNTIME_FORMAT,'stoneage-item-make-runtime-v2');
assert.equal(catalog.format,ITEM_MAKE_RUNTIME_FORMAT);
assert.equal(catalog.itemDataIntCount,ITEM_DATA_INT_COUNT);
assert.equal(catalog.stats.templates,10737);
assert.equal(catalog.source.gitBlobSha,'eac985796b59286c547db2abce7b3d604a5e6226');

const resolved=resolveSourceItemTemplate(catalog,20131);
assert.equal(resolved.ok,true);
assert.equal(resolved.itemId,20131);
assert.equal(resolved.baseData[0],20131);

const rolls=[];
const made=sourceMakeItemData(catalog,20131,{randInclusive:(a,b)=>{rolls.push([a,b]);return b;}});
assert.equal(made.ok,true);
assert.equal(made.rngCalls,66);
assert.equal(rolls.length,66);
assert.equal(made.data[0],20131);
assert.equal(made.data[59],1);

const state=freshPersistentState({playerId:'source-item'});
state.player.gold=1000;
const allocator=createSourceItemAllocator({
  catalog,
  itemCapacity:1000,
  cursor:10,
  randInclusive:(a,b)=>b
});
const allocation=allocator.allocate({state,itemId:20131});
assert.equal(allocation.ok,true);
assert.equal(allocation.existingIndex,10);
assert.equal(allocation.rngCalls,66);
assert.equal(allocation.item.itemId,20131);
assert.equal(allocation.item.owner,null);
assert.equal(allocation.item.leakLevel,1);
assert.equal(state.inventory.itemRuntime.slots['10'],undefined);

const buy=buyShopItem(state,{
  transactionId:'source-buy-1',
  itemId:20131,
  baseCost:100,
  buyRate:1,
  quantity:1
},{
  allocateItem:request=>allocator.allocate(request)
});
assert.equal(buy.applied,true);
assert.equal(buy.created.length,1);
assert.equal(buy.created[0].slot,9);
assert.equal(buy.created[0].existingIndex,11);
assert.equal(buy.state.inventory.itemRuntime.slots['11'].owner,'player');
assert.equal(buy.state.inventory.itemRuntime.slots['11'].data[0],20131);
assert.equal(buy.state.player.gold,900);

const freed=sourceItemRuntimeFree(buy.state,11);
assert.equal(freed.ok,true);
assert.equal(freed.state.inventory.itemRuntime.slots['11'],undefined);
assert.equal(buy.state.inventory.itemRuntime.slots['11'].owner,'player');

const missingState=freshPersistentState({playerId:'missing'});
const missing=allocator.allocate({state:missingState,itemId:99999999});
assert.equal(missing.ok,false);
assert.equal(missing.reason,'source-item-template-missing');
assert.equal(missing.rngCalls,0);

const fullState=freshPersistentState({playerId:'full'});
fullState.inventory.itemRuntime.itemnum=12;
for(let i=1;i<12;i++)fullState.inventory.itemRuntime.slots[String(i)]={use:true,itemId:i};
const full=allocator.allocate({state:fullState,itemId:20131});
assert.equal(full.ok,false);
assert.equal(full.reason,'item-runtime-full');
assert.equal(full.rngCalls,66);

const fixture={
  format:ITEM_MAKE_RUNTIME_FORMAT,
  itemDataIntCount:66,
  defaultData:Array(66).fill(0),
  byItemId:{
    '42':{b:[0,42,8,1,9,1,59,0],w:[24,3]},
    '43':{b:[0,43],f:{i:'TEST_INIT'}},
  }
};
const fixtureRolls=[];
const fixtureMade=sourceMakeItemData(fixture,42,{randInclusive:(a,b)=>{fixtureRolls.push([a,b]);return 0;}});
assert.equal(fixtureMade.ok,true);
assert.equal(fixtureMade.rngCalls,66);
assert.equal(fixtureMade.data[0],42);
assert.equal(fixtureMade.data[24],0);
assert.equal(fixtureMade.data[59],1);
assert.equal(fixtureRolls.length,66);
const fixtureState=freshPersistentState({playerId:'fixture'});
const fixtureAllocator=createSourceItemAllocator({
  catalog:fixture,
  itemCapacity:8,
  cursor:1,
  randInclusive:(a,b)=>0
});
const unresolved=fixtureAllocator.allocate({state:fixtureState,itemId:43});
assert.equal(unresolved.ok,false);
assert.equal(unresolved.reason,'source-init-callback-unresolved');
assert.equal(unresolved.rngCalls,66);
assert.equal(unresolved.existingIndex,1);

const handlerState=freshPersistentState({playerId:'handler'});
let handlerCalls=0;
const handlerAllocator=createSourceItemAllocator({
  catalog:fixture,
  itemCapacity:8,
  randInclusive:(a,b)=>0,
  initHandlers:{
    TEST_INIT(item){handlerCalls++;item.data[1]=777;item.initHandled=true;}
  }
});
const handled=handlerAllocator.allocate({state:handlerState,itemId:43});
assert.equal(handled.ok,true);
assert.equal(handlerCalls,1);
assert.equal(handled.item.data[1],777);
assert.equal(handled.item.initHandled,true);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-item-source-runtime-v1',
  itemMakeFormat:ITEM_MAKE_RUNTIME_FORMAT,
  templates:catalog.stats.templates,
  fixedFields:ITEM_DATA_INT_COUNT,
  gmque20131RngCalls:made.rngCalls,
  allocatorExistingIndex:allocation.existingIndex,
  economyBuyExistingIndex:buy.created[0].existingIndex,
  unresolvedInitPolicy:'fail-closed unless an explicit source callback handler is supplied'
}));
