#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { buildEventActionPlan } from '../src/stoneage_npc_event_runtime.mjs';
import { applyNpcEventActionPlan } from '../src/stoneage_npc_event_transaction.mjs';
import {
  FIRST_ROUTE_REWARD_HANDLER_FORMAT,
  createFirstRouteRewardHandlers
} from '../src/stoneage_first_route_reward_handlers.mjs';

const itemRewardCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_item_reward_runtime.json','utf8'));
const itemMakeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const petCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_pet_runtime.json','utf8'));
const state=freshPersistentState({playerId:'first-route-handlers'});
state.player.level=1;
state.player.transmigration=0;

const bundle=createFirstRouteRewardHandlers({
  itemRewardCatalog,
  itemMakeCatalog,
  petCatalog,
  petIdFactory:(st,created)=>'pet-'+created.petId,
  itemCapacity:1000,
  itemCursor:1,
  randInclusive:(a,b)=>0
});
assert.equal(bundle.ok,true);
assert.equal(bundle.format,FIRST_ROUTE_REWARD_HANDLER_FORMAT);
assert.deepEqual(bundle.capability,{GetItem:true,GetPet:true,EndSetFlg:true,NowSetFlg:true,Charm:false});

const syntheticPlan={
  format:'stoneage-npc-event-runtime-v1',
  type:'SYNTHETIC',
  condition:'LV=1',
  actions:{
    literalGetItem:[{itemId:20145,role:'GetItem'},{itemId:2849,role:'GetItem'}],
    literalGetPet:[{petId:341,role:'GetPet'}],
    charm:null,
    setEndEvents:[{eventId:366,role:'EndSetFlg'}],
    setNowEvents:[{eventId:367,role:'NowSetFlg'}]
  }
};
const applied=applyNpcEventActionPlan(state,syntheticPlan,{
  handlers:bundle.handlers,
  transactionId:'first-route-bundle-1',
  now:()=> '2026-09-30T06:30:00.000Z'
});
console.log('DEBUG_APPLIED',JSON.stringify({ok:applied.ok,reason:applied.reason,role:applied.role,transaction:applied.transaction?.reason,txRole:applied.transaction?.role,detail:applied.detail}));
assert.equal(applied.applied,true);
assert.equal(applied.actionCount,5);
assert.deepEqual(applied.state.inventory.playerItemSlots.slice(9,11),[1,2]);
assert.equal(applied.state.inventory.itemRuntime.slots['1'].itemId,20145);
assert.equal(applied.state.inventory.itemRuntime.slots['2'].itemId,2849);
assert.equal(applied.state.pets.petBox.length,1);
assert.equal(applied.state.pets.petBox[0].enemyId,341);
assert.equal(applied.state.pets.petBox[0].petId,274);
assert.equal(applied.state.events.endWords[11],16384);
assert.equal(applied.state.events.nowWords[11],32768);
assert.equal(applied.state.revision,1);

const rollbackPlan={
  ...syntheticPlan,
  actions:{
    literalGetItem:[{itemId:20145,role:'GetItem'}],
    literalGetPet:[{petId:341,role:'GetPet'}],
    charm:{value:1,role:'Charm'},
    setEndEvents:[{eventId:366,role:'EndSetFlg'}],
    setNowEvents:[]
  }
};
const rejected=applyNpcEventActionPlan(state,rollbackPlan,{handlers:bundle.handlers,transactionId:'first-route-bundle-fail'});
assert.equal(rejected.applied,false);
assert.equal(rejected.reason,'event-action-handler-required');
assert.equal(rejected.role,'Charm');
assert.equal(state.inventory.playerItemSlots.every(v=>v===null),true);
assert.equal(state.pets.petBox.length,0);
assert.equal(state.events.endWords?.length??0,0);
assert.equal(state.revision,0);

console.log(JSON.stringify({
  pass:true,
  format:FIRST_ROUTE_REWARD_HANDLER_FORMAT,
  capabilities:bundle.capability,
  syntheticActionsCommitted:applied.actionCount,
  atomicRollbackOnUnresolvedCharm:true
}));
