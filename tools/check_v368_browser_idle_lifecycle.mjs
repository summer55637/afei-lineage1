#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { ACTION_IDLE_STATUS, ACTION_IDLE_OFFLINE_RESUME, createBrowserStateController } from '../src/stoneage_browser_state_controller.mjs';
import { OFFLINE_RESUME_FORMAT } from '../src/stoneage_offline_resume.mjs';

const catalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const state=freshPersistentState({playerId:'v368-offline'});
state.idle.offline.eligible=true;
const controller=createBrowserStateController({state,idleRouteCatalog:catalog,now:()=> '2026-09-30T22:00:00.000Z'});

const status=await controller.dispatch({type:ACTION_IDLE_STATUS});
assert.equal(status.ok,true);
assert.equal(status.handled,true);
assert.equal(status.status.persistentRevision,0);
assert.equal(status.status.offline.eligible,true);

const missing=await controller.dispatch({type:ACTION_IDLE_OFFLINE_RESUME});
assert.equal(missing.ok,false);
assert.equal(missing.reason,'offline-resume-times-required');
assert.equal(controller.getState().revision,0);

const invalid=await controller.dispatch({
  type:ACTION_IDLE_OFFLINE_RESUME,
  closedAt:'2026-09-30T09:00:00Z',
  resumedAt:'2026-09-30T08:00:00Z',
  maxSeconds:3600,
  now:()=> '2026-09-30T08:00:00Z'
});
assert.equal(invalid.ok,false);
assert.equal(invalid.reason,'invalid-time-window');
assert.equal(controller.getState().revision,0);

const resumed=await controller.dispatch({
  type:ACTION_IDLE_OFFLINE_RESUME,
  closedAt:'2026-09-30T20:00:00Z',
  resumedAt:'2026-09-30T22:00:00Z',
  maxSeconds:3600,
  expectedRevision:0,
  now:()=> '2026-09-30T22:00:00Z'
});
assert.equal(resumed.ok,true);
assert.equal(resumed.handled,true);
assert.equal(resumed.format,OFFLINE_RESUME_FORMAT);
assert.equal(resumed.offline.elapsedSeconds,7200);
assert.equal(resumed.offline.accruedSeconds,3600);
assert.equal(resumed.rewardCompletionPending,true);
assert.equal(resumed.rewardsSimulated,false);
assert.equal(resumed.state.revision,1);
assert.equal(resumed.state.idle.mode,'offline_resume');
assert.equal(resumed.state.idle.offline.resumePending,true);
assert.equal(resumed.state.idle.offline.rewardsApplied,false);

const status2=await controller.dispatch({type:ACTION_IDLE_STATUS});
assert.equal(status2.status.persistentRevision,1);
assert.equal(status2.status.mode,'offline_resume');

const stale=await controller.dispatch({
  type:ACTION_IDLE_OFFLINE_RESUME,
  closedAt:'2026-09-30T22:00:00Z',
  resumedAt:'2026-09-30T23:00:00Z',
  maxSeconds:3600,
  expectedRevision:0,
  now:()=> '2026-09-30T23:00:00Z'
});
assert.equal(stale.ok,false);
assert.equal(stale.reason,'revision-conflict');
assert.equal(stale.currentRevision,1);
assert.equal(controller.getState().revision,1);

console.log(JSON.stringify({pass:true,format:OFFLINE_RESUME_FORMAT,statusReadOnly:true,checkpointCommitted:true,elapsedSeconds:7200,accruedSeconds:3600,rewardsSimulated:false,rewardCompletionPending:true,verificationRoundTrip:true,revisionConflictFailClosed:true},null,2));
