#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { executeNpcSourceEvent, NPC_EVENT_ORCHESTRATOR_FORMAT } from '../src/stoneage_npc_event_orchestrator.mjs';
import {
  NEW_PLAYER_EVENT_ADAPTERS_FORMAT,
  createNewPlayerEventHandlers
} from '../src/stoneage_new_player_event_adapters.mjs';
import { isEventFlagSet } from '../src/stoneage_event_flag_runtime.mjs';

const closure=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_event_closure.json','utf8'));
const itemRewardCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_item_reward_runtime.json','utf8'));
const itemMakeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const petCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_pet_runtime.json','utf8'));

assert.equal(NEW_PLAYER_EVENT_ADAPTERS_FORMAT,'stoneage-new-player-event-adapters-v1');
assert.equal(NPC_EVENT_ORCHESTRATOR_FORMAT,'stoneage-npc-event-orchestrator-v1');

const state=freshPersistentState({playerId:'new-player-first-route'});
state.player.level=1;
state.player.transmigration=0;
state.player.charm=60;

const ids=[];
const itemHandlerCursor=100;
const handlers=createNewPlayerEventHandlers({
  itemRewardCatalog,
  itemMakeCatalog,
  petCatalog,
  petIdFactory:(st,created)=>'pet-'+created.petId+'-'+st.pets.petBox.length,
  itemRandInclusive:()=>0,
  petRandInclusive:(min,max)=>min,
  itemCapacity:1000,
  itemCursor:itemHandlerCursor
});

const dry=executeNpcSourceEvent(state,closure.script,{handlers,transactionId:'dry-run',execute:false});
assert.equal(dry.ok,true);
assert.equal(dry.plannedOnly,true);
assert.equal(dry.branchIndex,0);
assert.equal(state.revision,0);
assert.equal(state.inventory.playerItemSlots.filter(v=>v!==null).length,0);
assert.equal(state.pets.petBox.length,0);

const executed=executeNpcSourceEvent(state,closure.script,{
  handlers,
  transactionId:'first-route-1',
  now:()=> '2026-09-30T07:00:00.000Z'
});
assert.equal(executed.ok,true);
assert.equal(executed.applied,true);
assert.equal(executed.branchIndex,0);
assert.equal(executed.transaction.actionCount,7);
assert.deepEqual(executed.state.inventory.playerItemSlots.slice(9,13),[100,101,102,103]);
assert.deepEqual(executed.state.inventory.itemRuntime.slots['100'].itemId,20145);
assert.deepEqual(executed.state.inventory.itemRuntime.slots['103'].itemId,18537);
assert.equal(executed.state.pets.petBox.length,1);
assert.equal(executed.state.pets.petBox[0].enemyId,341);
assert.equal(executed.state.pets.petBox[0].petId,274);
assert.equal(executed.state.pets.petBox[0].id,'pet-274-0');
assert.equal(executed.state.player.charm,60);
assert.equal(executed.state.revision,1);
assert.equal(isEventFlagSet(executed.state,'end',366),true);
assert.equal(executed.state.runtimeMeta.npcEventTransactions['first-route-1'].actionCount,7);

const repeat=executeNpcSourceEvent(executed.state,closure.script,{
  handlers,
  transactionId:'first-route-1'
});
assert.equal(repeat.ok,true);
assert.equal(repeat.idempotent,true);
assert.equal(repeat.state.revision,1);

const blocked=executeNpcSourceEvent(executed.state,closure.script,{
  handlers,
  transactionId:'first-route-2'
});
assert.equal(blocked.ok,true);
assert.equal(blocked.matched,false);
assert.equal(blocked.branchIndex,-1);

const stagedFailureBase=freshPersistentState({playerId:'first-route-fail'});
stagedFailureBase.player.level=1;
stagedFailureBase.player.transmigration=0;
stagedFailureBase.player.charm=60;
const failingHandlers=createNewPlayerEventHandlers({
  itemRewardCatalog,
  itemMakeCatalog,
  petCatalog,
  petIdFactory:null,
  itemRandInclusive:()=>0,
  petRandInclusive:()=>0,
  itemCapacity:1000,
  itemCursor:100
});
const failed=executeNpcSourceEvent(stagedFailureBase,closure.script,{
  handlers:failingHandlers,
  transactionId:'first-route-fail'
});
assert.equal(failed.ok,false);
assert.equal(failed.applied,false);
assert.equal(failed.transaction.role,'GetPet');
assert.equal(failed.state.revision,0);
assert.equal(failed.state.inventory.playerItemSlots.filter(v=>v!==null).length,4);
assert.equal(failed.state.pets.petBox.length,0);
assert.equal(stagedFailureBase.inventory.playerItemSlots.filter(v=>v!==null).length,0);
assert.equal(stagedFailureBase.pets.petBox.length,0);

ids.push(...executed.state.inventory.playerItemSlots.slice(9,13).map(index=>executed.state.inventory.itemRuntime.slots[String(index)].itemId));

console.log(JSON.stringify({
  pass:true,
  format:NEW_PLAYER_EVENT_ADAPTERS_FORMAT,
  route:'xinshoujd.arg',
  branch:0,
  transactionActions:executed.transaction.actionCount,
  grantedItems:ids,
  grantedPet:{enemyId:executed.state.pets.petBox[0].enemyId,tempNo:executed.state.pets.petBox[0].petId},
  charmNoOpBecauseEventNo:-1,
  endEvent:366,
  revision:executed.state.revision,
  idempotentRepeat:true,
  completionBlocksRepeat:true,
  handlerFailureDoesNotCommitCanonicalState:true
}));
