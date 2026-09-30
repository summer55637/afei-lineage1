#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  freshPersistentState,
  validatePersistentState
} from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_WORLD_ENCOUNTER_ROLL_COMMIT,
  BROWSER_WORLD_ENCOUNTER_PERSISTENCE_RUNTIME_FORMAT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';
const readJson=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const targetIndex=readJson('data/generated/stoneage_start_encounter_target_index.json');

let state=freshPersistentState({playerId:'v382-persist'});
assert.equal(state.world.encounter.cep,0);
assert.equal(validatePersistentState(state).length,0);
state.world.position={floorId:100,x:610,y:538};
assert.equal(validatePersistentState(state).length,0);

const controller=createBrowserStateController({
  state,
  encounterTargetIndex:targetIndex
});
let result=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ROLL_COMMIT,
  encounterId:65,
  position:{floorId:100,x:610,y:538},
  rng120:0
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.handled,true);
assert.equal(result.stage,'encounter-roll-persist');
assert.equal(result.format,BROWSER_WORLD_ENCOUNTER_PERSISTENCE_RUNTIME_FORMAT);
assert.equal(result.persistentCepBefore,0);
assert.equal(result.persistentCepAfter,1);
assert.equal(result.state.world.encounter.cep,1);
assert.equal(result.state.revision,1);
assert.equal(result.triggered,true);
assert.equal(result.battleStarted,false);
assert.ok(result.envelope);
assert.equal(result.verification.ok,true);

result=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ROLL_COMMIT,
  encounterId:65,
  position:{floorId:100,x:610,y:538},
  rng120:50
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.persistentCepBefore,1);
assert.equal(result.persistentCepAfter,2);
assert.equal(result.state.world.encounter.cep,2);
assert.equal(result.state.revision,2);

result=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ROLL_COMMIT,
  encounterId:65,
  position:{floorId:100,x:610,y:538},
  rng120:1,
  expectedRevision:0
});
assert.equal(result.ok,false);
assert.equal(result.reason,'revision-conflict');
assert.equal(controller.getState().revision,2);
assert.equal(controller.getState().world.encounter.cep,2);

result=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ROLL_COMMIT,
  encounterId:65,
  position:{floorId:100,x:610,y:538},
  rng120:120
});
assert.equal(result.ok,false);
assert.equal(result.reason,'encounter-rng120-required');
assert.equal(controller.getState().revision,2);
assert.equal(controller.getState().world.encounter.cep,2);

result=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ROLL_COMMIT,
  encounterId:65,
  position:{floorId:100,x:610,y:538},
  noEnemy:true
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.persistentCepAfter,2);
assert.equal(result.rngConsumed,false);
assert.equal(result.state.revision,3);
assert.equal(result.state.world.encounter.cep,2);

const wrongPosition=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ROLL_COMMIT,
  encounterId:57,
  position:{floorId:100,x:610,y:538},
  rng120:0
});
assert.equal(wrongPosition.ok,false);
assert.equal(wrongPosition.reason,'encounter-id-not-at-position');
assert.equal(controller.getState().revision,3);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_WORLD_ENCOUNTER_PERSISTENCE_RUNTIME_FORMAT,
  persistentField:'world.encounter.cep',
  initialCep:0,
  commitRevisions:[1,2,3],
  rollbackOnRevisionConflict:true,
  rollbackOnInvalidRng:true,
  battleStarted:false
},null,2));
