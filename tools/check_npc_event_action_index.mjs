#!/usr/bin/env node
import fs from 'node:fs';
const j=JSON.parse(fs.readFileSync('data/generated/stoneage_npc_event_action_index.json','utf8'));
function fail(m){console.error('NPC event action regression FAILED:',m);process.exit(1);}
if(j.format!=='stoneage-npc-event-action-index-v1')fail('format drift');
if(j.statistics.npcFiles!==3960)fail('npc file checkpoint drift');
if(j.statistics.sourceActionKeyCount!==38)fail('source action key checkpoint drift');
if(j.statistics.actionKeysObserved!==16)fail('observed action key checkpoint drift');
if(j.statistics.totalActionKeyMatches!==4860)fail('action match checkpoint drift');
if(j.statistics.conditionCounts.ENDEV!==1962)fail('ENDEV checkpoint drift');
if(j.statistics.conditionCounts.ITEM!==2379)fail('ITEM condition checkpoint drift');
if(j.statistics.itemReferenceCounts.DelItem!==719)fail('DelItem unique reference checkpoint drift');
console.log(JSON.stringify({pass:true,npcFiles:j.statistics.npcFiles,actionMatches:j.statistics.totalActionKeyMatches,ENDEV:j.statistics.conditionCounts.ENDEV,ITEM:j.statistics.conditionCounts.ITEM}));