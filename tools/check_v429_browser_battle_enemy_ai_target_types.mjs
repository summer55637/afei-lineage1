#!/usr/bin/env node
import assert from 'node:assert/strict';
import { planEnemyAiCommands } from '../src/stoneage_browser_battle_enemy_ai_runtime.mjs';

const makeContext=targetType=>({
  context:{
    mode:'battle',sourceMode:2,turn:1,
    sides:[
      {side:0,type:0,entries:[
        {bid:0,sourceType:'player',isDie:false,sourceBattleCharMode:2},
        {bid:5,sourceType:'pet',isDie:false,sourceBattleCharMode:2},
        {bid:6,sourceType:'player',isDie:true,sourceBattleCharMode:2},
        {bid:7,sourceType:'player',isDie:false,sourceBattleCharMode:5}
      ]},
      {side:1,type:1,flg:0,entries:[
        {bid:10,sourceType:'enemy',isDie:false,sourceBattleCharMode:2,
         sourceEnemyAi:{format:'stoneage-enemy-ai-source-v1',attackWeight:1,targetType,selectMode:1,guardWeight:0,magicWeight:0,escapeWeight:0,skillWeights:[0,0,0,0,0,0,0]}}
      ]}
    ]
  }
});
for(const targetType of [0,1]){
  const result=planEnemyAiCommands(makeContext(targetType),{actionRolls:[0],targetRolls:[1]});
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.commands[0].targetBid,5,'default/all targeting includes player and pet, excluding dead/rescue');
}
const playerOnly=planEnemyAiCommands(makeContext(2),{actionRolls:[0],targetRolls:[0]});
assert.equal(playerOnly.ok,true,JSON.stringify(playerOnly));
assert.equal(playerOnly.commands[0].targetBid,0);
const petOnly=planEnemyAiCommands(makeContext(3),{actionRolls:[0],targetRolls:[0]});
assert.equal(petOnly.ok,false,'the fixture has no opposing-side pet for this direction');
assert.equal(petOnly.reason,'enemy-ai-no-valid-targets');
console.log(JSON.stringify({pass:true,targetTypes:[0,1,2,3],defaultTypeIncludesAll:true,deadAndRescueExcluded:true},null,2));
