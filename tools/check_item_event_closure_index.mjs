#!/usr/bin/env node
import fs from 'node:fs';
const j=JSON.parse(fs.readFileSync('data/generated/stoneage_item_event_closure_index.json','utf8'));
function fail(m){console.error('Item/event closure regression FAILED:',m);process.exit(1);}
if(j.format!=='stoneage-item-event-closure-index-v2')fail('format drift');
if(j.fixedSource?.ref!=='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56')fail('fixed source ref drift');
for(const [k,v] of Object.entries({itemSourceRows:10737,parsedItemRows:10737,duplicateItemIds:0,totalNpcItemRefs:17010,uniqueItemIdsInNpcRefs:2301,resolvedItemIds:2065,unresolvedItemIds:236,resolvedReferenceOccurrences:16259,unresolvedReferenceOccurrences:751,eventReferenceOccurrences:7728,uniqueEventIds:158,missionLinkedEventIds:4,jobDailyLinkedEventIds:116,unresolvedEventIds:42})){if(j.statistics?.[k]!==v)fail(k+' checkpoint drift');}
const rc=j.statistics.referenceCounts||{};
for(const [k,v] of Object.entries({AddItem:{occurrences:361,uniqueIds:335},DelItem:{occurrences:3543,uniqueIds:1114},GetItem:{occurrences:1670,uniqueIds:734},GetRandItem:{occurrences:2505,uniqueIds:923},ITEM:{occurrences:8895,uniqueIds:1227},EntryItem:{occurrences:34,uniqueIds:5},CheckItem:{occurrences:2,uniqueIds:2}})){if(rc[k]?.occurrences!==v.occurrences||rc[k]?.uniqueIds!==v.uniqueIds)fail(k+' role checkpoint drift');}
console.log(JSON.stringify({pass:true,itemSourceRows:j.statistics.itemSourceRows,uniqueItemRefs:j.statistics.uniqueItemIdsInNpcRefs,resolved:j.statistics.resolvedItemIds,unresolved:j.statistics.unresolvedItemIds,unresolvedEvents:j.statistics.unresolvedEventIds}));