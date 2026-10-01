#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_DEATH_PLAN,
  ACTION_BATTLE_DEATH_COMMIT,
  ACTION_BATTLE_END_PLAN,
  ACTION_BATTLE_FINISH_COMMIT,
  ACTION_BATTLE_EXIT_PLAN,
  ACTION_BATTLE_EXIT_COMMIT,
  ACTION_IDLE_EVENT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';
import { IDLE_EVENTS, IDLE_STATES } from '../src/stoneage_idle_loop.mjs';

const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const encounterIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json','utf8'));

const state=freshPersistentState({playerId:'v421-controller'});
state.player.name='V421';
state.player.hp=100;
state.player.maxHp=100;
state.player.mp=20;
state.player.maxMp=20;
state.world.position={floorId:100,x:610,y:538};
state.idle.enabled=true;
state.idle.mode='encounter_pending';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
state.pets.petBox=[
  {id:'pet-alive',petId:120,tempNo:113,name:'AlivePet',level:3,hp:40,maxHp:40,mp:10,maxMp:20},
  {id:'pet-dead',petId:123,tempNo:114,name:'DeadPet',level:3,hp:0,maxHp:40,mp:0,maxMp:20}
];
state.pets.team=['pet-alive'];
state.pets.activePetId='pet-alive';

const team=[{enemyId:120,size:0,createMaxNum:1,enemy:{tempNo:113}}];

const controller=createBrowserStateController({
  state,
  idleRouteCatalog:routeCatalog,
  encounterTargetIndex:encounterIndex,
  now:()=> '2026-10-01T11:30:00.000Z'
});

let result=await controller.dispatch({
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  enemyTeam:team,
  groupId:94,
  battleFieldNo:0,
  encounter:{floorId:100,x:610,y:538,encounterId:65}
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.state.idle.mode,IDLE_STATES.IN_BATTLE);
assert.ok(controller.getBattleContext());

result=await controller.dispatch({type:ACTION_BATTLE_DEATH_PLAN,targetBid:15,hp:0});
assert.equal(result.ok,true,JSON.stringify(result));

result=await controller.dispatch({
  type:ACTION_BATTLE_DEATH_COMMIT,
  targetBid:15,
  deathPlan:result
});
assert.equal(result.ok,true,JSON.stringify(result));

result=await controller.dispatch({type:ACTION_BATTLE_END_PLAN});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.finished,true);
assert.equal(result.winnerSide,0);

result=await controller.dispatch({
  type:ACTION_BATTLE_FINISH_COMMIT,
  finishPlan:result
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.battleContext.context.mode,'finish');
assert.equal(result.battleContext.context.sourceMode,3);

const finished=await controller.dispatch({
  type:ACTION_IDLE_EVENT,
  event:IDLE_EVENTS.BATTLE_FINISHED,
  payload:{battle:{resultId:'v421-controller-battle'}},
  expectedRevision:result.state.revision,
  now:'2026-10-01T11:30:01.000Z'
});
assert.equal(finished.ok,true,JSON.stringify(finished));
assert.equal(finished.state.idle.mode,IDLE_STATES.SETTLEMENT);
assert.ok(controller.getBattleContext());

const reward=await controller.dispatch({
  type:ACTION_IDLE_EVENT,
  event:IDLE_EVENTS.REWARD_APPLIED,
  payload:{reward:{sourceResultId:'v421-controller-battle'},supplyRequired:false},
  expectedRevision:finished.state.revision,
  now:'2026-10-01T11:30:02.000Z'
});
assert.equal(reward.ok,true,JSON.stringify(reward));
assert.equal(reward.state.idle.mode,IDLE_STATES.MOVING);
assert.ok(controller.getBattleContext());

const denied=await controller.dispatch({
  type:ACTION_BATTLE_EXIT_PLAN,
  settlementComplete:false
});
assert.equal(denied.ok,false);
assert.equal(denied.reason,'settlement-complete-flag-required');

const exitPlan=await controller.dispatch({
  type:ACTION_BATTLE_EXIT_PLAN,
  settlementComplete:true
});
assert.equal(exitPlan.ok,true,JSON.stringify(exitPlan));
assert.deepEqual(exitPlan.pets,[{petId:'pet-dead',hpBefore:0,hpAfter:1}]);
assert.equal(exitPlan.persistentStateMutation,false);
assert.equal(exitPlan.battleContext.context.mode,'finish');

const exitCommit=await controller.dispatch({
  type:ACTION_BATTLE_EXIT_COMMIT,
  battleExitPlan:exitPlan,
  settlementComplete:true,
  transactionId:'battle-v421-controller-exit',
  expectedRevision:exitPlan.state.revision,
  now:'2026-10-01T11:30:02.000Z'
});
assert.equal(exitCommit.ok,true,JSON.stringify(exitCommit));
assert.equal(exitCommit.applied,true);
assert.equal(exitCommit.revisionAfter,exitPlan.state.revision+1);
assert.equal(exitCommit.state.pets.petBox.find(p=>p.id==='pet-dead').hp,1);
assert.equal(exitCommit.state.pets.petBox.find(p=>p.id==='pet-alive').hp,40);
assert.equal(exitCommit.state.idle.mode,IDLE_STATES.MOVING);
assert.equal(exitCommit.state.battleContext,undefined);
assert.equal(exitCommit.battleContext,null);
assert.equal(controller.getBattleContext(),null);

const replay=await controller.dispatch({
  type:ACTION_BATTLE_EXIT_COMMIT,
  battleExitPlan:exitPlan,
  settlementComplete:true,
  transactionId:'battle-v421-controller-exit',
  expectedRevision:exitPlan.state.revision,
  now:'2026-10-01T11:30:03.000Z'
});
assert.equal(replay.ok,true,JSON.stringify(replay));
assert.equal(replay.idempotent,true);
assert.equal(replay.applied,false);
assert.equal(replay.state.revision,exitCommit.state.revision);
assert.equal(controller.getBattleContext(),null);

console.log(JSON.stringify({
  pass:true,
  action:ACTION_BATTLE_EXIT_COMMIT,
  lifecycle:'encounter_pending -> in_battle -> settlement -> moving',
  settlementGate:'fail-closed',
  deadPetCleanup:'hp 0 -> 1',
  battleContextCleared:true,
  persistentBattleContext:false,
  duplicateExitIdempotent:true
},null,2));
