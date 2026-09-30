#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { ACTION_NPC_HEALER_USE, BROWSER_HEALER_RUNTIME_FORMAT, createBrowserHealerRuntime, applyBrowserHealer } from '../src/stoneage_browser_healer_runtime.mjs';
import { createBrowserStateController, BROWSER_STATE_CONTROLLER_FORMAT } from '../src/stoneage_browser_state_controller.mjs';
import worldNpcIndex from './fixtures/npc-healer/world-index.json' with { type: 'json' };

const fixedSource={repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'};
const moduleAudit={format:'stoneage-world-npc-functionset-audit-v1',fixedSource,sourceFunctionSets:['Healer']};
assert.equal(BROWSER_HEALER_RUNTIME_FORMAT,'stoneage-browser-healer-runtime-v1');

const state=freshPersistentState({now:()=> '2026-09-30T18:00:00+08:00',playerId:'p1',playerName:'healer-test'});
state.player.maxHp=120; state.player.hp=31; state.player.maxMp=80; state.player.mp=7;
state.pets.petBox=[{id:'pet-1',level:1,hp:12,maxHp:60,mp:2,maxMp:30}];

const runtime=createBrowserHealerRuntime({moduleAudit});
assert.equal(runtime.ok,true);
assert.equal(runtime.format,BROWSER_HEALER_RUNTIME_FORMAT);
const direct=runtime.dispatch(state,{type:ACTION_NPC_HEALER_USE,npc:{floor:1000,npc:[10,10],functionSet:'Healer',template:'npcgen_healer',services:[{functionSet:'Healer',sourceStatus:'known'}]},player:{floor:1000,x:11,y:10},now:()=> '2026-09-30T18:00:01+08:00'});
assert.equal(direct.ok,true); assert.equal(direct.handled,true);
assert.equal(direct.state.player.hp,120); assert.equal(direct.state.player.mp,80);
assert.equal(direct.state.pets.petBox[0].hp,60); assert.equal(direct.state.pets.petBox[0].mp,30);
assert.equal(direct.state.revision,1);
assert.equal(state.player.hp,31); assert.equal(state.pets.petBox[0].hp,12);

const tooFar=runtime.dispatch(state,{type:ACTION_NPC_HEALER_USE,npc:{floor:1000,npc:[10,10],functionSet:'Healer',template:'npcgen_healer',services:[{functionSet:'Healer',sourceStatus:'known'}]},player:{floor:1000,x:14,y:10}});
assert.equal(tooFar.ok,false); assert.equal(tooFar.stage,'interaction-gate'); assert.equal(tooFar.reason,'out-of-range');
const widened=runtime.dispatch(state,{type:ACTION_NPC_HEALER_USE,npc:{floor:1000,npc:[10,10],functionSet:'Healer',template:'npcgen_healer',services:[{functionSet:'Healer',sourceStatus:'known'}]},player:{floor:1000,x:14,y:10},maxDistance:10});
assert.equal(widened.ok,false); assert.equal(widened.reason,'out-of-range');
assert.equal(state.player.hp,31);

const unresolved=runtime.dispatch(state,{type:ACTION_NPC_HEALER_USE,npc:{floor:1000,npc:[10,10],functionSet:'Bankman',template:'npcgen_bankman'},player:{floor:1000,x:11,y:10}});
assert.equal(unresolved.ok,false); assert.equal(unresolved.stage,'module-resolution'); assert.equal(unresolved.reason,'npc-healer-service-unresolved');

const badPet=JSON.parse(JSON.stringify(state)); badPet.pets.petBox=[{id:'pet-bad',hp:1,mp:1}];
const badPetResult=applyBrowserHealer(badPet,{now:()=> '2026-09-30T18:00:02+08:00'});
assert.equal(badPetResult.applied,false); assert.equal(badPetResult.reason,'pet-max-hp-mp-required'); assert.equal(badPetResult.state.player.hp,31);

const controller=createBrowserStateController({state,moduleAudit,worldNpcIndex,now:()=> '2026-09-30T18:00:03+08:00'});
assert.equal(controller.format,BROWSER_STATE_CONTROLLER_FORMAT);
const resolved=await controller.dispatch({type:ACTION_NPC_HEALER_USE,targetCell:{floor:1000,x:10,y:10},serviceFunctionSet:'Healer',player:{floor:1000,x:11,y:10}});
assert.equal(resolved.ok,true); assert.equal(resolved.handled,true); assert.equal(resolved.stage,'healer');
assert.equal(resolved.worldNpc.functionSet,'Healer');
assert.equal(controller.getState().player.hp,120); assert.equal(controller.getState().player.mp,80);
assert.equal(controller.getState().pets.petBox[0].hp,60); assert.equal(controller.getState().revision,1);

const blockedController=createBrowserStateController({state:freshPersistentState({now:()=> '2026-09-30T18:00:00+08:00'}),moduleAudit:{...moduleAudit,fixedSource:{...fixedSource,ref:'wrong-ref'}},worldNpcIndex});
const blocked=await blockedController.dispatch({type:ACTION_NPC_HEALER_USE,targetCell:{floor:1000,x:10,y:10},serviceFunctionSet:'Healer',player:{floor:1000,x:11,y:10}});
assert.equal(blocked.ok,false); assert.equal(blocked.stage,'healer-runtime'); assert.equal(blocked.reason,'dependency-validation-failed');

console.log(JSON.stringify({pass:true,format:BROWSER_HEALER_RUNTIME_FORMAT,action:ACTION_NPC_HEALER_USE,source:fixedSource,checks:['player full hp/mp','pet full hp/mp','distance<=2 gate','service routing','fail-closed dependency','fail-closed pet schema','world-npc controller integration']}));
