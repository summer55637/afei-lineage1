#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { ACTION_IDLE_EVENT, ACTION_WORLD_ENCOUNTER_GROUP_SELECT, ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE, ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD, createBrowserStateController } from '../src/stoneage_browser_state_controller.mjs';
import { IDLE_EVENTS } from '../src/stoneage_idle_loop.mjs';

const encounterIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json','utf8'));
const groupCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_group_runtime.json','utf8'));
const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));

function state(){
  const s=freshPersistentState({playerId:'pipeline-bind'});
  s.player.name='pipeline'; s.player.hp=100; s.player.maxHp=100; s.player.mp=20; s.player.maxMp=20;
  s.world.position={floorId:100,x:610,y:538};
  s.idle.enabled=true; s.idle.mode='encounter_pending';
  s.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
  return s;
}
function controller(){return createBrowserStateController({state:state(),idleRouteCatalog:routeCatalog,encounterTargetIndex:encounterIndex,encounterGroupCatalog:groupCatalog,battleFieldNoProvider:0});}

const encounter={encounterId:65,floorId:100,x:610,y:538};
const coreStatRolls=[
  {levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:[0,0,0,0,0,0,0,0,0,0]},
  {levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:[0,0,0,0,0,0,0,0,0,0]}
];

{
  const c=controller();
  const moving=c.getState();
  const r=await c.dispatch({type:ACTION_IDLE_EVENT,event:IDLE_EVENTS.MOVE_TICK,payload:{encounterTriggered:false},expectedRevision:0});
  assert.equal(r.ok,false);
  assert.equal(r.reason,'no_transition');
  const group=await c.dispatch({type:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,encounter,groupRoll:2});
  assert.equal(group.ok,true,JSON.stringify(group));
  assert.equal(group.group.groupId,94);
  const generated=await c.dispatch({type:ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,encounter,groupId:94,entryMaxRoll:2,enemyRolls:[0,1],enemyStatRolls:coreStatRolls});
  assert.equal(generated.ok,true,JSON.stringify(generated));
  assert.equal(generated.team.length,2);
  assert.deepEqual(generated.team.map(x=>x.enemyId),[120,123]);
  const build=await c.dispatch({type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,encounter,groupId:94,battleFieldNo:0,enemyTeam:generated.team,materializeEnemyStats:true});
  assert.equal(build.ok,true,JSON.stringify(build));
  assert.equal(build.context.sourceGroupId,94);
  assert.deepEqual(build.context.sides[1].entries.filter(Boolean).map(x=>x.enemyId),[120,123]);
  assert.equal(c.getBattleContext().context.sourceGroupId,94);
}

{
  const c=controller();
  await c.dispatch({type:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,encounter,groupRoll:2});
  const generated=await c.dispatch({type:ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,encounter,groupId:94,entryMaxRoll:2,enemyRolls:[0,1],enemyStatRolls:coreStatRolls});
  assert.equal(generated.ok,true,JSON.stringify(generated));
  const tampered=structuredClone(generated.team);
  tampered[1]={...tampered[1],enemyId:120};
  const rejected=await c.dispatch({type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,encounter,groupId:94,battleFieldNo:0,enemyTeam:tampered});
  assert.equal(rejected.ok,false,JSON.stringify(rejected));
  assert.equal(rejected.stage,'battle-context-encounter-binding');
  assert.equal(rejected.reason,'enemy-team-generation-mismatch');
  const mismatchedRolls=structuredClone(coreStatRolls);
  mismatchedRolls[0].levelRoll=1;
  const rollRejected=await c.dispatch({type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,encounter,groupId:94,battleFieldNo:0,enemyTeam:generated.team,materializeEnemyStats:true,enemyStatRolls:mismatchedRolls});
  assert.equal(rollRejected.ok,false,JSON.stringify(rollRejected));
  assert.equal(rollRejected.stage,'enemy-core-stat-binding');
  assert.equal(rollRejected.reason,'enemy-stat-roll-plan-mismatch');
  assert.equal(c.getState().revision,0);
}

{
  const c=controller();
  const badOrder=await c.dispatch({type:ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,encounter,groupId:94,entryMaxRoll:1,enemyRolls:[0]});
  assert.equal(badOrder.ok,false,JSON.stringify(badOrder));
  assert.equal(badOrder.reason,'encounter-group-selection-required');
}

console.log(JSON.stringify({pass:true,contract:'encounter-group-enemy-generation-binding',groupRequired:true,enemyRosterBound:true,coreStatRollsBound:true,buildConsumesTransientPlan:true,manualTamperRejected:true},null,2));