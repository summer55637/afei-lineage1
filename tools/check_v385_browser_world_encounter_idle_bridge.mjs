#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState, validatePersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_WORLD_ENCOUNTER_ROLL_IDLE_COMMIT,
  BROWSER_WORLD_ENCOUNTER_IDLE_BRIDGE_FORMAT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';
import fs from 'node:fs';

const readJson=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const targetIndex=readJson('data/generated/stoneage_start_encounter_target_index.json');

let state=freshPersistentState({playerId:'v385-hit'});
state.world.position={floorId:100,x:610,y:538};
state.idle.enabled=true;
state.idle.mode='moving';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
assert.equal(validatePersistentState(state).length,0);

const controller=createBrowserStateController({state,encounterTargetIndex:targetIndex});
let result=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ROLL_IDLE_COMMIT,
  encounterId:65,
  rng120:0,
  expectedRevision:0,
  now:'2026-10-01T05:00:00.000Z'
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.handled,true);
assert.equal(result.stage,'encounter-roll-idle-commit');
assert.equal(result.format,BROWSER_WORLD_ENCOUNTER_IDLE_BRIDGE_FORMAT);
assert.equal(result.triggered,true);
assert.equal(result.battleStarted,false);
assert.equal(result.persistentCepAfter,1);
assert.equal(result.state.world.encounter.cep,1);
assert.equal(result.state.idle.mode,'encounter_pending');
assert.equal(result.state.idle.enabled,true);
assert.equal(result.state.revision,1);
assert.ok(result.envelope);
assert.equal(result.verification.ok,true);

state=freshPersistentState({playerId:'v385-miss'});
state.world.position={floorId:100,x:610,y:538};
state.idle.enabled=true;
state.idle.mode='moving';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
const missController=createBrowserStateController({state,encounterTargetIndex:targetIndex});
result=await missController.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ROLL_IDLE_COMMIT,
  encounterId:65,
  rng120:50,
  expectedRevision:0,
  now:'2026-10-01T05:00:00.000Z'
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.triggered,false);
assert.equal(result.persistentCepAfter,2);
assert.equal(result.state.world.encounter.cep,2);
assert.equal(result.state.idle.mode,'moving');
assert.equal(result.state.revision,1);

state=freshPersistentState({playerId:'v385-disabled'});
state.world.position={floorId:100,x:610,y:538};
const disabledController=createBrowserStateController({state,encounterTargetIndex:targetIndex});
result=await disabledController.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ROLL_IDLE_COMMIT,
  encounterId:65,
  rng120:0,
  expectedRevision:0
});
assert.equal(result.ok,false);
assert.equal(result.reason,'idle-state-not-moving');
assert.equal(disabledController.getState().revision,0);
assert.equal(disabledController.getState().world.encounter.cep,0);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_WORLD_ENCOUNTER_IDLE_BRIDGE_FORMAT,
  action:ACTION_WORLD_ENCOUNTER_ROLL_IDLE_COMMIT,
  hitMode:'encounter_pending',
  missMode:'moving',
  hitCepAfter:1,
  missCepAfter:2,
  saveAtomic:true,
  battleStarted:false
},null,2));
