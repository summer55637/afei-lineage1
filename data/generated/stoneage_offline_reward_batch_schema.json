#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { prepareOfflineResume, commitOfflineResume } from '../src/stoneage_offline_resume.mjs';
import { commitOfflineRewardBatch, OFFLINE_REWARD_BATCH_FORMAT } from '../src/stoneage_offline_reward_batch.mjs';
import { parseAndValidateSaveEnvelope } from '../src/stoneage_save_transaction.mjs';

const now=()=> '2026-09-30T22:00:00.000Z';
const state=freshPersistentState({playerId:'v369',now});
state.idle.offline.eligible=true;
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';

const prepared=prepareOfflineResume(state,'2026-09-30T20:00:00Z','2026-09-30T22:00:00Z',{maxSeconds:3600});
assert.equal(prepared.ok,true);
const checkpoint=await commitOfflineResume(state,prepared,{expectedRevision:0,savedAt:now});
assert.equal(checkpoint.ok,true);
assert.equal(checkpoint.state.revision,1);
assert.equal(checkpoint.state.idle.mode,'offline_resume');
assert.equal(checkpoint.state.idle.offline.resumePending,true);
assert.equal(checkpoint.state.idle.offline.accruedSeconds,0);

const batch={batchId:'offline-v369-1',source:'offline-sim:source-backed-battle-results',accruedSeconds:3600,rewardPackets:[
  {transactionId:'offline-battle-1',source:'battle:65',playerExp:20,gold:15,items:[],petCredits:[]},
  {transactionId:'offline-battle-2',source:'battle:65',playerExp:7,gold:5,items:[],petCredits:[]}
]};
const completed=await commitOfflineRewardBatch(checkpoint.state,batch,{expectedRevision:1,savedAt:now});
assert.equal(completed.ok,true);
assert.equal(completed.format,OFFLINE_REWARD_BATCH_FORMAT);
assert.equal(completed.revision,2);
assert.equal(completed.state.player.exp,27);
assert.equal(completed.state.player.gold,20);
assert.equal(completed.state.idle.enabled,true);
assert.equal(completed.state.idle.mode,'moving');
assert.equal(completed.state.idle.offline.resumePending,false);
assert.equal(completed.state.idle.offline.rewardsApplied,true);
assert.equal(completed.state.idle.offline.accruedSeconds,3600);
assert.equal(completed.state.runtimeMeta.offlineRewardBatches['offline-v369-1'].rewardPacketCount,2);
assert.equal(completed.verification.ok,true);
assert.equal(completed.verification.state.revision,2);

const roundTrip=await parseAndValidateSaveEnvelope(completed.envelope,{now});
assert.equal(roundTrip.ok,true);
assert.equal(roundTrip.state.player.exp,27);

const over=await commitOfflineRewardBatch(checkpoint.state,{...batch,batchId:'offline-v369-over',accruedSeconds:3601},{expectedRevision:1,savedAt:now});
assert.equal(over.ok,false);
assert.equal(over.reason,'accrued-seconds-exceed-checkpoint-window');
assert.equal(checkpoint.state.revision,1);

const duplicate=await commitOfflineRewardBatch(completed.state,batch,{expectedRevision:2,savedAt:now});
assert.equal(duplicate.ok,false);
assert.equal(duplicate.reason,'offline-resume-not-pending');

const stale=await commitOfflineRewardBatch(checkpoint.state,{...batch,batchId:'offline-v369-stale'},{expectedRevision:0,savedAt:now});
assert.equal(stale.ok,false);
assert.equal(stale.reason,'revision-conflict');
assert.equal(stale.currentRevision,1);

const invalid=freshPersistentState({playerId:'no-resume',now});
invalid.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
const noResume=await commitOfflineRewardBatch(invalid,batch,{expectedRevision:0,savedAt:now});
assert.equal(noResume.ok,false);
assert.equal(noResume.reason,'offline-resume-not-pending');

console.log(JSON.stringify({pass:true,format:OFFLINE_REWARD_BATCH_FORMAT,sourceBattleResultsAreInputs:true,rewardPacketsApplied:2,revisionAdvancedOnce:true,routeRestored:'moving',rewardCompletionPending:false,rewardsApplied:true,saveRoundTrip:true,staleRevisionFailClosed:true,overAccrualFailClosed:true},null,2));
