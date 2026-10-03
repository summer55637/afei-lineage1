#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const args=process.argv.slice(2);
const value=(flag,fallback=null)=>{
  const i=args.indexOf(flag);
  return i>=0 ? args[i+1] : fallback;
};

const sourceRoot=path.resolve(value('--source-root','/tmp/StoneAge'));
const headerCatalog=path.resolve(value('--header-catalog','/tmp/stoneage-map-header-catalog.json'));
const outManifest=path.resolve(value('--out','data/generated/stoneage_main_world_map_coverage_wave1.json'));
const indexPath=path.resolve(value('--index','data/generated/stoneage_map_runtime_index.json'));
const allowPartial=args.includes('--allow-partial');

const FIXED_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const SOURCE_REPO='gavinlinasd/StoneAge';
const CORE_WORLD_RUNTIME=[100,200,400,1000,2000,3000,4000];

const CANDIDATES=[
  {floor:300,branch:'core-world'},
  {floor:500,branch:'floor-500'},
  {floor:1040,branch:'floor-100-branch'},
  {floor:1100,branch:'floor-100-branch'},
  {floor:1300,branch:'floor-100-branch'},
  {floor:1400,branch:'floor-100-branch'},
  {floor:817,branch:'floor-200-branch'},
  {floor:3030,branch:'floor-200-branch'},
  {floor:3100,branch:'floor-200-branch'},
  {floor:3200,branch:'floor-200-branch'},
  {floor:3300,branch:'floor-200-branch'},
  {floor:3400,branch:'floor-200-branch'},
  {floor:4030,branch:'floor-200-branch'},
  {floor:5000,branch:'floor-300-branch'},
  {floor:5100,branch:'floor-300-branch'},
  {floor:6000,branch:'floor-400-branch'},
  {floor:5500,branch:'floor-500-branch'},
  {floor:5501,branch:'floor-500-branch'},
  {floor:5511,branch:'floor-500-branch'},
  {floor:5530,branch:'floor-500-branch'},
  {floor:5532,branch:'floor-500-branch'},
  {floor:5536,branch:'floor-500-branch'}
];

const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
if(!fs.existsSync(headerCatalog)) throw new Error('Missing header catalog: '+headerCatalog);
const headers=readJson(headerCatalog);
const index=fs.existsSync(indexPath)?readJson(indexPath):{maps:{}};
const graphPath='data/generated/stoneage_world_graph_index.json';
const graph=readJson(graphPath);
const nodeSet=new Set((graph.weakComponents||[]).flatMap(c=>c.floors||[]));

function graphEvidence(floor){
  const edges=(graph.directedFloorEdges||[]).filter(e=>e.fromFloor===floor||e.toFloor===floor);
  return {
    nodePresent:nodeSet.has(floor),
    directedEdgeCount:edges.length,
    outboundRows:edges.filter(e=>e.fromFloor===floor&&e.toFloor!==floor).reduce((n,e)=>n+e.rowCount,0),
    inboundRows:edges.filter(e=>e.toFloor===floor&&e.fromFloor!==floor).reduce((n,e)=>n+e.rowCount,0),
    linkedFloors:[...new Set(edges.flatMap(e=>[e.fromFloor,e.toFloor]).filter(x=>x!==floor))].sort((a,b)=>a-b)
  };
}

const sourceMapByFloor=new Map();
for(const m of headers.maps||[]){
  const f=Number(m.floorId);
  const arr=sourceMapByFloor.get(f)||[];
  arr.push(m);
  sourceMapByFloor.set(f,arr);
}

const results=[];
let generated=0,already=0,blocked=0;
for(const c of CANDIDATES){
  const evidence=graphEvidence(c.floor);
  const existing=index.maps?.[String(c.floor)];
  if(existing){
    already++;
    results.push({
      floor:c.floor,
      branch:c.branch,
      status:'already-verified',
      graph:evidence,
      runtimePath:existing.path,
      sourcePath:existing.sourcePath,
      sourceBlobSha:existing.sourceBlobSha,
      width:existing.width,
      height:existing.height
    });
    continue;
  }

  const matches=sourceMapByFloor.get(c.floor)||[];
  if(matches.length!==1){
    blocked++;
    results.push({
      floor:c.floor,
      branch:c.branch,
      status:'source-header-ambiguous-or-missing',
      graph:evidence,
      matches:matches.map(m=>({path:m.path,blobSha:m.blobSha,width:m.width,height:m.height,fileBytes:m.fileBytes}))
    });
    continue;
  }

  const h=matches[0];
  const sourcePath=path.posix.join('gmsv/data/map',h.path.replaceAll(path.sep,'/'));
  const outPath=path.join('data/generated',`stoneage_map_${c.floor}.json`);
  try{
    execFileSync(process.execPath,[
      'tools/generate_verified_map_runtime.mjs',
      '--floor',String(c.floor),
      '--source-root',sourceRoot,
      '--source-path',sourcePath,
      '--out',outPath,
      '--index',indexPath
    ],{stdio:'inherit'});
    const generatedMap=readJson(outPath);
    if(generatedMap.source?.blobSha!==h.blobSha) throw new Error('generated source SHA mismatch');
    if(Number(generatedMap.floorId)!==c.floor) throw new Error('generated floor mismatch');
    if(Number(generatedMap.width)!==Number(h.width)||Number(generatedMap.height)!==Number(h.height)){
      throw new Error('generated dimensions mismatch');
    }
    generated++;
    results.push({
      floor:c.floor,
      branch:c.branch,
      status:'generated',
      graph:evidence,
      runtimePath:path.relative(process.cwd(),outPath).replaceAll(path.sep,'/'),
      sourcePath,
      sourceBlobSha:h.blobSha,
      width:h.width,
      height:h.height,
      tileCount:Number(generatedMap.tileCount),
      objectCount:Number(generatedMap.objectCount)
    });
  }catch(error){
    blocked++;
    console.error(JSON.stringify({floor:c.floor,status:'runtime-generation-blocked',error:String(error?.message||error)},null,2));
    results.push({
      floor:c.floor,
      branch:c.branch,
      status:'runtime-generation-blocked',
      graph:evidence,
      sourcePath,
      sourceBlobSha:h.blobSha,
      width:h.width,
      height:h.height,
      error:String(error?.message||error)
    });
    if(!allowPartial) break;
  }
}

const refreshedIndex=fs.existsSync(indexPath)?readJson(indexPath):index;
const corePresent=CORE_WORLD_RUNTIME.filter(f=>!!refreshedIndex.maps?.[String(f)]);
const manifest={
  format:'stoneage-main-world-map-coverage-wave1-v1',
  generatedAt:new Date().toISOString(),
  source:{repository:SOURCE_REPO,ref:FIXED_REF,headerScanner:'tools/check_v314_stoneage_map_headers.mjs'},
  purpose:'Promote source-backed main-world map floors into the canonical map runtime. No synthetic map, warp, remap, or cross-version substitution is permitted.',
  baseline:{
    sourceMapBlobCount:1284,
    sourceMapHeaderFloorCount:1250,
    mapwarpRows:5457,
    mapwarpMissingMapFloorRows:0,
    mapwarpOutOfBoundsRows:0,
    existingCoreWorldRuntimeFloors:CORE_WORLD_RUNTIME,
    existingCoreWorldRuntimeCount:corePresent.length
  },
  wave:{
    targetCount:CANDIDATES.length,
    candidateFloors:CANDIDATES.map(x=>x.floor),
    generatedCount:generated,
    alreadyVerifiedCount:already,
    blockedCount:blocked,
    promotedCoreWorldRuntimeFloors:[...new Set([...CORE_WORLD_RUNTIME,...results.filter(r=>r.status==='generated'||r.status==='already-verified').map(r=>r.floor)])].sort((a,b)=>a-b)
  },
  candidates:results,
  promotionGate:{
    exactLS2MAPHeader:true,
    exactFixedSourceRef:FIXED_REF,
    exactBlobSha:true,
    mapsetImageCoverage:'required by generate_verified_map_runtime.mjs',
    battlemapCandidateCoverage:'required by generate_verified_map_runtime.mjs',
    runtimeIndexAdmission:'required',
    coordinateLevelRouteProof:'separate gate; not implied by map generation',
    idleRouteAdmission:'separate gate; not implied by map generation'
  }
};

fs.mkdirSync(path.dirname(outManifest),{recursive:true});
fs.writeFileSync(outManifest,JSON.stringify(manifest,null,2)+'\n');

console.log(JSON.stringify({
  pass:allowPartial?generated+already>0:blocked===0,
  generated,
  alreadyVerified:already,
  blocked,
  outManifest,
  runtimeIndex:indexPath
},null,2));

if(blocked>0&&!allowPartial) process.exit(1);
