#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState, validatePersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_WORLD_ENCOUNTER_PREPARE,
  ACTION_WORLD_ENCOUNTER_ROLL,
  BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';

const readJson=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const targetIndex=readJson('data/generated/stoneage_start_encounter_target_index.json');
const state=freshPersistentState({playerId:'v381-encounter'});
state.world.position={floorId:100,x:610,y:538};
const controller=createBrowserStateController({state,encounterTargetIndex:targetIndex});

const prepare=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_PREPARE,encounterId:65});
assert.equal(prepare.ok,true,JSON.stringify(prepare));
assert.equal(prepare.encounter.probMin,1);
assert.equal(prepare.encounter.probMax,5);

let result=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_ROLL,encounterId:65,cep:0,rng120:0});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.stage,'encounter-roll');
assert.equal(result.format,BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT);
assert.equal(result.outcome,'encounter');
assert.equal(result.rng120,0);
assert.equal(result.cepBefore,0);
assert.equal(result.cepAfter,1);
assert.equal(result.triggered,true);
assert.equal(result.rngConsumed,true);
assert.equal(result.battleStarted,false);
assert.equal(result.state.revision,0);

result=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_ROLL,encounterId:65,cep:1,rng120:1});
assert.equal(result.outcome,'no-encounter');
assert.equal(result.cepAfter,2);

result=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_ROLL,encounterId:65,cep:5,rng120:5});
assert.equal(result.outcome,'no-encounter');
assert.equal(result.cepAfter,5);

result=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_ROLL,encounterId:65,cep:0,rng120:0,warpBlocked:true});
assert.equal(result.outcome,'roll-hit-blocked');
assert.equal(result.triggered,false);
assert.equal(result.cepAfter,1);
assert.equal(result.rngConsumed,true);

result=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_ROLL,encounterId:65,cep:0,noEnemy:true});
assert.equal(result.ok,true);
assert.equal(result.outcome,'skipped');
assert.equal(result.reason,'encounter-disabled-noenemy');
assert.equal(result.rngConsumed,false);
assert.equal(result.cepAfter,1);

result=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_ROLL,encounterId:65,cep:9,battleModeNone:false});
assert.equal(result.ok,true);
assert.equal(result.outcome,'skipped');
assert.equal(result.reason,'battle-mode-not-none');
assert.equal(result.rngConsumed,false);
assert.equal(result.cepAfter,5);

const invalid=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_ROLL,encounterId:65,cep:1,rng120:120});
assert.equal(invalid.ok,false);
assert.equal(invalid.reason,'encounter-rng120-required');
assert.equal(controller.getState().revision,0);
assert.equal(validatePersistentState(controller.getState()).length,0);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT,
  action:ACTION_WORLD_ENCOUNTER_ROLL,
  triggerCondition:'rng120 < clampedCep',
  hitCepReset:1,
  missCepCap:5,
  persistentMutation:false,
  battleStarted:false
},null,2));
