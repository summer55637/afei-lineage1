#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { freshPersistentState, validatePersistentState } from '../src/stoneage_persistent_state.mjs';
import { createBrowserStateController, ACTION_WORLD_WARPPOINT_EXECUTE, BROWSER_STATE_CONTROLLER_FORMAT, BROWSER_WORLD_WARPPOINT_RUNTIME_FORMAT } from '../src/stoneage_browser_state_controller.mjs';
import { createBrowserWorldWarpPointRuntime, resolveWorldWarpPointBinding } from '../src/stoneage_browser_world_warppoint_runtime.mjs';

const repoRoot=process.cwd();
const fixedRoot=process.argv[2] ? path.resolve(process.argv[2]) : path.resolve('/tmp/StoneAge');
const read=(root,p)=>fs.readFileSync(path.join(root,p),'utf8');
const fixedRef='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const catalog=JSON.parse(read(repoRoot,'data/generated/stoneage_start_destination_warp_coordinates.json'));
const map100=JSON.parse(read(repoRoot,'data/generated/stoneage_map_100.json'));
const map200=JSON.parse(read(repoRoot,'data/generated/stoneage_map_200.json'));

const source=read(fixedRoot,'gmsv/src/map/map_warppoint.c');
assert.ok(source.includes('MAPPOINT_getMapWarpGoal'));
assert.ok(source.includes('MapWarppoint[ps].ofloor != ofl'));
assert.ok(source.includes('MapWarppoint[ps].ox != ox'));
assert.ok(source.includes('MapWarppoint[ps].oy != oy'));
assert.ok(source.includes('MAP_IsValidCoordinate'));
assert.ok(source.includes('CHAR_warpToSpecificPoint'));

const eventSource=read(fixedRoot,'gmsv/src/char/event.c');
assert.ok(eventSource.includes('OBJECT_getType(o) == OBJTYPE_WARPPOINT'));
assert.ok(eventSource.includes('MAPPOINT_MapWarpHandle'));

assert.equal(catalog.format,'stoneage-start-destination-warp-coordinates-v2');
assert.deepEqual(catalog.fixedSource,{repository:'gavinlinasd/StoneAge',ref:fixedRef,path:'gmsv/data/map/mapwarp.txt',blobSha:'617d2d02cbf17561d0eafc379a015d949055e922'});
const groups=Array.isArray(catalog.nextFloorPortals)
  ? catalog.nextFloorPortals
  : [...(catalog.nextFloorPortals?.to100??[]),...(catalog.nextFloorPortals?.to200??[])];
assert.equal(groups.length,8);
const rowCount=groups.reduce((n,g)=>n+(g.rows?.length??0),0);
assert.equal(rowCount,31);

const loadMap=async floorId=>Number(floorId)===100?map100:(Number(floorId)===200?map200:null);
const runtime=createBrowserWorldWarpPointRuntime({catalog,loadMap});
assert.equal(runtime.ok,true);
assert.equal(runtime.format,'stoneage-browser-world-warppoint-runtime-v1');

const binding=resolveWorldWarpPointBinding({floorId:1000,x:49,y:116},catalog,{portalId:'1000_to_100_a'});
assert.equal(binding.ok,true);
assert.deepEqual(binding.binding.to,{floorId:100,x:637,y:491});

const state=freshPersistentState({playerId:'v377'});
state.world.position={floorId:1000,x:49,y:116};
const controller=createBrowserStateController({
  state,
  worldNpcIndex:null,
  warpCatalog:catalog,
  worldMovementOptions:{loadMap:async()=>null,loadMapset:async()=>({})},
  worldWarpPointOptions:{loadMap}
});
assert.equal(controller.format,BROWSER_STATE_CONTROLLER_FORMAT);

const moved=await controller.dispatch({
  type:ACTION_WORLD_WARPPOINT_EXECUTE,
  portalId:'1000_to_100_a',
  expectedRevision:0,
  now:'2026-10-01T00:00:01.000Z'
});
assert.equal(moved.ok,true);
assert.equal(moved.handled,true);
assert.equal(moved.stage,'warppoint');
assert.equal(moved.format,BROWSER_WORLD_WARPPOINT_RUNTIME_FORMAT);
assert.deepEqual(moved.from,{floorId:1000,x:49,y:116});
assert.deepEqual(moved.to,{floorId:100,x:637,y:491});
assert.equal(moved.state.revision,1);
assert.deepEqual(moved.state.world.position,{floorId:100,x:637,y:491});
assert.equal(validatePersistentState(moved.state).length,0);
assert.equal(moved.verification.ok,true);

const unknownSourceState=freshPersistentState({playerId:'v377-unknown-source'});
unknownSourceState.world.position={floorId:1000,x:0,y:0};
const wrong=await runtime.execute(unknownSourceState,{portalId:'1000_to_100_a',expectedRevision:0});
assert.equal(wrong.ok,false);
assert.equal(wrong.reason,'warppoint-id-not-at-position');

const mismatch=freshPersistentState({playerId:'v377-mismatch'});
mismatch.world.position={floorId:1000,x:49,y:117};
const mismatchResult=await runtime.execute(mismatch,{portalId:'1000_to_100_a',expectedRevision:0});
assert.equal(mismatchResult.ok,false);
assert.equal(mismatchResult.reason,'warppoint-id-not-at-position');

const stale=await runtime.execute(moved.state,{portalId:'1000_to_100_a',expectedRevision:0});
assert.equal(stale.ok,false);
assert.equal(stale.reason,'warppoint-id-not-at-position');

const badRevisionState=freshPersistentState({playerId:'v377-stale'});
badRevisionState.world.position={floorId:1000,x:49,y:116};
const staleRevision=await runtime.execute(badRevisionState,{portalId:'1000_to_100_a',expectedRevision:1});
assert.equal(staleRevision.ok,false);
assert.equal(staleRevision.reason,'revision-conflict');

const badCatalog={...catalog,fixedSource:{...catalog.fixedSource,blobSha:'wrong'}};
const badRuntime=createBrowserWorldWarpPointRuntime({catalog:badCatalog,loadMap});
assert.equal(badRuntime.ok,false);
assert.equal(badRuntime.reason,'dependency-validation-failed');

const kar=resolveWorldWarpPointBinding({floorId:4000,x:104,y:55},catalog,{portalId:'4000_to_200_a'});
assert.equal(kar.ok,true);
assert.deepEqual(kar.binding.to,{floorId:200,x:304,y:599});

const jaja=resolveWorldWarpPointBinding({floorId:3000,x:73,y:59},catalog,{portalId:'3000_to_200_b'});
assert.equal(jaja.ok,true);
assert.deepEqual(jaja.binding.to,{floorId:200,x:587,y:318});
const jajaState=freshPersistentState({playerId:'v377-jaja'});
jajaState.world.position={floorId:3000,x:73,y:59};
const jajaResult=await runtime.execute(jajaState,{portalId:'3000_to_200_b',expectedRevision:0});
assert.equal(jajaResult.ok,true);
assert.deepEqual(jajaResult.state.world.position,{floorId:200,x:587,y:318});

const unresolved=await runtime.execute(freshPersistentState({playerId:'v377-unresolved'}),{portalId:'1000_to_100_a',expectedRevision:0});
assert.equal(unresolved.ok,false);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-browser-world-warppoint-runtime-v1',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:fixedRef},
  portalGroups:groups.length,
  portalRows:rowCount,
  checks:[
    'MAPPOINT exact source-cell match',
    'MAP_IsValidCoordinate destination guard',
    '1000 -> 100 source warp execution',
    'wrong source rejection',
    'revision guard',
    'fixed-source pin rejection',
    '3000 -> 200 (587,318) source behavior retained',
    '4000 -> 200 source binding retained without synthetic reachability'
  ]
},null,2));
