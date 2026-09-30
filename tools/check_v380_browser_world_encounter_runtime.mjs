#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState, validatePersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_WORLD_ENCOUNTER_PREPARE,
  BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';

const readJson=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const targetIndex=readJson('data/generated/stoneage_start_encounter_target_index.json');
const state=freshPersistentState({playerId:'v380-encounter'});
state.world.position={floorId:100,x:610,y:538};

const controller=createBrowserStateController({
  state,
  encounterTargetIndex:targetIndex
});
const result=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_PREPARE,
  encounterId:65
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.handled,true);
assert.equal(result.stage,'encounter-prepare');
assert.equal(result.format,BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT);
assert.deepEqual(result.position,{floorId:100,x:610,y:538});
assert.equal(result.encounter.encounterId,65);
assert.deepEqual(result.encounter.rect,[568,538,610,578]);
assert.equal(result.encounter.probMin,1);
assert.equal(result.encounter.probMax,5);
assert.equal(result.encounter.enemyMax,4);
assert.deepEqual(result.encounter.groupIds,[89,92,94]);
assert.deepEqual(result.encounter.enemyIds,[120,123]);
assert.equal(result.readyForRoll,true);
assert.equal(result.rngConsumed,false);
assert.equal(result.battleStarted,false);
assert.equal(result.state.revision,0);
assert.deepEqual(controller.getState().world.position,{floorId:100,x:610,y:538});
assert.equal(validatePersistentState(controller.getState()).length,0);

const wrong=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_PREPARE,
  encounterId:57
});
assert.equal(wrong.ok,false);
assert.equal(wrong.reason,'encounter-id-not-at-position');
assert.equal(controller.getState().revision,0);

const mixedState=freshPersistentState({playerId:'v380-mixed'});
mixedState.world.position={floorId:100,x:630,y:350};
const mixedController=createBrowserStateController({
  state:mixedState,
  encounterTargetIndex:targetIndex
});
const mixed=await mixedController.dispatch({
  type:ACTION_WORLD_ENCOUNTER_PREPARE
});
assert.equal(mixed.ok,false);
assert.equal(mixed.reason,'unconditional-encounter-not-at-position');
assert.equal(mixedController.getState().revision,0);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT,
  action:ACTION_WORLD_ENCOUNTER_PREPARE,
  encounterId:result.encounter.encounterId,
  probability:[result.encounter.probMin,result.encounter.probMax],
  enemyMax:result.encounter.enemyMax,
  groupIds:result.encounter.groupIds,
  persistentMutation:false,
  rngConsumed:false,
  battleStarted:false
},null,2));
