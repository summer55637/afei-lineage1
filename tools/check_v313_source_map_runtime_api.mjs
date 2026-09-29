import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadSourceMapRuntime,sourceMapTileAt,sourceMapBattleCandidates,sourceMapRuntimeSummary} from '../src/stoneage_map_runtime.mjs';

const index=fs.readFileSync('data/generated/stoneage_map_runtime_index.json','utf8');
const map=fs.readFileSync('data/generated/stoneage_map_20000.json','utf8');
const routes={
  'data/generated/stoneage_map_runtime_index.json':index,
  './data/generated/stoneage_map_runtime_index.json':index,
  'data/generated/stoneage_map_20000.json':map,
  './data/generated/stoneage_map_20000.json':map
};
const fetchImpl=async url=>{
  const key=String(url);
  const body=routes[key];
  return {ok:body!==undefined,status:body===undefined?404:200,json:async()=>JSON.parse(body)};
};

const loaded=await loadSourceMapRuntime(20000,{fetchImpl});
assert.equal(loaded.floorId,20000);
assert.deepEqual(sourceMapTileAt(loaded,5,0),{x:5,y:0,tile:4500,object:0,index:5});
assert.deepEqual(sourceMapBattleCandidates(loaded,4500),[138,139,140]);
assert.equal(sourceMapTileAt(loaded,-1,0),null);
assert.equal(sourceMapTileAt(loaded,50,0),null);
assert.equal(await loadSourceMapRuntime(99999,{fetchImpl}),null);
assert.deepEqual(sourceMapRuntimeSummary(loaded),{status:'ready',floorId:20000,width:50,height:50,tileCount:2500,objectCount:2500});
console.log(JSON.stringify({pass:true,version:'V3.13',focus:'floor/x/y -> tile -> battle candidate API',example:{floor:20000,x:5,y:0,tile:4500,candidates:[138,139,140]},unknownFloor:'fail-closed'}));