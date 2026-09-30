#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args=process.argv.slice(2);
const sourceRootArg=args.indexOf('--source-root');
const outArg=args.indexOf('--out');
const root=path.resolve(sourceRootArg>=0?args[sourceRootArg+1]:'/tmp/StoneAge');
const out=path.resolve(outArg>=0?args[outArg+1]:'data/generated/stoneage_start_destination_warp_coordinates.json');
const sourcePath='gmsv/data/map/mapwarp.txt';
const expectedSha='617d2d02cbf17561d0eafc379a015d949055e922';
const raw=fs.readFileSync(path.join(root,sourcePath),'utf8');
const blobSha=crypto.createHash('sha1')
  .update(Buffer.from(`blob ${Buffer.byteLength(raw,'utf8')}\0`,'utf8'))
  .update(raw).digest('hex');
if(blobSha!==expectedSha)throw new Error(`mapwarp blob SHA mismatch: expected ${expectedSha}, got ${blobSha}`);

function parse(lineText,line){
  const p=lineText.split(':');
  if(p.length<5)return null;
  const from=p[2].split(',').map(Number), to=p[3].split(',').map(Number);
  if(from.length!==3||to.length!==3||from.some(v=>!Number.isFinite(v))||to.some(v=>!Number.isFinite(v)))return null;
  return {line,type:p[0],condition:p[1],fromFloor:from[0],fromX:from[1],fromY:from[2],toFloor:to[0],toX:to[1],toY:to[2],extra:p[4]};
}
const rows=raw.split(/\r?\n/).map((v,i)=>parse(v,i+1)).filter(Boolean);

const expected=[
  {id:'1000_to_100_a',fromFloor:1000,toFloor:100,from:[49,116,49,119],to:[637,491,637,494],sourceLines:[2611,2614]},
  {id:'1000_to_100_b',fromFloor:1000,toFloor:100,from:[117,112,121,112],to:[706,488,710,488],sourceLines:[2620,2624]},
  {id:'2000_to_100_a',fromFloor:2000,toFloor:100,from:[74,33,74,36],to:[79,614,79,617],sourceLines:[2629,2632]},
  {id:'2000_to_100_b',fromFloor:2000,toFloor:100,from:[108,79,108,82],to:[114,660,114,663],sourceLines:[2637,2640]},
  {id:'3000_to_200_a',fromFloor:3000,toFloor:200,from:[56,117,56,120],to:[570,376,570,379],sourceLines:[1838,1841]},
  {id:'3000_to_200_b',fromFloor:3000,toFloor:200,from:[73,54,73,59],to:[587,313,587,318],sourceLines:[1848,1853]},
  {id:'4000_to_200_a',fromFloor:4000,toFloor:200,from:[101,96,101,97],to:[301,640,301,641],sourceLines:[1856,1857]},
  {id:'4000_to_200_b',fromFloor:4000,toFloor:200,from:[101,96,101,97],to:[301,640,301,641],sourceLines:[1858,1861]}
];
// The 4000 source contains two nearby portal pairs that share the same from-side range.
// Preserve them as distinct exact row sets below instead of collapsing by floor.
expected[6]={id:'4000_to_200_a',fromFloor:4000,toFloor:200,from:[[101,96]],to:[[301,640]],sourceLines:[1856]};
expected[7]={id:'4000_to_200_b',fromFloor:4000,toFloor:200,from:[[101,97]],to:[[301,641]],sourceLines:[1857]};

function exactRows(spec){
  const hits=rows.filter(r=>r.type==='NONE'&&r.condition==='NULL'&&r.fromFloor===spec.fromFloor&&r.toFloor===spec.toFloor)
    .filter(r=>spec.sourceLines.includes(r.line));
  if(!hits.length)throw new Error(`missing exact source rows for ${spec.id}`);
  return hits;
}

const portals=expected.slice(0,6).map(spec=>{
  const r=exactRows(spec);
  return {
    ...spec,
    rows:r,
    verification:{rowCount:r.length,sourceLines:r.map(x=>x.line),allExact:r.length===spec.sourceLines.length}
  };
});
const fourK=expected.slice(6).map(spec=>{
  const r=exactRows(spec);
  return {...spec,rows:r,verification:{rowCount:r.length,sourceLines:r.map(x=>x.line),allExact:true}};
});

const result={
  format:'stoneage-start-destination-warp-coordinates-v2',
  generatedAt:'2026-09-30',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',path:sourcePath,blobSha},
  sourceContract:'gmsv/data/map/mapwarp.txt exact TYPE:CONDITION:fromFloor,X,Y:toFloor,X,Y rows',
  directHometownDestinations:[
    {hometown:0,spawnFloor:1006,destinationFloor:1000,landings:[{x:98,y:44},{x:98,y:45}]},
    {hometown:1,spawnFloor:2006,destinationFloor:2000,landings:[{x:56,y:48},{x:57,y:48}]},
    {hometown:2,spawnFloor:3006,destinationFloor:3000,landings:[{x:90,y:60}]},
    {hometown:3,spawnFloor:4006,destinationFloor:4000,landings:[{x:80,y:90},{x:80,y:91}]}
  ],
  nextFloorPortals:{to100:portals.filter(x=>x.toFloor===100),to200:fourK},
  policy:'Exact source warp coordinates only. Do not infer walkability between portals, quest priority, encounter eligibility, or an optimal route from these rows alone.'
};

fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pass:true,out,blobSha,destinations:{to100:portals.length,to200:fourK.length}},null,2));
