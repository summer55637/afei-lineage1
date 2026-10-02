#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_IDLE_EVENT,
  BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';
import { IDLE_EVENTS } from '../src/stoneage_idle_loop.mjs';
import { buildBattleContext, buildEnemyEntryLayout } from '../src/stoneage_browser_battle_context_runtime.mjs';

const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const encounterIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json','utf8'));

const state=freshPersistentState({playerId:'v386'});
state.player.name='阿飛';
state.player.hp=100;state.player.maxHp=100;
state.player.mp=50;state.player.maxMp=50;
state.world.position={floorId:100,x:610,y:538};
state.idle.enabled=true;
state.idle.mode='encounter_pending';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
state.pets.petBox=[{
  id:'pet-1',petId:120,tempNo:113,name:'TestPet',level:3,hp:40,maxHp:40,mp:10,maxMp:10
}];
state.pets.team=['pet-1'];
state.pets.activePetId='pet-1';

const team=[
  {enemyId:120,size:0,createMaxNum:10,enemy:{tempNo:113}},
  {enemyId:120,size:0,createMaxNum:10,enemy:{tempNo:113}},
  {enemyId:123,size:0,createMaxNum:10,enemy:{tempNo:114}},
  {enemyId:123,size:0,createMaxNum:10,enemy:{tempNo:114}}
];

const layout=buildEnemyEntryLayout(team);
assert.equal(layout.ok,true);
assert.equal(layout.entries[0],null);
assert.equal(layout.entries[4],null);
assert.equal(layout.entries[5].enemyId,120);
assert.equal(layout.entries[6].enemyId,120);
assert.equal(layout.entries[7].enemyId,123);
assert.equal(layout.entries[8].enemyId,123);
assert.equal(layout.entries[9],null);

const direct=buildBattleContext({
  player:state.player,
  activePet:state.pets.petBox[0],
  team,
  encounter:{floorId:100,x:610,y:538,encounterId:65},
  groupId:94,
  battleFieldNo:0
});
assert.equal(direct.ok,true,JSON.stringify(direct));
assert.equal(direct.context.type,1);
assert.equal(direct.context.dpbattle,0);
assert.equal(direct.context.norisk,0);
assert.equal(direct.context.flg,0);
assert.equal(direct.context.fieldAtt,0);
assert.equal(direct.context.attCount,0);
assert.deepEqual(direct.context.sourceEntryInit,{escape:0,getitem:[-1,-1,-1]});
assert.equal(direct.context.sides[0].entries[0].battleSlot,0);
assert.equal(direct.context.sides[0].entries[5].battleSlot,5);
assert.equal(direct.context.sides[1].entries[5].bid,15);
assert.equal(direct.context.sides[1].entries[8].bid,18);
assert.equal(direct.persistentMutation,false);
assert.equal(direct.battleStarted,false);

const controller=createBrowserStateController({
  state,
  idleRouteCatalog:routeCatalog,
  encounterTargetIndex:encounterIndex,
  now:()=> '2026-10-01T06:00:00.000Z'
});

let result=await controller.dispatch({
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  enemyTeam:team,
  groupId:94,
  battleFieldNo:0,
  encounter:{floorId:100,x:610,y:538,encounterId:65}
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.handled,true);
assert.equal(result.stage,'battle-context-started');
assert.equal(result.format,BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT);
assert.equal(result.idleStateBefore,'encounter_pending');
assert.equal(result.idleStateAfter,'in_battle');
assert.equal(result.state.idle.mode,'in_battle');
assert.equal(result.state.revision,1);
assert.equal(result.context.sides[0].entries[0].characterId,'v386');
assert.equal(result.context.sides[0].entries[0].escape,0);
assert.deepEqual(result.context.sides[0].entries[0].getitem,[-1,-1,-1]);
assert.equal(result.context.sides[0].entries[5].characterId,'pet-1');
assert.equal(result.context.sides[1].entries[5].enemyId,120);
assert.equal(result.context.sides[1].entries[5].escape,0);
assert.deepEqual(result.context.sides[1].entries[5].getitem,[-1,-1,-1]);
assert.equal(result.context.sides[1].entries[8].enemyId,123);
assert.equal(result.state.battleContext,undefined);
assert.ok(controller.getBattleContext());
assert.equal(result.idleCommit.verification.ok,true);
assert.deepEqual(controller.getBattleContext().sides[1].entries.map(e=>e?.bid??null),[null,null,null,null,null,15,16,17,18,null]);

const duplicate=await controller.dispatch({
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  enemyTeam:team,groupId:94,battleFieldNo:0,
  encounter:{floorId:100,x:610,y:538,encounterId:65}
});
assert.equal(duplicate.ok,false);
assert.equal(duplicate.reason,'battle-context-clear-required');
assert.equal(controller.getState().revision,1);

result=await controller.dispatch({
  type:ACTION_IDLE_EVENT,
  event:IDLE_EVENTS.BATTLE_FINISHED,
  payload:{},
  expectedRevision:1,
  now:'2026-10-01T06:01:00.000Z'
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.state.idle.mode,'settlement');
assert.equal(result.state.revision,2);
assert.ok(controller.getBattleContext());
assert.equal(result.verification.ok,true);

const deadPet=buildBattleContext({
  player:state.player,
  activePet:{id:'dead',petId:120,hp:0,maxHp:40},
  team,battleFieldNo:0
});
assert.equal(deadPet.ok,false);
assert.equal(deadPet.reason,'active-pet-dead-cannot-start-battle');

const missingField=buildBattleContext({player:state.player,team,battleFieldNo:null});
assert.equal(missingField.ok,false);
assert.equal(missingField.reason,'battle-field-no-required');

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,
  action:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  idleTransition:'encounter_pending -> in_battle',
  playerSlot:0,
  petSlot:5,
  enemyBids:[15,16,17,18],
  persistentBattleContext:false,
  contextClearedOnBattleFinish:true,
  battleDamageExecuted:false
},null,2));
