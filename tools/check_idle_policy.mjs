#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { validateIdlePolicy, sourceHealerRecovery, supplyRequired, deathRecoveryDecision, offlineResumeWindow } from '../src/stoneage_idle_policy.mjs';

const s=freshPersistentState({now:()=> '2026-09-30T03:00:00.000Z'});
s.player.maxHp=100;s.player.hp=40;s.player.maxMp=50;s.player.mp=10;
const healed=sourceHealerRecovery(s);
assert.equal(healed.applied,true);
assert.equal(healed.state.player.hp,100);
assert.equal(healed.state.player.mp,50);
assert.equal(s.player.hp,40);

assert.equal(supplyRequired(s,{}).required,false);
assert.equal(supplyRequired(s,{supply:{hpBelowPercent:50}}).required,true);
assert.equal(supplyRequired(s,{supply:{mpBelowPercent:10}}).required,false);
assert.equal(validateIdlePolicy({offline:{maxSeconds:-1}}).ok,false);

s.player.hp=0;
assert.equal(deathRecoveryDecision(s,{}).action,'stop_idle');
assert.equal(deathRecoveryDecision(s,{death:{recoveryMode:'manual'}}).action,'await_manual_recovery');
assert.equal(deathRecoveryDecision(s,{death:{recoveryMode:'save_point'}},{savePointAvailable:false}).action,'blocked_missing_save_point');
assert.equal(deathRecoveryDecision(s,{death:{recoveryMode:'nearest_healer'}},{healerAvailable:true}).action,'move_to_healer');

assert.deepEqual(offlineResumeWindow('2026-09-30T00:00:00Z','2026-09-30T01:30:00Z'),{ok:true,elapsedSeconds:5400,accruedSeconds:5400,capped:false});
assert.deepEqual(offlineResumeWindow('2026-09-30T00:00:00Z','2026-09-30T01:30:00Z',{maxSeconds:3600}),{ok:true,elapsedSeconds:5400,accruedSeconds:3600,capped:true});

console.log(JSON.stringify({pass:true,format:'stoneage-idle-policy-v1',sourceHealer:'full HP/MP',implicitThresholds:false,offlineRewards:'not simulated'}));
