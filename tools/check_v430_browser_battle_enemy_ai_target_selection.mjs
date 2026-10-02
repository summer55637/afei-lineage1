#!/usr/bin/env node
import assert from 'node:assert/strict';
import { planEnemyAiCommands } from '../src/stoneage_browser_battle_enemy_ai_runtime.mjs';

function context({targetType=1,selectMode=1,players=[40,60],pets=[80]}={}){
  const playerEntries=players.map((hp,i)=>({bid:i,sourceType:'player',hp,isDie:false,sourceBattleCharMode:2}));
  const petEntries=pets.map((hp,i)=>({bid:5+i,sourceType:'pet',hp,isDie:false,sourceBattleCharMode:2}));
  playerEntries.push({bid:2,sourceType:'player',hp:999,isDie:true,sourceBattleCharMode:2});
  petEntries.push({bid:8,sourceType:'pet',hp:0,isDie:false,sourceBattleCharMode:5});
  return {context:{mode:'battle',sourceMode:2,turn:1,sides:[
    {side:0,type:0,entries:[...playerEntries,...petEntries]},
    {side:1,type:1,flg:0,entries:[{bid:10,sourceType:'enemy',isDie:false,sourceBattleCharMode:2,
      sourceEnemyAi:{format:'stoneage-enemy-ai-source-v1',attackWeight:1,targetType,selectMode,guardWeight:0,magicWeight:0,escapeWeight:0,skillWeights:[0,0,0,0,0,0,0]}}
    ]}
  ]}};
}
function plan(options,rolls=[]){
  return planEnemyAiCommands(context(options),{actionRolls:[0],targetRolls:rolls});
}

const hpMax=plan({selectMode:2});
assert.equal(hpMax.ok,true,JSON.stringify(hpMax));
assert.equal(hpMax.commands[0].targetBid,5,'HP_MAX selects the highest-HP eligible target');
assert.equal(hpMax.commands[0].targetRoll,null);
assert.deepEqual(hpMax.rngConsumed,{action:1,target:0,total:1});

const hpMin=plan({selectMode:3,players:[40,40],pets:[80]});
assert.equal(hpMin.ok,true,JSON.stringify(hpMin));
assert.equal(hpMin.commands[0].targetBid,0,'HP_MIN keeps the first target on equal HP');

const playerMax=plan({targetType:2,selectMode:2,players:[40,60],pets:[100]});
assert.equal(playerMax.ok,true,JSON.stringify(playerMax));
assert.equal(playerMax.commands[0].targetBid,1,'PLAYER target type excludes higher-HP pets');

const petMin=plan({targetType:3,selectMode:3,players:[1],pets:[80,50]});
assert.equal(petMin.ok,true,JSON.stringify(petMin));
assert.equal(petMin.commands[0].targetBid,6,'PET target type selects the lowest-HP pet');

const fallback=plan({targetType:2,selectMode:1,players:[],pets:[80]},[0]);
assert.equal(fallback.ok,true,JSON.stringify(fallback));
assert.equal(fallback.commands[0].targetBid,5,'empty specific target set falls back to all eligible targets');

const missingHp=plan({selectMode:2,players:[null],pets:[]});
assert.equal(missingHp.ok,false);
assert.equal(missingHp.reason,'enemy-ai-target-hp-required');

const unsupported=plan({selectMode:4});
assert.equal(unsupported.ok,false);
assert.equal(unsupported.reason,'enemy-ai-target-select-mode-not-supported');

console.log(JSON.stringify({pass:true,format:'stoneage-v430-browser-battle-enemy-ai-target-selection-v1',cases:['HP max','HP min with stable first-match tie','player-only HP max','pet-only HP min','specific-target fallback to all','missing HP fail-closed','unsupported selector fail-closed'],targetRngForHpModes:0},null,2));
