import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_BATTLE_EXP_PLAN,
  BROWSER_BATTLE_EXP_PLAN_RUNTIME_FORMAT,
  SOURCE_BATTLE_EXP_MULTIPLIER,
  applyBattleExpFormula,
  planBattleExp
} from '../src/stoneage_browser_battle_exp_runtime.mjs';

const now=()=> '2026-10-01T10:20:00+08:00';
const state=freshPersistentState({now,playerId:'p1',playerName:'Tester'});
state.player.level=10;
state.player.exp=100;
state.pets.petBox=[
  {id:'pet-1',level:8,exp:50,hp:10,maxHp:10,workGetExp:3},
  {id:'pet-dead',level:8,exp:50,hp:0,maxHp:10,workGetExp:99}
];
const battleContext={
  context:{
    sides:[
      {side:0,type:0,entries:[
        {bid:0,sourceType:'player',characterId:'p1',level:10,hp:100,isDie:false,workGetExp:2},
        {bid:5,sourceType:'pet',characterId:'pet-1',level:8,hp:20,isDie:false,workGetExp:3}
      ]},
      {side:1,type:1,entries:Array(10).fill(null)}
    ]
  }
};

const result=planBattleExp(battleContext,state);
assert.equal(result.ok,true);
assert.equal(result.handled,true);
assert.equal(result.stage,'battle-exp-plan-ready');
assert.equal(result.format,BROWSER_BATTLE_EXP_PLAN_RUNTIME_FORMAT);
assert.equal(result.action,ACTION_BATTLE_EXP_PLAN);
assert.equal(result.source.setupBattleExp,SOURCE_BATTLE_EXP_MULTIPLIER);
assert.equal(result.player.calculation.clampedWorkGetExp,2);
assert.equal(result.player.calculation.addExp,200);
assert.equal(result.player.calculation.nextExp,300);
assert.equal(result.pets.length,1,'only pets present in the active Battle Context receive battle EXP');
assert.equal(result.pets[0].petId,'pet-1');
assert.equal(result.pets[0].calculation.addExp,300);
assert.equal(result.pets[0].calculation.nextExp,350);
assert.equal(result.persistentStateMutation,false);

const levelCap=applyBattleExpFormula({workGetExp:10,level:200,currentExp:123});
assert.equal(levelCap.addExp,0);
assert.equal(levelCap.nextExp,123);

const expCap=applyBattleExpFormula({workGetExp:1000000000,level:1,currentExp:1000000000,battleExpMultiplier:100});
assert.equal(expCap.nextExp,1224160000);
assert.equal(expCap.expCapApplied,true);

const mismatchState=freshPersistentState({now,playerId:'p1'});
mismatchState.player.level=10;
mismatchState.player.workGetExp=9;
const mismatch=planBattleExp(battleContext,mismatchState);
assert.equal(mismatch.ok,false);
assert.equal(mismatch.reason,'player-workgetexp-mismatch');

console.log('V4.13 Browser Battle EXP plan regression: PASS');
