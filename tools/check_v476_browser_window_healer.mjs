#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  createBrowserWindowHealerRuntime,
  ACTION_NPC_WINDOW_HEALER_USE,
  BROWSER_WINDOW_HEALER_RUNTIME_FORMAT
} from '../src/stoneage_browser_window_healer_runtime.mjs';
import {
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';

const worldNpcIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_world_npc_index.json','utf8'));
const moduleAudit=JSON.parse(fs.readFileSync('data/generated/stoneage_world_npc_functionset_audit.json','utf8'));

const runtime=createBrowserWindowHealerRuntime();
assert.equal(runtime.ok,true);
assert.equal(runtime.format,BROWSER_WINDOW_HEALER_RUNTIME_FORMAT);

const npc={
  floor:1005,
  npc:[17,13],
  sourceEnemy:{raw:'npcgen_winhealer|10|0.5|2.0|2'},
  functionSet:'WindowHealer',
  services:[{
    functionSet:'WindowHealer',
    sourceStatus:'known'
  }]
};
const player={floor:1005,x:17,y:14};

const freeState=freshPersistentState({playerId:'v476-free'});
freeState.player.level=1;
freeState.player.hp=50;freeState.player.maxHp=120;
freeState.player.mp=10;freeState.player.maxMp=80;
freeState.player.gold=0;
freeState.pets.petBox=[{id:'pet-1',hp:12,maxHp:60,mp:2,maxMp:30,dead:true}];

const free=runtime.dispatch(freeState,{
  type:ACTION_NPC_WINDOW_HEALER_USE,
  npc,player,
  confirm:true,
  now:()=> '2026-10-03T23:50:01+08:00'
});
assert.equal(free.ok,true,JSON.stringify(free));
assert.equal(free.handled,true);
assert.equal(free.cost.freeByLevel,true);
assert.equal(free.cost.totalCost,0);
assert.equal(free.charge.applied,false);
assert.equal(free.state.player.hp,120);
assert.equal(free.state.player.mp,80);
assert.equal(free.state.player.gold,0);
assert.equal(free.state.pets.petBox[0].hp,60);
assert.equal(free.state.pets.petBox[0].mp,30);
assert.equal(free.state.pets.petBox[0].dead,false);
assert.equal(free.state.revision,1);
assert.equal(freeState.player.hp,50);

const paidState=freshPersistentState({playerId:'v476-paid'});
paidState.player.level=10;
paidState.player.hp=20;paidState.player.maxHp=120;
paidState.player.mp=10;paidState.player.maxMp=80;
paidState.player.gold=100;
paidState.pets.petBox=[{id:'pet-1',hp:12,maxHp:60,mp:2,maxMp:30,dead:true}];

const planned=runtime.dispatch(paidState,{
  type:ACTION_NPC_WINDOW_HEALER_USE,
  npc,player,
  confirm:false
});
assert.equal(planned.ok,true);
assert.equal(planned.stage,'window-healer-plan');
assert.equal(planned.requiresConfirmation,true);
assert.equal(planned.cost.hpCost,5);
assert.equal(planned.cost.mpCost,20);
assert.equal(planned.cost.totalCost,25);
assert.equal(paidState.player.gold,100);
assert.equal(paidState.player.hp,20);

const paid=runtime.dispatch(paidState,{
  type:ACTION_NPC_WINDOW_HEALER_USE,
  npc,player,
  confirm:true,
  now:()=> '2026-10-03T23:50:02+08:00'
});
assert.equal(paid.ok,true,JSON.stringify(paid));
assert.equal(paid.cost.totalCost,25);
assert.equal(paid.state.player.gold,75);
assert.equal(paid.state.player.hp,120);
assert.equal(paid.state.player.mp,80);
assert.equal(paid.state.pets.petBox[0].dead,false);

const poorState=freshPersistentState({playerId:'v476-poor'});
poorState.player.level=10;
poorState.player.hp=20;poorState.player.maxHp=120;
poorState.player.mp=10;poorState.player.maxMp=80;
poorState.player.gold=24;
const poor=runtime.dispatch(poorState,{type:ACTION_NPC_WINDOW_HEALER_USE,npc,player,confirm:true});
assert.equal(poor.ok,false);
assert.equal(poor.reason,'insufficient-gold');
assert.equal(poorState.player.gold,24);
assert.equal(poorState.player.hp,20);

const far=runtime.dispatch(freeState,{
  type:ACTION_NPC_WINDOW_HEALER_USE,
  npc,
  player:{floor:1005,x:20,y:14},
  confirm:true
});
assert.equal(far.ok,false);
assert.equal(far.reason,'out-of-range');

const controllerState=freshPersistentState({playerId:'v476-controller'});
controllerState.player.level=1;
controllerState.player.hp=40;controllerState.player.maxHp=120;
controllerState.player.mp=5;controllerState.player.maxMp=80;
controllerState.player.gold=0;
controllerState.pets.petBox=[{id:'pet-1',hp:5,maxHp:30,mp:1,maxMp:10,dead:true}];
const controller=createBrowserStateController({
  state:controllerState,
  moduleAudit,
  worldNpcIndex,
  now:()=> '2026-10-03T23:50:05+08:00'
});
const controllerResult=await controller.dispatch({
  type:ACTION_NPC_WINDOW_HEALER_USE,
  targetCell:{floor:1005,x:17,y:13},
  serviceFunctionSet:'WindowHealer',
  player:{floor:1005,x:17,y:14},
  confirm:true
});
assert.equal(controllerResult.ok,true,JSON.stringify(controllerResult));
assert.equal(controllerResult.handled,true);
assert.equal(controllerResult.worldNpc.functionSet,'WindowHealer');
assert.equal(controllerResult.profile.level,10);
assert.equal(controllerResult.profile.hpRate,0.5);
assert.equal(controller.getState().player.hp,120);
assert.equal(controller.getState().player.mp,80);
assert.equal(controller.getState().pets.petBox[0].hp,30);
assert.equal(controller.getState().revision,1);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_WINDOW_HEALER_RUNTIME_FORMAT,
  action:ACTION_NPC_WINDOW_HEALER_USE,
  sourceHospital:{floor:1005,npc:[17,13],template:'npcgen_winhealer',arg:'10|0.5|2.0|2'},
  freeLevel:{level:1,totalCost:free.cost.totalCost,healed:true},
  paidLevel:{level:10,totalCost:paid.cost.totalCost,goldAfter:paid.state.player.gold},
  controllerIntegration:true,
  failClosed:['insufficient-gold','out-of-range']
},null,2));
