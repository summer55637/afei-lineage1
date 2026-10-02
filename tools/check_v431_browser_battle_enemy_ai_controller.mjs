#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_INITIALIZE,
  ACTION_BATTLE_ENEMY_AI_APPLY,
  ACTION_BATTLE_IDLE_STRATEGY_APPLY,
  ACTION_BATTLE_COMMAND_WAIT_STATUS,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';

const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const encounterIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json','utf8'));
const state=freshPersistentState({playerId:'v431-enemy-ai-controller'});
state.player.name='阿飛';
state.player.hp=100;state.player.maxHp=100;
state.player.mp=50;state.player.maxMp=50;
state.world.position={floorId:100,x:610,y:538};
state.idle.enabled=true;
state.idle.mode='encounter_pending';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
state.pets.petBox=[{id:'pet-1',petId:120,tempNo:113,name:'TestPet',level:3,hp:40,maxHp:40,mp:10,maxMp:10}];
state.pets.team=['pet-1'];
state.pets.activePetId='pet-1';

const sourceEnemyAi={format:'stoneage-enemy-ai-source-v1',raw:'at:1;1;1|gu:0|es:0|wa:0;0;0;0;0;0;0;',attackWeight:1,targetType:1,selectMode:1,guardWeight:0,magicWeight:0,escapeWeight:0,skillWeights:[0,0,0,0,0,0,0]};
const team=[{enemyId:120,size:0,createMaxNum:10,enemy:{tempNo:113,ai:sourceEnemyAi,dropTable:[]}}];
const encounter={floorId:100,x:610,y:538,encounterId:65};
const c=createBrowserStateController({state,idleRouteCatalog:routeCatalog,encounterTargetIndex:encounterIndex});

const built=await c.dispatch({type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,enemyTeam:team,groupId:94,battleFieldNo:0,encounter});
assert.equal(built.ok,true,JSON.stringify(built));
assert.equal(built.state.revision,1);
const initialized=await c.dispatch({type:ACTION_BATTLE_INITIALIZE,fixedLuck:0,surpriseRoll:100});
assert.equal(initialized.ok,true,JSON.stringify(initialized));
assert.equal(initialized.battleContext.mode,'battle');

const blocked=await c.dispatch({type:ACTION_BATTLE_ENEMY_AI_APPLY,actionRolls:[0],targetRolls:[0]});
assert.equal(blocked.ok,false,JSON.stringify(blocked));
assert.equal(blocked.stage,'battle-enemy-ai-wait-gate');
assert.equal(blocked.reason,'player-commands-not-ready');
assert.equal(c.getState().revision,1,'wait gate must not mutate Persistent State');

const playerStrategy=await c.dispatch({type:ACTION_BATTLE_IDLE_STRATEGY_APPLY,defaultTargetRoll:0,weaponKind:'none'});
assert.equal(playerStrategy.ok,true,JSON.stringify(playerStrategy));
assert.equal(playerStrategy.persistentMutation,false);
const applied=await c.dispatch({type:ACTION_BATTLE_ENEMY_AI_APPLY,actionRolls:[0],targetRolls:[0]});
assert.equal(applied.ok,true,JSON.stringify(applied));
assert.equal(applied.stage,'battle-enemy-ai-applied');
assert.equal(applied.commandCount,1);
assert.equal(applied.commands[0].action,'attack');
assert.equal(applied.commands[0].targetBid,0);
const enemy=applied.battleContext.sides[1].entries.find(entry=>entry?.sourceType==='enemy');
assert.equal(enemy.battleCommands[0],1);
assert.equal(enemy.battleCommands[1],0);
assert.equal(enemy.sourceBattleCharMode,3);
assert.equal(enemy.battleMode,'c_ok');
assert.equal(applied.persistentMutation,false);
assert.equal(applied.damageExecuted,false);
assert.equal(c.getState().revision,1,'enemy command commit is transient');
const ready=await c.dispatch({type:ACTION_BATTLE_COMMAND_WAIT_STATUS});
assert.equal(ready.ok,true,JSON.stringify(ready));
assert.equal(ready.ready,true);

console.log(JSON.stringify({pass:true,format:'stoneage-v431-browser-battle-enemy-ai-controller-v1',cases:['player command wait gate','enemy AI applies after player strategy','enemy attack command committed as C_OK','command wait becomes ready'],persistentMutation:false,damageExecuted:false},null,2));
