#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { createFirstRouteRewardHandlers } from '../src/stoneage_first_route_reward_handlers.mjs';
import { executeAndSaveNpcSourceEvent } from '../src/stoneage_first_route_save.mjs';
import { parseAndValidateSaveEnvelope } from '../src/stoneage_save_transaction.mjs';
import { isEventFlagSet } from '../src/stoneage_event_flag_runtime.mjs';
const closure=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_event_closure.json','utf8'));
const itemRewardCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_item_reward_runtime.json','utf8'));
const itemMakeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const petCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_pet_runtime.json','utf8'));
const cases=[
 {level:1,branch:0,event:366,items:[20145,2849,20228,18537],pets:[341]},
 {level:99,branch:0,event:366,items:[20145,2849,20228,18537],pets:[341]},
 {level:100,branch:1,event:365,items:[20866,2912,2909,2911],pets:[2057]},
 {level:139,branch:1,event:365,items:[20866,2912,2909,2911],pets:[2057]},
 {level:140,branch:2,event:364,items:[20867,19567,19568,19569],pets:[1645]},
 {level:149,branch:2,event:364,items:[20867,19567,19568,19569],pets:[1645]},
 {level:150,branch:3,event:363,items:[20615,20616,20617,20635],pets:[1479,2547]}
];
for(const [index,expected] of cases.entries()){
 const state=freshPersistentState({playerId:'branch-matrix-'+expected.level});
 state.player.level=expected.level; state.player.transmigration=0; state.player.charm=60;
 const bundle=createFirstRouteRewardHandlers({itemRewardCatalog,itemMakeCatalog,petCatalog,petIdFactory:(st,created)=>'pet-'+created.petId+'-'+st.pets.petBox.length,itemCapacity:1000,itemCursor:1000+(index*100),randInclusive:(a,b)=>a===b?a:0});
 assert.equal(bundle.ok,true);
 const result=await executeAndSaveNpcSourceEvent(state,closure.script,{handlers:bundle.handlers,transactionId:'branch-matrix-'+expected.level,now:()=> '2026-09-30T10:00:00.000Z',source:'new-player-branch-matrix'});
 assert.equal(result.ok,true); assert.equal(result.applied,true); assert.equal(result.execution.branchIndex,expected.branch);
 assert.equal(result.state.revision,1); assert.equal(result.execution.transaction.actionCount,expected.branch===3?8:7); assert.equal(result.state.player.charm,60);
 assert.equal(isEventFlagSet(result.state,'end',expected.event),true);
 const grantedItems=result.state.inventory.playerItemSlots.slice(9,13).map(slot=>result.state.inventory.itemRuntime.slots[String(slot)]?.itemId).filter(v=>v!=null);
 assert.deepEqual(grantedItems,expected.items); assert.deepEqual(result.state.pets.petBox.map(p=>p.enemyId),expected.pets);
 const loaded=await parseAndValidateSaveEnvelope(result.save.envelope); assert.equal(loaded.ok,true);
 assert.deepEqual(loaded.state.inventory.playerItemSlots.slice(9,13).map(slot=>loaded.state.inventory.itemRuntime.slots[String(slot)]?.itemId).filter(v=>v!=null),expected.items);
 assert.deepEqual(loaded.state.pets.petBox.map(p=>p.enemyId),expected.pets); assert.equal(isEventFlagSet(loaded.state,'end',expected.event),true);
}
const boundary150=freshPersistentState({playerId:'branch-boundary-150'}); boundary150.player.level=150;
const bundle150=createFirstRouteRewardHandlers({itemRewardCatalog,itemMakeCatalog,petCatalog,petIdFactory:(st,created)=>'pet-'+created.petId,itemCapacity:1000,itemCursor:2000,randInclusive:(a,b)=>a===b?a:0});
const first=await executeAndSaveNpcSourceEvent(boundary150,closure.script,{handlers:bundle150.handlers,transactionId:'boundary-150',now:()=> '2026-09-30T10:01:00.000Z'});
assert.equal(first.execution.branchIndex,3);
const repeat=await executeAndSaveNpcSourceEvent(first.state,closure.script,{handlers:bundle150.handlers,transactionId:'boundary-150'});
assert.equal(repeat.idempotent,true); assert.equal(repeat.applied,false); assert.equal(repeat.state.revision,1);
console.log(JSON.stringify({pass:true,format:'stoneage-new-player-branch-matrix-v1',cases:cases.length,branch0Levels:[1,99],branch1Levels:[100,139],branch2Levels:[140,149],branch3Levels:[150],branch3ActionCount:8,saveReloadParity:true,charmNoOpBecauseEventNoMinusOne:true,idempotentRepeat:true}));
