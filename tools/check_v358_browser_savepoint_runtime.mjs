#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { ACTION_NPC_SAVEPOINT_SET, ACTION_NPC_SAVEPOINT_CONFIRM, BROWSER_SAVEPOINT_RUNTIME_FORMAT, createBrowserSavePointRuntime, applySavePoint, resolveSavePointBinding } from '../src/stoneage_browser_savepoint_runtime.mjs';
import { createBrowserStateController, BROWSER_STATE_CONTROLLER_FORMAT } from '../src/stoneage_browser_state_controller.mjs';
import fixtureCatalog from './fixtures/npc-savepoint/savepoint-catalog.json' with { type: 'json' };
import worldNpcIndex from './fixtures/npc-savepoint/world-index.json' with { type: 'json' };

const fixedSource={repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'};
const moduleAudit={format:'stoneage-world-npc-functionset-audit-v1',fixedSource,sourceFunctionSets:['SavePoint']};
const npc={floor:3000,npc:[20,20],path:'fixture/savepoint.create',blockIndex:0,template:'npcgen_savepoint',functionSet:'SavePoint',services:[{functionSet:'SavePoint',sourceStatus:'known'}]};
const player={floor:3000,x:20,y:21,facingCell:[3000,20,20]};
const state=freshPersistentState({now:()=> '2026-09-30T18:20:00+08:00'});
const runtime=createBrowserSavePointRuntime({moduleAudit,savePointCatalog:fixtureCatalog});
const generatedPath=new URL('../data/generated/stoneage_npc_savepoint_source_index.json',import.meta.url);
if(fs.existsSync(generatedPath)){ const generated=JSON.parse(fs.readFileSync(generatedPath,'utf8')); assert.deepEqual(generated.statistics,{savePointInstanceCount:28,unresolvedCount:0,noItemCount:0,itemRequiredCount:27,confirmOnlyCount:1}); }

assert.equal(runtime.ok,true); assert.equal(runtime.format,BROWSER_SAVEPOINT_RUNTIME_FORMAT);
const bound=resolveSavePointBinding(npc,fixtureCatalog);
assert.equal(bound.ok,true); assert.equal(bound.binding.elderId,2); assert.deepEqual(bound.binding.born,{floorId:3006,x:21,y:16});
const direct=runtime.dispatch(state,{type:ACTION_NPC_SAVEPOINT_SET,npc,player,savePointCatalog:fixtureCatalog,now:()=> '2026-09-30T18:20:01+08:00'});
assert.equal(direct.ok,true); assert.equal(direct.handled,true); assert.equal(direct.stage,'savepoint');
assert.deepEqual(direct.state.world.savePoint,{elderId:2,unlockedMask:4,position:{floorId:3006,x:21,y:16},sourceKey:'fixture/savepoint.create#0',sourceMode:'no-item'});
assert.equal(direct.state.world.position.floorId,null); assert.equal(direct.state.revision,1); assert.equal(state.world.savePoint,null);
const confirm=runtime.dispatch(direct.state,{type:ACTION_NPC_SAVEPOINT_CONFIRM,npc,player});
assert.equal(confirm.ok,false); assert.equal(confirm.stage,'confirmation'); assert.equal(confirm.reason,'savepoint-confirmation-only-applies-to-item-required-source-path');
const far=runtime.dispatch(state,{type:ACTION_NPC_SAVEPOINT_SET,npc,player:{floor:3000,x:25,y:20,facingCell:[3000,24,20]},savePointCatalog:fixtureCatalog});
assert.equal(far.ok,false); assert.equal(far.reason,'out-of-range'); assert.equal(state.world.savePoint,null);
const itemRequired=runtime.dispatch(state,{type:ACTION_NPC_SAVEPOINT_SET,npc,player,sourceBinding:{elderId:2,born:{floorId:3006,x:21,y:16},mode:'item-required'}});
assert.equal(itemRequired.ok,false); assert.equal(itemRequired.reason,'savepoint-item-requirement-not-yet-closed'); assert.equal(state.world.savePoint,null);
const confirmOnly=runtime.dispatch(state,{type:ACTION_NPC_SAVEPOINT_SET,npc,player,sourceBinding:{elderId:33,born:{floorId:30691,x:85,y:60},mode:'confirm-only'}});
assert.equal(confirmOnly.ok,false); assert.equal(confirmOnly.reason,'savepoint-confirmation-required');
const confirmed=runtime.dispatch(state,{type:ACTION_NPC_SAVEPOINT_CONFIRM,npc,player,sourceBinding:{elderId:33,born:{floorId:30691,x:85,y:60},mode:'confirm-only'}});
assert.equal(confirmed.ok,true); assert.deepEqual(confirmed.state.world.savePoint.unlockedElderIds,[33]); assert.equal(confirmed.state.world.savePoint.elderId,33);
const controller=createBrowserStateController({state,moduleAudit,worldNpcIndex,savePointCatalog:fixtureCatalog});
assert.equal(controller.format,BROWSER_STATE_CONTROLLER_FORMAT);
const viaController=await controller.dispatch({type:ACTION_NPC_SAVEPOINT_SET,targetCell:{floor:3000,x:20,y:20},serviceFunctionSet:'SavePoint',player:{floor:3000,x:20,y:21,facingCell:[3000,20,20]}});
assert.equal(viaController.ok,true); assert.equal(viaController.handled,true); assert.equal(viaController.stage,'savepoint');
assert.equal(viaController.worldNpc.functionSet,'SavePoint');
assert.equal(controller.getState().world.savePoint.elderId,2);
const wrongSource=createBrowserSavePointRuntime({moduleAudit:{...moduleAudit,fixedSource:{...fixedSource,ref:'wrong'}},savePointCatalog:fixtureCatalog});
assert.equal(wrongSource.ok,false);
console.log(JSON.stringify({pass:true,format:BROWSER_SAVEPOINT_RUNTIME_FORMAT,source:fixedSource,checks:['ID-to-mask','Born savepoint position','distance<=2 facing gate','no-item set','item-required fail-closed','fixed-source validation']}));
