#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
  BROWSER_WORLD_ENCOUNTER_GROUP_RUNTIME_FORMAT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';

const readJson=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const targetIndex=readJson('data/generated/stoneage_start_encounter_target_index.json');
const groupCatalog=readJson('data/generated/stoneage_start_encounter_group_runtime.json');

const state=freshPersistentState({playerId:'v383'});
state.world.position={floorId:100,x:610,y:538};
state.idle.enabled=true;
state.idle.mode='encounter_pending';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';

const controller=createBrowserStateController({
  state,
  encounterTargetIndex:targetIndex,
  encounterGroupCatalog:groupCatalog
});

let result=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
  encounterId:65,
  groupRoll:0
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.handled,true);
assert.equal(result.stage,'group-selected');
assert.equal(result.format,BROWSER_WORLD_ENCOUNTER_GROUP_RUNTIME_FORMAT);
assert.equal(result.action,ACTION_WORLD_ENCOUNTER_GROUP_SELECT);
assert.equal(result.group.groupId,89);
assert.deepEqual(result.selection.eligibleGroupIds,[89,92,94]);
assert.equal(result.selection.totalWeight,3);
assert.equal(result.rngConsumed,true);
assert.equal(result.battleStarted,false);
assert.equal(result.persistentMutation,false);
assert.equal(result.state.revision,0);

result=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,encounterId:65,groupRoll:1});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.group.groupId,92);

result=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,encounterId:65,groupRoll:2});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.group.groupId,94);

result=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,encounterId:65,groupRoll:3});
assert.equal(result.ok,false);
assert.equal(result.reason,'group-rng-required-or-out-of-range');
assert.equal(controller.getState().revision,0);

const gatedState=freshPersistentState({playerId:'v383-gated'});
gatedState.world.position={floorId:100,x:630,y:350};
const gatedGroup=groupCatalog.groups.find(g=>g.groupId===711);
assert.ok(gatedGroup);
assert.equal(gatedGroup.appearByItemId,2764);
assert.equal(gatedGroup.notAppearByItemId,2760);

const runtime=(await import('../src/stoneage_browser_world_encounter_group_runtime.mjs')).createBrowserWorldEncounterGroupRuntime({groupCatalog});
const gatedEncounter={floorId:100,x:630,y:350,encounterId:56,probMin:1,probMax:5,enemyMax:10,zorder:50,groupIds:[711],groupProbs:[1]};
const gated=runtime.select(gatedEncounter,gatedState,{groupRoll:0});
assert.equal(gated.ok,false);
assert.equal(gated.reason,'no-eligible-group');
assert.equal(gated.candidates[0].gate.reason,'required-item-missing');
assert.equal(gated.candidates[0].gate.itemId,2764);
assert.equal(gatedState.revision,0);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_WORLD_ENCOUNTER_GROUP_RUNTIME_FORMAT,
  action:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
  encounterId:65,
  selectedByRoll:{0:89,1:92,2:94},
  totalWeight:3,
  persistentMutation:false,
  battleStarted:false,
  itemGateFailClosed:true
},null,2));
