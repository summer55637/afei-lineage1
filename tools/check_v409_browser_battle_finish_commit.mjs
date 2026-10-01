#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_BATTLE_FINISH_COMMIT,
  BROWSER_BATTLE_FINISH_COMMIT_RUNTIME_FORMAT,
  commitBattleFinish
} from '../src/stoneage_browser_battle_finish_commit_runtime.mjs';
import {
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_DEATH_PLAN,
  ACTION_BATTLE_DEATH_COMMIT,
  ACTION_BATTLE_INITIALIZE,
  ACTION_BATTLE_END_PLAN,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';

const baseContext={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    type:1,
    mode:'battle',
    sourceMode:2,
    finishHookProfile:{
      auditFormat:'stoneage-battle-finish-hook-audit-v1',
      profile:'ordinary-world-encounter',
      winFuncInjected:false,
      pkFuncInjected:false,
      dantai:false,
      linkedBattleCount:0
    },
    turn:0,
    sides:[
      {side:0,type:0,entries:[
        {bid:0,sourceType:'player',hp:100,isDie:false,deadCount:0,battleOutcomeFlags:0,ultimate:0,relife:0},
        null,null,null,null,null,null,null,null,null
      ]},
      {side:1,type:1,entries:[
        {bid:10,sourceType:'enemy',hp:0,isDie:true,deadCount:1,battleOutcomeFlags:1,ultimate:0,relife:0},
        null,null,null,null,null,null,null,null,null
      ]}
    ]
  }
};

const finishPlan={
  ok:true,
  finished:true,
  winnerSide:0,
  finishReason:'enemy-side-empty'
};
const original=structuredClone(baseContext);
let result=commitBattleFinish(baseContext,{finishPlan,settlementStartRevision:0});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.action,ACTION_BATTLE_FINISH_COMMIT);
assert.equal(result.format,BROWSER_BATTLE_FINISH_COMMIT_RUNTIME_FORMAT);
assert.equal(result.previousSourceMode,2);
assert.equal(result.sourceMode,3);
assert.equal(result.winnerSide,0);
assert.equal(result.battleContext.context.mode,'finish');
assert.equal(result.battleContext.context.sourceMode,3);
assert.equal(baseContext.context.mode,'battle');
assert.deepEqual(baseContext,original);

result=commitBattleFinish(result.battleContext,{finishPlan,settlementStartRevision:0});
assert.equal(result.ok,false);
assert.equal(result.reason,'battle-already-finished');

result=commitBattleFinish({...baseContext,context:{...baseContext.context,finishHookProfile:undefined}},{finishPlan,settlementStartRevision:0});
assert.equal(result.ok,false);
assert.equal(result.reason,'finish-hook-profile-required');

result=commitBattleFinish({...baseContext,context:{...baseContext.context,finishHookProfile:{...baseContext.context.finishHookProfile,winFuncInjected:true}}},{finishPlan,settlementStartRevision:0});
assert.equal(result.ok,false);
assert.equal(result.reason,'finish-hook-special-branch-deferred');

result=commitBattleFinish(baseContext,{finishPlan:{ok:true,finished:false,winnerSide:0},settlementStartRevision:0});
assert.equal(result.ok,false);
assert.equal(result.reason,'battle-end-plan-not-finished');

result=commitBattleFinish(baseContext,{finishPlan:{ok:true,finished:true,winnerSide:null},settlementStartRevision:0});
assert.equal(result.ok,false);
assert.equal(result.reason,'winner-side-required');

const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const encounterIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json','utf8'));
const controllerState=freshPersistentState({playerId:'v409-player'});
controllerState.player.name='V409';
controllerState.player.hp=100;
controllerState.player.maxHp=100;
controllerState.player.mp=20;
controllerState.player.maxMp=20;
controllerState.idle.enabled=true;
controllerState.idle.mode='encounter_pending';
controllerState.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
const controller=createBrowserStateController({
  state:controllerState,
  idleRouteCatalog:routeCatalog,
  encounterTargetIndex:encounterIndex,
  now:()=> '2026-10-01T12:00:00.000Z'
});
const build=await controller.dispatch({
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  playerId:'v409-player',
  player:{
    id:'v409-player',
    name:'V409',
    level:1,
    hp:100,
    maxHp:100,
    mp:20,
    maxMp:20,
    luck:0,
    stats:{vital:10,str:10,tgh:10,dex:10}
  },
  enemyTeam:[{enemyId:1,size:1,createMaxNum:1,enemy:{tempNo:1}}],
  encounter:{encounterId:65,floorId:100,x:610,y:538},
  groupId:94,
  battleFieldNo:1
});
assert.equal(build.ok,true,JSON.stringify(build));

const init=await controller.dispatch({type:ACTION_BATTLE_INITIALIZE,fixedLuck:5,surpriseRoll:20});
assert.equal(init.ok,true,JSON.stringify(init));
assert.equal(init.battleContext.sourceMode,2);

const death=await controller.dispatch({
  type:ACTION_BATTLE_DEATH_PLAN,
  targetBid:15,
  hp:0
});
assert.equal(death.ok,true,JSON.stringify(death));

const committedDeath=await controller.dispatch({
  type:ACTION_BATTLE_DEATH_COMMIT,
  targetBid:15,
  deathPlan:death
});
assert.equal(committedDeath.ok,true,JSON.stringify(committedDeath));

const end=await controller.dispatch({type:ACTION_BATTLE_END_PLAN});
assert.equal(end.ok,true,JSON.stringify(end));
assert.equal(end.finished,true);
assert.equal(end.winnerSide,0);

const finish=await controller.dispatch({
  type:ACTION_BATTLE_FINISH_COMMIT,
  finishPlan:end
});
assert.equal(finish.ok,true,JSON.stringify(finish));
assert.equal(finish.battleContext.context.mode,'finish');
assert.equal(finish.battleContext.context.sourceMode,3);
assert.equal(finish.battleContext.context.winnerSide,0);
assert.equal(finish.battleContext.context.finishReason,'enemy-side-empty');

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_BATTLE_FINISH_COMMIT_RUNTIME_FORMAT,
  action:ACTION_BATTLE_FINISH_COMMIT,
  mode:'finish',
  winnerSide:0,
  persistentMutation:false
},null,2));
