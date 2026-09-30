#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState, validatePersistentState } from '../src/stoneage_persistent_state.mjs';
import { IDLE_STATES, IDLE_EVENTS } from '../src/stoneage_idle_loop.mjs';
import { IDLE_PERSISTENT_STATE_RUNTIME_FORMAT, applyIdleEventToPersistentState, commitIdleEvent, persistentIdleProjection } from '../src/stoneage_idle_persistent_state_runtime.mjs';

const t=(iso)=>()=>iso;
let state=freshPersistentState({playerId:'v365-idle'});
assert.equal(IDLE_PERSISTENT_STATE_RUNTIME_FORMAT,'stoneage-idle-persistent-state-runtime-v1');
assert.equal(persistentIdleProjection(state).state,IDLE_STATES.DISABLED);

let result=applyIdleEventToPersistentState(state,IDLE_EVENTS.ENABLE,{routeId:'idle-route-1'},{now:t('2026-09-30T19:00:00.000Z')});
assert.equal(result.ok,true);
assert.equal(result.state.idle.enabled,true);
assert.equal(result.state.idle.mode,IDLE_STATES.MOVING);
assert.equal(result.state.idle.routeId,'idle-route-1');
assert.equal(result.state.idle.lastSimulatedAt,'2026-09-30T19:00:00.000Z');
state=result.state;

result=applyIdleEventToPersistentState(state,IDLE_EVENTS.MOVE_TICK,{encounterTriggered:false},{now:t('2026-09-30T19:01:00.000Z')});
assert.equal(result.state.idle.mode,IDLE_STATES.MOVING);
assert.equal(result.state.idle.lastSimulatedAt,'2026-09-30T19:01:00.000Z');
state=result.state;

result=applyIdleEventToPersistentState(state,IDLE_EVENTS.MOVE_TICK,{encounterTriggered:true,encounter:{floorId:100,encounterId:65}},{now:t('2026-09-30T19:02:00.000Z')});
assert.equal(result.state.idle.mode,IDLE_STATES.ENCOUNTER_PENDING);
state=result.state;

result=applyIdleEventToPersistentState(state,IDLE_EVENTS.ENCOUNTER_ROLLED,{active:true},{now:t('2026-09-30T19:02:01.000Z')});
assert.equal(result.state.idle.mode,IDLE_STATES.IN_BATTLE);
state=result.state;

result=applyIdleEventToPersistentState(state,IDLE_EVENTS.BATTLE_FINISHED,{battle:{resultId:'battle-1'}},{now:t('2026-09-30T19:03:00.000Z')});
assert.equal(result.state.idle.mode,IDLE_STATES.SETTLEMENT);
state=result.state;

result=applyIdleEventToPersistentState(state,IDLE_EVENTS.REWARD_APPLIED,{reward:{exp:12},supplyRequired:true},{now:t('2026-09-30T19:03:01.000Z')});
assert.equal(result.state.idle.mode,IDLE_STATES.SUPPLY_CHECK);
state=result.state;

result=applyIdleEventToPersistentState(state,IDLE_EVENTS.SUPPLY_DONE,{}, {now:t('2026-09-30T19:04:00.000Z')});
assert.equal(result.state.idle.mode,IDLE_STATES.MOVING);
state=result.state;

result=applyIdleEventToPersistentState(state,IDLE_EVENTS.PLAYER_DEAD,{}, {now:t('2026-09-30T19:05:00.000Z')});
assert.equal(result.state.idle.mode,IDLE_STATES.DEAD);
assert.equal(result.state.idle.enabled,false);
state=result.state;

result=applyIdleEventToPersistentState(state,IDLE_EVENTS.ENABLE,{routeId:'idle-route-1'}, {now:t('2026-09-30T19:06:00.000Z')});
assert.equal(result.state.idle.mode,IDLE_STATES.MOVING);
assert.equal(result.state.idle.enabled,true);
state=result.state;

state=freshPersistentState({playerId:'v365-offline'});
result=applyIdleEventToPersistentState(state,IDLE_EVENTS.OFFLINE_RESUME,{}, {now:t('2026-09-30T19:10:00.000Z')});
assert.equal(result.ok,true);
assert.equal(result.state.idle.mode,IDLE_STATES.OFFLINE_RESUME);
assert.equal(result.state.idle.enabled,false);
assert.equal(result.state.idle.offline.resumePending,true);
assert.equal(result.state.idle.offline.lastResumedAt,'2026-09-30T19:10:00.000Z');

result=applyIdleEventToPersistentState(result.state,IDLE_EVENTS.SAVE_COMMITTED,{}, {now:t('2026-09-30T19:11:00.000Z')});
assert.equal(result.state.idle.mode,IDLE_STATES.MOVING);
assert.equal(result.state.idle.enabled,true);
assert.equal(result.state.idle.offline.resumePending,false);

const invalidState=freshPersistentState({playerId:'v365-invalid'});
invalidState.player.level=0;
const denied=applyIdleEventToPersistentState(invalidState,IDLE_EVENTS.ENABLE,{routeId:'x'});
assert.equal(denied.ok,false);
assert.equal(denied.reason,'persistent-state-invalid');
assert.equal(denied.state.player.level,0);

const deniedRoute=applyIdleEventToPersistentState(freshPersistentState(),IDLE_EVENTS.ENABLE,{});
assert.equal(deniedRoute.ok,false);
assert.equal(deniedRoute.reason,'route_required');
assert.equal(deniedRoute.idle.state,IDLE_STATES.DISABLED);

const deniedTransition=applyIdleEventToPersistentState(freshPersistentState(),IDLE_EVENTS.BATTLE_FINISHED,{});
assert.equal(deniedTransition.ok,false);
assert.equal(deniedTransition.reason,'no_transition');

const commitBase=freshPersistentState({playerId:'v365-save'});
const committed=await commitIdleEvent(commitBase,IDLE_EVENTS.ENABLE,{routeId:'idle-route-save'},{now:t('2026-09-30T19:20:00.000Z'),expectedRevision:0});
assert.equal(committed.ok,true);
assert.equal(committed.revision,1);
assert.equal(committed.state.idle.mode,IDLE_STATES.MOVING);
assert.equal(committed.state.idle.routeId,'idle-route-save');
assert.equal(committed.envelope.schemaVersion,1);
assert.equal(committed.verification.ok,true);
assert.deepEqual(validatePersistentState(committed.state),[]);

const conflict=await commitIdleEvent(committed.state,IDLE_EVENTS.MOVE_TICK,{encounterTriggered:false},{now:t('2026-09-30T19:21:00.000Z'),expectedRevision:0});
assert.equal(conflict.ok,false);
assert.equal(conflict.reason,'revision-conflict');
assert.equal(conflict.currentRevision,1);

console.log(JSON.stringify({
  pass:true,
  format:IDLE_PERSISTENT_STATE_RUNTIME_FORMAT,
  persistentFields:['idle.enabled','idle.mode','idle.routeId','idle.lastSimulatedAt','idle.offline'],
  transitionCoverage:['enable','move_tick','encounter_pending','in_battle','settlement','supply_check','dead','offline_resume'],
  saveEnvelopeRoundTrip:true,
  revisionConflictFailClosed:true,
  battleResultRecomputed:false
},null,2));
