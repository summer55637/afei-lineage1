#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  NPC_ITEMSHOP_RUNTIME_FORMAT,
  validateNpcItemShopCatalog,
  resolveShopBuyOffer,
  resolveShopSellPolicy,
  resolveNpcShopBuyRequest,
  buildItemShopAcquisitionIndex,
  itemTypeMatches,
  parseConstraintToken,
  expandConstraintToken,
  buyNpcItemShopItem
} from '../src/stoneage_npc_itemshop_runtime.mjs';

const fixture=JSON.parse(fs.readFileSync('tools/fixtures/npc-itemshop/catalog.json','utf8'));
const itemMakeFixture={
  format:'stoneage-item-make-runtime-v2',
  itemDataIntCount:66,
  defaultData:Array(66).fill(0),
  byItemId:{
    '42':{b:[0,42,2,100],w:[]},
    '43':{b:[0,43,2,100],w:[]},
    '44':{b:[0,44,2,200],w:[]},
    '45':{b:[0,45,2,300],w:[]},
    '46':{b:[0,46,2,400],w:[]},
    '50':{b:[0,50,2,20],w:[]}
  }
};

assert.equal(NPC_ITEMSHOP_RUNTIME_FORMAT,'stoneage-npc-itemshop-runtime-v1');
assert.equal(validateNpcItemShopCatalog(fixture).ok,true);

const offer=resolveShopBuyOffer(fixture,{shopId:'fixture.create#0',itemId:42});
assert.equal(offer.ok,true);
assert.equal(offer.offerIndex,0);
assert.equal(offer.buyRate,1);

const rangeOffer=resolveShopBuyOffer(fixture,{shopId:'fixture.create#0',itemId:46});
assert.equal(rangeOffer.ok,true);
assert.equal(rangeOffer.offerIndex,4);

const missing=resolveShopBuyOffer(fixture,{shopId:'fixture.create#0',itemId:999});
assert.equal(missing.ok,false);
assert.equal(missing.reason,'item-not-offered');

const sellType=resolveShopSellPolicy(fixture,{shopId:'fixture.create#0',itemId:50,itemType:4});
assert.equal(sellType.ok,true);
assert.equal(sellType.matchedBy.kind,'type');

const sellNo=resolveShopSellPolicy(fixture,{shopId:'fixture.create#1',itemId:77,itemType:99});
assert.equal(sellNo.ok,true);
assert.equal(sellNo.matchedBy.kind,'number');
assert.equal(sellNo.sellRate,1.5);
assert.equal(sellNo.special,true);

assert.equal(itemTypeMatches(4,'OFFENCE'),true);
assert.equal(itemTypeMatches(6,'DEFENCE'),true);
assert.equal(itemTypeMatches(12,'ACCESSORY'),true);
assert.equal(itemTypeMatches(16,'ACCESSORY'),false);

const parsed=parseConstraintToken('15-25');
assert.deepEqual(parsed,{raw:'15-25',kind:'range',start:15,end:25,inclusive:true});
assert.deepEqual(expandConstraintToken(parsed),Array.from({length:11},(_,i)=>15+i));

const buyReq=resolveNpcShopBuyRequest({
  catalog:fixture,
  itemMakeCatalog:itemMakeFixture,
  shopId:'fixture.create#0',
  itemId:42,
  quantity:2
});
assert.equal(buyReq.ok,true);
assert.equal(buyReq.transaction.baseCost,100);
assert.equal(buyReq.transaction.buyRate,1);
assert.equal(buyReq.transaction.quantity,2);

const index=buildItemShopAcquisitionIndex(fixture);
assert.equal(index.ok,true);
assert.equal(index.itemIndex['42'][0].shopId,'fixture.create#0');
assert.equal(index.itemIndex['42'][0].offerIndex,0);
const floorIndex=buildItemShopFloorIndex(fixture);
assert.equal(floorIndex.ok,true);
assert.deepEqual(floorIndex.floorIndex['1001'],['fixture.create#0']);
const floorShops=resolveItemShopsAtFloor(fixture,1001);
assert.equal(floorShops.ok,true);
assert.equal(floorShops.shops.length,1);
assert.equal(floorShops.shops[0].shopId,'fixture.create#0');

const state=freshPersistentState({playerId:'npc-shop'});
state.player.gold=1000;
const calls=[];
const buy=buyNpcItemShopItem(state,{
  catalog:fixture,
  itemMakeCatalog:itemMakeFixture,
  shopId:'fixture.create#0',
  itemId:42,
  quantity:1,
  transactionId:'npc-shop-1',
  options:{
    allocateItem:req=>{calls.push(req);return {ok:true,existingIndex:7,item:{use:true,itemId:req.itemId,data:[42,...Array(65).fill(0)]}};}
  }
});
assert.equal(buy.applied,true);
assert.equal(buy.created.length,1);
assert.equal(buy.state.player.gold,900);
assert.equal(calls.length,1);
assert.equal(calls[0].itemId,42);

console.log(JSON.stringify({
  pass:true,
  format:NPC_ITEMSHOP_RUNTIME_FORMAT,
  fixtureShops:Object.keys(fixture.shops).length,
  acquisitionItems:Object.keys(index.itemIndex).length,
  sourceBuyRange:'inclusive',
  sourceSellSpecialRate:'special_item > sell_rate',
  integratedBuy:true,
  floorLookup:true
}));
