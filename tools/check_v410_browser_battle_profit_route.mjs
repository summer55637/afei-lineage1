#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  ACTION_BATTLE_PROFIT_ROUTE_PLAN,
  BROWSER_BATTLE_PROFIT_ROUTE_RUNTIME_FORMAT,
  planBattleProfitRoute
} from '../src/stoneage_browser_battle_profit_route_runtime.mjs';
import {
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_PROFIT_ROUTE_PLAN as CONTROLLER_PROFIT_ROUTE_PLAN,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';

const context=(dpbattle)=>({
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    dpbattle,
    mode:'finish',
    sourceMode:3,
    sides:[
      {side:0,type:0,entries:[null,null,null,null,null,null,null,null,null,null]},
      {side:1,type:1,entries:[null,null,null,null,null,null,null,null,null,null]}
    ]
  }
});

let result=planBattleProfitRoute(context(0));
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.action,ACTION_BATTLE_PROFIT_ROUTE_PLAN);
assert.equal(result.format,BROWSER_BATTLE_PROFIT_ROUTE_RUNTIME_FORMAT);
assert.equal(result.route,'exp-gold');
assert.equal(result.fixedCFunction,'BATTLE_GetExpGold');
assert.equal(result.mutation,false);

result=planBattleProfitRoute(context(1));
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.route,'duel-point');
assert.equal(result.fixedCFunction,'BATTLE_GetDuelPoint');

result=planBattleProfitRoute(context(null));
assert.equal(result.ok,false);
assert.equal(result.reason,'dpbattle-required');

result=planBattleProfitRoute(context(2));
assert.equal(result.ok,false);
assert.equal(result.reason,'dpbattle-invalid');

const controller=createBrowserStateController({state:{revision:0}});
const build=await controller.dispatch({
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  playerId:'v410-player',
  player:{
    id:'v410-player',
    name:'V410',
    level:1,
    hp:100,
    maxHp:100,
    mp:20,
    maxMp:20,
    luck:0,
    stats:{vital:10,str:10,tgh:10,dex:10}
  },
  team:[{enemyId:1,size:1,createMaxNum:1,enemy:{tempNo:1}}],
  encounter:{encounterId:1,floorId:1,x:1,y:1},
  groupId:1,
  battleFieldNo:1
});
assert.equal(build.ok,true,JSON.stringify(build));
const route=await controller.dispatch({type:CONTROLLER_PROFIT_ROUTE_PLAN,dpbattle:0});
assert.equal(route.ok,true,JSON.stringify(route));
assert.equal(route.route,'exp-gold');
assert.equal(route.dpbattle,0);
assert.equal(route.nextAction,'BATTLE_EXP_GOLD_PLAN');
assert.equal(route.fixedCFunction,'BATTLE_GetExpGold');
assert.equal(route.mutation,false);
assert.equal(route.persistentMutation,false);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_BATTLE_PROFIT_ROUTE_RUNTIME_FORMAT,
  action:CONTROLLER_PROFIT_ROUTE_PLAN,
  route:'exp-gold',
  readOnly:true
},null,2));
