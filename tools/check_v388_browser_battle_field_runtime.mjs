#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_BATTLE_FIELD_RESOLVE,
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  BROWSER_BATTLE_FIELD_RUNTIME_FORMAT,
  BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';
import { resolveBattleFieldFromMap } from '../src/stoneage_browser_battle_field_runtime.mjs';

const index={
  maps:{
    "100":{
      path:"data/generated/stoneage_map_100.json",
      floorId:100,
      width:2,
      height:2
    }
  }
};
const map={
  floorId:100,
  width:2,
  height:2,
  tiles:[42,0,0,0],
  objects:[0,0,0,0],
  battlemapResolver:{candidatesByImageId:{"42":[7,8,9]}}
};
const mockFetch=async(url)=>{
  if(url==='data/generated/stoneage_map_runtime_index.json')return {ok:true,json:async()=>index};
  if(String(url).includes('data/generated/stoneage_map_100.json'))return {ok:true,json:async()=>map};
  return {ok:false,status:404,json:async()=>({})};
};

let direct=resolveBattleFieldFromMap(map,100,0,0,{battleFieldRoll:0});
assert.equal(direct.ok,true,JSON.stringify(direct));
assert.equal(direct.format,BROWSER_BATTLE_FIELD_RUNTIME_FORMAT);
assert.deepEqual(direct.candidates,[7,8,9]);
assert.equal(direct.selection,0);
assert.equal(direct.battleFieldNo,7);

direct=resolveBattleFieldFromMap(map,100,0,0,{battleFieldRoll:2});
assert.equal(direct.ok,true,JSON.stringify(direct));
assert.equal(direct.selection,2);
assert.equal(direct.battleFieldNo,9);

direct=resolveBattleFieldFromMap(map,100,0,0,{battleFieldRoll:3});
assert.equal(direct.ok,false);
assert.equal(direct.reason,'battle-field-rng-required-or-out-of-range');

let state=freshPersistentState({playerId:'v388'});
state.world.position={floorId:100,x:0,y:0};
let controller=createBrowserStateController({
  state,
  encounterTargetIndex:JSON.parse(JSON.stringify({
    format:'stoneage-start-encounter-target-index-v1',
    fixedSource:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'},
    floors:{100:{unconditionalRows:[{encounterId:65,rect:[0,0,1,1],probMin:1,probMax:5,enemyMax:4,zorder:30,groupIds:[89,92,94],groupProbs:[1,1,1],enemyIds:[120,123]}],mixedRows:[]}}
  })),
  battleFieldRuntimeOptions:{fetchImpl:mockFetch}
});

let result=await controller.dispatch({
  type:ACTION_BATTLE_FIELD_RESOLVE,
  encounter:{floorId:100,x:0,y:0},
  battleFieldRoll:1
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.battleFieldNo,8);
assert.equal(result.selection,1);
assert.equal(result.state.revision,0);

state=freshPersistentState({playerId:'v388-battle'});
state.player.hp=100;state.player.maxHp=100;
state.world.position={floorId:100,x:0,y:0};
state.idle.enabled=true;
state.idle.mode='encounter_pending';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
controller=createBrowserStateController({
  state,
  idleRouteCatalog:JSON.parse(JSON.stringify({
    format:'stoneage-first-idle-route-catalog-v1',
    fixedSource:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'},
    routes:[{hometown:0,name:'samugiru',entryFloor:1000,encounterFloor:100,status:'path_closed_battle_policy_pending',variants:[{portalId:'1000_to_100_a',usableLandingCount:1,encounterId:65}]}]
  })),
  encounterTargetIndex:JSON.parse(JSON.stringify({
    format:'stoneage-start-encounter-target-index-v1',
    fixedSource:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'},
    floors:{100:{unconditionalRows:[{encounterId:65,rect:[0,0,1,1],probMin:1,probMax:5,enemyMax:4,zorder:30,groupIds:[89,92,94],groupProbs:[1,1,1],enemyIds:[120,123]}],mixedRows:[]}}
  })),
  battleFieldRuntimeOptions:{fetchImpl:mockFetch}
});
const enemyTeam=[
  {enemyId:120,size:0,createMaxNum:10,enemy:{tempNo:113}},
  {enemyId:120,size:0,createMaxNum:10,enemy:{tempNo:113}},
  {enemyId:123,size:0,createMaxNum:10,enemy:{tempNo:114}},
  {enemyId:123,size:0,createMaxNum:10,enemy:{tempNo:114}}
];
result=await controller.dispatch({
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  enemyTeam,
  groupId:94,
  battleFieldRoll:2,
  encounter:{floorId:100,x:0,y:0,encounterId:65}
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.format,BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT);
assert.equal(result.context.fieldNo,9);
assert.equal(result.battleFieldResolution.selection,2);
assert.equal(result.battleFieldResolution.battleFieldNo,9);
assert.equal(result.state.idle.mode,'in_battle');
assert.equal(result.state.revision,1);
assert.equal(result.state.battleContext,undefined);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_BATTLE_FIELD_RUNTIME_FORMAT,
  action:ACTION_BATTLE_FIELD_RESOLVE,
  candidates:[7,8,9],
  selected:{roll0:7,roll1:8,roll2:9},
  integratedBattleFieldNo:9,
  battleContextFormat:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,
  persistentMutation:false
},null,2));
