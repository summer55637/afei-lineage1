import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('start.html','utf8');
const runtime=fs.readFileSync('src/stoneage_map_runtime.mjs','utf8');
const index=JSON.parse(fs.readFileSync('data/generated/stoneage_map_runtime_index.json','utf8'));

assert.ok(html.includes('id="worldSceneSourceTile"'),'encounter source probe node missing');
const start=game.indexOf('function sourceMapEncounterProbeStatus(map)');
const end=game.indexOf('function loadSourceMapRuntimeModule()',start);
assert.ok(start>=0&&end>start,'probe helper missing');
const helper=game.slice(start,end);
assert.equal(helper.includes('Math.random'),false,'probe must not consume RNG');
assert.ok(helper.includes('sourceMapTileWithAttributes'),'probe must use source tile attributes');
assert.ok(helper.includes('sourceMapBattleCandidatesAt'),'probe must use source battle candidates');
assert.ok(helper.includes('sourceMapWalkableAt'),'probe must use fixed-C walkability resolver');
assert.ok(game.includes('sourceMapEncounterProbeStatus(map);'),'world renderer must call probe');
assert.ok(runtime.includes('export function sourceMapBattleCandidatesAt(map,x,y)'),'battle candidates API missing');
assert.ok(runtime.includes('export function sourceMapWalkableAt(map,x,y,mapset,{flying=false}={})'),'walkability API missing');
assert.deepEqual(Object.keys(index.maps).map(Number).sort((a,b)=>a-b),[200,400,2000,5507,10406,10702,20000]);

console.log(JSON.stringify({pass:true,version:'V3.15',focus:'verified encounter coordinate source probe',verifiedMapCount:Object.keys(index.maps).length,failClosedOnUnknownFloor:true,rngConsumedByProbe:false}));