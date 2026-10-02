#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_BATTLE_END_PLAN,
  BROWSER_BATTLE_END_RUNTIME_FORMAT,
  planBattleEnd
} from '../src/stoneage_browser_battle_end_runtime.mjs';
import {
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
  ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  ACTION_BATTLE_DEATH_PLAN,
  ACTION_BATTLE_DEATH_COMMIT,
  ACTION_BATTLE_END_PLAN as CONTROLLER_BATTLE_END_PLAN,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';

const context=({
  player={isDie:false,battleMode:'init',relife:0},
  pet={isDie:false,battleMode:'init',relife:0},
  enemy={isDie:false,battleMode:'init',relife:0}
}={})=>({
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    type:1,
    sides:[
      {side:0,type:0,entries:[
        {bid:0,sourceType:'player',hp:100,isDie:false,deadCount:0,battleOutcomeFlags:0,ultimate:0,...player},
        null,null,null,null,
        {bid:5,sourceType:'pet',hp:100,isDie:false,deadCount:0,battleOutcomeFlags:0,ultimate:0,...pet},
        null,null,null,null
      ]},
      {side:1,type:1,entries:[
        {bid:10,sourceType:'enemy',hp:100,isDie:false,deadCount:0,battleOutcomeFlags:0,ultimate:0,...enemy},
        null,null,null,null,null,null,null,null,null
      ]}
    ]
  }
});

let result=planBattleEnd(context());
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.action,ACTION_BATTLE_END_PLAN);
assert.equal(result.format,BROWSER_BATTLE_END_RUNTIME_FORMAT);
assert.equal(result.finished,false);
assert.equal(result.winnerSide,null);

result=planBattleEnd(context({enemy:{isDie:true}}));
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.finished,true);
assert.equal(result.winnerSide,0);
assert.equal(result.finishReason,'enemy-side-empty');

result=planBattleEnd(context({player:{isDie:true}}));
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.finished,true);
assert.equal(result.winnerSide,1);
assert.equal(result.finishReason,'player-side-empty');

result=planBattleEnd(context({
  player:{isDie:false,battleMode:'rescue'},
  enemy:{isDie:false}
}));
assert.equal(result.ok,true);
assert.equal(result.finished,false);
assert.equal(result.playerSide.onlyRescue,true);

result=planBattleEnd(context({
  player:{isDie:true,battleMode:'rescue',relife:1},
  enemy:{isDie:false}
}));
assert.equal(result.ok,true);
assert.equal(result.finished,false);
assert.equal(result.playerSide.participantCount,1);
assert.deepEqual(result.playerSide.relifeBids,[0]);

result=planBattleEnd(context({
  pet:{isDie:true},
  enemy:{isDie:false}
}));
assert.equal(result.ok,true);
assert.equal(result.finished,false);

const missingDeathState=context();
delete missingDeathState.context.sides[1].entries[0].isDie;
result=planBattleEnd(missingDeathState);
assert.equal(result.ok,false);
assert.equal(result.reason,'death-state-required');

const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const encounterIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json','utf8'));
const encounterGroupCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_group_runtime.json','utf8'));
const controllerState=freshPersistentState({playerId:'v408-player'});
controllerState.player.name='V408';
controllerState.player.hp=100;
controllerState.player.maxHp=100;
controllerState.player.mp=20;
controllerState.player.maxMp=20;
controllerState.world.position={floorId:100,x:610,y:538};
controllerState.idle.enabled=true;
controllerState.idle.mode='encounter_pending';
controllerState.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
const controller=createBrowserStateController({state:controllerState,idleRouteCatalog:routeCatalog,encounterTargetIndex:encounterIndex,encounterGroupCatalog,now:()=> '2026-10-01T12:00:00.000Z'});
const encounter={encounterId:65,floorId:100,x:610,y:538};
const group=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,encounter,groupRoll:0});
assert.equal(group.ok,true,JSON.stringify(group));
const generated=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  encounter,
  groupId:group.group.groupId,
  entryMaxRoll:1,
  enemyRolls:[0]
});
assert.equal(generated.ok,true,JSON.stringify(generated));
assert.equal(generated.team.length,1);
const build=await controller.dispatch({
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  playerId:'v408-player',
  player:{
    id:'v408-player',
    name:'V408',
    level:1,
    hp:100,
    maxHp:100,
    mp:20,
    maxMp:20,
    luck:0,
    stats:{vital:10,str:10,tgh:10,dex:10}
  },
  enemyTeam:generated.team,
  encounter,
  groupId:group.group.groupId,
  battleFieldNo:1
});
assert.equal(build.ok,true,JSON.stringify(build));

const death=await controller.dispatch({
  type:ACTION_BATTLE_DEATH_PLAN,
  targetBid:15,
  hp:0
});
assert.equal(death.ok,true,JSON.stringify(death));

const commit=await controller.dispatch({
  type:ACTION_BATTLE_DEATH_COMMIT,
  targetBid:15,
  deathPlan:death
});
assert.equal(commit.ok,true,JSON.stringify(commit));

const end=await controller.dispatch({type:CONTROLLER_BATTLE_END_PLAN});
assert.equal(end.ok,true,JSON.stringify(end));
assert.equal(end.finished,true);
assert.equal(end.winnerSide,0);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_BATTLE_END_RUNTIME_FORMAT,
  action:CONTROLLER_BATTLE_END_PLAN,
  finished:true,
  winnerSide:0,
  readOnly:true
},null,2));
