#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';

const catalog=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_group_runtime.json','utf8'));
const group94=catalog.groups.find(x=>x.groupId===94);
assert.ok(group94);
assert.equal(group94.status,'resolved');

const team=group94.members.map(m=>({
  enemyId:m.enemyId,
  size:m.enemy.base.size,
  createMaxNum:m.enemy.createMaxNum,
  enemy:m.enemy
}));

const state=freshPersistentState({playerId:'v391'});
state.player.name='阿飛';
state.player.hp=100;
state.player.maxHp=100;
state.player.mp=50;
state.player.maxMp=50;
state.world.position={floorId:100,x:610,y:538};
state.idle.enabled=true;
state.idle.mode='encounter_pending';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';

const routeCatalog={
  format:'stoneage-first-idle-route-catalog-v1',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'},
  routes:[{
    hometown:0,name:'samugiru',entryFloor:1000,encounterFloor:100,status:'ok',
    variants:[{portalId:'1000_to_100_a',usableLandingCount:1,encounterId:65}]
  }]
};

const controller=createBrowserStateController({
  state,
  idleRouteCatalog:routeCatalog,
  encounterTargetIndex:{
    format:'stoneage-start-encounter-target-index-v1',
    fixedSource:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'},
    floors:{100:{unconditionalRows:[{encounterId:65,rect:[568,538,610,578],probMin:1,probMax:5,enemyMax:4,zorder:30,groupIds:[89,92,94],groupProbs:[1,1,1],enemyIds:[120,123]}],mixedRows:[]}}
  }
});

const enemyStatRolls=team.map(()=>({
  levelRoll:0,
  baseStatRolls:[2,2,2,2],
  allocationRolls:[0,0,0,0,0,0,0,0,0,0]
}));

const result=await controller.dispatch({
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  enemyTeam:team,
  enemyStatRolls,
  materializeEnemyStats:true,
  groupId:94,
  battleFieldNo:0,
  encounter:{floorId:100,x:610,y:538,encounterId:65}
});

assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.format,BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT);
assert.equal(result.stage,'battle-context-started');
assert.equal(result.state.idle.mode,'in_battle');
assert.equal(result.state.revision,1);
assert.equal(result.context.enemyCoreStatHydrated,true);
assert.equal(result.context.enemyCoreStatRngRollCount,30);

const enemies=result.context.sides[1].entries.filter(Boolean);
assert.equal(enemies.length,2);

const enemy120=enemies.find(e=>e.enemyId===120);
const enemy123=enemies.find(e=>e.enemyId===123);
assert.ok(enemy120);
assert.ok(enemy123);

assert.equal(enemy120.level,2);
assert.deepEqual(enemy120.stats,{vital:448,str:390,tgh:331,dex:487});
assert.equal(enemy120.maxHp,30);
assert.equal(enemy120.hp,30);
assert.equal(enemy120.rank,5);
assert.equal(enemy120.maxMp,null);
assert.equal(enemy120.mp,null);
assert.deepEqual(enemy120.elements,{earth:0,water:0,fire:50,wind:50});
assert.deepEqual(enemy120.resist,{poison:0,paralysis:0,sleep:0,stone:0,drunk:0,confusion:0});
assert.ok(enemy120.sourceCoreStats);

assert.equal(enemy123.level,2);
assert.deepEqual(enemy123.stats,{vital:611,str:470,tgh:376,dex:658});
assert.equal(enemy123.maxHp,39);
assert.equal(enemy123.hp,39);
assert.equal(enemy123.rank,4);
assert.equal(enemy123.maxMp,null);
assert.equal(enemy123.mp,null);

assert.equal(result.state.battleContext,undefined);
assert.ok(controller.getBattleContext());
assert.equal(result.idleCommit.verification.ok,true);

const missingRolls=await controller.dispatch({
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  enemyTeam:team,
  materializeEnemyStats:true,
  enemyStatRolls:[],
  groupId:94,
  battleFieldNo:0,
  encounter:{floorId:100,x:610,y:538,encounterId:65}
});
assert.equal(missingRolls.ok,false);
assert.equal(missingRolls.reason,'enemy-stat-rolls-required');
assert.equal(controller.getState().revision,1);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,
  action:'ENCOUNTER_BATTLE_CONTEXT_BUILD',
  enemyIds:[120,123],
  hydratedRollCount:30,
  enemy120:{level:2,stats:{vital:448,str:390,tgh:331,dex:487},maxHp:30,rank:5},
  enemy123:{level:2,stats:{vital:611,str:470,tgh:376,dex:658},maxHp:39,rank:4},
  maxMpPending:true,
  persistentBattleContext:false,
  battleDamageExecuted:false
},null,2));
