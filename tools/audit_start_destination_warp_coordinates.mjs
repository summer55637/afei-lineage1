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
const file=path.join(root,sourcePath);
const raw=fs.readFileSync(file,'utf8');
const sha=crypto.createHash('sha1').update(Buffer.from(`blob ${Buffer.byteLength(raw,'utf8')}\0`)).update(raw).digest('hex');
if(sha!==expectedSha) throw new Error(`mapwarp blob SHA mismatch: expected ${expectedSha}, got ${sha}`);

function parseLine(raw,line){
  const p=raw.split(':');
  if(p.length<5)return null;
  const from=p[2].split(',').map(Number);
  const to=p[3].split(',').map(Number);
  if(from.length!==3||to.length!==3||from.some(v=>!Number.isFinite(v))||to.some(v=>!Number.isFinite(v)))return null;
  return {line,type:p[0],condition:p[1],fromFloor:from[0],fromX:from[1],fromY:from[2],toFloor:to[0],toX:to[1],toY:to[2],extra:p[4]};
}
const rows=raw.split(/\r?\n/).map((x,i)=>parseLine(x,i+1)).filter(Boolean);
const wants=[
  {id:'1000_to_100',fromFloor:1000,toFloor:100},
  {id:'2000_to_100',fromFloor:2000,toFloor:100},
  {id:'3000_to_200_primary',fromFloor:3000,toFloor:200},
  {id:'3000_to_200_secondary',fromFloor:3000,toFloor:200},
  {id:'4000_to_200',fromFloor:4000,toFloor:200}
];
const selected=[];
for(const spec of wants){
  const hits=rows.filter(r=>r.fromFloor===spec.fromFloor&&r.toFloor===spec.toFloor&&r.type==='NONE'&&r.condition==='NULL');
  if(!hits.length) throw new Error(`no source warp rows for ${spec.id}`);
  // Keep distinct coordinate runs; secondary 3000->200 entry is retained separately.
  const key=r=>[${r.fromFloor},${r.fromX},${r.fromY},${r.toFloor},${r.toX},${r.toY}].join(':');
  const uniq=[...new Map(hits.map(r=>[key(r),r])).values()];
  selected.push({...spec,rows:uniq});
}
const result={
  format:'stoneage-start-destination-warp-coordinates-v1',
  generatedAt:'2026-09-30',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',path:sourcePath,blobSha:sha},
  sourceContract:'gmsv/data/map/mapwarp.txt exact TYPE:CONDITION:fromFloor,X,Y:toFloor,X,Y rows',
  destinations:selected,
  policy:'These are source warp coordinates only. They do not imply destination walkability, encounter eligibility, quest priority, or an optimal route.'
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pass:true,out,destinations:selected.map(x=>({id:x.id,rowCount:x.rows.length,lines:x.rows.map(r=>r.line)}))},null,2));
