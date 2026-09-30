#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot=process.cwd();
const fixedRoot=process.argv[2] ? path.resolve(process.argv[2]) : path.resolve('/tmp/StoneAge');
const fixedRef='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const read=(root,p)=>fs.readFileSync(path.join(root,p),'utf8');
const map=JSON.parse(read(repoRoot,'data/generated/stoneage_map_4000.json'));
const mapset=JSON.parse(read(repoRoot,'data/generated/stoneage_mapset_runtime.json'));
const audit=JSON.parse(read(repoRoot,'data/generated/stoneage_4000_exit_component_audit.json'));
assert.equal(map.floorId,4000);
assert.equal(audit.fixedSource.ref,fixedRef);
assert.equal(audit.runtime.sourceBlobSha,'1429c3717685b9fb05ff7f07979cc1ce967c3eea');

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

const width=Number(map.width),height=Number(map.height),n=width*height;
const walkable=new Uint8Array(n);
const imageAttrs=id=>mapset?.walkableByImageId?.[String(Math.trunc(Number(id)))];
const canWalk=(x,y)=>{
  if(x<0||y<0||x>=width||y>=height)return false;
  const i=y*width+x;
  const tile=Number(map.tiles?.[i]),obj=Number(map.objects?.[i]);
  const objectWalk=imageAttrs(obj)===1;
  const tileWalk=imageAttrs(tile)===1;
  const rule=objectWalk ? (tileWalk?1:0) : 0;
  const objectMode=(mapset?.walkableByImageId?.[String(obj)]??null);
  const objectWalkMode=Number(objectMode);
  const result=Object.prototype.hasOwnProperty.call(mapset?.walkableByImageId||{},String(obj)) ? (objectWalkMode===2 || (objectWalkMode===1 && tileWalk)) : false;
  return result && rule===result;
};
for(let i=0;i<n;i++){ const x=i%width,y=Math.floor(i/width); if(canWalk(x,y)) walkable[i]=1; }

const comp=new Int32Array(n); comp.fill(-1);
let compCount=0;
const q=new Int32Array(n);
for(let s=0;s<n;s++){
  if(!walkable[s] || comp[s]!==-1)continue;
  let head=0,tail=0; q[tail++]=s; comp[s]=compCount;
  while(head<tail){
    const i=q[head++],x=i%width,y=Math.floor(i/width);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy; if(nx<0||ny<0||nx>=width||ny>=height)continue;
      const j=ny*width+nx; if(!walkable[j]||comp[j]!==-1)continue; comp[j]=compCount; q[tail++]=j;
    }
  }
  compCount++;
}

const componentAt=(x,y)=>walkable[y*width+x] ? comp[y*width+x] : -1;
const direct=[...[80,90],[80,91]];
const portals=[[104,55],[104,56],[101,96],[101,97]];
const directComponents=[...new Set(direct.map(([x,y])=>componentAt(x,y)))];
const portalComponents=[...new Set(portals.map(([x,y])=>componentAt(x,y)))];
assert.deepEqual(directComponents,[48]);
assert.deepEqual(portalComponents,[0]);
assert.notEqual(directComponents[0],portalComponents[0]);

let legalDiagonalBridges=0;
const diagonalExamples=[];
for(let y=0;y<height;y++){
  for(let x=0;x<width;x++){
    if(!walkable[y*width+x])continue;
    for(const [dx,dy] of [[1,1],[1,-1],[-1,1],[-1,-1]]){
      const nx=x+dx,ny=y+dy; if(nx<0||ny<0||nx>=width||ny>=height)continue;
      const ni=ny*width+nx; if(!walkable[ni])continue;
      const c1=comp[y*width+x],c2=comp[ni]; if(c1===c2)continue;
      const xSide=canWalk(x+dx,y),ySide=canWalk(x,y+dy);
      if(xSide && ySide){ legalDiagonalBridges++; if(diagonalExamples.length<10)diagonalExamples.push({from:[x,y],to:[nx,ny],fromComponent:c1,toComponent:c2}); }
    }
  }
}
assert.equal(legalDiagonalBridges,0);

for(const [x,y] of portals)assert.equal(componentAt(x,y),0);
for(const [x,y] of direct)assert.equal(componentAt(x,y),48);

console.log(JSON.stringify({
  pass:true,
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:fixedRef},
  map:{floor:4000,width,height,totalWalkableComponents:compCount},
  directLandingComponent:48,
  portalOriginComponent:0,
  legalDiagonalBridges,
  diagonalExamples,
  conclusion:'4000->200 remains source-movement-parity verified exception; 4-neighbor component proof is not bypassed by fixed-C diagonal movement.'
},null,2));
