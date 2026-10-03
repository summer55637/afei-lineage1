#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  createBrowserIdleSupplyRouteRuntime,
  BROWSER_IDLE_SUPPLY_ROUTE_RUNTIME_FORMAT
} from '../src/stoneage_browser_idle_supply_route_runtime.mjs';
import { sourceMapWalkableAt } from '../src/stoneage_map_runtime.mjs';

const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const warpCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_idle_supply_warp_catalog.json','utf8'));
const recoveryCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_recovery_service_source_catalog.json','utf8'));
const mapset=JSON.parse(fs.readFileSync('data/generated/stoneage_mapset_runtime.json','utf8'));

const mapCache=new Map();
async function loadMap(floorId){
  const id=Number(floorId);
  if(mapCache.has(id))return mapCache.get(id);
  const map=JSON.parse(fs.readFileSync(`data/generated/stoneage_map_${id}.json`,'utf8'));
  mapCache.set(id,map);
  return map;
}
async function loadMapset(){return mapset;}

const routes=[
  {routeId:'hometown-0/floor-1000-to-100/1000_to_100_a',encounterFloor:100,rect:[568,538,610,578]},
  {routeId:'hometown-1/floor-2000-to-100/2000_to_100_a',encounterFloor:100,rect:[568,538,610,578]},
  {routeId:'hometown-2/floor-3000-to-200/3000_to_200_a',encounterFloor:200,rect:[384,238,516,415]},
  {routeId:'hometown-3/floor-4000-to-200/4000_to_200_a',encounterFloor:200,rect:[384,238,516,415]}
];

function findWalkablePoint(map,rect){
  const [x1,y1,x2,y2]=rect;
  for(let y=y1;y<=y2;y++){
    for(let x=x1;x<=x2;x++){
      if(sourceMapWalkableAt(map,x,y,mapset))return {x,y,floorId:Number(map.floorId)};
    }
  }
  return null;
}

const routePoints={};
for(const row of routes){
  const map=await loadMap(row.encounterFloor);
  const point=findWalkablePoint(map,row.rect);
  assert.ok(point,`no walkable encounter point for ${row.routeId}`);
  routePoints[row.routeId]=point;
}

const runtime=createBrowserIdleSupplyRouteRuntime({
  routeCatalog,
  supplyWarpCatalog:warpCatalog,
  recoveryServiceCatalog:recoveryCatalog,
  loadMap,
  loadMapset
});
assert.equal(runtime.ok,true,JSON.stringify(runtime));

const planned=[];
for(const row of routes){
  const point=routePoints[row.routeId];
  const state={
    schemaVersion:1,
    revision:0,
    idle:{
      enabled:true,
      mode:'supply_check',
      routeId:row.routeId
    },
    world:{position:point},
    player:{id:'v477-route'},
    pets:{}
  };
  const result=await runtime.plan(state,{routeId:row.routeId});
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.handled,true);
  assert.equal(result.format,BROWSER_IDLE_SUPPLY_ROUTE_RUNTIME_FORMAT);
  assert.equal(result.persistentMutation,false);
  assert.equal(result.rngGeneratedInternally,false);
  assert.equal(result.encounterFloor,row.encounterFloor);
  assert.equal(result.hospitalFloor,result.entryFloor+5);
  assert.ok(result.segments.encounterToTown.moveDistance>=0);
  assert.ok(result.segments.townToHospital.moveDistance>=0);
  assert.ok(result.segments.hospitalToHealer.moveDistance>=0);
  assert.ok(result.segments.hospitalToHealer.healerRange>=1);
  assert.ok(Math.abs(result.segments.hospitalToHealer.interactionPosition.x-result.segments.hospitalToHealer.healerPoint.x)
    +Math.abs(result.segments.hospitalToHealer.interactionPosition.y-result.segments.hospitalToHealer.healerPoint.y)
    <=result.segments.hospitalToHealer.healerRange);
  planned.push({
    routeId:row.routeId,
    hometown:result.hometown,
    from:point,
    returnDistance:result.segments.encounterToTown.moveDistance,
    townToHospitalDistance:result.segments.townToHospital.moveDistance,
    hospitalToHealerDistance:result.segments.hospitalToHealer.moveDistance,
    hospitalFloor:result.hospitalFloor,
    healerPoint:result.segments.hospitalToHealer.healerPoint,
    interactionPosition:result.segments.hospitalToHealer.interactionPosition
  });
}

const stale={
  ...JSON.parse(JSON.stringify({
    schemaVersion:1,
    revision:0,
    idle:{enabled:true,mode:'supply_check',routeId:'hometown-0/floor-1000-to-100/1000_to_100_a'},
    world:{position:routePoints[routes[0].routeId]},
    player:{id:'v477-stale'},pets:{}
  })),
  world:{position:{floorId:200,x:1,y:1}}
};
const staleResult=await runtime.plan(stale);
assert.equal(staleResult.ok,false);
assert.equal(staleResult.reason,'player-not-on-route-encounter-floor');

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_IDLE_SUPPLY_ROUTE_RUNTIME_FORMAT,
  exactSourcePortals:true,
  routesPlanned:planned.length,
  planned,
  failClosedReason:staleResult.reason
},null,2));
