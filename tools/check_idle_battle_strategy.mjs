#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  freshPersistentState,
  normalizePersistentState
} from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_BATTLE_INITIALIZE,
  ACTION_BATTLE_COMMAND_WAIT_STATUS,
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_IDLE_STRATEGY_APPLY,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';
import {
  applyIdleBattleStrategy,
  DEFAULT_IDLE_BATTLE_STRATEGY,
  IDLE_BATTLE_STRATEGY_MODE
} from '../src/stoneage_browser_idle_battle_strategy_runtime.mjs';

const makeEntry=(bid,sourceType,overrides={})=>({
  sourceType,
  battleSlot:bid%10,
  bid,
  battleSide:bid>=10?1:0,
  characterId:sourceType+'-'+bid,
  hp:100,
  maxHp:100,
  sourceBattleCharMode:2,
  battleMode:'c_wait',
  battleCommands:[-1,-1,-1],
  isAttacked:1,
  isDead:false,
  ...overrides
});
function makeContext({enemies=2,playerOverrides={},pet=true}={}){
  const players=Array(10).fill(null);
  players[0]=makeEntry(0,'player',{characterId:'player-1',...playerOverrides});
  if(pet)players[5]=makeEntry(5,'pet',{characterId:'pet-1'});
  const foes=Array(10).fill(null);
  for(let i=0;i<enemies;i++)foes[i]=makeEntry(10+i,'enemy',{characterId:'enemy-'+i});
  return {
    format:'stoneage-browser-battle-context-runtime-v1',
    context:{mode:'battle',sides:[
      {side:0,type:0,entries:players},
      {side:1,type:1,entries:foes}
    ]}
  };
}

assert.deepEqual(DEFAULT_IDLE_BATTLE_STRATEGY,{mode:'basic_attack_only',targetPolicy:'source-default-random'});
assert.deepEqual(freshPersistentState().battleSettings.strategy,DEFAULT_IDLE_BATTLE_STRATEGY);
const migrated=normalizePersistentState({battleSettings:{strategy:{},sourceParity:{}}}).state;
assert.deepEqual(migrated.battleSettings.strategy,DEFAULT_IDLE_BATTLE_STRATEGY);

let context=makeContext({enemies:2});
let result=applyIdleBattleStrategy(context,{playerId:'player-1',defaultTargetRoll:1});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.action,ACTION_BATTLE_IDLE_STRATEGY_APPLY);
assert.equal(result.stage,'idle-battle-strategy-command-set');
assert.equal(result.command.type,'attack');
assert.equal(result.command.code,1);
assert.equal(result.command.targetBid,11);
assert.equal(result.targetSelection.selectedBid,11);
assert.equal(result.rngConsumed,true);
assert.equal(result.persistentMutation,false);
assert.equal(result.damageExecuted,false);
assert.equal(result.battleContext.sides[0].entries[0].sourceBattleCharMode,3);
assert.equal(result.battleContext.sides[0].entries[5].battleCommands[0],1);
assert.equal(result.battleContext.sides[0].entries[5].battleCommands[1],-1);
assert.equal(result.battleContext.sides[0].entries[5].sourceBattleCharMode,3);
assert.equal(context.context.sides[0].entries[0].sourceBattleCharMode,2);
assert.equal(context.context.sides[0].entries[5].sourceBattleCharMode,2);

context=makeContext({enemies:1,playerOverrides:{battleStatus:{sleep:1}}});
result=applyIdleBattleStrategy(context,{playerId:'player-1'});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.stage,'idle-battle-strategy-status-wait');
assert.equal(result.command.type,'wait');
assert.equal(result.command.code,11);
assert.equal(result.rngConsumed,false);

context=makeContext({enemies:2});
result=applyIdleBattleStrategy(context,{playerId:'player-1'});
assert.equal(result.ok,false);
assert.equal(result.reason,'default-target-rng-required-or-out-of-range');
assert.equal(context.context.sides[0].entries[0].sourceBattleCharMode,2);

context=makeContext({enemies:0});
result=applyIdleBattleStrategy(context,{playerId:'player-1'});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.stage,'idle-battle-strategy-no-target-wait');
assert.equal(result.command.type,'wait');
assert.equal(result.rngConsumed,false);

context=makeContext({enemies:1});
result=applyIdleBattleStrategy(context,{playerId:'player-1',defaultTargetRoll:0,strategy:{mode:'skills-and-items'}});
assert.equal(result.ok,false);
assert.equal(result.reason,'strategy-invalid');
assert.equal(context.context.sides[0].entries[0].sourceBattleCharMode,2);

context=makeContext({enemies:1});
context.context.mode='init';
result=applyIdleBattleStrategy(context,{playerId:'player-1',defaultTargetRoll:0});
assert.equal(result.ok,false);
assert.equal(result.reason,'battle-active-phase-required');

const state=freshPersistentState({playerId:'idle-strategy-controller',playerName:'IdleStrategy'});
state.player.hp=100;
state.player.maxHp=100;
state.player.mp=20;
state.player.maxMp=20;
state.idle.enabled=true;
state.idle.mode='encounter_pending';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
state.pets.petBox=[{id:'pet-controller',petId:120,tempNo:113,name:'Pet',level:3,hp:40,maxHp:40,mp:10,maxMp:20,mailMode:0}];
state.pets.team=['pet-controller'];
state.pets.activePetId='pet-controller';
const controller=createBrowserStateController({state,now:()=> '2026-10-02T04:30:00.000Z'});
const built=await controller.dispatch({
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  enemyTeam:[{enemyId:120,size:0,createMaxNum:1,enemy:{tempNo:113}}],
  groupId:94,
  battleFieldNo:0,
  encounter:{floorId:100,x:610,y:538,encounterId:65}
});
assert.equal(built.ok,true,JSON.stringify(built));
const initialized=await controller.dispatch({type:ACTION_BATTLE_INITIALIZE,fixedLuck:5,surpriseRoll:20});
assert.equal(initialized.ok,true,JSON.stringify(initialized));
const applied=await controller.dispatch({type:ACTION_BATTLE_IDLE_STRATEGY_APPLY,defaultTargetRoll:0});
assert.equal(applied.ok,true,JSON.stringify(applied));
assert.equal(applied.command.code,1);
assert.equal(applied.command.targetBid,10);
assert.equal(controller.getBattleContext().sides[0].entries[5].battleCommands[0],1);
assert.equal(controller.getState().revision,0);
const ready=await controller.dispatch({type:ACTION_BATTLE_COMMAND_WAIT_STATUS});
assert.equal(ready.ok,true,JSON.stringify(ready));
assert.equal(ready.ready,true);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-browser-idle-battle-strategy-runtime-v1',
  mode:IDLE_BATTLE_STRATEGY_MODE,
  policy:DEFAULT_IDLE_BATTLE_STRATEGY,
  player:'basic attack with source-default random target',
  pet:'fixed-C default attack',
  statusBlocked:'wait without target RNG',
  noTarget:'wait',
  unsupportedPolicy:'fail-closed',
  controllerIntegrated:true,
  commandWaitReady:ready.ready,
  persistentMutation:false,
  damageExecuted:false
},null,2));
