#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { freshPersistentState, validatePersistentState } from '../src/stoneage_persistent_state.mjs';
import { createBrowserStateController, ACTION_WORLD_MOVE_STEP, BROWSER_STATE_CONTROLLER_FORMAT, BROWSER_WORLD_MOVEMENT_RUNTIME_FORMAT } from '../src/stoneage_browser_state_controller.mjs';
import { createBrowserWorldMovementRuntime, validateMoveStep } from '../src/stoneage_browser_world_movement_runtime.mjs';

const repoRoot=process.cwd();
const fixedRoot=process.argv[2] ? path.resolve(process.argv[2]) : path.resolve('/tmp/StoneAge');
const read=(root,p)=>fs.readFileSync(path.join(root,p),'utf8');
const fixedRef='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const mapset=JSON.parse(read(repoRoot,'data/generated/stoneage_mapset_runtime.json'));
const map1000=JSON.parse(read(repoRoot,'data/generated/stoneage_map_1000.json'));
assert.equal(map1000.floorId,1000);

const mapDeal=read(fixedRoot,'gmsv/src/map/map_deal.c');
const walkStart=mapDeal.indexOf('BOOL MAP_walkAbleFromPoint');
const walkEnd=mapDeal.indexOf('BOOL MAP_walkAble(',walkStart);
assert.ok(walkStart>=0 && walkEnd>walkStart);
const walkBody=mapDeal.slice(walkStart,walkEnd);
assert.ok(walkBody.includes('MAP_getImageInt( map[1], MAP_WALKABLE )'));
assert.ok(walkBody.includes('case 0:'));
assert.ok(walkBody.includes('case 1:'));
assert.ok(walkBody.includes('MAP_getImageInt( map[0], MAP_WALKABLE ) == 1'));
assert.ok(walkBody.includes('case 2:'));
assert.ok(walkBody.includes('MAP_HAVEHEIGHT'));

const charWalk=read(fixedRoot,'gmsv/src/char/char_walk.c');
const diagMarker='if( CHAR_getDX(dir)*CHAR_getDY(dir) == 0 )';
const diagStart=charWalk.indexOf(diagMarker);
assert.ok(diagStart>=0);
const diagBody=charWalk.slice(diagStart,diagStart+2400);
assert.ok(diagBody.includes('xflg = MAP_walkAble( charaindex,of, ox+CHAR_getDX(dir), oy );'));
assert.ok(diagBody.includes('yflg = MAP_walkAble( charaindex,of, ox, oy+CHAR_getDY(dir) );'));
assert.ok(diagBody.includes('if( !xflg || !yflg )'));

const runtime=createBrowserWorldMovementRuntime({
  loadMap:async floorId=>Number(floorId)===1000?map1000:null,
  loadMapset:async()=>mapset,
  now:()=> '2026-10-01T00:00:00.000Z'
});
assert.equal(runtime.ok,true);
assert.equal(runtime.format,'stoneage-browser-world-movement-runtime-v1');

const origin={floorId:1000,x:98,y:44};
assert.equal((validateMoveStep(origin,{dx:0,dy:0},map1000,mapset)).ok,false);
assert.equal((validateMoveStep(origin,{dx:2,dy:0},map1000,mapset)).ok,false);

const adjacentDirections=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const firstLegal=adjacentDirections
  .map(([dx,dy])=>({dx,dy,check:validateMoveStep(origin,{dx,dy},map1000,mapset)}))
  .find(x=>x.check.ok);
assert.ok(firstLegal,'V3.75 warp landing 1000:98,44 must have a source-legal adjacent move');

const firstBlocked=adjacentDirections
  .map(([dx,dy])=>({dx,dy,check:validateMoveStep(origin,{dx,dy},map1000,mapset)}))
  .find(x=>!x.check.ok);
assert.ok(firstBlocked,'1000:98,44 should expose at least one blocked adjacent step');

const state=freshPersistentState({playerId:'v376-move'});
state.world.position=origin;
const controller=createBrowserStateController({
  state,
  worldNpcIndex:null,
  warpCatalog:null,
  worldMovementOptions:{
    loadMap:async floorId=>Number(floorId)===1000?map1000:null,
    loadMapset:async()=>mapset,
    now:()=> '2026-10-01T00:00:00.000Z'
  }
});
assert.equal(controller.format,BROWSER_STATE_CONTROLLER_FORMAT);

const moved=await controller.dispatch({
  type:ACTION_WORLD_MOVE_STEP,
  dx:firstLegal.dx,
  dy:firstLegal.dy,
  player:origin,
  expectedRevision:0,
  now:'2026-10-01T00:00:01.000Z'
});
assert.equal(moved.ok,true);
assert.equal(moved.handled,true);
assert.equal(moved.stage,'movement');
assert.equal(moved.format,BROWSER_WORLD_MOVEMENT_RUNTIME_FORMAT);
assert.equal(moved.state.revision,1);
assert.deepEqual(moved.from,origin);
assert.deepEqual(moved.to,moved.state.world.position);
assert.equal(moved.to.floorId,1000);
assert.equal(validatePersistentState(moved.state).length,0);
assert.equal(moved.verification.ok,true);

const blocked=await controller.dispatch({
  type:ACTION_WORLD_MOVE_STEP,
  dx:firstBlocked.dx,
  dy:firstBlocked.dy,
  player:origin,
  expectedRevision:1,
  now:'2026-10-01T00:00:02.000Z'
});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'movement-player-state-mismatch');
assert.equal(controller.getState().revision,1);

const stale=await controller.dispatch({
  type:ACTION_WORLD_MOVE_STEP,
  dx:firstLegal.dx,
  dy:firstLegal.dy,
  player:moved.to,
  expectedRevision:0,
  now:'2026-10-01T00:00:03.000Z'
});
assert.equal(stale.ok,false);
assert.equal(stale.reason,'revision-conflict');
assert.equal(controller.getState().revision,1);

assert.equal(moved.to.floorId,origin.floorId);

const diagonalFixture={
  floorId:9999,width:3,height:3,
  tiles:[1,1,1,1,1,1,1,1,1],
  objects:[1,1,1,1,1,1,1,1,1]
};
const fixtureMapset={walkableByImageId:{'1':1}};
assert.equal(validateMoveStep({floorId:9999,x:1,y:1},{dx:1,dy:1},diagonalFixture,fixtureMapset).ok,true);
diagonalFixture.objects[1*3+2]=2;
const blockedDiagonal=validateMoveStep({floorId:9999,x:1,y:1},{dx:1,dy:1},diagonalFixture,fixtureMapset);
assert.equal(blockedDiagonal.ok,false);
assert.equal(blockedDiagonal.reason,'movement-diagonal-side-cell-blocked');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-browser-world-movement-runtime-v1',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:fixedRef},
  checks:[
    'MAP_walkAbleFromPoint source parity',
    'CHAR_walk diagonal side-cell gate',
    'real map 1000 source-legal step',
    'blocked destination fail-closed',
    'same-floor position mutation only',
    'Persistent State + Save Envelope verification',
    'expectedRevision guard',
    'diagonal side-cell rejection'
  ]
},null,2));
