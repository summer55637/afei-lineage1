import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { planDuelPoint } from '../src/stoneage_browser_battle_duelpoint_runtime.mjs';
import {
  ACTION_BATTLE_DUELPOINT_COMMIT,
  BROWSER_BATTLE_DUELPOINT_COMMIT_RUNTIME_FORMAT,
  commitDuelPoint
} from '../src/stoneage_browser_battle_duelpoint_commit_runtime.mjs';

const battleContext={
  context:{
    sides:[
      {side:0,type:0,entries:Array.from({length:10},(_,num)=>num===0?{bid:0,sourceType:'player',characterId:'p1',duelPoint:120,workGetExp:30}:{bid:num,sourceType:'player',duelPoint:0,workGetExp:0})},
      {side:1,type:1,entries:Array(10).fill(null)}
    ]
  }
};
const now=()=> '2026-10-01T10:12:00+08:00';
const state=freshPersistentState({now,playerId:'p1',playerName:'Tester'});
state.player.duelPoint=120;
state.revision=4;

const plan=planDuelPoint(battleContext,{side:0,num:0,duelPoint:120,workGetExp:30});
assert.equal(plan.ok,true);

const committed=commitDuelPoint(state,battleContext,plan,{transactionId:'battle-v412-1',expectedRevision:4,now});
assert.equal(committed.ok,true);
assert.equal(committed.stage,'battle-duelpoint-commit-applied');
assert.equal(committed.format,BROWSER_BATTLE_DUELPOINT_COMMIT_RUNTIME_FORMAT);
assert.equal(committed.action,ACTION_BATTLE_DUELPOINT_COMMIT);
assert.equal(committed.applied,true);
assert.equal(committed.state.player.duelPoint,150);
assert.equal(committed.state.revision,5);
assert.equal(committed.state.player.gold,0);

const retry=commitDuelPoint(committed.state,battleContext,plan,{transactionId:'battle-v412-1',expectedRevision:5,now});
const retryOldRevision=commitDuelPoint(committed.state,battleContext,plan,{transactionId:'battle-v412-1',expectedRevision:4,now});
assert.equal(retryOldRevision.ok,true);
assert.equal(retryOldRevision.idempotent,true);
assert.equal(retryOldRevision.state.player.duelPoint,150);
assert.equal(retryOldRevision.state.revision,5);
assert.equal(retry.ok,true);
assert.equal(retry.idempotent,true);
assert.equal(retry.applied,false);
assert.equal(retry.state.player.duelPoint,150);
assert.equal(retry.state.revision,5);

const stale=commitDuelPoint(
  {...committed.state,runtimeMeta:{...committed.state.runtimeMeta,battleDuelPointTransactions:{}}},
  battleContext,
  {...plan,currentDuelPoint:120,nextDuelPoint:150},
  {transactionId:'battle-v412-stale',expectedRevision:5,now}
);
assert.equal(stale.ok,false);
assert.equal(stale.reason,'duelpoint-stale-plan');

const mismatch=commitDuelPoint(
  state,battleContext,plan,{transactionId:'battle-v412-mismatch',expectedRevision:4,now}
);
assert.equal(mismatch.ok,true);

const cappedState=freshPersistentState({now});
cappedState.player.duelPoint=99999990;
const cappedPlan=planDuelPoint(battleContext,{side:0,num:0,duelPoint:99999990,workGetExp:50});
assert.equal(cappedPlan.nextDuelPoint,100000000);
const capped=commitDuelPoint(cappedState,battleContext,cappedPlan,{transactionId:'battle-v412-cap',now});
assert.equal(capped.ok,true);
assert.equal(capped.state.player.duelPoint,100000000);

console.log('V4.12 DuelPoint commit regression: PASS');
