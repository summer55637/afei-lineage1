#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { createBrowserWorldMovementRuntime } from '../src/stoneage_browser_world_movement_runtime.mjs';
import { createBrowserIdleSupplyRouteRuntime } from '../src/stoneage_browser_idle_supply_route_runtime.mjs';
import {
  createBrowserIdleSupplyRouteExecutionRuntime,
  BROWSER_IDLE_SUPPLY_ROUTE_EXECUTION_RUNTIME_FORMAT,
  ACTION_IDLE_SUPPLY_RETURN_EXECUTE
} from '../src/stoneage_browser_idle_supply_route_execution_runtime.mjs';
import {
  createBrowserWindowHealerRuntime,
  ACTION_NPC_WINDOW_HEALER_USE
} from '../src/stoneage_browser_window_healer_runtime.mjs';

const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const warpCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_idle_supply_warp_catalog.json','utf8'));
const recoveryCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_recovery_service_source_catalog.json','utf8'));
const mapset=JSON.parse(fs.readFileSync('data/generated/stoneage_mapset_runtime.json','utf8'));

async function loadMap(floorId){
  return JSON.parse(fs.readFileSync(`data/generated/stoneage_map_${Number(floorId)}.json`,'utf8'));
}
async function loadMapset(){return mapset;}

const state=freshPersistentState({
  now:()=> '2026-10-04T00:20:00+08:00',
  playerId:'v478-route',
  playerName:'V4.78 Route'
});
state.player.hp=80;
state.player.maxHp=200;
state.player.mp=40;
state.player.maxMp=100;
state.player.gold=30000;
state.player.level=1;
state.idle.enabled=true;
state.idle.mode='supply_check';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
state.world.position={floorId:100,x:610,y:538};

const movementRuntime=createBrowserWorldMovementRuntime({loadMap,loadMapset});
assert.equal(movementRuntime.ok,true,JSON.stringify(movementRuntime));

const planner=createBrowserIdleSupplyRouteRuntime({
  routeCatalog,
  supplyWarpCatalog:warpCatalog,
  recoveryServiceCatalog:recoveryCatalog,
  loadMap,
  loadMapset
});
assert.equal(planner.ok,true,JSON.stringify(planner));

const plan=await planner.plan(state);
assert.equal(plan.ok,true,JSON.stringify(plan));
assert.equal(plan.routeId,state.idle.routeId);
assert.equal(plan.hospitalFloor,1005);
assert.deepEqual(plan.nurse.exactPoint??{x:plan.nurse.x,y:plan.nurse.y},{x:17,y:13});

const executor=createBrowserIdleSupplyRouteExecutionRuntime({
  movementRuntime,
  loadMap
});
assert.equal(executor.ok,true,JSON.stringify(executor));

const initialRevision=state.revision;
const executed=await executor.execute(state,plan,{
  supplyWarpCatalog:warpCatalog,
  transactionPrefix:'v478',
  now:()=> '2026-10-04T00:20:01+08:00'
});
assert.equal(executed.ok,true,JSON.stringify(executed));
assert.equal(executed.handled,true);
assert.equal(executed.format,BROWSER_IDLE_SUPPLY_ROUTE_EXECUTION_RUNTIME_FORMAT);
assert.equal(executed.action,ACTION_IDLE_SUPPLY_RETURN_EXECUTE);
assert.equal(executed.persistentMutation,true);
assert.equal(executed.rngGeneratedInternally,false);
assert.equal(executed.state.idle.mode,'supply_check');
assert.deepEqual(executed.finalPosition,{floorId:1005,x:17,y:15});
assert.deepEqual(executed.healerPoint,{floorId:1005,x:17,y:13});
assert.equal(executed.interactionDistance,2);
assert.equal(executed.executedSegments.length,3);
assert.equal(executed.executedSegments[0].portalExecuted,true);
assert.equal(executed.executedSegments[1].portalExecuted,true);
assert.equal(executed.executedSegments[2].portalExecuted,false);
assert.ok(executed.state.revision>initialRevision);

const healerRuntime=createBrowserWindowHealerRuntime();
const nurseRow=recoveryCatalog.instances.find(row=>row.service==='windowhealer'&&Number(row.floorId)===1005&&row.exactPoint);
assert.ok(nurseRow);
const npc={
  floor:1005,
  npc:[Number(nurseRow.exactPoint.x),Number(nurseRow.exactPoint.y)],
  functionSet:'WindowHealer',
  sourceEnemy:{raw:nurseRow.enemyRaw},
  services:[{functionSet:'WindowHealer',sourceStatus:'known'}]
};
const healed=healerRuntime.dispatch(executed.state,{
  type:ACTION_NPC_WINDOW_HEALER_USE,
  npc,
  player:executed.finalPosition,
  confirm:true,
  now:()=> '2026-10-04T00:20:02+08:00'
});
assert.equal(healed.ok,true,JSON.stringify(healed));
assert.equal(healed.state.player.hp,healed.state.player.maxHp);
assert.equal(healed.state.player.mp,healed.state.player.maxMp);
assert.equal(healed.state.idle.mode,'supply_check');

const controllerState=freshPersistentState({
  now:()=> '2026-10-04T00:20:10+08:00',
  playerId:'v478-controller',
  playerName:'V4.78 Controller'
});
controllerState.player.hp=80;
controllerState.player.maxHp=200;
controllerState.player.mp=40;
controllerState.player.maxMp=100;
controllerState.player.gold=30000;
controllerState.player.level=1;
controllerState.idle.enabled=true;
controllerState.idle.mode='supply_check';
controllerState.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
controllerState.world.position={floorId:100,x:610,y:538};

const { createBrowserStateController }=await import('../src/stoneage_browser_state_controller.mjs');
const controller=createBrowserStateController({
  state:controllerState,
  idleRouteCatalog:routeCatalog,
  idleSupplyWarpCatalog:warpCatalog,
  recoveryServiceCatalog:recoveryCatalog,
  worldMovementOptions:{loadMap,loadMapset},
  now:()=> '2026-10-04T00:20:11+08:00'
});
const controllerResult=await controller.dispatch({
  type:ACTION_IDLE_SUPPLY_RETURN_EXECUTE,
  transactionPrefix:'v478-controller'
});
assert.equal(controllerResult.ok,true,JSON.stringify(controllerResult));
assert.equal(controllerResult.handled,true);
assert.equal(controllerResult.action,ACTION_IDLE_SUPPLY_RETURN_EXECUTE);
assert.equal(controllerResult.state.idle.mode,'supply_check');
assert.deepEqual(controllerResult.state.world.position,{floorId:1005,x:17,y:15});
assert.equal(controllerResult.plan.routeId,controllerState.idle.routeId);
assert.equal(controller.getState().revision,controllerResult.state.revision);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_IDLE_SUPPLY_ROUTE_EXECUTION_RUNTIME_FORMAT,
  action:ACTION_IDLE_SUPPLY_RETURN_EXECUTE,
  routeId:plan.routeId,
  executedSegments:executed.executedSegments.map(x=>({
    segment:x.segmentName,
    moveSteps:x.moveSteps,
    portalExecuted:x.portalExecuted,
    finalPosition:x.finalPosition
  })),
  finalInteraction:executed.finalPosition,
  healerDistance:executed.interactionDistance,
  supplyStatePreserved:'supply_check',
  healerRecoveryVerified:true,
  rngGeneratedInternally:executed.rngGeneratedInternally
},null,2));
