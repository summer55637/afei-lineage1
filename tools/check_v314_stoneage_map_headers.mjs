#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';

export function parseLS2MapHeader(buffer){
  if(buffer.length<44)return null;
  if(buffer.subarray(0,6).toString('ascii')!=='LS2MAP')return null;
  const id=buffer.readUInt16BE(6);
  const nameRaw=Buffer.from(buffer.subarray(8,40));
  const zero=nameRaw.indexOf(0);
  const trimmed=zero>=0?nameRaw.subarray(0,zero):nameRaw;
  const width=buffer.readUInt16BE(40);
  const height=buffer.readUInt16BE(42);
  const cellCount=width*height;
  if(!Number.isSafeInteger(cellCount))throw new Error('invalid cell count');
  const expectedBytes=44+cellCount*4;
  return {magic:'LS2MAP',floorId:id,width,height,cellCount,expectedBytes,fileBytes:buffer.length,trailingBytes:Math.max(0,buffer.length-expectedBytes),nameRawHex:trimmed.toString('hex')};
}

function blobSha(buffer){
  const h=crypto.createHash('sha1');
  const header=Buffer.from(`blob ${buffer.length}\\0`,'ascii');
  h.update(header);h.update(buffer);
  return h.digest('hex');
}

function walk(dir){
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

if(import.meta.url===pathToFileURL(process.argv[1]).href){
const root=process.argv[2];
if(!root){console.error('usage: node tools/check_v314_stoneage_map_headers.mjs <fixed-c-data-map-dir>');process.exit(2);}
const files=walk(root).sort();
const maps=[];const nonMaps=[];const bad=[];
for(const file of files){
  const b=fs.readFileSync(file);
  const parsed=parseLS2MapHeader(b);
  if(!parsed){nonMaps.push(path.relative(root,file).replaceAll(path.sep,'/'));continue;}
  const expected=parsed.expectedBytes;
  if(b.length<expected)bad.push({path:path.relative(root,file).replaceAll(path.sep,'/'),reason:'truncated',fileBytes:b.length,expectedBytes:expected});
  maps.push({...parsed,path:path.relative(root,file).replaceAll(path.sep,'/'),blobSha:blobSha(b)});
}
if(bad.length){console.error(JSON.stringify({pass:false,bad},null,2));process.exit(1);}
const floorCounts=new Map();for(const m of maps)floorCounts.set(m.floorId,(floorCounts.get(m.floorId)||0)+1);
const duplicateFloorIds=[...floorCounts].filter(([,count])=>count>1).map(([floorId,count])=>({floorId,count}));
const result={schemaVersion:1,version:'V3.14',source:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',root:'gmsv/data/map'},mapFileCount:maps.length,nonMapFileCount:nonMaps.length,duplicateFloorIds,hasDuplicateFloorIds:duplicateFloorIds.length>0,maps};
const output=process.env.OUTPUT||'/tmp/stoneage-map-header-catalog.json';
fs.writeFileSync(output,JSON.stringify(result,null,2));
console.log(JSON.stringify({pass:true,version:'V3.14',mapFileCount:maps.length,nonMapFileCount:nonMaps.length,duplicateFloorIds,output,bytes:Buffer.byteLength(JSON.stringify(result))}));
}
