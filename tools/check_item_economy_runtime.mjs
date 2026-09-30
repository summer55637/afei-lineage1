#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ITEM_ECONOMY_RUNTIME_FORMAT,
  ITEMSHOP_MAX_BASE_PRICE,
  sourcePlayerMaxGold,
  emptyBackpackSlots,
  pricePerUnit,
  validateEconomyState,
  buyShopItem,
  sellShopItem
} from '../src/stoneage_item_economy_runtime.mjs';

const state=freshPersistentState({playerId:'p1',playerName:'A'});
assert.equal(ITEM_ECONOMY_RUNTIME_FORMAT,'stoneage-item-economy-runtime-v1');
assert.equal(sourcePlayerMaxGold(state),1000000);
state.player.transmigration=5;
assert.equal(sourcePlayerMaxGold(state),10000000);
state.player.transmigration=0;

const allocIds=[];
const allocated=(existingIndex,itemId,pile=1)=>({
  existingIndex,
  item:{use:true,itemId,owner:null,pile,sourceItemAllocated:true}
});

let nextExistingIndex=100;
let buy=buyShopItem(state,{transactionId:'buy-1',itemId:42,baseCost:100,buyRate:1.5,quantity:2},{
  allocateItem:({itemId})=>allocated(nextExistingIndex++,itemId)
});
assert.equal(buy.applied,true);
assert.equal(buy.unitPrice,150);
assert.equal(buy.total,300);
assert.deepEqual(buy.created.map(x=>x.slot),[9,10]);
assert.equal(buy.state.player.gold,0-300+0);
assert.equal(buy.state.inventory.playerItemSlots[9],100);
assert.equal(buy.state.inventory.itemRuntime.slots['100'].owner,'player');

const sellingState=buy.state;
sellingState.player.gold=1000;
const sell=sellShopItem(sellingState,{
  transactionId:'sell-1',slot:9,quantity:1,baseCost:1000,sellRate:0.2
});
assert.equal(sell.applied,true);
assert.equal(sell.total,200);
assert.equal(sell.state.player.gold,1200);
assert.equal(sell.state.inventory.playerItemSlots[9],null);
assert.equal(sell.state.inventory.itemRuntime.slots['100'],undefined);

const pileState=freshPersistentState({playerId:'p2'});
pileState.player.gold=100;
pileState.inventory.playerItemSlots[9]=500;
pileState.inventory.itemRuntime.slots['500']={use:true,itemId:77,owner:'player',pile:5};
pileState.inventory.piles['77']=5;
const sellOne=sellShopItem(pileState,{slot:9,quantity:1,baseCost:100,sellRate:0.2});
assert.equal(sellOne.applied,true);
assert.equal(sellOne.state.inventory.itemRuntime.slots['500'].pile,4);
assert.equal(sellOne.state.inventory.playerItemSlots[9],500);
assert.equal(sellOne.state.inventory.piles['77'],4);

assert.equal(pricePerUnit(9999,0.2),1999);
assert.equal(pricePerUnit(100,-1),-1);
assert.equal(ITEMSHOP_MAX_BASE_PRICE,9999);

const full=freshPersistentState({playerId:'full'});
for(let i=9;i<24;i++)full.inventory.playerItemSlots[i]=1000+i;
assert.equal(emptyBackpackSlots(full).length,0);
const fullBuy=buyShopItem(full,{itemId:1,baseCost:10,buyRate:1,quantity:1},{allocateItem:()=>allocated(900,1)});
assert.equal(fullBuy.applied,false);
assert.equal(fullBuy.reason,'inventory-full');

const cap=freshPersistentState({playerId:'cap'});
cap.player.gold=999900;
const capSell=sellShopItem(cap,{slot:9,quantity:1,baseCost:500,sellRate:0.2});
assert.equal(capSell.applied,false,'exactly reaching source cap must be rejected');

const bad=freshPersistentState({playerId:'bad'});
bad.player.gold=-1;
assert.equal(validateEconomyState(bad).ok,false);

console.log(JSON.stringify({
  pass:true,
  format:ITEM_ECONOMY_RUNTIME_FORMAT,
  backpackSlots:'9-23',
  maxGoldFormula:'1000000 + transmigration * 1800000',
  simpleShopSellBasePriceMax:ITEMSHOP_MAX_BASE_PRICE,
  buyRequiresSourceAllocator:true,
  stackLifecycle:'pile decrements in-place; zero frees existing item'
}));
