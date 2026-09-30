#!/usr/bin/env node
import fs from 'node:fs';
const j=JSON.parse(fs.readFileSync('data/generated/stoneage_npc_item_acquisition_graph.json','utf8'));
function fail(m){console.error('NPC acquisition graph regression FAILED:',m);process.exit(1);}
if(j.format!=='stoneage-npc-item-acquisition-graph-v1')fail('format drift');
if(j.fixedSource?.ref!=='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56')fail('fixed ref drift');
for(const [k,v] of Object.entries({npcCreateInstances:7979,npcInstancesWithArg:3610,unresolvedArgFiles:23,eventBlocks:3772,itemActionEdges:5578,petActionEdges:500,eventStateActionEdges:218,itemConditionEdges:5421,uniqueEventNoNodes:124,sentinelEventNoMinusOneBlocks:3340,unresolvedItemActionEdges:300,unresolvedItemConditionEdges:105})){if(j.statistics?.[k]!==v)fail(k+' checkpoint drift');}
console.log(JSON.stringify({pass:true,npcCreateInstances:j.statistics.npcCreateInstances,npcInstancesWithArg:j.statistics.npcInstancesWithArg,eventBlocks:j.statistics.eventBlocks,itemActionEdges:j.statistics.itemActionEdges,itemConditionEdges:j.statistics.itemConditionEdges,realEventNos:j.statistics.uniqueEventNoNodes,sentinel:j.statistics.sentinelEventNoMinusOneBlocks}));