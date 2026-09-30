#!/usr/bin/env node
import fs from 'node:fs';
const j=JSON.parse(fs.readFileSync('data/generated/stoneage_event_owner_index.json','utf8'));
function fail(m){console.error('Event owner index regression FAILED:',m);process.exit(1);}
if(j.format!=='stoneage-event-owner-index-v1')fail('format drift');
if(j.fixedSource?.ref!=='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56')fail('fixed source ref drift');
for(const [k,v] of Object.entries({npcFiles:3960,uniqueEventIds:160,eventReferenceOccurrences:10552,missionMatchedIds:4,jobdailyMatchedIds:117,unresolvedFromMissionJobdaily:43,startupDefaultMatchedUnresolvedIds:4,encounterOwnedUnresolvedIds:1,ownerlessUnresolvedIds:38})){if(j.statistics?.[k]!==v)fail(k+' checkpoint drift');}
const expect=[48,49,50,51];
if(JSON.stringify(j.startupOwnedUnresolvedIds)!==JSON.stringify(expect))fail('startup unresolved owner set drift');
if((j.ownerlessUnresolvedIds||[]).length!==38)fail('ownerless list length drift');
console.log(JSON.stringify({pass:true,uniqueEventIds:j.statistics.uniqueEventIds,eventReferenceOccurrences:j.statistics.eventReferenceOccurrences,unresolved:j.statistics.unresolvedFromMissionJobdaily,startupOwned:j.statistics.startupDefaultMatchedUnresolvedIds,encounterOwned:j.statistics.encounterOwnedUnresolvedIds,ownerless:j.statistics.ownerlessUnresolvedIds}));