#!/usr/bin/env node
import fs from 'node:fs';
function load(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function fail(m){console.error('NPC service index regression FAILED:',m);process.exit(1);}
const j=load('data/generated/stoneage_npc_service_index.json');
if(j.format!=='stoneage-npc-service-index-v1') fail('format drift');
if(j.fixedSource?.ref!=='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56') fail('fixed ref drift');
if(j.statistics?.serviceFunctionSets!==55) fail('service functionset count drift');
if(j.statistics?.totalServiceInstances!==9335) fail('service binding count drift');
if(j.statistics?.uniqueServiceFloors!==1031) fail('service floor count drift');
const cat=j.categorySummary||{};
if(cat.shop?.instanceCount!==557) fail('shop binding checkpoint drift');
if(cat.movement?.instanceCount!==4495) fail('movement binding checkpoint drift');
if(cat.recovery?.instanceCount!==67) fail('recovery binding checkpoint drift');
console.log(JSON.stringify({pass:true,serviceFunctionSets:j.statistics.serviceFunctionSets,totalServiceBindings:j.statistics.totalServiceInstances,uniqueServiceFloors:j.statistics.uniqueServiceFloors}));
