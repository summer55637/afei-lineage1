#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { ACTION_NPC_SAVEPOINT_SET, ACTION_NPC_SAVEPOINT_CONFIRM, BROWSER_SAVEPOINT_RUNTIME_FORMAT, createBrowserSavePointRuntime, selectSavePointItemRequirement } from '../src/stoneage_browser_savepoint_runtime.mjs';

const fixedSource={repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'};
const moduleAudit={format:'stoneage-world-npc-functionset-audit-v1',fixedSource,sourceFunctionSets:['SavePoint']};
const npc={floor:1000,npc:[10,10],path:'genout/sp.create',blockIndex:0,template:'npcgen_savepoint',functionSet:'SavePoint'};
const player={floor:1000,x:10,y:11,facingCell:[1000,10,10]};
const runtime=createBrowserSavePointRuntime({moduleAudit});
assert.equal(runtime.ok,true);
assert.equal(runtime.format,BROWSER_SAVEPOINT_RUNTIME_FORMAT);

const itemBinding={elderId:4,born:{floorId:1000,x:92,y:99},mode:'item-required',sourceKey:'genout/sp.create#0',getItem:'1930*1,1931*1,1932*1,1933*1,1934*1,1935*1',itemRequirements:[[{itemId:1930,count:1}],[{itemId:1931,count:1}],[{itemId:1932,count:1}],[{itemId:1933,count:1}],[{itemId:1934,count:1}],[{itemId:1935,count:1}]]};
const state=freshPersistentState({now:()=> '2026-09-30T18:40:00+08:00'});
state.inventory.playerItemSlots[9]=101;
state.inventory.playerItemSlots[10]=102;
state.inventory.itemRuntime.slots['101']={use:true,itemId:1930,owner:'player',pile:5,data:[1930]};
state.inventory.itemRuntime.slots['102']={use:true,itemId:9999,owner:'player',pile:7,data:[9999]};
state.inventory.piles['1930']=5;
state.inventory.piles['9999']=7;
const set=runtime.dispatch(state,{type:ACTION_NPC_SAVEPOINT_SET,npc,player,sourceBinding:itemBinding});
assert.equal(set.ok,false); assert.equal(set.handled,false); assert.equal(set.stage,'confirmation'); assert.equal(set.reason,'savepoint-confirmation-required');
assert.equal(set.itemRequirement.branchIndex,0); assert.deepEqual(set.itemRequirement.selectedSlots,[9]);
assert.equal(state.inventory.playerItemSlots[9],101); assert.equal(state.revision,0);
const confirmed=runtime.dispatch(state,{type:ACTION_NPC_SAVEPOINT_CONFIRM,npc,player,sourceBinding:itemBinding,now:()=> '2026-09-30T18:40:01+08:00'});
assert.equal(confirmed.ok,true); assert.equal(confirmed.handled,true);
assert.deepEqual(confirmed.consumedItems,[{slot:9,existingIndex:101,itemId:1930,previousPile:5,remainingPile:4,removed:false}]);
assert.equal(confirmed.state.inventory.playerItemSlots[9],101);
assert.equal(confirmed.state.inventory.itemRuntime.slots['101'].pile,4);
assert.equal(confirmed.state.inventory.piles['1930'],4);
assert.equal(confirmed.state.inventory.playerItemSlots[10],102);
assert.equal(confirmed.state.world.savePoint.elderId,4);
assert.deepEqual(confirmed.state.world.savePoint.position,{floorId:1000,x:92,y:99});
assert.equal(confirmed.state.revision,1);
const repeat=runtime.dispatch(confirmed.state,{type:ACTION_NPC_SAVEPOINT_SET,npc,player,sourceBinding:itemBinding});
assert.equal(repeat.ok,true); assert.equal(repeat.state.revision,2); assert.equal(repeat.state.inventory.playerItemSlots[10],102);

const insufficient=freshPersistentState();
insufficient.inventory.playerItemSlots[9]=201;
insufficient.inventory.itemRuntime.slots['201']={use:true,itemId:1930,owner:'player',pile:99,data:[1930]};
const oneStack=selectSavePointItemRequirement(insufficient,{itemRequirements:[[{itemId:1930,count:2}]]});
assert.equal(oneStack.ok,false); assert.equal(oneStack.reason,'savepoint-item-requirement-not-met');
insufficient.inventory.playerItemSlots[10]=202;
insufficient.inventory.itemRuntime.slots['202']={use:true,itemId:1930,owner:'player',pile:1,data:[1930]};
const twoObjects=selectSavePointItemRequirement(insufficient,{itemRequirements:[[{itemId:1930,count:2}]]});
assert.equal(twoObjects.ok,true); assert.deepEqual(twoObjects.selectedSlots,[9,10]);

const orState=freshPersistentState();
orState.inventory.playerItemSlots[9]=301;
orState.inventory.itemRuntime.slots['301']={use:true,itemId:1931,owner:'player',pile:1,data:[1931]};
const orSelection=selectSavePointItemRequirement(orState,{itemRequirements:[[{itemId:1930,count:1}],[{itemId:1931,count:1}]]});
assert.equal(orSelection.ok,true); assert.equal(orSelection.branchIndex,1); assert.deepEqual(orSelection.selectedSlots,[9]);

const actualCatalogPath=new URL('../data/generated/stoneage_npc_savepoint_source_index.json',import.meta.url);
if(fs.existsSync(actualCatalogPath)){
  const catalog=JSON.parse(fs.readFileSync(actualCatalogPath,'utf8'));
  assert.deepEqual(catalog.statistics,{savePointInstanceCount:28,unresolvedCount:0,noItemCount:0,itemRequiredCount:27,confirmOnlyCount:1});
  const actual=Object.values(catalog.bySourceKey??{}).find(row=>row.mode==='item-required');
  assert.ok(actual); assert.ok(Array.isArray(actual.itemRequirements)&&actual.itemRequirements.length>0);
  const malformed=Object.values(catalog.bySourceKey??{}).find(row=>String(row.sourceArgPath??'')==='genout/sp_200_449_982');
  assert.ok(malformed);
  assert.ok(Array.isArray(malformed.itemRequirementIssues)&&malformed.itemRequirementIssues.some(x=>x.reason==='savepoint-getitem-zero-count-branch-impossible'));
  assert.ok(Array.isArray(actual.itemRequirements[0])&&actual.itemRequirements[0].length>0);
}

console.log(JSON.stringify({pass:true,format:BROWSER_SAVEPOINT_RUNTIME_FORMAT,checks:['GetItem comma=OR / ampersand=AND','count means distinct item objects in slots 9..23','pile is not substituted for source object count','first satisfied OR branch selected','SET confirmation is non-mutating','CONFIRM atomically consumes selected item objects then sets savepoint','unlocked elder repeat skips item requirement','fixed-source generated catalog exposes parsed requirements']}));