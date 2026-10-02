#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { freshPersistentState, validatePersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_WORLD_FIRST_ROUTE_PLAN,
  BROWSER_STATE_CONTROLLER_FORMAT,
  BROWSER_WORLD_ROUTE_RUNTIME_FORMAT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';
import { rectContains } from '../src/stoneage_browser_world_first_route_runtime.mjs';

const repoRoot=process.cwd();
const fixedRoot=process.argv[2] ? path.resolve(process.argv[2]) : path.resolve('/tmp/StoneAge');
const read=(root,p)=>fs.readFileSync(path.join(root,p),'utf8');
const readJson=(root,p)=>JSON.parse(read(root,p));
const fixedRef='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

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

const util=read(fixedRoot,'gmsv/src/util.c');
const utilStart=util.indexOf('BOOL PointInRect( RECT* rect, POINT* p )');
const utilEnd=util.indexOf('BOOL CoordinateInRect( RECT* rect, int x, int y)',utilStart);
assert.ok(utilStart>=0&&utilEnd>utilStart);
const pointBody=util.slice(utilStart,utilStart+700);
assert.ok(pointBody.includes('rect->x         <= p->x && p->x <= rect->x + rect->width'));
assert.ok(pointBody.includes('rect->y         <= p->y && p->y <= rect->y + rect->height'));

assert.equal(rectContains([568,538,610,578],568,538),true);
assert.equal(rectContains([568,538,610,578],610,578),true);
assert.equal(rectContains([568,538,610,578],567,538),false);
assert.equal(rectContains([568,538,610,578],611,578),false);

const encount=read(fixedRoot,'gmsv/src/char/encount.c');
const areaStart=encount.indexOf('int ENCOUNT_getEncountAreaArray( int floor, int x, int y)');
assert.ok(areaStart>=0);
const areaBody=encount.slice(areaStart,areaStart+1800);
assert.ok(areaBody.includes('CoordinateInRect'));
const walk=read(fixedRoot,'gmsv/src/char/char_walk.c');
assert.ok(walk.includes('ENCOUNT_getEncountPercentMax( charaindex, of,ox,oy)'));

const base=freshPersistentState({playerId:'v378-first-route'});
base.world.position={floorId:1000,x:98,y:44};
const controller=createBrowserStateController({
  state:base,
  idleRouteCatalog:routeCatalog,
  warpCatalog,
  encounterTargetIndex,
  worldFirstRouteOptions:{
    loadMap:async floorId=>maps[Number(floorId)]??null,
    loadMapset:async()=>mapset
  }
});
assert.equal(controller.format,BROWSER_STATE_CONTROLLER_FORMAT);

const listedBefore=controller.getState();
const planned=await controller.dispatch({
  type:ACTION_WORLD_FIRST_ROUTE_PLAN,
  routeId:'hometown-0/floor-1000-to-100/1000_to_100_a'
});
assert.equal(planned.ok,true,JSON.stringify(planned));
assert.equal(planned.handled,true);
assert.equal(planned.stage,'first-route-plan');
assert.equal(planned.format,BROWSER_WORLD_ROUTE_RUNTIME_FORMAT);
assert.equal(planned.routeId,'hometown-0/floor-1000-to-100/1000_to_100_a');
assert.equal(planned.entryFloor,1000);
assert.equal(planned.encounterFloor,100);
assert.equal(planned.portalId,'1000_to_100_a');
assert.equal(planned.encounter.id,65);
assert.ok(planned.path.toPortalDistance>=120);
assert.ok(planned.path.toEncounterDistance>=71);
assert.ok(planned.path.totalWalkSteps>=191);
assert.equal(routeCatalog.routes[0].variants[0].originPathMin,120);
assert.equal(routeCatalog.routes[0].variants[0].landingPathMin,71);
assert.equal(routeCatalog.routes[0].variants[0].totalWalkBeforeEncounterMin,191);
assert.equal(planned.encounterBoundary.insideUnconditional,true);
assert.equal(planned.encounterBoundary.encounterId,65);
assert.equal(planned.encounterBoundary.rngConsumed,false);
assert.equal(planned.encounterBoundary.battleStarted,false);
assert.equal(planned.actions.length,planned.path.totalWalkSteps+1);
assert.equal(planned.actions.filter(a=>a.type==='WORLD_MOVE_STEP').length,planned.path.totalWalkSteps);
assert.equal(planned.actions.filter(a=>a.type==='WORLD_WARPPOINT_EXECUTE').length,1);

const moveActions=planned.actions.filter(a=>a.type==='WORLD_MOVE_STEP');
const warpAction=planned.actions.find(a=>a.type==='WORLD_WARPPOINT_EXECUTE');
const preWarpMoves=planned.path.toPortalDistance;
assert.deepEqual(moveActions[0].player,{floorId:1000,x:98,y:44});
assert.equal(moveActions[0].expectedRevision,0);
assert.equal(warpAction.expectedRevision,preWarpMoves);
assert.equal(warpAction.portalId,'1000_to_100_a');
assert.deepEqual(warpAction.player,planned.portalFrom);
if(moveActions.length>preWarpMoves)assert.equal(moveActions[preWarpMoves].expectedRevision,preWarpMoves+1);
assert.equal(planned.encounterBoundary.position.floorId,100);
assert.equal(rectContains(planned.encounter.rect,planned.encounterBoundary.position.x,planned.encounterBoundary.position.y),true);

const listedAfter=controller.getState();
assert.equal(listedAfter.revision,listedBefore.revision);
assert.deepEqual(listedAfter.world.position,listedBefore.world.position);
assert.deepEqual(validatePersistentState(listedAfter),[]);

const repaired=freshPersistentState({playerId:'v378-4000-repaired'});
repaired.world.position={floorId:4000,x:80,y:90};
const repairedController=createBrowserStateController({
  state:repaired,
  idleRouteCatalog:routeCatalog,
  warpCatalog,
  encounterTargetIndex,
  worldFirstRouteOptions:{
    loadMap:async floorId=>maps[Number(floorId)]??null,
    loadMapset:async()=>mapset
  }
});
for(const portalId of ['4000_to_200_a','4000_to_200_b']){
  const repairPlan=await repairedController.dispatch({
    type:ACTION_WORLD_FIRST_ROUTE_PLAN,
    routeId:'hometown-3/floor-4000-to-200/'+portalId
  });
  assert.equal(repairPlan.ok,true,JSON.stringify(repairPlan));
  assert.equal(repairPlan.productRepair?.id,'karutarna-4000-road-access-v1');
  assert.equal(repairPlan.encounterBoundary.insideUnconditional,true);
  for(const cell of [{x:91,y:109},{x:92,y:109},{x:93,y:109}])
    assert.ok(repairPlan.path.toPortal.some(point=>point.x===cell.x&&point.y===cell.y),JSON.stringify({portalId,cell}));
}
assert.deepEqual([maps[4000].tiles[109*150+91],maps[4000].tiles[109*150+92],maps[4000].tiles[109*150+93]],[409,196,307]);

const noRepair=freshPersistentState({playerId:'v378-4000-no-repair'});
noRepair.world.position={floorId:4000,x:80,y:90};
const noRepairController=createBrowserStateController({
  state:noRepair,
  idleRouteCatalog:routeCatalog,
  warpCatalog,
  encounterTargetIndex,
  worldMapRepairOverlay:null,
  worldFirstRouteOptions:{
    loadMap:async floorId=>maps[Number(floorId)]??null,
    loadMapset:async()=>mapset
  }
});
const blockedResult=await noRepairController.dispatch({
  type:ACTION_WORLD_FIRST_ROUTE_PLAN,
  routeId:'hometown-3/floor-4000-to-200/4000_to_200_a'
});
assert.equal(blockedResult.ok,false);
assert.equal(blockedResult.reason,'route-product-repair-overlay-not-applied');
assert.equal(noRepairController.getState().revision,0);
assert.deepEqual(noRepairController.getState().world.position,{floorId:4000,x:80,y:90});

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_WORLD_ROUTE_RUNTIME_FORMAT,
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:fixedRef},
  routeId:planned.routeId,
  portalId:planned.portalId,
  portalSourceLine:planned.sourceLine,
  walkSteps:planned.path.totalWalkSteps,
  actionCount:planned.actions.length,
  encounterId:planned.encounter.id,
  encounterBoundary:planned.encounterBoundary,
  readonlyRevision:listedAfter.revision,
  repaired4000Route:true,disabledOverlayFailClosed:true
},null,2));
