#!/usr/bin/env node
import fs from 'node:fs';
function load(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function fail(m){console.error('World NPC / map audit FAILED:',m);process.exit(1);}
const f=load('data/generated/stoneage_world_npc_functionset_audit.json');
if(f.format!=='stoneage-world-npc-functionset-audit-v1') fail('functionset audit format');
if(f.statistics.createBlocks!==7979) fail('create block checkpoint drift');
if(f.statistics.unresolvedTemplateRefs!==0) fail('template reference closure drift');
if(f.statistics.unknownFunctionSetCount!==20) fail('unknown functionset checkpoint drift');
const refs=load('data/generated/stoneage_world_npc_file_ref_audit.json');
if(refs.statistics.unresolvedFileRefs!==27) fail('unresolved file ref checkpoint drift');
const w=load('data/generated/stoneage_mapwarp_source_validation.json');
if(w.statistics.mapwarpRows!==5457) fail('mapwarp row checkpoint drift');
if(w.statistics.missingMapFloorRows!==0) fail('mapwarp missing floor regression');
if(w.statistics.outOfBoundsRows!==0) fail('mapwarp bounds regression');
if(w.statistics.oneWayRows!==2351) fail('mapwarp directionality checkpoint drift');
console.log(JSON.stringify({pass:true,createBlocks:f.statistics.createBlocks,unknownFunctionSets:f.statistics.unknownFunctionSetCount,unresolvedFileRefs:refs.statistics.unresolvedFileRefs,mapwarpRows:w.statistics.mapwarpRows,missingMapFloorRows:w.statistics.missingMapFloorRows,outOfBoundsRows:w.statistics.outOfBoundsRows}));
