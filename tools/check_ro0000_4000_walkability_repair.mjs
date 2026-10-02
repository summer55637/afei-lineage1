import assert from 'node:assert/strict';
import fs from 'node:fs';
import { sourceMapWalkableAt } from '../src/stoneage_map_runtime.mjs';
import { assertRo0000_4000RepairCellMatchesSource, isRo0000_4000WalkabilityRepairCell, ro0000SourceMapWalkableAt } from '../src/stoneage_ro0000_4000_repair.mjs';

const map=JSON.parse(fs.readFileSync('data/generated/stoneage_map_4000.json','utf8'));
const mapset=JSON.parse(fs.readFileSync('data/generated/stoneage_mapset_runtime.json','utf8'));
const repairCells=[[91,109],[92,109],[93,109]];
const portalOrigins=[[104,55],[104,56],[101,96],[101,97]];

assert.equal(Number(map.floorId),4000);
assert.equal(repairCells.filter(([x,y])=>isRo0000_4000WalkabilityRepairCell(4000,x,y)).length,3);

for(const [x,y] of repairCells){
  const index=y*Number(map.width)+x;
  const before=sourceMapWalkableAt(map,x,y,mapset,{flying:false});
  const checked=assertRo0000_4000RepairCellMatchesSource(map,x,y);
  const after=ro0000SourceMapWalkableAt(map,x,y,mapset,{flying:false,sourceMapWalkableAt});
  assert.equal(before,false,`canonical walkability changed unexpectedly at ${x},${y}`);
  assert.equal(checked.ok,true,`repair source guard failed at ${x},${y}`);
  assert.equal(after,true,`repair overlay did not open ${x},${y}`);
  assert.equal(Number(map.tiles[index]),Number(checked.source.tile));
  assert.equal(Number(map.objects[index]),Number(checked.source.object));
}

for(const [x,y] of portalOrigins){
  assert.equal(ro0000SourceMapWalkableAt(map,x,y,mapset,{flying:false,sourceMapWalkableAt}),sourceMapWalkableAt(map,x,y,mapset,{flying:false}),`portal origin walkability changed at ${x},${y}`);
}

function reachable(start,goalSet){
  const width=Number(map.width),height=Number(map.height),queue=[start[1]*width+start[0]];
  const seen=new Set(queue);
  const goals=new Set(goalSet.map(([x,y])=>y*width+x));
  for(let head=0;head<queue.length;head++){
    const index=queue[head];
    if(goals.has(index))return true;
    const x=index%width,y=Math.floor(index/width);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=width||ny>=height)continue;
      const next=ny*width+nx;
      if(seen.has(next))continue;
      if(!ro0000SourceMapWalkableAt(map,nx,ny,mapset,{flying:false,sourceMapWalkableAt}))continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return false;
}

assert.equal(reachable([80,90],portalOrigins),true,'birth landing (80,90) cannot reach 4000->200 portal');
assert.equal(reachable([80,91],portalOrigins),true,'birth landing (80,91) cannot reach 4000->200 portal');
assert.equal(isRo0000_4000WalkabilityRepairCell(3000,91,109),false);
assert.equal(isRo0000_4000WalkabilityRepairCell(4000,90,109),false);
assert.equal(isRo0000_4000WalkabilityRepairCell(4000,94,109),false);

const mismatch={...map,tiles:[...map.tiles]};
mismatch.tiles[109*Number(map.width)+91]=321;
assert.equal(assertRo0000_4000RepairCellMatchesSource(mismatch,91,109).ok,false,'source mismatch must fail closed');

console.log('RO0000 4000 repair overlay regression: PASS');
console.log(JSON.stringify({floorId:4000,repairedCells:repairCells,birthLandingsReachPortal:true,canonicalMapUnchanged:true,sourceMismatchFailsClosed:true},null,2));
