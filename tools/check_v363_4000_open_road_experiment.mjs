#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { sourceMapWalkableAt } from '../src/stoneage_map_runtime.mjs';

const root=process.cwd();
const map=JSON.parse(fs.readFileSync(path.join(root,'data/generated/stoneage_map_4000.json'),'utf8'));
const mapset=JSON.parse(fs.readFileSync(path.join(root,'data/generated/stoneage_mapset_runtime.json'),'utf8'));

assert.equal(map.floorId,4000);
assert.equal(map.width,150);
assert.equal(map.height,150);

const changedCells=[
  {x:91,y:109,tile:321},
  {x:92,y:109,tile:321},
  {x:93,y:109,tile:321}
];

const originalWalkable=changedCells.map(({x,y})=>sourceMapWalkableAt(map,x,y,mapset,{flying:false}));
assert.deepEqual(originalWalkable,[false,false,false]);

const experimentalMap={...map,tiles:[...map.tiles]};
for(const {x,y,tile} of changedCells) experimentalMap.tiles[y*experimentalMap.width+x]=tile;

const patchedWalkable=changedCells.map(({x,y})=>sourceMapWalkableAt(experimentalMap,x,y,mapset,{flying:false}));
assert.deepEqual(patchedWalkable,[true,true,true]);

const starts=[[80,90],[80,91]];
const portals=[[104,55],[104,56],[101,96],[101,97]];
const dirs=[[1,0],[-1,0],[0,1],[0,-1]];

function bfs(start){
  const queue=[start];
  const previous=new Map([[start.join(','),null]]);
  for(let head=0;head<queue.length;head++){
    const [x,y]=queue[head];
    const key=x+','+y;
    if(portals.some(([px,py])=>px===x&&py===y)){
      const route=[];
      let cursor=key;
      while(cursor){
        route.push(cursor.split(',').map(Number));
        cursor=previous.get(cursor);
      }
      return route.reverse();
    }
    for(const [dx,dy] of dirs){
      const nx=x+dx,ny=y+dy,nkey=nx+','+ny;
      if(nx<0||ny<0||nx>=experimentalMap.width||ny>=experimentalMap.height)continue;
      if(previous.has(nkey))continue;
      if(!sourceMapWalkableAt(experimentalMap,nx,ny,mapset,{flying:false}))continue;
      previous.set(nkey,key);
      queue.push([nx,ny]);
    }
  }
  return null;
}

const routes=starts.map(bfs);
assert.ok(routes.every(Boolean),'experimental road must connect both birth landings to a 4000->200 portal origin');
assert.ok(routes.every(route=>changedCells.every(({x,y})=>route.some(([px,py])=>px===x&&py===y)),
  'routes must actually cross the three experimentally opened cells');

console.log(JSON.stringify({
  pass:true,
  floor:4000,
  policy:'virtual-overlay-only; canonical map file is unchanged',
  changedCells,
  sourceTileReplacements:changedCells.map(({x,y,tile})=>({x,y,from:map.tiles[y*map.width+x],to:tile})),
  starts,
  portalOrigins:portals,
  routeLengths:routes.map(route=>route.length),
  reachedPortals:routes.map(route=>route.at(-1)),
  conclusion:'Opening the three cells as walkable ground makes the existing fixed-C movement path reach an existing 4000->200 portal. This is a repair experiment, not yet a canonical map change.'
},null,2));
