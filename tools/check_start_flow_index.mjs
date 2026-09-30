#!/usr/bin/env node
import fs from 'node:fs';
const j=JSON.parse(fs.readFileSync('data/generated/stoneage_start_flow_index.json','utf8'));
function fail(m){console.error('Start flow index regression FAILED:',m);process.exit(1);}
if(j.format!=='stoneage-start-flow-index-v1')fail('format drift');
if(j.fixedSource?.ref!=='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56')fail('fixed source drift');
if(j.statistics?.hometowns!==4)fail('hometown count drift');
if(j.statistics?.startFloorCount!==4)fail('start floor count drift');
if(j.statistics?.npcInstancesOnStartFloors!==46)fail('start NPC count drift');
const h=j.hometowns||[];
const expect=[[0,'samugiru',1006,15,22],[1,'marinasu',2006,20,16],[2,'jaja',3006,21,16],[3,'karutarna',4006,14,20]];
if(h.length!==4)fail('hometown rows missing');
for(const [i,e] of expect.entries()){const x=h[i];if(x.hometown!==e[0]||x.elder!==e[1]||x.floor!==e[2]||x.x!==e[3]||x.y!==e[4])fail('hometown '+e[0]+' drift');}
if(!j.newPlayerPet?.enabledBySourceFlag)fail('new player pet source flag missing');
console.log(JSON.stringify({pass:true,hometowns:j.statistics.hometowns,startFloors:j.statistics.startFloorCount,npcInstances:j.statistics.npcInstancesOnStartFloors,serviceCounts:j.statistics.serviceCounts}));