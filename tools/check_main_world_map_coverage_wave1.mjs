#!/usr/bin/env node
import fs from 'node:fs';

const manifest=JSON.parse(fs.readFileSync('data/generated/stoneage_main_world_map_coverage_wave1.json','utf8'));
const index=JSON.parse(fs.readFileSync('data/generated/stoneage_map_runtime_index.json','utf8'));

if(manifest.format!=='stoneage-main-world-map-coverage-wave1-v1') throw new Error('unexpected manifest format');
if(manifest.source?.repository!=='gavinlinasd/StoneAge') throw new Error('unexpected source repository');
if(manifest.source?.ref!=='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56') throw new Error('unexpected pinned source ref');

const requiredCore=[100,200,300,400,1000,2000,3000,4000];
for(const floor of requiredCore){
  if(!index.maps?.[String(floor)]) throw new Error(`required core runtime floor ${floor} missing`);
}

const generated=manifest.candidates.filter(x=>x.status==='generated');
for(const row of generated){
  const entry=index.maps?.[String(row.floor)];
  if(!entry) throw new Error(`generated floor missing from runtime index: ${row.floor}`);
  if(entry.sourcePath!==row.sourcePath) throw new Error(`source path mismatch: ${row.floor}`);
  if(entry.sourceBlobSha!==row.sourceBlobSha) throw new Error(`source SHA mismatch: ${row.floor}`);
  const map=JSON.parse(fs.readFileSync(entry.path,'utf8'));
  if(Number(map.floorId)!==row.floor) throw new Error(`map floor mismatch: ${row.floor}`);
  if(map.source?.blobSha!==row.sourceBlobSha) throw new Error(`map source SHA mismatch: ${row.floor}`);
  if(Number(map.width)!==Number(row.width)||Number(map.height)!==Number(row.height)) throw new Error(`map dimensions mismatch: ${row.floor}`);
}

const failed=manifest.candidates.filter(x=>x.status==='runtime-generation-blocked'||x.status==='source-header-ambiguous-or-missing');
if(failed.length && manifest.wave.generatedCount===0 && manifest.wave.alreadyVerifiedCount===0){
  throw new Error('wave produced no usable map runtime');
}

console.log(JSON.stringify({
  pass:true,
  wave:manifest.wave,
  generatedFloors:generated.map(x=>x.floor),
  blockedFloors:failed.map(x=>({floor:x.floor,status:x.status}))
},null,2));
