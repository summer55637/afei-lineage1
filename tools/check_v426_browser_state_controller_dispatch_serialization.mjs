#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState, validatePersistentState } from '../src/stoneage_persistent_state.mjs';
import { ACTION_WORLD_ENCOUNTER_ROLL_IDLE_COMMIT, createBrowserStateController } from '../src/stoneage_browser_state_controller.mjs';
import fs from 'node:fs';

const targetIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json','utf8'));

function movingState(playerId){
  const state=freshPersistentState({playerId});
  state.world.position={floorId:100,x:610,y:538};
  state.idle.enabled=true;
  state.idle.mode='moving';
  state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
  assert.equal(validatePersistentState(state).length,0);
  return state;
}

{
  const controller=createBrowserStateController({state:movingState('v426-concurrent'),encounterTargetIndex:targetIndex});
  const action={type:ACTION_WORLD_ENCOUNTER_ROLL_IDLE_COMMIT,encounterId:65,rng120:0,expectedRevision:0,now:'2026-10-01T06:00:00.000Z'};
  const first=controller.dispatch(action);
  const second=controller.dispatch(action);
  const [a,b]=await Promise.all([first,second]);
  assert.equal(a.ok,true,JSON.stringify(a));
  assert.equal(a.state.revision,1);
  assert.equal(a.state.idle.mode,'encounter_pending');
  assert.equal(b.ok,false,JSON.stringify(b));
  assert.equal(b.reason,'idle-state-not-moving');
  assert.equal(controller.getState().revision,1);
  assert.equal(controller.getState().idle.mode,'encounter_pending');
}

{
  const controller=createBrowserStateController({state:movingState('v426-stale'),encounterTargetIndex:targetIndex});
  const first=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_ROLL_IDLE_COMMIT,encounterId:65,rng120:50,expectedRevision:0,now:'2026-10-01T06:00:01.000Z'});
  assert.equal(first.ok,true,JSON.stringify(first));
  assert.equal(first.state.revision,1);
  assert.equal(first.state.idle.mode,'moving');
  const stale=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_ROLL_IDLE_COMMIT,encounterId:65,rng120:50,expectedRevision:0,now:'2026-10-01T06:00:02.000Z'});
  assert.equal(stale.ok,false,JSON.stringify(stale));
  assert.equal(stale.reason,'revision-conflict');
  assert.equal(stale.currentRevision,1);
  assert.equal(controller.getState().revision,1);
  assert.equal(controller.getState().world.encounter.cep,2);
}

console.log(JSON.stringify({pass:true,contract:'controller-dispatch-serialization',concurrentDuplicate:'second action observes first committed state',staleRevision:'revision-conflict',finalRevision:1},null,2));