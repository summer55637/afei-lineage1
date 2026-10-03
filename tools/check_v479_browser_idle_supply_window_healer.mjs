#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,
  BROWSER_IDLE_SUPPLY_WINDOW_HEALER_RUNTIME_FORMAT
} from '../src/stoneage_browser_idle_supply_window_healer_runtime.mjs';
import { createBrowserStateController } from '../src/stoneage_browser_state_controller.mjs';

const worldNpcIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_world_npc_index.json','utf8'));
const moduleAudit=JSON.parse(fs.readFileSync('data/generated/stoneage_world_npc_functionset_audit.json','utf8'));

const routeCatalog={
  format:'stoneage-first-idle-route-catalog-v1',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'},
  routes:[{
    hometown:0,name:'samugiru',entryFloor:1000,encounterFloor:100,status:'path_closed_battle_policy_pending',
    variants:[{portalId:'1000_to_100_a',encounterId:65,usableLandingCount:4,totalLandingCount:4}]
  }]
};

const state=freshPersistentState({
  now:()=> '2026-10-04T00:50:00+08:00',
  playerId:'v479-window',
  playerName:'V4.79 WindowHealer'
});
state.player.level=1;
state.player.hp=40;
state.player.maxHp=120;
state.player.mp=5;
state.player.maxMp=80;
state.player.gold=0;
state.pets.petBox=[{id:'pet-1',level:1,hp:5,maxHp:30,mp:1,maxMp:10,dead:true}];
state.idle.enabled=true;
state.idle.mode='supply_check';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
state.world.position={floorId:1005,x:17,y:15};

const controller=createBrowserStateController({
  state,
  moduleAudit,
  worldNpcIndex,
  idleRouteCatalog:routeCatalog,
  now:()=> '2026-10-04T00:50:01+08:00'
});

const result=await controller.dispatch({
  type:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,
  targetCell:{floor:1005,x:17,y:13},
  serviceFunctionSet:'WindowHealer',
  player:{floor:1005,x:17,y:15},
  policy:{supply:{hpBelowPercent:80,mpBelowPercent:20}},
  confirm:true
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.handled,true);
assert.equal(result.format,BROWSER_IDLE_SUPPLY_WINDOW_HEALER_RUNTIME_FORMAT);
assert.equal(result.action,ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER);
assert.equal(result.mode,'window-healer');
assert.equal(result.policyBefore.required,true);
assert.equal(result.policyAfter.required,false);
assert.equal(result.healer.cost.totalCost,0);
assert.equal(result.healer.state.player.hp,120);
assert.equal(result.healer.state.player.mp,80);
assert.equal(result.healer.state.pets.petBox[0].hp,30);
assert.equal(result.healer.state.pets.petBox[0].mp,10);
assert.equal(result.healer.state.pets.petBox[0].dead,false);
assert.equal(result.state.idle.mode,'moving');
assert.equal(controller.getState().idle.mode,'moving');
assert.equal(controller.getState().revision,2);

const stateNoNeed=freshPersistentState({now:()=> '2026-10-04T00:50:05+08:00',playerId:'v479-no-need'});
stateNoNeed.player.hp=120;
stateNoNeed.player.maxHp=120;
stateNoNeed.player.mp=80;
stateNoNeed.player.maxMp=80;
stateNoNeed.idle.enabled=true;
stateNoNeed.idle.mode='supply_check';
stateNoNeed.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
stateNoNeed.world.position={floorId:1005,x:17,y:15};
const noNeedController=createBrowserStateController({
  state:stateNoNeed,
  moduleAudit,
  worldNpcIndex,
  idleRouteCatalog:routeCatalog,
  now:()=> '2026-10-04T00:50:06+08:00'
});
const noNeed=await noNeedController.dispatch({
  type:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,
  targetCell:{floor:1005,x:17,y:13},
  serviceFunctionSet:'WindowHealer',
  player:{floor:1005,x:17,y:15},
  policy:{supply:{hpBelowPercent:80,mpBelowPercent:20}},
  confirm:true
});
assert.equal(noNeed.ok,true,JSON.stringify(noNeed));
assert.equal(noNeed.mode,'no-healer-needed');
assert.equal(noNeed.state.idle.mode,'moving');
assert.equal(noNeedController.getState().revision,1);

const badState=freshPersistentState({now:()=> '2026-10-04T00:50:07+08:00',playerId:'v479-bad-policy'});
badState.player.hp=50;
badState.player.maxHp=120;
badState.player.mp=10;
badState.player.maxMp=80;
badState.idle.enabled=true;
badState.idle.mode='supply_check';
badState.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
badState.world.position={floorId:1005,x:17,y:15};
const badController=createBrowserStateController({
  state:badState,
  moduleAudit,
  worldNpcIndex,
  idleRouteCatalog:routeCatalog,
  now:()=> '2026-10-04T00:50:08+08:00'
});
const bad=await badController.dispatch({
  type:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,
  targetCell:{floor:1005,x:17,y:13},
  serviceFunctionSet:'WindowHealer',
  player:{floor:1005,x:17,y:15},
  confirm:true
});
assert.equal(bad.ok,false);
assert.equal(bad.reason,'explicit-supply-policy-required');

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_IDLE_SUPPLY_WINDOW_HEALER_RUNTIME_FORMAT,
  action:ACTION_IDLE_SUPPLY_USE_WINDOW_HEALER,
  sourceHospital:{floor:1005,nurse:[17,13],interaction:[17,15]},
  healerCompleted:true,
  supplyDoneCompleted:true,
  finalIdleMode:result.state.idle.mode,
  revisionAfterHealerFlow:result.state.revision,
  noHealerNeededBoundary:true,
  failClosedReason:bad.reason
},null,2));
