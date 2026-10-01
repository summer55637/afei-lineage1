#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  ACTION_BATTLE_DEATH_COMMIT,
  BROWSER_BATTLE_DEATH_COMMIT_RUNTIME_FORMAT,
  commitDeathState
} from '../src/stoneage_browser_battle_death_commit_runtime.mjs';
import {
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_DEATH_PLAN,
  ACTION_BATTLE_DEATH_COMMIT as CONTROLLER_DEATH_COMMIT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';

const baseContext={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    type:1,
    sides:[
      {
        side:0,
        type:0,
        entries:[
          {bid:0,sourceType:'player',hp:100,isDie:false,deadCount:0,battleOutcomeFlags:0,ultimate:0},
          null,null,null,null,
          {bid:5,sourceType:'pet',hp:100,isDie:false,deadCount:0,battleOutcomeFlags:0,ultimate:0},
          null,null,null,null
        ]
      },
      {
        side:1,
        type:1,
        entries:[
          {bid:10,sourceType:'enemy',hp:0,isDie:false,deadCount:0,battleOutcomeFlags:0,ultimate:0},
          null,null,null,null,null,null,null,null,null
        ]
      }
    ]
  }
};

const deathPlan={
  ok:true,
  dead:true,
  deathFlag:true,
  targetBid:10,
  clientFlags:65,
  ultimate:1
};

const original=structuredClone(baseContext);
let result=commitDeathState(baseContext,{targetBid:10,deathPlan});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.action,ACTION_BATTLE_DEATH_COMMIT);
assert.equal(result.format,BROWSER_BATTLE_DEATH_COMMIT_RUNTIME_FORMAT);
assert.equal(result.isDie,true);
assert.equal(result.deadCountBefore,0);
assert.equal(result.deadCountAfter,1);
assert.equal(result.battleOutcomeFlags,65);
assert.equal(result.ultimate,1);
assert.equal(result.persistentMutation,false);
assert.equal(result.rewardMutation,false);
assert.equal(baseContext.context.sides[1].entries[0].isDie,false);
assert.deepEqual(baseContext,original);

result=commitDeathState(result.battleContext,{targetBid:10,deathPlan});
assert.equal(result.ok,false);
assert.equal(result.reason,'target-already-dead');

result=commitDeathState(baseContext,{targetBid:10,deathPlan:{ok:true,dead:false,deathFlag:false}});
assert.equal(result.ok,false);
assert.equal(result.reason,'death-plan-not-dead');

result=commitDeathState(baseContext,{targetBid:10});
assert.equal(result.ok,false);
assert.equal(result.reason,'death-plan-required');

const controller=createBrowserStateController({state:{revision:0}});
const build=await controller.dispatch({
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  playerId:'v407-player',
  player:{
    id:'v407-player',
    name:'V407',
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

const planResult=await controller.dispatch({
  type:ACTION_BATTLE_DEATH_PLAN,
  targetBid:10,
  hp:0
});
assert.equal(planResult.ok,true,JSON.stringify(planResult));
assert.equal(planResult.dead,true);

const committed=await controller.dispatch({
  type:CONTROLLER_DEATH_COMMIT,
  targetBid:10,
  deathPlan:planResult
});
assert.equal(committed.ok,true,JSON.stringify(committed));
assert.equal(committed.battleContext.context.sides[1].entries[0].isDie,true);
assert.equal(committed.battleContext.context.sides[1].entries[0].deadCount,1);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v407-browser-battle-death-commit-v1',
  action:CONTROLLER_DEATH_COMMIT,
  ephemeralMutation:true,
  persistentMutation:false,
  rewardMutation:false
},null,2));
