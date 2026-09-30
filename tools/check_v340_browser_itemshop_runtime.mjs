#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { createBrowserStateController } from '../src/stoneage_browser_state_controller.mjs';
import {
  BROWSER_ITEMSHOP_RUNTIME_FORMAT,
  ACTION_NPC_ITEMSHOP_OPEN,
  ACTION_NPC_ITEMSHOP_BUY,
  ACTION_NPC_ITEMSHOP_SELL,
  resolveBrowserItemShopOffers,
  getItemRuntimeSnapshot,
  createBrowserItemShopRuntime
} from '../src/stoneage_browser_itemshop_runtime.mjs';

const catalog=JSON.parse(fs.readFileSync('tools/fixtures/npc-itemshop/catalog.json','utf8'));
const itemMakeCatalog=JSON.parse(fs.readFileSync('tools/fixtures/npc-itemshop/item-make.json','utf8'));
const npc={
  floor:1001,
  npc:[17,13],
  template:'npcgen_shop',
  path:'tools/fixtures/npc-itemshop/source/create.fixture',
  blockIndex:0,
  runtimeModuleStatus:'resolved'
};
const player={
  floor:1001,
  x:17,
  y:14,
  facingCell:[1001,17,13]
};

assert.equal(BROWSER_ITEMSHOP_RUNTIME_FORMAT,'stoneage-browser-itemshop-runtime-v1');
const listed=resolveBrowserItemShopOffers(catalog,itemMakeCatalog,'fixture.create#0');
assert.equal(listed.ok,true);
assert.equal(listed.offers.length,5);
assert.deepEqual(listed.offers.map(x=>x.itemId),[42,43,44,45,46]);
assert.equal(listed.offers[4].unitPrice,400);

const runtime=createBrowserItemShopRuntime({
  catalog,
  itemMakeCatalog,
  itemCapacity:1000,
  cursor:1,
  randInclusive:(a,b)=>a
});
assert.equal(runtime.ok,true);
const state=freshPersistentState({playerId:'browser-itemshop'});
state.player.gold=1000;

const open=runtime.dispatch(state,{
  type:ACTION_NPC_ITEMSHOP_OPEN,
  npc,player,shopId:'fixture.create#0'
});
assert.equal(open.ok,true);
assert.equal(open.handled,true);
assert.equal(open.shop.offers.length,5);
assert.equal(open.state.revision,0);

const buy=runtime.dispatch(state,{
  type:ACTION_NPC_ITEMSHOP_BUY,
  npc,player,shopId:'fixture.create#0',itemId:42,quantity:2,transactionId:'v340-buy-1'
});
assert.equal(buy.ok,true);
assert.equal(buy.result.applied,true);
assert.equal(buy.state.player.gold,800);
assert.equal(buy.state.inventory.playerItemSlots[9],1);
assert.equal(buy.state.inventory.playerItemSlots[10],2);
assert.equal(buy.state.revision,1);

const snapshot=getItemRuntimeSnapshot(buy.state,9);
assert.equal(snapshot.ok,true);
assert.equal(snapshot.itemId,42);
assert.equal(snapshot.baseCost,100);
assert.equal(snapshot.itemType,2);

const sell=runtime.dispatch(buy.state,{
  type:ACTION_NPC_ITEMSHOP_SELL,
  npc,player,shopId:'fixture.create#0',slot:9,quantity:1,transactionId:'v340-sell-1'
});
assert.equal(sell.ok,true);
assert.equal(sell.result.applied,true);
assert.equal(sell.policy.sellRate,0.2);
assert.equal(sell.result.total,20);
assert.equal(sell.state.player.gold,820);
assert.equal(sell.state.inventory.playerItemSlots[9],null);
assert.equal(sell.state.inventory.playerItemSlots[10],2);
assert.equal(sell.state.revision,2);

const idempotent=runtime.dispatch(sell.state,{
  type:ACTION_NPC_ITEMSHOP_BUY,
  npc,player,shopId:'fixture.create#0',itemId:42,quantity:1,transactionId:'v340-sell-1'
});
assert.equal(idempotent.ok,false);
assert.equal(idempotent.result.idempotent,true);
assert.equal(idempotent.state.player.gold,820);

const outOfRange=runtime.dispatch(state,{
  type:ACTION_NPC_ITEMSHOP_OPEN,
  npc,
  player:{...player,x:50,y:50,facingCell:[1001,50,49]},
  shopId:'fixture.create#0'
});
assert.equal(outOfRange.ok,false);
assert.equal(outOfRange.stage,'interaction-gate');

const missingItem=runtime.dispatch(state,{
  type:ACTION_NPC_ITEMSHOP_BUY,
  npc,player,shopId:'fixture.create#0',itemId:999,quantity:1,transactionId:'v340-buy-missing'
});
assert.equal(missingItem.ok,false);
assert.equal(missingItem.reason,'item-not-offered');
assert.equal(missingItem.state.player.gold,1000);

const sellBlocked=runtime.dispatch(sell.state,{
  type:ACTION_NPC_ITEMSHOP_SELL,
  npc,player,shopId:'fixture.create#1',slot:10,quantity:1,transactionId:'v340-sell-blocked'
});
assert.equal(sellBlocked.ok,false);
assert.equal(sellBlocked.stage,'sell-policy');
assert.equal(sellBlocked.reason,'item-not-sellable-to-shop');

const controllerState=freshPersistentState({playerId:'browser-controller'});
controllerState.player.gold=1000;
const controller=createBrowserStateController({
  state:controllerState,
  itemShopCatalog:catalog,
  itemMakeCatalog,
  itemShopRuntimeOptions:{itemCapacity:1000,cursor:1,randInclusive:(a,b)=>a},
  interactionRule:'NPC_Util_charIsInFrontOfChar distance=1'
});
const controllerOpen=await controller.dispatch({
  type:ACTION_NPC_ITEMSHOP_OPEN,npc,player,shopId:'fixture.create#0'
});
assert.equal(controllerOpen.ok,true);
const controllerBuy=await controller.dispatch({
  type:ACTION_NPC_ITEMSHOP_BUY,npc,player,shopId:'fixture.create#0',itemId:42,quantity:1,transactionId:'v340-controller-buy'
});
assert.equal(controllerBuy.ok,true);
assert.equal(controller.getState().player.gold,900);
assert.equal(controller.getState().revision,1);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_ITEMSHOP_RUNTIME_FORMAT,
  openOffers:open.shop.offers.length,
  buyGoldDelta:200,
  sellGoldDelta:20,
  atomicRevision:sell.state.revision,
  sourceAllocatorCursor:runtime.getCursor(),
  strictInteractionGate:true
}));
