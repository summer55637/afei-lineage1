#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { freshPersistentState, validatePersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_WORLD_FIRST_ROUTE_EXECUTE,
  ACTION_WORLD_FIRST_ROUTE_PLAN,
  BROWSER_STATE_CONTROLLER_FORMAT,
  BROWSER_WORLD_ROUTE_EXECUTION_RUNTIME_FORMAT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';

const repoRoot=process.cwd();
const read=(root,p)=>fs.readFileSync(path.join(root,p),'utf8');
const readJson=(root,p)=>JSON.parse(read(root,p));
const fixedRoot=process.argv[2] ? path.resolve(process.argv[2]) : path.resolve('/tmp/StoneAge');

const routeCatalog=readJson(repoRoot,'data/generated/stoneage_first_idle_route_catalog.json');
const warpCatalog=readJson(repoRoot,'data/generated/stoneage_start_destination_warp_coordinates.json');
const encounterTargetIndex=readJson(repoRoot,'data/generated/stoneage_start_encounter_target_index.json');
const mapset=readJson(repoRoot,'data/generated/stoneage_mapset_runtime.json');
const maps={
  1000:readJson(repoRoot,'data/generated/stoneage_map_1000.json'),
  100:readJson(repoRoot,'data/generated/stoneage_map_100.json'),
  4000:readJson(repoRoot,'data/generated/stoneage_map_4000.json'),
  200:readJson(repoRoot,'data/generated/stoneage_map_200.json')
};

const fixedMovement=read(repoRoot,'src/stoneage_browser_world_movement_runtime.mjs');
const fixedWarp=read(repoRoot,'src/stoneage_browser_world_warppoint_runtime.mjs');
assert.ok(fixedMovement.includes("commitSave"));
assert.ok(fixedWarp.includes("commitSave"));

const base=freshPersistentState({playerId:'v379-first-route'});
base.world.position={floorId:1000,x:98,y:44};
const controller=createBrowserStateController({
  state:base,
  idleRouteCatalog:routeCatalog,
  warpCatalog,
  encounterTargetIndex,
  worldMovementOptions:{
    loadMap:async floorId=>maps[Number(floorId)]??null,
    loadMapset:async()=>mapset
  },
  worldWarpPointOptions:{
    loadMap:async floorId=>maps[Number(floorId)]??null
  },
  worldFirstRouteOptions:{
    loadMap:async floorId=>maps[Number(floorId)]??null,
    loadMapset:async()=>mapset
  }
});
assert.equal(controller.format,BROWSER_STATE_CONTROLLER_FORMAT);

const result=await controller.dispatch({
  type:ACTION_WORLD_FIRST_ROUTE_EXECUTE,
  routeId:'hometown-0/floor-1000-to-100/1000_to_100_a'
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.handled,true);
assert.equal(result.stage,'first-route-execute');
assert.equal(result.format,BROWSER_WORLD_ROUTE_EXECUTION_RUNTIME_FORMAT);
assert.equal(result.routeId,'hometown-0/floor-1000-to-100/1000_to_100_a');
assert.equal(result.portalId,'1000_to_100_a');
assert.equal(result.executedActionCount,196);
assert.equal(result.executedMoveCount,195);
assert.equal(result.executedWarpPointCount,1);
assert.equal(result.initialRevision,0);
assert.equal(result.finalRevision,196);
assert.deepEqual(result.finalPosition,{floorId:100,x:610,y:538});
assert.equal(result.encounterBoundary.insideUnconditional,true);
assert.equal(result.encounterBoundary.encounterId,65);
assert.equal(result.rngConsumed,false);
assert.equal(result.battleStarted,false);
assert.deepEqual(result.state.world.position,{floorId:100,x:610,y:538});
assert.equal(result.state.revision,196);
assert.equal(validatePersistentState(result.state).length,0);
assert.equal(controller.getState().revision,196);

const repaired=freshPersistentState({playerId:'v379-4000-repaired'});
repaired.world.position={floorId:4000,x:80,y:90};
const repairedController=createBrowserStateController({
  state:repaired,
  idleRouteCatalog:routeCatalog,
  warpCatalog,
  encounterTargetIndex,
  worldMovementOptions:{
    loadMap:async floorId=>maps[Number(floorId)]??null,
    loadMapset:async()=>mapset
  },
  worldWarpPointOptions:{
    loadMap:async floorId=>maps[Number(floorId)]??null
  },
  worldFirstRouteOptions:{
    loadMap:async floorId=>maps[Number(floorId)]??null,
    loadMapset:async()=>mapset
  }
});
const repairPlan=await repairedController.dispatch({
  type:ACTION_WORLD_FIRST_ROUTE_PLAN,
  routeId:'hometown-3/floor-4000-to-200/4000_to_200_a'
});
assert.equal(repairPlan.ok,true,JSON.stringify(repairPlan));
assert.equal(repairPlan.productRepair?.id,'karutarna-4000-road-access-v1');
for(const cell of [{x:91,y:109},{x:92,y:109},{x:93,y:109}])
  assert.ok(repairPlan.path.toPortal.some(point=>point.x===cell.x&&point.y===cell.y),JSON.stringify(cell));
const repairResult=await repairedController.dispatch({
  type:ACTION_WORLD_FIRST_ROUTE_EXECUTE,
  routeId:'hometown-3/floor-4000-to-200/4000_to_200_a'
});
assert.equal(repairResult.ok,true,JSON.stringify(repairResult));
assert.equal(repairResult.handled,true);
assert.equal(repairResult.stage,'first-route-execute');
assert.equal(repairResult.productRepair?.id,'karutarna-4000-road-access-v1');
assert.equal(repairResult.finalPosition.floorId,200);
assert.equal(repairResult.encounterBoundary.insideUnconditional,true);
assert.equal(repairResult.finalRevision,repairResult.executedActionCount);
assert.equal(repairedController.getState().revision,repairResult.finalRevision);
assert.equal(validatePersistentState(repairResult.state).length,0);
assert.deepEqual([maps[4000].tiles[109*150+91],maps[4000].tiles[109*150+92],maps[4000].tiles[109*150+93]],[409,196,307]);

const noRepair=freshPersistentState({playerId:'v379-4000-no-repair'});
noRepair.world.position={floorId:4000,x:80,y:90};
const noRepairController=createBrowserStateController({
  state:noRepair,
  idleRouteCatalog:routeCatalog,
  warpCatalog,
  encounterTargetIndex,
  worldMapRepairOverlay:null,
  worldMovementOptions:{loadMap:async floorId=>maps[Number(floorId)]??null,loadMapset:async()=>mapset},
  worldWarpPointOptions:{loadMap:async floorId=>maps[Number(floorId)]??null},
  worldFirstRouteOptions:{loadMap:async floorId=>maps[Number(floorId)]??null,loadMapset:async()=>mapset}
});
const blockedResult=await noRepairController.dispatch({
  type:ACTION_WORLD_FIRST_ROUTE_EXECUTE,
  routeId:'hometown-3/floor-4000-to-200/4000_to_200_a'
});
assert.equal(blockedResult.ok,false);
assert.equal(blockedResult.reason,'route-product-repair-overlay-not-applied');
assert.equal(noRepairController.getState().revision,0);
assert.deepEqual(noRepairController.getState().world.position,{floorId:4000,x:80,y:90});

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_WORLD_ROUTE_EXECUTION_RUNTIME_FORMAT,
  routeId:result.routeId,
  portalId:result.portalId,
  executedActionCount:result.executedActionCount,
  executedMoveCount:result.executedMoveCount,
  executedWarpPointCount:result.executedWarpPointCount,
  finalRevision:result.finalRevision,
  finalPosition:result.finalPosition,
  encounterBoundary:result.encounterBoundary,
  rngConsumed:result.rngConsumed,
  battleStarted:result.battleStarted,
  repaired4000Route:true,
  repairActionCount:repairResult.executedActionCount,
  repairFinalPosition:repairResult.finalPosition,
  disabledOverlayFailClosed:true
},null,2));
