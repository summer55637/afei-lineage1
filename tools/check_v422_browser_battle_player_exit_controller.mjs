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
  ACTION_BATTLE_PLAYER_EXIT_PLAN,
  ACTION_BATTLE_PLAYER_EXIT_COMMIT,
  ACTION_IDLE_EVENT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';
import { IDLE_EVENTS, IDLE_STATES } from '../src/stoneage_idle_loop.mjs';

const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const encounterIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json','utf8'));

const state=freshPersistentState({playerId:'v422-controller'});
state.player.name='V422';
state.player.hp=100;
state.player.maxHp=100;
state.player.mp=20;
state.player.maxMp=20;
state.world.position={floorId:100,x:610,y:538};
state.idle.enabled=true;
state.idle.mode='encounter_pending';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
state.pets.petBox=[{id:'pet-1',petId:120,tempNo:113,name:'Pet1',level:3,hp:40,maxHp:40,mp:10,maxMp:20}];
state.pets.team=['pet-1'];
state.pets.activePetId='pet-1';

const team=[{enemyId:120,size:0,createMaxNum:1,enemy:{tempNo:113}}];
const controller=createBrowserStateController({
  state,
  idleRouteCatalog:routeCatalog,
  encounterTargetIndex:encounterIndex,
  now:()=> '2026-10-01T12:10:00.000Z'
});

let result=await controller.dispatch({
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  enemyTeam:team,
  groupId:94,
  battleFieldNo:0,
  encounter:{floorId:100,x:610,y:538,encounterId:65}
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.ok(controller.getBattleContext());

result=await controller.dispatch({type:ACTION_BATTLE_DEATH_PLAN,targetBid:15,hp:0});
assert.equal(result.ok,true,JSON.stringify(result));
result=await controller.dispatch({type:ACTION_BATTLE_DEATH_COMMIT,targetBid:15,deathPlan:result});
assert.equal(result.ok,true,JSON.stringify(result));

const end=await controller.dispatch({type:ACTION_BATTLE_END_PLAN});
assert.equal(end.ok,true,JSON.stringify(end));
const finish=await controller.dispatch({type:ACTION_BATTLE_FINISH_COMMIT,finishPlan:end});
assert.equal(finish.ok,true,JSON.stringify(finish));
assert.equal(finish.battleContext.context.mode,'finish');
assert.equal(finish.battleContext.context.settlementStartRevision,finish.state.revision);

const settlementCommit=await controller.dispatch({
  type:'BATTLE_LEVELUP_COMMIT',
  transactionId:'battle-v422-levelup',
  expectedRevision:finish.state.revision,
  now:'2026-10-01T12:10:00.500Z'
});
assert.equal(settlementCommit.ok,true,JSON.stringify(settlementCommit));
assert.equal(settlementCommit.applied,true);

const settlementReceipt=await controller.dispatch({
  type:'BATTLE_SETTLEMENT_RECEIPT_COMMIT',
  settlementId:'battle-v422-settlement',
  transactions:[{kind:'levelUp',transactionId:'battle-v422-levelup'}],
  expectedRevision:settlementCommit.state.revision,
  now:'2026-10-01T12:10:00.750Z'
});
assert.equal(settlementReceipt.ok,true,JSON.stringify(settlementReceipt));
assert.equal(settlementReceipt.applied,true);

const finished=await controller.dispatch({
  type:ACTION_IDLE_EVENT,
  event:IDLE_EVENTS.BATTLE_FINISHED,
  payload:{battle:{resultId:'v422-battle'}},
  expectedRevision:settlementReceipt.state.revision,
  now:'2026-10-01T12:10:01.000Z'
});
assert.equal(finished.ok,true,JSON.stringify(finished));
assert.equal(finished.state.idle.mode,IDLE_STATES.SETTLEMENT);
assert.ok(controller.getBattleContext());

const reward=await controller.dispatch({
  type:ACTION_IDLE_EVENT,
  event:IDLE_EVENTS.REWARD_APPLIED,
  payload:{settlementReceiptId:'battle-v422-settlement',reward:{sourceResultId:'v422-battle'},supplyRequired:false},
  expectedRevision:finished.state.revision,
  now:'2026-10-01T12:10:02.000Z'
});
assert.equal(reward.ok,true,JSON.stringify(reward));
assert.equal(reward.state.idle.mode,IDLE_STATES.MOVING);
assert.ok(controller.getBattleContext());

const plan=await controller.dispatch({
  type:ACTION_BATTLE_PLAYER_EXIT_PLAN,
  settlementComplete:true
});
assert.equal(plan.ok,true,JSON.stringify(plan));
assert.equal(plan.player.playerId,'v422-controller');
assert.equal(plan.player.hpAfter,100);
assert.equal(plan.player.mpAfter,20);

const commit=await controller.dispatch({
  type:ACTION_BATTLE_PLAYER_EXIT_COMMIT,
  battlePlayerExitPlan:plan,
  settlementComplete:true,
  transactionId:'battle-v422-controller-player',
  expectedRevision:plan.state.revision,
  now:'2026-10-01T12:10:03.000Z'
});
assert.equal(commit.ok,true,JSON.stringify(commit));
assert.equal(commit.applied,true);
assert.equal(commit.state.player.hp,100);
assert.equal(commit.state.player.mp,20);
assert.equal(commit.state.idle.mode,IDLE_STATES.MOVING);
assert.ok(controller.getBattleContext());

const exitPlan=await controller.dispatch({type:'ACTION_BATTLE_EXIT_PLAN',settlementComplete:true});
assert.equal(exitPlan.ok,true,JSON.stringify(exitPlan));

console.log(JSON.stringify({
  pass:true,
  lifecycle:'in_battle -> finish -> settlement -> moving -> player-exit-state -> pet-exit',
  idleBattleFinishContextPreserved:true,
  playerHpMpCommitted:true,
  nextBoundary:'BATTLE_EXIT_COMMIT'
},null,2));
