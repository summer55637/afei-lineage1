import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { planBattleExp } from '../src/stoneage_browser_battle_exp_runtime.mjs';
import {
  ACTION_BATTLE_LEVELUP_PLAN,
  BROWSER_BATTLE_LEVELUP_PLAN_RUNTIME_FORMAT,
  EXP_TABLE,
  planEntityLevelUp,
  planBattleLevelUp
} from '../src/stoneage_browser_battle_levelup_runtime.mjs';

const now=()=> '2026-10-01T10:30:00+08:00';
const state=freshPersistentState({now,playerId:'p1',playerName:'Tester'});
state.player.level=1;
state.player.exp=0;
state.player.duelPoint=10;
state.player.charm=20;
state.player.profession.skillPoint=4;
state.player.workGetExp=1;
state.pets.petBox=[{id:'pet-1',level:1,exp:0,hp:10,maxHp:10,workGetExp:1}];

const battleContext={
  context:{sides:[
    {side:0,type:0,entries:[
      {bid:0,sourceType:'player',characterId:'p1',level:1,hp:100,isDie:false,workGetExp:1},
      {bid:5,sourceType:'pet',characterId:'pet-1',level:1,hp:20,isDie:false,workGetExp:1}
    ]},
    {side:1,type:1,entries:Array(10).fill(null)}
  ]}
};

const expPlan=planBattleExp(battleContext,state);
assert.equal(expPlan.ok,true);
const levelPlan=planBattleLevelUp(expPlan,state);
assert.equal(levelPlan.ok,true);
assert.equal(levelPlan.stage,'battle-levelup-plan-ready');
assert.equal(levelPlan.format,BROWSER_BATTLE_LEVELUP_PLAN_RUNTIME_FORMAT);
assert.equal(levelPlan.action,ACTION_BATTLE_LEVELUP_PLAN);
assert.equal(EXP_TABLE[2],2);
assert.equal(levelPlan.player.levelUps,4);
assert.equal(levelPlan.player.levelAfter,5);
assert.equal(levelPlan.player.expAfter,37);
assert.equal(levelPlan.player.duelPointGain,140);
assert.equal(levelPlan.player.duelPointAfter,150);
assert.equal(levelPlan.player.skillPointAfter,16);
assert.equal(levelPlan.player.charmAfter,22);
assert.equal(levelPlan.pets.length,1);
assert.equal(levelPlan.pets[0].levelUps,4);
assert.equal(levelPlan.pets[0].levelAfter,5);
assert.equal(levelPlan.pets[0].expAfter,37);
assert.equal(levelPlan.persistentStateMutation,false);

const noLevel=planEntityLevelUp({entityType:'player',level:140,exp:99999999,transmigration:0});
assert.equal(noLevel.levelUps,0);
assert.equal(noLevel.levelAfter,140);
assert.equal(noLevel.expAfter,99999999);

const transAllowed=planEntityLevelUp({entityType:'player',level:140,exp:80000000,transmigration:5});
assert.equal(transAllowed.levelUps>0,true);

const petCap=planEntityLevelUp({entityType:'pet',level:160,exp:99999999});
assert.equal(petCap.levelUps,0);
assert.equal(petCap.levelAfter,160);

console.log('V4.14 Browser Battle level-up plan regression: PASS');
