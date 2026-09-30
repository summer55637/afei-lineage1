#!/usr/bin/env node
import fs from 'node:fs';
const j=JSON.parse(fs.readFileSync('data/generated/stoneage_item_reward_gap_clusters.json','utf8'));
function fail(m){console.error('Item reward gap regression FAILED:',m);process.exit(1);}
if(j.format!=='stoneage-item-reward-gap-cluster-v2')fail('format drift');
if(j.fixedSource?.ref!=='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56')fail('fixed ref drift');
const s=j.statistics||{};
for(const [k,v] of Object.entries({npcFiles:3960,totalRewardOccurrences:2866,unresolvedRewardOccurrences:294,resolvedRewardOccurrences:2572,uniqueUnresolvedRewardIds:163,clusterCount:3})){if(s[k]!==v)fail(k+' checkpoint drift');}
if(s.roleSummary?.AddItem?.occurrences!==24||s.roleSummary?.AddItem?.uniqueIds!==19)fail('AddItem reward checkpoint drift');
if(s.roleSummary?.GetRandItem?.occurrences!==274||s.roleSummary?.GetRandItem?.uniqueIds!==146)fail('GetRandItem reward checkpoint drift');
console.log(JSON.stringify({pass:true,totalRewardOccurrences:s.totalRewardOccurrences,unresolvedRewardOccurrences:s.unresolvedRewardOccurrences,uniqueUnresolvedRewardIds:s.uniqueUnresolvedRewardIds,clusterCount:s.clusterCount}));