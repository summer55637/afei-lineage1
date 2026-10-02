#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
  BROWSER_WORLD_ENCOUNTER_ENEMY_RUNTIME_FORMAT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';
import { generateEnemyRoster } from '../src/stoneage_browser_world_encounter_enemy_runtime.mjs';

const readJson=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const targetIndex=readJson('data/generated/stoneage_start_encounter_target_index.json');
const groupCatalog=readJson('data/generated/stoneage_start_encounter_group_runtime.json');

const state=freshPersistentState({playerId:'v384'});
state.world.position={floorId:100,x:610,y:538};
state.idle.enabled=true;
state.idle.mode='encounter_pending';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
const controller=createBrowserStateController({state,encounterTargetIndex:targetIndex,encounterGroupCatalog:groupCatalog});

let selected=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,encounterId:65,groupRoll:2});
assert.equal(selected.ok,true,JSON.stringify(selected));
assert.equal(selected.group.groupId,94);

let result=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  encounterId:65,
  groupId:94,
  entryMaxRoll:4,
  enemyRolls:[0,0,1,1]
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.handled,true);
assert.equal(result.stage,'enemy-generated');
assert.equal(result.format,BROWSER_WORLD_ENCOUNTER_ENEMY_RUNTIME_FORMAT);
assert.equal(result.group.groupId,94);
assert.equal(result.enemyEntryMax,4);
assert.equal(result.requestedEntryMax,4);
assert.equal(result.finalEntryMax,4);
assert.equal(result.createEnemyNum,20);
assert.deepEqual(result.team.map(x=>x.enemyId),[120,120,123,123]);
assert.equal(result.completed,true);
const landingGroup=groupCatalog.groups.find(x=>x.groupId===240);
const landingEnemy=landingGroup.members.find(x=>x.enemyId===382).enemy;
assert.equal(landingEnemy.ai.format,'stoneage-enemy-ai-source-v1');
assert.equal(landingEnemy.ai.attackWeight,20);
assert.equal(landingEnemy.ai.targetType,1);
assert.equal(landingEnemy.ai.selectMode,1);
assert.equal(landingEnemy.ai.guardWeight,0);
assert.equal(landingEnemy.ai.escapeWeight,1);
assert.deepEqual(landingEnemy.ai.skillWeights,[0,0,0,0,0,0,0]);
assert.deepEqual(landingEnemy.dropTable,[{slot:1,itemId:1234,probability:300,rollMin:0,rollMax:999,denominator:1000}]);
assert.equal(result.battleStarted,false);
assert.equal(result.persistentMutation,false);
assert.equal(result.state.revision,0);

selected=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,encounterId:65,groupRoll:0});
assert.equal(selected.ok,true,JSON.stringify(selected));
assert.equal(selected.group.groupId,89);
result=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  encounterId:65,
  groupId:89,
  entryMaxRoll:1,
  enemyRolls:[0]
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.deepEqual(result.team.map(x=>x.enemyId),[120]);
assert.equal(result.enemyEntryMax,4);

selected=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,encounterId:65,groupRoll:2});
assert.equal(selected.ok,true,JSON.stringify(selected));
result=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  encounterId:65,
  groupId:94,
  entryMaxRoll:0,
  enemyRolls:[0]
});
assert.equal(result.ok,false);
assert.equal(result.reason,'entry-max-rng-required-or-out-of-range');
assert.equal(controller.getState().revision,0);

result=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  encounterId:65,
  groupId:94,
  entryMaxRoll:4,
  enemyRolls:[0]
});
assert.equal(result.ok,false);
assert.equal(result.reason,'enemy-rng-required-or-out-of-range');
assert.equal(controller.getState().revision,0);

const bigState=freshPersistentState({playerId:'v384-big'});
const group349=groupCatalog.groups.find(g=>g.groupId===349);
assert.ok(group349);
const bigEncounter={floorId:200,x:371,y:866,encounterId:222,enemyMax:5,groupIds:[349],groupProbs:[1]};
const bigResult=generateEnemyRoster(bigEncounter,{...group349,groupId:349,weight:1},{entryMaxRoll:4,enemyRolls:[10,10,0,0]});
assert.equal(bigResult.ok,true,JSON.stringify(bigResult));
assert.equal(bigResult.team.length,4);
assert.deepEqual(bigResult.team.map(x=>x.enemyId),[474,474,473,473]);
assert.equal(bigResult.team[0].size,1);
assert.equal(bigResult.team[1].size,1);
assert.equal(bigResult.team[2].size,0);
assert.equal(bigResult.team[3].size,0);

const special=generateEnemyRoster({encounterId:1,enemyMax:1},{groupId:1,weight:1,members:[{slot:1,enemyId:945,createProb:1,enemy:{enemyId:945,createMaxNum:1,createMinNum:1,base:{size:0}}}]},{entryMaxRoll:1,enemyRolls:[0]});
assert.equal(special.ok,false);
assert.equal(special.reason,'random-enemy-replacement-runtime-required');
assert.equal(bigState.revision,0);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_WORLD_ENCOUNTER_ENEMY_RUNTIME_FORMAT,
  action:ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  encounter65Group94:{entryMax:4,team:[120,120,123,123]},
  encounter222Group349BigTeam:[474,474,473,473],
  randomEnemyFailClosed:true,
  persistentMutation:false,
  battleStarted:false
},null,2));
