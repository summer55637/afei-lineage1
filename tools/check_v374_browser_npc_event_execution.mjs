#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { createFirstRouteRewardHandlers } from '../src/stoneage_first_route_reward_handlers.mjs';
import { createBrowserStateController, ACTION_NPC_EVENT_EXECUTE } from '../src/stoneage_browser_state_controller.mjs';
import { parseAndValidateSaveEnvelope } from '../src/stoneage_save_transaction.mjs';

const world=JSON.parse(fs.readFileSync('data/generated/stoneage_world_npc_index.json','utf8'));
const audit=JSON.parse(fs.readFileSync('data/generated/stoneage_world_npc_functionset_audit.json','utf8'));
const closure=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_event_closure.json','utf8'));
const itemRewardCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_item_reward_runtime.json','utf8'));
const itemMakeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const petCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_pet_runtime.json','utf8'));
const reachable=JSON.parse(fs.readFileSync('data/generated/stoneage_start_npc_reachability.json','utf8'));

assert.equal(audit.fixedSource.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(closure.fixedSource.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
const rows=reachable.rows.filter(r=>r.template==='changeevent'&&r.floor===1006&&r.blockIndex===2);
assert.equal(rows.length,1);
assert.equal(rows[0].reachableInteraction,true);

const state=freshPersistentState({playerId:'v374-browser-event'});
state.player.level=1; state.player.transmigration=0; state.player.gold=30000; state.player.charm=60;
const bundle=createFirstRouteRewardHandlers({itemRewardCatalog,itemMakeCatalog,petCatalog,petIdFactory:(st,created)=>'pet-'+created.petId,itemCapacity:1000,itemCursor:900,randInclusive:(a,b)=>a===b?a:0});
const controller=createBrowserStateController({state,moduleAudit:audit,modules:{ExChangeMan:{script:closure.script,kind:'changeevent-source-resolved'}},handlerFactory:()=>bundle.handlers,worldNpcIndex:world,interactionRule:'NPC_Util_charIsInFrontOfChar distance=1',now:()=> '2026-10-01T02:00:00.000Z'});

const result=await controller.dispatch({type:ACTION_NPC_EVENT_EXECUTE,targetCell:[1006,15,22],player:{floor:1006,x:15,y:21,facingCell:[1006,15,22]},transactionId:'v374-new-player-event'});
assert.equal(result.ok,true); assert.equal(result.handled,true); assert.equal(result.event,true); assert.equal(result.stage,'npc-event');
assert.equal(result.execution.applied,true); assert.equal(result.execution.execution.plan.eventNo,-1); assert.equal(result.state.revision,1);
assert.equal(result.state.inventory.itemRuntime.slots['900'].itemId,20145); assert.equal(result.state.inventory.itemRuntime.slots['901'].itemId,2849); assert.equal(result.state.inventory.itemRuntime.slots['902'].itemId,20228); assert.equal(result.state.inventory.itemRuntime.slots['903'].itemId,18537);
assert.equal(result.state.pets.petBox.length,1); assert.equal(result.state.pets.petBox[0].petId,274);
assert.equal(result.state.events.endWords[11],16384); assert.equal(result.state.player.charm,60);
assert.equal(result.execution.save.ok,true); assert.equal(result.execution.save.envelope.revision,1);

const loaded=await parseAndValidateSaveEnvelope(result.execution.save.envelope,{now:()=> '2026-10-01T02:00:01.000Z'});
assert.equal(loaded.ok,true); assert.equal(loaded.state.revision,1); assert.equal(loaded.state.inventory.itemRuntime.slots['900'].itemId,20145); assert.equal(loaded.state.pets.petBox[0].petId,274); assert.equal(loaded.state.events.endWords[11],16384);

const repeat=await controller.dispatch({type:ACTION_NPC_EVENT_EXECUTE,targetCell:[1006,15,22],player:{floor:1006,x:15,y:21,facingCell:[1006,15,22]},transactionId:'v374-new-player-event'});
assert.equal(repeat.ok,true); assert.equal(repeat.handled,false); assert.equal(repeat.execution.idempotent,true); assert.equal(repeat.state.revision,1);

const farState=freshPersistentState({playerId:'v374-browser-event-far'});
farState.player.level=1; farState.player.transmigration=0; farState.player.gold=30000; farState.player.charm=60;
const farController=createBrowserStateController({state:farState,moduleAudit:audit,modules:{ExChangeMan:{script:closure.script,kind:'changeevent-source-resolved'}},handlerFactory:()=>bundle.handlers,worldNpcIndex:world,interactionRule:'NPC_Util_charIsInFrontOfChar distance=1',now:()=> '2026-10-01T02:00:00.000Z'});
const far=await farController.dispatch({type:ACTION_NPC_EVENT_EXECUTE,targetCell:[1006,15,22],player:{floor:1006,x:18,y:21,facingCell:[1006,15,22]},transactionId:'v374-far'});
assert.equal(far.ok,false); assert.equal(far.handled,false); assert.equal(far.stage,'npc-event'); assert.equal(far.reason,'interaction-distance-too-far'); assert.equal(farController.getState().revision,0);

console.log(JSON.stringify({pass:true,format:'stoneage-v374-browser-npc-event-execution-v1',productionChangeEventInstance:'floor1006#2',rewardItems:4,starterPet:274,endEventFlagWord11:16384,charmNoOpForEventNoMinus1:true,saveRevision:1,idempotentReplay:true,interactionGateFailClosed:true},null,2));