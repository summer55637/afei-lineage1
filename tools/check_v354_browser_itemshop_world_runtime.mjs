#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  BROWSER_WORLD_ITEMSHOP_RUNTIME_FORMAT,
  buildWorldItemShopBindingIndex,
  createBrowserWorldItemShopRuntime,
  resolveWorldItemShopBinding,
  npcSourceKey
} from '../src/stoneage_browser_world_itemshop_runtime.mjs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';

const catalog=JSON.parse(fs.readFileSync('tools/fixtures/npc-itemshop/catalog.json','utf8'));
const itemMakeCatalog=JSON.parse(fs.readFileSync('tools/fixtures/npc-itemshop/item-make.json','utf8'));
const worldNpcIndex=JSON.parse(fs.readFileSync('tools/fixtures/npc-itemshop/world-index.json','utf8'));

const bindingIndex=buildWorldItemShopBindingIndex(worldNpcIndex,catalog);
assert.equal(bindingIndex.ok,true);
assert.equal(bindingIndex.counts.worldItemShopBindings,3);
assert.equal(bindingIndex.counts.resolvedBindings,2);
assert.equal(bindingIndex.counts.unresolvedBindings,1);
assert.equal(bindingIndex.unresolved[0].npcKey,'fixture.create#2');

const npc={
  path:'gmsv/data/npc/fixture.create',
  blockIndex:0,
  floor:1001,
  npc:[17,13],
  template:'npcgen_shop'
};
const player={
  floor:1001,
  x:17,
  y:14,
  facingCell:[1001,17,13]
};

const resolved=resolveWorldItemShopBinding(bindingIndex,npc);
assert.equal(resolved.ok,true);
assert.equal(resolved.shopId,'fixture.create#0');
assert.equal(npcSourceKey(npc),'fixture.create#0');

const runtime=createBrowserWorldItemShopRuntime({
  worldNpcIndex,
  catalog,
  itemMakeCatalog,
  itemCapacity:1000,
  cursor:1,
  randInclusive:(a,b)=>a
});
assert.equal(runtime.ok,true);
assert.equal(runtime.format,BROWSER_WORLD_ITEMSHOP_RUNTIME_FORMAT);

const state=freshPersistentState({playerId:'v354'});
state.player.gold=1000;
const open=runtime.dispatch(state,{type:'NPC_ITEMSHOP_OPEN',npc,player});
assert.equal(open.ok,true);
assert.equal(open.handled,true);
assert.equal(open.worldBinding.shopId,'fixture.create#0');
assert.equal(open.shop.offers.length,5);
assert.equal(open.state.revision,0);

const buy=runtime.dispatch(state,{
  type:'NPC_ITEMSHOP_BUY',
  npc,
  player,
  itemId:42,
  quantity:1,
  transactionId:'v354-buy-1'
});
assert.equal(buy.ok,true);
assert.equal(buy.result.applied,true);
assert.equal(buy.worldBinding.shopId,'fixture.create#0');
assert.equal(buy.state.player.gold,900);
assert.equal(buy.state.inventory.playerItemSlots[9],1);

const sell=runtime.dispatch(buy.state,{
  type:'NPC_ITEMSHOP_SELL',
  npc,
  player,
  slot:9,
  quantity:1,
  transactionId:'v354-sell-1'
});
assert.equal(sell.ok,true);
assert.equal(sell.result.applied,true);
assert.equal(sell.policy.sellRate,0.2);
assert.equal(sell.result.total,20);
assert.equal(sell.state.player.gold,920);

const mismatchedShop=runtime.dispatch(state,{
  type:'NPC_ITEMSHOP_OPEN',
  npc,
  player,
  shopId:'fixture.create#1'
});
assert.equal(mismatchedShop.ok,false);
assert.equal(mismatchedShop.stage,'shop-resolution');
assert.equal(mismatchedShop.reason,'shop-id-mismatch');

const wrongFloor=runtime.dispatch(state,{
  type:'NPC_ITEMSHOP_OPEN',
  npc:{...npc,floor:9999},
  player
});
assert.equal(wrongFloor.ok,false);
assert.equal(wrongFloor.stage,'shop-resolution');
assert.equal(wrongFloor.reason,'npc-floor-mismatch');

const unresolvedNpc={
  path:'fixture.create',
  blockIndex:2,
  floor:1200,
  npc:[20,20],
  template:'npcgen_shop'
};
const unresolved=runtime.dispatch(state,{
  type:'NPC_ITEMSHOP_OPEN',
  npc:unresolvedNpc,
  player:{floor:1200,x:20,y:21,facingCell:[1200,20,20]}
});
assert.equal(unresolved.ok,false);
assert.equal(unresolved.stage,'shop-resolution');
assert.equal(unresolved.reason,'itemshop-catalog-missing-for-world-npc');

const productionCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_npc_itemshop_runtime.json','utf8'));
const productionWorld=JSON.parse(fs.readFileSync('data/generated/stoneage_world_npc_index.json','utf8'));
const productionIndex=buildWorldItemShopBindingIndex(productionWorld,productionCatalog);
assert.equal(productionIndex.ok,true);
assert.equal(productionIndex.counts.worldItemShopBindings,336);
assert.equal(productionIndex.counts.resolvedBindings,335);
assert.equal(productionIndex.counts.unresolvedBindings,1);
assert.equal(productionIndex.unresolved[0].npcKey,'my/magicdou/daochang.create#8');

const productionShop=Object.values(productionCatalog.shops)[0];
const productionKey=npcSourceKey(productionShop.source.create);
const productionBinding=resolveWorldItemShopBinding(productionIndex,{
  path:productionShop.source.create.path,
  blockIndex:productionShop.source.create.blockIndex,
  floor:productionShop.floorId,
  npc:[productionShop.bornCorner.x1,productionShop.bornCorner.y1],
  template:productionShop.templateName
});
assert.equal(productionBinding.ok,true);
assert.equal(productionBinding.shopId,productionKey);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_WORLD_ITEMSHOP_RUNTIME_FORMAT,
  fixtureResolved:2,
  fixtureUnresolved:1,
  productionWorldItemShopBindings:productionIndex.counts.worldItemShopBindings,
  productionResolved:productionIndex.counts.resolvedBindings,
  productionUnresolved:productionIndex.counts.unresolvedBindings,
  knownUnresolvedNpc:productionIndex.unresolved[0].npcKey,
  transactionGold:920
}));
