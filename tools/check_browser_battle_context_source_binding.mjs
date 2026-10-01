#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD, createBrowserStateController } from '../src/stoneage_browser_state_controller.mjs';

const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const encounterIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json','utf8'));

function base(){
  const state=freshPersistentState({playerId:'encounter-binding'});
  state.player.name='binding';
  state.player.hp=100; state.player.maxHp=100;
  state.player.mp=20; state.player.maxMp=20;
  state.world.position={floorId:100,x:610,y:538};
  state.idle.enabled=true;
  state.idle.mode='encounter_pending';
  state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
  return state;
}

function controller(){
  return createBrowserStateController({state:base(),idleRouteCatalog:routeCatalog,encounterTargetIndex:encounterIndex,battleFieldNoProvider:0});
}

const player={id:'encounter-binding',name:'binding',level:1,hp:100,maxHp:100,mp:20,maxMp:20,luck:0,stats:{vital:10,str:10,tgh:10,dex:10}};
const enemyTeam=[{enemyId:1,size:1,createMaxNum:1,enemy:{tempNo:1}}];

{
  const c=controller();
  const stale=await c.dispatch({
    type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
    player,enemyTeam,groupId:94,battleFieldNo:0,
    encounter:{encounterId:1,floorId:1,x:1,y:1}
  });
  assert.equal(stale.ok,false,JSON.stringify(stale));
  assert.equal(stale.stage,'battle-context-encounter-binding');
  assert.equal(stale.reason,'unconditional-encounter-not-at-position');
  assert.equal(c.getState().revision,0);
}

{
  const c=controller();
  const badGroup=await c.dispatch({
    type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
    player,enemyTeam,groupId:1,battleFieldNo:0,
    encounter:{encounterId:65,floorId:100,x:610,y:538}
  });
  assert.equal(badGroup.ok,false,JSON.stringify(badGroup));
  assert.equal(badGroup.stage,'battle-context-encounter-binding');
  assert.equal(badGroup.reason,'group-not-in-encounter');
  assert.equal(c.getState().revision,0);
}

{
  const c=controller();
  const ok=await c.dispatch({
    type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
    player,enemyTeam,groupId:94,battleFieldNo:0,
    encounter:{encounterId:65,floorId:100,x:610,y:538}
  });
  assert.equal(ok.ok,true,JSON.stringify(ok));
  assert.equal(ok.stage,'battle-context-started');
  assert.deepEqual(ok.context.encounter,{
    floorId:100,x:610,y:538,encounterId:65,rect:[568,538,610,578],
    probMin:1,probMax:5,enemyMax:4,zorder:30,groupIds:[89,92,94],
    groupProbs:[1,1,1],enemyIds:[120,123],sourceSelection:'exact'
  });
  assert.equal(ok.state.idle.mode,'in_battle');
  assert.equal(ok.state.revision,1);
}

console.log(JSON.stringify({pass:true,contract:'battle-context-source-encounter-binding',staleEncounterRejected:true,invalidGroupRejected:true,canonicalEncounterUsed:true},null,2));