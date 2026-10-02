#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  ACTION_BATTLE_DUELPOINT_PLAN,
  BROWSER_BATTLE_DUELPOINT_RUNTIME_FORMAT,
  MAX_DUELPOINT,
  planDuelPoint
} from '../src/stoneage_browser_battle_duelpoint_runtime.mjs';
import {
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_DUELPOINT_PLAN as CONTROLLER_DUELPOINT_PLAN,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';

const context=({side=0,sideType=0,sourceType='player',duelPoint=100,workGetExp=25,isDie=false}={})=>({
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    dpbattle:1,
    mode:'finish',
    sourceMode:3,
    sides:[
      {side:0,type:side===0?sideType:0,entries:[
        {bid:0,sourceType:sourceType,hp:0,isDie,deadCount:0,duelPoint,workGetExp,battleMode:'c_wait'},
        null,null,null,null,null,null,null,null,null
      ]},
      {side:1,type:side===1?sideType:1,entries:[
        {bid:10,sourceType:side===1?sourceType:'enemy',hp:0,isDie:true,deadCount:1,duelPoint:0,workGetExp:0,battleMode:'c_wait'},
        null,null,null,null,null,null,null,null,null
      ]}
    ]
  }
});

let result=planDuelPoint(context());
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.action,ACTION_BATTLE_DUELPOINT_PLAN);
assert.equal(result.format,BROWSER_BATTLE_DUELPOINT_RUNTIME_FORMAT);
assert.equal(result.currentDuelPoint,100);
assert.equal(result.workGetExp,25);
assert.equal(result.dpadd,25);
assert.equal(result.nextDuelPoint,125);
assert.equal(result.isDeadIgnored,true);
assert.equal(result.mutation,false);

result=planDuelPoint(context({duelPoint:5,workGetExp:-50,isDie:true}));
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.dpadd,-50);
assert.equal(result.nextDuelPoint,0);

result=planDuelPoint(context({duelPoint:MAX_DUELPOINT-1,workGetExp:500}));
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.nextDuelPoint,MAX_DUELPOINT);

result=planDuelPoint(context({duelPoint:3,workGetExp:0}));
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.dpadd,0);
assert.equal(result.nextDuelPoint,3);

result=planDuelPoint(context({sourceType:'pet'}));
assert.equal(result.ok,false);
assert.equal(result.reason,'pet-not-eligible');

result=planDuelPoint(context({side:0,sideType:1,sourceType:'player'}));
assert.equal(result.ok,false);
assert.equal(result.reason,'non-player-side');

result=planDuelPoint(context({workGetExp:null}));
assert.equal(result.ok,false);
assert.equal(result.reason,'work-getexp-required');

result=planDuelPoint(context({duelPoint:-1}));
assert.equal(result.ok,false);
assert.equal(result.reason,'duelpoint-required-or-invalid');

const controller=createBrowserStateController({state:{revision:0}});
const build=await controller.dispatch({
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  playerId:'v411-player',
  player:{
    id:'v411-player',
    name:'V411',
    level:1,
    hp:100,
    maxHp:100,
    mp:20,
    maxMp:20,
    luck:0,
    duelPoint:120,
    workGetExp:30,
    stats:{vital:10,str:10,tgh:10,dex:10}
  },
  team:[{enemyId:1,size:1,createMaxNum:1,enemy:{tempNo:1}}],
  encounter:{encounterId:1,floorId:1,x:1,y:1},
  groupId:1,
  battleFieldNo:1
});
assert.equal(build.ok,true,JSON.stringify(build));
const plan=await controller.dispatch({
  type:CONTROLLER_DUELPOINT_PLAN,
  side:0,
  num:0
});
assert.equal(plan.ok,true,JSON.stringify(plan));
assert.equal(plan.currentDuelPoint,120);
assert.equal(plan.workGetExp,30);
assert.equal(plan.nextDuelPoint,150);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_BATTLE_DUELPOINT_RUNTIME_FORMAT,
  action:CONTROLLER_DUELPOINT_PLAN,
  nextDuelPoint:150,
  readOnly:true
},null,2));
