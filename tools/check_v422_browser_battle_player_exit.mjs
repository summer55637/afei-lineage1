#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  ACTION_BATTLE_PLAYER_EXIT_PLAN,
  BROWSER_BATTLE_PLAYER_EXIT_RUNTIME_FORMAT,
  planBattlePlayerExit
} from '../src/stoneage_browser_battle_player_exit_runtime.mjs';

const context={
  mode:'finish',
  sourceMode:3,
  sides:[{
    side:0,
    entries:[{
      bid:0,
      sourceType:'player',
      characterId:'p1',
      hp:0,
      maxHp:100,
      mp:7,
      maxMp:20,
      isDie:true
    }]
  }]
};
const state={revision:3,player:{id:'p1',hp:42,mp:12,maxHp:100,maxMp:20}};

const denied=planBattlePlayerExit(context,state,{settlementComplete:false});
assert.equal(denied.ok,false);
assert.equal(denied.reason,'settlement-complete-flag-required');

const plan=planBattlePlayerExit(context,state,{settlementComplete:true});
assert.equal(plan.ok,true,JSON.stringify(plan));
assert.equal(plan.action,ACTION_BATTLE_PLAYER_EXIT_PLAN);
assert.equal(plan.format,BROWSER_BATTLE_PLAYER_EXIT_RUNTIME_FORMAT);
assert.equal(plan.player.playerId,'p1');
assert.equal(plan.player.battleHp,0);
assert.equal(plan.player.battleMp,7);
assert.equal(plan.player.hpAfter,1);
assert.equal(plan.player.mpAfter,7);
assert.equal(plan.persistentStateMutation,false);
assert.equal(plan.rngPreserved,true);

const livePlan=planBattlePlayerExit({
  mode:'finish',
  sourceMode:3,
  sides:[{side:0,entries:[{bid:0,sourceType:'player',characterId:'p1',hp:33,maxHp:100,mp:9,maxMp:20,isDie:false}]}]
},state,{settlementComplete:true});
assert.equal(livePlan.ok,true,JSON.stringify(livePlan));
assert.equal(livePlan.player.hpAfter,33);
assert.equal(livePlan.player.mpAfter,9);

const inconsistent=planBattlePlayerExit({mode:'finish',sourceMode:3,sides:[{side:0,entries:[{bid:0,sourceType:'player',characterId:'p1',hp:0,maxHp:100,mp:9,maxMp:20,isDie:false}]}]},state,{settlementComplete:true});
assert.equal(inconsistent.ok,true,JSON.stringify(inconsistent));
assert.equal(inconsistent.player.hpAfter,0);
assert.equal(inconsistent.player.battleIsDie,false);

console.log('V4.22 Browser Battle player exit plan regression: PASS');
