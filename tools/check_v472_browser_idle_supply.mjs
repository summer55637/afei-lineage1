#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  createBrowserIdleSupplyRuntime,
  ACTION_IDLE_SUPPLY_USE_HEALER
} from '../src/stoneage_browser_idle_supply_runtime.mjs';
import {
  createBrowserStateController,
  BROWSER_IDLE_SUPPLY_RUNTIME_FORMAT
} from '../src/stoneage_browser_state_controller.mjs';
import worldNpcIndex from './fixtures/npc-healer/world-index.json' with { type: 'json' };

const routeCatalog={
  format:'stoneage-first-idle-route-catalog-v1',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'},
  routes:[{
    hometown:0,name:'samugiru',entryFloor:1000,encounterFloor:100,status:'path_closed_battle_policy_pending',
    variants:[{
      portalId:'1000_to_100_a',
      encounterId:65,
      usableLandingCount:4,
      totalLandingCount:4
    }]
  }]
};

const moduleAudit={
  format:'stoneage-world-npc-functionset-audit-v1',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'},
  sourceFunctionSets:['Healer']
};

const state=freshPersistentState({
  now:()=> '2026-10-03T23:20:00+08:00',
  playerId:'v472-supply',
  playerName:'V4.72 Supply'
});
state.player.maxHp=200;
state.player.hp=60;
state.player.maxMp=100;
state.player.mp=10;
state.pets.petBox=[{id:'pet-1',level:1,hp:12,maxHp:60,mp:2,maxMp:30}];
state.idle.enabled=true;
state.idle.mode='supply_check';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';

const idleRuntime={
  ok:true,
  dispatch:async(current,action)=>{
    assert.equal(action.type,'IDLE_EVENT');
    assert.equal(action.event,'supply_done');
    const next=JSON.parse(JSON.stringify(current));
    next.revision=Number(next.revision??0)+1;
    next.idle.mode='moving';
    return {ok:true,handled:true,state:next};
  }
};
const healerRuntime={
  ok:true,
  dispatch:(current,action)=>{
    assert.equal(action.type,'NPC_HEALER_USE');
    const next=JSON.parse(JSON.stringify(current));
    next.revision=Number(next.revision??0)+1;
    next.player.hp=next.player.maxHp;
    next.player.mp=next.player.maxMp;
    for(const pet of next.pets.petBox){pet.hp=pet.maxHp;pet.mp=pet.maxMp;}
    return {ok:true,handled:true,state:next,stage:'healer'};
  }
};

const runtime=createBrowserIdleSupplyRuntime({idleRuntime,healerRuntime});
assert.equal(runtime.ok,true);
const result=await runtime.complete(state,{
  policy:{supply:{hpBelowPercent:80,mpBelowPercent:20}},
  npc:{functionSet:'Healer'},
  player:{floor:1000,x:1,y:1}
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.action,ACTION_IDLE_SUPPLY_USE_HEALER);
assert.equal(result.mode,'healer');
assert.equal(result.policyBefore.required,true);
assert.equal(result.policyAfter.required,false);
assert.equal(result.state.idle.mode,'moving');
assert.equal(result.state.player.hp,200);
assert.equal(result.state.player.mp,100);
assert.equal(result.state.revision,2);

const controllerState=freshPersistentState({now:()=> '2026-10-03T23:20:00+08:00',playerId:'v472-controller'});
controllerState.player.maxHp=120;
controllerState.player.hp=20;
controllerState.player.maxMp=80;
controllerState.player.mp=4;
controllerState.pets.petBox=[{id:'pet-1',level:1,hp:5,maxHp:30,mp:1,maxMp:10}];
controllerState.idle.enabled=true;
controllerState.idle.mode='supply_check';
controllerState.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';

const controller=createBrowserStateController({
  state:controllerState,
  moduleAudit,
  worldNpcIndex,
  idleRouteCatalog:routeCatalog,
  now:()=> '2026-10-03T23:20:05+08:00'
});
const controllerResult=await controller.dispatch({
  type:ACTION_IDLE_SUPPLY_USE_HEALER,
  targetCell:{floor:1000,x:10,y:10},
  serviceFunctionSet:'Healer',
  player:{floor:1000,x:11,y:10},
  policy:{supply:{hpBelowPercent:80,mpBelowPercent:20}}
});
assert.equal(controllerResult.ok,true,JSON.stringify(controllerResult));
assert.equal(controllerResult.format,BROWSER_IDLE_SUPPLY_RUNTIME_FORMAT);
assert.equal(controllerResult.worldNpc.functionSet,'Healer');
assert.equal(controller.getState().idle.mode,'moving');
assert.equal(controller.getState().player.hp,120);
assert.equal(controller.getState().player.mp,80);
assert.equal(controller.getState().pets.petBox[0].hp,30);
assert.equal(controller.getState().revision,2);

const bad=await controller.dispatch({
  type:ACTION_IDLE_SUPPLY_USE_HEALER,
  targetCell:{floor:1000,x:10,y:10},
  serviceFunctionSet:'Healer',
  player:{floor:1000,x:11,y:10}
});
assert.equal(bad.ok,false);
assert.equal(bad.reason,'explicit-supply-policy-required');

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_IDLE_SUPPLY_RUNTIME_FORMAT,
  action:ACTION_IDLE_SUPPLY_USE_HEALER,
  healerBoundary:true,
  playerRecovered:true,
  petRecovered:true,
  idleResumed:'moving',
  revisionAfterController:controller.getState().revision,
  failClosedReason:bad.reason
},null,2));
