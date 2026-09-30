#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { parseAndValidateSaveEnvelope, SAVE_ENVELOPE_FORMAT } from '../src/stoneage_save_transaction.mjs';
import { createFirstRouteRewardHandlers } from '../src/stoneage_first_route_reward_handlers.mjs';
import { FIRST_ROUTE_SAVE_FORMAT, executeAndSaveNpcSourceEvent } from '../src/stoneage_first_route_save.mjs';

const closure=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_event_closure.json','utf8'));
const itemRewardCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_item_reward_runtime.json','utf8'));
const itemMakeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const petCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_pet_runtime.json','utf8'));

const state=freshPersistentState({now:()=> '2026-09-30T08:00:00.000Z',playerId:'first-route-save'});
state.player.level=1;
state.player.transmigration=0;
state.player.charm=60;

const bundle=createFirstRouteRewardHandlers({
  itemRewardCatalog,
  itemMakeCatalog,
  petCatalog,
  petIdFactory:(st,created)=>'pet-'+created.petId,
  itemCapacity:1000,
  itemCursor:200,
  randInclusive:(a,b)=>a===b?a:0
});
assert.equal(bundle.ok,true);

const context={
  level:1,
  transmigration:0,
  gold:0,
  isEventEnd:id=>false,
  isEventNow:id=>false
};

const result=await executeAndSaveNpcSourceEvent(state,closure.script,{
  context,
  handlers:bundle.handlers,
  transactionId:'first-route-save-1',
  now:()=> '2026-09-30T08:01:00.000Z',
  source:'new-player-changeevent'
});
assert.equal(result.ok,true);
assert.equal(result.applied,true);
assert.equal(result.save.ok,true);
assert.equal(result.save.envelope.format,SAVE_ENVELOPE_FORMAT);
assert.equal(result.state.revision,1);
assert.equal(result.state.runtimeMeta.lastSavedAt,'2026-09-30T08:01:00.000Z');
assert.equal(result.state.inventory.playerItemSlots.slice(9,13).length,4);
assert.deepEqual(result.state.inventory.playerItemSlots.slice(9,13),[200,201,202,203]);
assert.equal(result.state.inventory.itemRuntime.slots['200'].itemId,20145);
assert.equal(result.state.pets.petBox[0].id,'pet-274');
assert.equal(result.state.player.charm,60);
assert.equal(result.state.events.endWords[11],16384);

const loaded=await parseAndValidateSaveEnvelope(result.save.envelope,{now:()=> '2026-09-30T08:02:00.000Z'});
assert.equal(loaded.ok,true);
assert.equal(loaded.state.revision,1);
assert.equal(loaded.state.inventory.itemRuntime.slots['200'].itemId,20145);
assert.equal(loaded.state.pets.petBox[0].petId,274);
assert.equal(loaded.state.events.endWords[11],16384);
assert.equal(loaded.state.runtimeMeta.npcEventTransactions['first-route-save-1'].actionCount,7);

const repeat=await executeAndSaveNpcSourceEvent(result.state,closure.script,{
  context,
  handlers:bundle.handlers,
  transactionId:'first-route-save-1',
  now:()=> '2026-09-30T08:03:00.000Z'
});
assert.equal(repeat.ok,true);
assert.equal(repeat.idempotent,true);
assert.equal(repeat.save,null);
assert.equal(repeat.state.revision,1);

const blocked=await executeAndSaveNpcSourceEvent(result.state,closure.script,{
  context,
  handlers:bundle.handlers,
  transactionId:'first-route-save-2'
});
assert.equal(blocked.ok,true);
assert.equal(blocked.applied,false);
assert.equal(blocked.execution.matched,false);
assert.equal(blocked.save,null);

const conflictBase=freshPersistentState({playerId:'first-route-conflict'});
conflictBase.player.level=1;
conflictBase.player.transmigration=0;
const conflictResult=await executeAndSaveNpcSourceEvent(conflictBase,closure.script,{
  context,
  handlers:bundle.handlers,
  transactionId:'first-route-conflict',
  now:()=> '2026-09-30T08:04:00.000Z'
});
assert.equal(conflictResult.ok,true);

console.log(JSON.stringify({
  pass:true,
  format:FIRST_ROUTE_SAVE_FORMAT,
  transactionId:'first-route-save-1',
  savedRevision:result.state.revision,
  savedItems:[20145,2849,20228,18537],
  savedPet:{enemyId:341,tempNo:274},
  charmUnchangedBecauseEventNoMinusOne:true,
  endEvent:366,
  envelopeFormat:result.save.envelope.format,
  reloadParity:true,
  idempotentRepeat:true,
  completedBranchBlocked:true
}));
