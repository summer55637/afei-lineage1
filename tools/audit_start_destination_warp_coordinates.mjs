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
  {id:'1000_to_100_a',fromFloor:1000,toFloor:100,from:[[49,116],[49,117],[49,118],[49,119]],to:[[637,491],[637,492],[637,493],[637,494]],sourceLines:[2611,2612,2613,2614]},
  {id:'1000_to_100_b',fromFloor:1000,toFloor:100,from:[[117,112],[118,112],[119,112],[120,112],[121,112]],to:[[706,488],[707,488],[708,488],[709,488],[710,488]],sourceLines:[2620,2621,2622,2623,2624]},
  {id:'2000_to_100_a',fromFloor:2000,toFloor:100,from:[[74,33],[74,34],[74,35],[74,36]],to:[[79,614],[79,615],[79,616],[79,617]],sourceLines:[2629,2630,2631,2632]},
  {id:'2000_to_100_b',fromFloor:2000,toFloor:100,from:[[108,79],[108,80],[108,81],[108,82]],to:[[114,660],[114,661],[114,662],[114,663]],sourceLines:[2637,2638,2639,2640]},
  {id:'3000_to_200_a',fromFloor:3000,toFloor:200,from:[[56,117],[56,118],[56,119],[56,120]],to:[[570,376],[570,377],[570,378],[570,379]],sourceLines:[1838,1839,1840,1841]},
  {id:'3000_to_200_b',fromFloor:3000,toFloor:200,from:[[73,54],[73,55],[73,56],[73,57],[73,58],[73,59]],to:[[587,313],[587,314],[587,315],[587,316],[587,317],[587,318]],sourceLines:[1848,1849,1850,1851,1852,1853]},
  {id:'4000_to_200_a',fromFloor:4000,toFloor:200,from:[[104,55],[104,56]],to:[[304,599],[304,600]],sourceLines:[1856,1857]},
  {id:'4000_to_200_b',fromFloor:4000,toFloor:200,from:[[101,96],[101,97]],to:[[301,640],[301,641]],sourceLines:[1860,1861]}
];

function exactRows(spec){
  const hits=rows.filter(r=>r.type==='NONE'&&r.condition==='NULL'&&r.fromFloor===spec.fromFloor&&r.toFloor===spec.toFloor)
    .filter(r=>spec.sourceLines.includes(r.line));
  if(hits.length!==spec.sourceLines.length)throw new Error(`source row count mismatch for ${spec.id}: expected ${spec.sourceLines.length}, got ${hits.length}`);
  const expectedCount=spec.from.length;
  if(expectedCount!==hits.length)throw new Error(`expected coordinate count mismatch for ${spec.id}`);
  hits.forEach((r,i)=>{
    const expectedFrom=spec.from[i], expectedTo=spec.to[i];
    if(r.fromX!==expectedFrom[0]||r.fromY!==expectedFrom[1]||r.toX!==expectedTo[0]||r.toY!==expectedTo[1]){
      throw new Error(`coordinate mismatch for ${spec.id} line ${r.line}: got ${r.fromX},${r.fromY}->${r.toX},${r.toY}`);
    }
  });
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
