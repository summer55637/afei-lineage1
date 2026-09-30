#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  BROWSER_WORLD_NPC_RUNTIME_FORMAT,
  buildWorldNpcPointIndex,
  createBrowserWorldNpcRuntime,
  resolveWorldNpcAt,
  sourceKey
} from '../src/stoneage_browser_world_npc_runtime.mjs';
import {
  createBrowserStateController,
  ACTION_NPC_RESOLVE_AT
} from '../src/stoneage_browser_state_controller.mjs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';

const worldNpcIndex=JSON.parse(fs.readFileSync('tools/fixtures/npc-itemshop/world-index.json','utf8'));
const catalog=JSON.parse(fs.readFileSync('tools/fixtures/npc-itemshop/catalog.json','utf8'));
const itemMakeCatalog=JSON.parse(fs.readFileSync('tools/fixtures/npc-itemshop/item-make.json','utf8'));

const runtime=createBrowserWorldNpcRuntime({worldNpcIndex});
assert.equal(runtime.ok,true);
assert.equal(runtime.format,BROWSER_WORLD_NPC_RUNTIME_FORMAT);
assert.equal(runtime.index.statistics.pointInstanceCount,3);
assert.equal(runtime.index.statistics.nonPointCreateBlocks,0);

const located=resolveWorldNpcAt(runtime.index,[1001,17,13]);
assert.equal(located.ok,true);
assert.equal(located.npc.path,'fixture.create');
assert.equal(located.npc.blockIndex,0);
assert.equal(located.npc.template,'npcgen_shop');
assert.equal(located.npc.functionSet,'ItemShop');
assert.equal(located.npc.services.length,1);
assert.equal(located.npc.services[0].sourceStatus,'known');
assert.equal(sourceKey(located.npc),'fixture.create#0');

const serviceLocated=resolveWorldNpcAt(runtime.index,[1001,17,13],{functionSet:'ItemShop'});
assert.equal(serviceLocated.ok,true);
assert.equal(serviceLocated.npc.functionSet,'ItemShop');

const wrongService=resolveWorldNpcAt(runtime.index,[1001,17,13],{functionSet:'Bankman'});
assert.equal(wrongService.ok,false);
assert.equal(wrongService.reason,'npc-not-found-at-cell');

const missing=resolveWorldNpcAt(runtime.index,[1001,99,99]);
assert.equal(missing.ok,false);
assert.equal(missing.reason,'npc-not-found-at-cell');

const productionWorld=JSON.parse(fs.readFileSync('data/generated/stoneage_world_npc_index.json','utf8'));
const productionCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_npc_itemshop_runtime.json','utf8'));
const production=buildWorldNpcPointIndex(productionWorld);
assert.equal(production.ok,true);
assert.ok(production.index.statistics.pointInstanceCount>0);
const productionShop=Object.values(productionCatalog.shops)[0];
const productionNpc=resolveWorldNpcAt(production.index,{
  floor:productionShop.floorId,
  x:productionShop.bornCorner.x1,
  y:productionShop.bornCorner.y1
});
assert.equal(productionNpc.ok,true);
assert.equal(productionNpc.npc.blockIndex,productionShop.source.create.blockIndex);
assert.equal(productionNpc.npc.path,productionShop.source.create.path);
assert.ok(Array.isArray(productionNpc.npc.services));
assert.ok(productionNpc.npc.services.some(x=>x.functionSet.toLowerCase()==='itemshop'));

const state=freshPersistentState({playerId:'v356'});
state.player.gold=1000;
const controller=createBrowserStateController({
  state,
  worldNpcIndex,
  itemShopCatalog:catalog,
  itemMakeCatalog,
  interactionRule:'NPC_Util_charIsInFrontOfChar distance=1',
  itemShopRuntimeOptions:{itemCapacity:1000,cursor:1,randInclusive:(a,b)=>a}
});

const resolveResult=await controller.dispatch({
  type:ACTION_NPC_RESOLVE_AT,
  targetCell:[1001,17,13],
  serviceFunctionSet:'ItemShop',
  player:{floor:1001,x:17,y:14,facingCell:[1001,17,13]}
});
assert.equal(resolveResult.ok,true);
assert.equal(resolveResult.worldNpc.functionSet,'ItemShop');
assert.equal(resolveResult.state.player.gold,1000);

const open=await controller.dispatch({
  type:'NPC_ITEMSHOP_OPEN',
  targetCell:[1001,17,13],
  serviceFunctionSet:'ItemShop',
  player:{floor:1001,x:17,y:14,facingCell:[1001,17,13]}
});
assert.equal(open.ok,true);
assert.equal(open.handled,true);
assert.equal(open.shop.offers.length,5);

const buy=await controller.dispatch({
  type:'NPC_ITEMSHOP_BUY',
  targetCell:[1001,17,13],
  serviceFunctionSet:'ItemShop',
  player:{floor:1001,x:17,y:14,facingCell:[1001,17,13]},
  itemId:42,
  quantity:1,
  transactionId:'v356-buy-1'
});
assert.equal(buy.ok,true);
assert.equal(buy.state.player.gold,900);
assert.equal(buy.state.inventory.playerItemSlots[9],1);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_WORLD_NPC_RUNTIME_FORMAT,
  fixturePointInstances:runtime.index.statistics.pointInstanceCount,
  productionPointInstances:production.index.statistics.pointInstanceCount,
  serviceRouting:true,
  serviceFunctionSet:'ItemShop',
  clickToItemShop:true,
  buyGold:buy.state.player.gold
}));
