#!/usr/bin/env node
import fs from 'node:fs';
const j=JSON.parse(fs.readFileSync('data/generated/stoneage_aux_world_data_index.json','utf8'));
function fail(m){console.error('Aux world data regression FAILED:',m);process.exit(1);}
if(j.format!=='stoneage-aux-world-data-index-v1')fail('format drift');
if(j.fixedSource?.ref!=='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56')fail('fixed ref drift');
const n=k=>j.sources[k]?.statistics?.nonEmptyLines;
for(const [k,v] of Object.entries({mission:4,jobdaily:207,ride:13,leaderride:10,titleconfig:1,titlename:2,question:150,raceman:286,racequiz:82,memberpets:14,membershop:12,needitemeneny:128,contract:1}))if(n(k)!==v)fail(k+' checkpoint drift');
if(!Array.isArray(j.sources.mission.parsed)||j.sources.mission.parsed.length!==4)fail('mission parser missing');
if(!Array.isArray(j.sources.jobdaily.parsed)||j.sources.jobdaily.parsed.length!==207)fail('jobdaily parser missing');
if(!Array.isArray(j.sources.ride.parsed)||j.sources.ride.parsed.length!==13)fail('ride parser missing');
console.log(JSON.stringify({pass:true,mission:n('mission'),jobdaily:n('jobdaily'),ride:n('ride'),question:n('question'),raceman:n('raceman'),racequiz:n('racequiz'),memberpets:n('memberpets'),membershop:n('membershop'),needitemeneny:n('needitemeneny')}));