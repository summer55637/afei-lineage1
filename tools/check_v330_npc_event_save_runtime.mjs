#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { createFirstRouteRewardHandlers } from '../src/stoneage_first_route_reward_handlers.mjs';
import { executeAndPersistNpcSourceEvent, NPC_EVENT_SAVE_RUNTIME_FORMAT } from '../src/stoneage_npc_event_save_runtime.mjs';

const closure=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_event_closure.json','utf8'));
const itemRewardCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_item_reward_runtime.json','utf8'));
const itemMakeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const petCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_pet_runtime.json','utf8'));

const state=freshPersistentState({playerId:'v330-save-route'});
state.player.level=1;
state.player.transmigration=0;
state.player.charm=60;

const bundle=createFirstRouteRewardHandlers({
  itemRewardCatalog, itemMakeCatalog, petCatalog,
  petIdFactory:(st,created)=>'pet-'+created.petId+'-'+st.pets.petBox.length,
  itemCapacity:1000, itemCursor:100, randInclusive:(a,b)=>a===b?a:0
});
assert.equal(bundle.ok,true);

const first=executeAndPersistNpcSourceEvent(state,closure.script,{handlers:bundle.handlers,transactionId:'v330-first-route-1',now:()=> '2026-09-30T07:30:00.000Z',source:'v3.30-first-route'});
assert.equal(first.ok,true);
assert.equal(first.applied,true);
assert.equal(first.state.revision,1);
assert.equal(first.save.ok,true);
assert.equal(first.save.envelope.revision,1);
assert.equal(first.save.envelope.source,'v3.30-first-route');
assert.equal(first.state.runtimeMeta.npcEventTransactions['v330-first-route-1'].actionCount,6);
assert.equal(first.state.player.charm,60);
assert.equal(first.state.inventory.playerItemSlots.filter(v=>v!==null).length,4);
assert.equal(first.state.pets.petBox.length,1);

const parsed=JSON.parse(first.save.envelope.payload);
assert.equal(parsed.revision,1);
assert.equal(parsed.events.endWords[11],16384);
assert.equal(parsed.pets.petBox[0].petId,274);

const repeated=executeAndPersistNpcSourceEvent(first.state,closure.script,{handlers:bundle.handlers,transactionId:'v330-first-route-1',now:()=> '2026-09-30T07:31:00.000Z',source:'v3.30-first-route'});
assert.equal(repeated.ok,true);
assert.equal(repeated.idempotent,true);
assert.equal(repeated.applied,false);
assert.equal(repeated.state.revision,1);
assert.equal(repeated.state.inventory.playerItemSlots.filter(v=>v!==null).length,4);

const blocked=executeAndPersistNpcSourceEvent(first.state,closure.script,{handlers:bundle.handlers,transactionId:'v330-first-route-2',now:()=> '2026-09-30T07:32:00.000Z'});
assert.equal(blocked.ok,true);
assert.equal(blocked.execution.matched,false);
assert.equal(blocked.execution.branchIndex,-1);

const failedBase=freshPersistentState({playerId:'v330-save-fail'});
failedBase.player.level=1; failedBase.player.transmigration=0;
const incompleteHandlers={...bundle.handlers}; delete incompleteHandlers.GetPet;
const failed=executeAndPersistNpcSourceEvent(failedBase,closure.script,{handlers:incompleteHandlers,transactionId:'v330-fail',now:()=> '2026-09-30T07:33:00.000Z'});
assert.equal(failed.ok,false);
assert.equal(failed.stage,'event');
assert.equal(failed.execution.applied,false);
assert.equal(failed.state.inventory.playerItemSlots.filter(v=>v!==null).length,0);
assert.equal(failed.state.pets.petBox.length,0);
assert.equal(failed.state.revision,0);

console.log(JSON.stringify({pass:true,format:NPC_EVENT_SAVE_RUNTIME_FORMAT,firstRoutePersisted:true,revision:1,saveEnvelopeRevision:1,grantedItems:4,grantedPets:1,endEvent:366,charm:60,idempotentReplay:true,completedBranchBlocked:true,failureLeavesCanonicalStateUntouched:true}));
