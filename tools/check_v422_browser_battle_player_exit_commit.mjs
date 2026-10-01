#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  ACTION_BATTLE_PLAYER_EXIT_COMMIT,
  BROWSER_BATTLE_PLAYER_EXIT_COMMIT_RUNTIME_FORMAT,
  commitBattlePlayerExit
} from '../src/stoneage_browser_battle_player_exit_commit_runtime.mjs';

const state={
  revision:3,
  player:{id:'p1',hp:42,mp:12,maxHp:100,maxMp:20},
  runtimeMeta:{}
};
const plan={
  ok:true,
  handled:true,
  stage:'battle-player-exit-plan-ready',
  format:'stoneage-v422-browser-battle-player-exit-plan-v1',
  action:'BATTLE_PLAYER_EXIT_PLAN',
  settlementComplete:true,
  player:{
    playerId:'p1',
    persistentHpBefore:42,
    persistentMpBefore:12,
    battleHp:0,
    battleMp:7,
    battleIsDie:true,
    hpAfter:1,
    mpAfter:7
  }
};

const done=commitBattlePlayerExit(state,plan,{
  transactionId:'battle-v422-player-1',
  expectedRevision:3,
  now:()=> '2026-10-01T12:00:00+08:00'
});
assert.equal(done.ok,true,JSON.stringify(done));
assert.equal(done.action,ACTION_BATTLE_PLAYER_EXIT_COMMIT);
assert.equal(done.format,BROWSER_BATTLE_PLAYER_EXIT_COMMIT_RUNTIME_FORMAT);
assert.equal(done.applied,true);
assert.equal(done.revisionBefore,3);
assert.equal(done.revisionAfter,4);
assert.equal(done.state.player.hp,1);
assert.equal(done.state.player.mp,7);
assert.equal(state.player.hp,42);
assert.equal(state.player.mp,12);

const retry=commitBattlePlayerExit(done.state,plan,{
  transactionId:'battle-v422-player-1',
  expectedRevision:3
});
assert.equal(retry.ok,true);
assert.equal(retry.idempotent,true);
assert.equal(retry.applied,false);
assert.equal(retry.state.revision,4);

const staleHp=commitBattlePlayerExit(
  {...state,player:{...state.player,hp:43}},
  plan,
  {transactionId:'battle-v422-stale-hp',expectedRevision:3}
);
assert.equal(staleHp.ok,false);
assert.equal(staleHp.reason,'player-hp-stale-plan');

const staleMp=commitBattlePlayerExit(
  {...state,player:{...state.player,mp:13}},
  plan,
  {transactionId:'battle-v422-stale-mp',expectedRevision:3}
);
assert.equal(staleMp.ok,false);
assert.equal(staleMp.reason,'player-mp-stale-plan');

const noSettlement=commitBattlePlayerExit(state,{...plan,settlementComplete:false},{
  transactionId:'battle-v422-no-settlement',
  expectedRevision:3
});
assert.equal(noSettlement.ok,false);
assert.equal(noSettlement.reason,'settlement-complete-flag-required');

console.log('V4.22 Browser Battle player exit commit regression: PASS');
