#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { prepareOfflineResume, commitOfflineResume, markOfflineRewardsApplied, OFFLINE_RESUME_FORMAT } from '../src/stoneage_offline_resume.mjs';

const state=freshPersistentState({now:()=> '2026-09-30T07:00:00.000Z',playerId:'p1'});
state.idle.offline.eligible=true;
const prepared=prepareOfflineResume(state,'2026-09-30T07:00:00Z','2026-09-30T09:00:00Z',{maxSeconds:3600});
assert.equal(prepared.ok,true);
assert.equal(prepared.format,OFFLINE_RESUME_FORMAT);
assert.equal(prepared.window.elapsedSeconds,7200);
assert.equal(prepared.window.accruedSeconds,3600);
assert.equal(prepared.state.idle.mode,'offline_resume');
assert.equal(prepared.state.idle.offline.resumePending,true);
assert.equal(prepared.state.idle.offline.accruedSeconds,0);
assert.equal(prepared.state.idle.offline.rewardsApplied,false);

const committed=await commitOfflineResume(state,prepared,{expectedRevision:0,savedAt:()=> '2026-09-30T09:00:00Z'});
assert.equal(committed.ok,true);
assert.equal(committed.state.revision,1);
assert.equal(committed.save.envelope.source,'offline-resume');

const completed=markOfflineRewardsApplied(committed.state,{accruedSeconds:3600});
assert.equal(completed.ok,true);
assert.equal(completed.state.idle.offline.accruedSeconds,3600);
assert.equal(completed.state.idle.offline.resumePending,false);
assert.equal(completed.state.idle.offline.rewardsApplied,true);

const ineligible=freshPersistentState();
assert.equal(prepareOfflineResume(ineligible,'2026-09-30T07:00:00Z','2026-09-30T08:00:00Z',{maxSeconds:3600}).reason,'offline-not-eligible');

console.log(JSON.stringify({pass:true,format:OFFLINE_RESUME_FORMAT,rewardsGenerated:false,revisionGuard:true,defaultAccruedSeconds:0}));
