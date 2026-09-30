#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState, validatePersistentState } from '../src/stoneage_persistent_state.mjs';
import { ACTION_IDLE_LIST_ROUTES, ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER, createBrowserStateController } from '../src/stoneage_browser_state_controller.mjs';
import { BROWSER_IDLE_RUNTIME_FORMAT } from '../src/stoneage_browser_idle_runtime.mjs';

const catalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const base=freshPersistentState({playerId:'v367-first-encounter'});
base.player.maxHp=100;base.player.hp=100;base.player.maxMp=50;base.player.mp=50;

const controller=createBrowserStateController({state:base,idleRouteCatalog:catalog});

const listed=await controller.dispatch({type:ACTION_IDLE_LIST_ROUTES});
assert.equal(listed.ok,true);
assert.equal(listed.routes.length,6);
assert.equal(listed.routes.every(r=>r.eligible),true);
const routeId=listed.routes.find(r=>r.hometown===0&&r.portalId==='1000_to_100_a').routeId;

const missing=await controller.dispatch({type:ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER,routeId});
assert.equal(missing.ok,false);
assert.equal(missing.stage,'idle-simulation');
assert.equal(missing.reason,'battle-result-missing');
assert.equal(controller.getState().revision,0);

const victory=await controller.dispatch({
  type:ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER,
  routeId,
  encounter:{floorId:100,encounterId:65},
  sourceBattleResult:{
    battleIndex:65,winside:0,finished:true,
    player:{hp:80,mp:45},
    reward:{transactionId:'v367-win-1',source:'battle:65',playerExp:20,gold:15,items:[],petCredits:[]}
  },
  now:()=> '2026-09-30T21:00:00.000Z'
});
assert.equal(victory.ok,true);
assert.equal(victory.handled,true);
assert.equal(victory.stage,'idle-simulation');
assert.equal(victory.simulation.idleState.state,'moving');
assert.equal(victory.simulation.routeId,routeId);
assert.equal(victory.state.revision,1);
assert.equal(victory.state.player.hp,80);
assert.equal(victory.state.player.exp,20);
assert.equal(victory.state.player.gold,15);
assert.equal(victory.state.idle.routeId,routeId);
assert.deepEqual(validatePersistentState(victory.state),[]);

const defeat=await controller.dispatch({
  type:ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER,
  routeId,
  sourceBattleResult:{
    battleIndex:66,winside:1,finished:true,
    player:{hp:0,mp:0}
  },
  policy:{death:{recoveryMode:'manual'}},
  now:()=> '2026-09-30T21:30:00.000Z'
});
assert.equal(defeat.ok,true);
assert.equal(defeat.handled,true);
assert.equal(defeat.simulation.dead,true);
assert.equal(defeat.state.idle.mode,'dead');
assert.equal(defeat.simulation.death.action,'await_manual_recovery');
assert.equal(defeat.state.revision,2);

const blocked=await controller.dispatch({
  type:ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER,
  routeId:'hometown-3/floor-4000-to-200/4000_to_200_a',
  sourceBattleResult:{battleIndex:1,winside:0,finished:true,player:{hp:1,mp:1}}
});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'idle-route-not-eligible');
assert.equal(controller.getState().revision,2);

const stale=await controller.dispatch({
  type:ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER,
  routeId,
  expectedRevision:0,
  sourceBattleResult:{battleIndex:1,winside:0,finished:true,player:{hp:1,mp:1}}
});
assert.equal(stale.ok,false);
assert.equal(stale.reason,'revision-conflict');
assert.equal(stale.currentRevision,2);
assert.equal(controller.getState().revision,2);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_IDLE_RUNTIME_FORMAT,
  usableRoutes:listed.routes.length,
  sourceBattleInjected:true,
  noSyntheticBattleResult:true,
  existingRewardTransactionUsed:true,
  deathPolicyConsumed:true,
  blocked4000:true,
  revisionConflictFailClosed:true
},null,2));
