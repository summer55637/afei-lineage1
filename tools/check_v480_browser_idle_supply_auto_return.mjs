#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_IDLE_SUPPLY_AUTO_RETURN,
  BROWSER_IDLE_SUPPLY_AUTO_RETURN_RUNTIME_FORMAT
} from '../src/stoneage_browser_idle_supply_auto_return_runtime.mjs';
import { createBrowserStateController } from '../src/stoneage_browser_state_controller.mjs';

const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const warpCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_idle_supply_warp_catalog.json','utf8'));
const recoveryCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_recovery_service_source_catalog.json','utf8'));
const worldNpcIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_world_npc_index.json','utf8'));
const moduleAudit=JSON.parse(fs.readFileSync('data/generated/stoneage_world_npc_functionset_audit.json','utf8'));

async function loadMap(floorId){
  return JSON.parse(fs.readFileSync(`data/generated/stoneage_map_${Number(floorId)}.json`,'utf8'));
}
async function loadMapset(){
  return JSON.parse(fs.readFileSync('data/generated/stoneage_mapset_runtime.json','utf8'));
}

const state=freshPersistentState({
  now:()=> '2026-10-04T01:20:00+08:00',
  playerId:'v480-auto-supply',
  playerName:'V4.80 Auto Supply'
});
state.player.level=1;
state.player.hp=40;state.player.maxHp=120;
state.player.mp=5;state.player.maxMp=80;
state.player.gold=0;
state.pets.petBox=[{id:'pet-1',level:1,hp:5,maxHp:30,mp:1,maxMp:10,dead:true}];
state.idle.enabled=true;
state.idle.mode='supply_check';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
state.world.position={floorId:100,x:610,y:538};

const controller=createBrowserStateController({
  state,
  moduleAudit,
  worldNpcIndex,
  idleRouteCatalog:routeCatalog,
  idleSupplyWarpCatalog:warpCatalog,
  recoveryServiceCatalog:recoveryCatalog,
  worldMovementOptions:{loadMap,loadMapset},
  now:()=> '2026-10-04T01:20:01+08:00'
});

const result=await controller.dispatch({
  type:ACTION_IDLE_SUPPLY_AUTO_RETURN,
  policy:{supply:{hpBelowPercent:80,mpBelowPercent:20}},
  confirmRoute:true,
  confirmHealer:true,
  transactionPrefix:'v480'
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.handled,true);
assert.equal(result.format,BROWSER_IDLE_SUPPLY_AUTO_RETURN_RUNTIME_FORMAT);
assert.equal(result.action,ACTION_IDLE_SUPPLY_AUTO_RETURN);
assert.equal(result.mode,'return-heal-complete');
assert.equal(result.policyBefore.required,true);
assert.equal(result.policyAfter.required,false);
assert.equal(result.routed.finalPosition.x,17);
assert.equal(result.routed.finalPosition.y,15);
assert.equal(result.routed.finalPosition.floorId,1005);
assert.equal(result.healer.cost.totalCost,0);
assert.equal(result.healer.state.player.hp,120);
assert.equal(result.healer.state.player.mp,80);
assert.equal(result.state.player.hp,120);
assert.equal(result.state.player.mp,80);
assert.equal(result.state.pets.petBox[0].dead,false);
assert.equal(result.state.idle.mode,'moving');
assert.equal(controller.getState().idle.mode,'moving');
assert.ok(result.state.revision>0);

const fullState=freshPersistentState({now:()=> '2026-10-04T01:20:05+08:00',playerId:'v480-no-heal'});
fullState.player.hp=120;fullState.player.maxHp=120;
fullState.player.mp=80;fullState.player.maxMp=80;
fullState.idle.enabled=true;
fullState.idle.mode='supply_check';
fullState.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
fullState.world.position={floorId:1005,x:17,y:15};
const fullController=createBrowserStateController({
  state:fullState,
  moduleAudit,
  worldNpcIndex,
  idleRouteCatalog:routeCatalog,
  idleSupplyWarpCatalog:warpCatalog,
  recoveryServiceCatalog:recoveryCatalog,
  now:()=> '2026-10-04T01:20:06+08:00'
});
const noNeed=await fullController.dispatch({
  type:ACTION_IDLE_SUPPLY_AUTO_RETURN,
  policy:{supply:{hpBelowPercent:80,mpBelowPercent:20}}
});
assert.equal(noNeed.ok,true,JSON.stringify(noNeed));
assert.equal(noNeed.mode,'no-healer-needed');
assert.equal(noNeed.routed,false);
assert.equal(noNeed.state.idle.mode,'moving');

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_IDLE_SUPPLY_AUTO_RETURN_RUNTIME_FORMAT,
  action:ACTION_IDLE_SUPPLY_AUTO_RETURN,
  routeId:result.routePlan.routeId,
  finalPosition:result.state.world.position,
  healerCost:result.healer.cost.totalCost,
  supplyDone:true,
  finalIdleMode:result.state.idle.mode,
  persistentRevision:result.state.revision,
  noHealerNeededBoundary:true
},null,2));
