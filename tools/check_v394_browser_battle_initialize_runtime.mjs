#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  createBrowserBattleInitializeRuntime,
  BROWSER_BATTLE_INITIALIZE_RUNTIME_FORMAT
} from '../src/stoneage_browser_battle_initialize_runtime.mjs';

function makeContext(){
  return {
    format:'stoneage-browser-battle-context-runtime-v1',
    context:{
      mode:'init',sourceMode:1,turn:0,type:1,
      sides:[
        {side:0,type:0,flg:0,entries:[{
          battleSlot:0,bid:0,battleSide:0,battleMode:'init',sourceBattleCharMode:1,
          battleCommands:[-1,-1,-1],modAttack:0,attackPower:100,modDefence:0,defencePower:20,modQuick:0,quick:30,
          modCharm:100,fixCharm:50,guardian:3
        },null,null,null,null]},
        {side:1,type:1,flg:0,entries:[
          null,null,null,null,null,
          {battleSlot:5,bid:15,battleSide:1,battleMode:'init',sourceBattleCharMode:1,
           battleCommands:[-1,-1,-1],modAttack:100,attackPower:100,modDefence:0,defencePower:20,modQuick:0,quick:30,guardian:4},
          null,null,null,null
        ]}
      ]
    }
  };
}
const runtime=createBrowserBattleInitializeRuntime();
assert.equal(runtime.ok,true);

let result=runtime.initialize(makeContext(),{fixedLuck:5,surpriseRoll:20});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.format,BROWSER_BATTLE_INITIALIZE_RUNTIME_FORMAT);
assert.equal(result.stage,'battle-initialized');
assert.equal(result.surprise.result,1);
assert.equal(result.context.sides[1].flg,1);
assert.equal(result.context.sides[0].flg,0);
assert.equal(result.context.mode,'battle');
assert.equal(result.context.sourceMode,2);
assert.equal(result.context.turn,0);
assert.equal(result.context.sides[0].entries[0].battleMode,'c_wait');
assert.equal(result.context.sides[0].entries[0].sourceBattleCharMode,2);
assert.equal(result.context.sides[0].entries[0].battleCommands[0],0);
assert.equal(result.context.sides[1].entries[5].battleMode,'c_wait');
assert.equal(result.context.sides[1].entries[5].battleCommands[0],0);
assert.equal(result.context.sides[0].entries[0].modAttack,0);
assert.equal(result.persistentMutation,false);
assert.equal(result.damageExecuted,false);

result=runtime.initialize(makeContext(),{fixedLuck:5,surpriseRoll:21});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.surprise.result,0);
assert.equal(result.context.sides[0].flg,0);
assert.equal(result.context.sides[1].flg,0);

result=runtime.initialize(makeContext(),{fixedLuck:4,surpriseRoll:16});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.surprise.result,2);
assert.equal(result.context.sides[0].flg,1);
assert.equal(result.context.sides[1].flg,0);

result=runtime.initialize(makeContext(),{fixedLuck:4,surpriseRoll:17});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.surprise.result,0);

result=runtime.initialize(makeContext(),{fixedLuck:null,surpriseRoll:1});
assert.equal(result.ok,false);
assert.equal(result.reason,'fixed-luck-required');

result=runtime.initialize(makeContext(),{fixedLuck:5,surpriseRoll:101});
assert.equal(result.ok,false);
assert.equal(result.reason,'surprise-rng-required-or-out-of-range');

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_BATTLE_INITIALIZE_RUNTIME_FORMAT,
  action:'BATTLE_INITIALIZE',
  enemySurprise:{fixedLuck:5,roll:20,result:1,side1Flag:1},
  playerSurprise:{fixedLuck:4,roll:16,result:2,side0Flag:1},
  noSurprise:{fixedLuck:5,roll:21,result:0},
  actorMode:'c_wait',
  sourceMode:2,
  persistentMutation:false,
  damageExecuted:false
},null,2));
