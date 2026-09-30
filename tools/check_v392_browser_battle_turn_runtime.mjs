#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  BATTLE_COM_NONE,
  BATTLE_CHARMODE_C_WAIT,
  BATTLE_MODE_BATTLE,
  initializeBattleTurn
} from '../src/stoneage_browser_battle_turn_runtime.mjs';

const context={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'init',
    sourceMode:1,
    turn:0,
    sides:[
      {side:0,type:0,entries:[
        {battleSlot:0,bid:0,battleSide:0,battleMode:'init',sourceBattleCharMode:1,battleCommands:[5,6,7],modAttack:150,attackPower:100,modDefence:50,defencePower:20,modQuick:200,quick:100,modCharm:100,fixCharm:50,guardian:3},
        null,null,null,null,
        {battleSlot:5,bid:5,battleSide:0,battleMode:'init',sourceBattleCharMode:1,battleCommands:[4,6,7],modAttack:0,attackPower:30,modDefence:0,defencePower:10,modQuick:0,quick:20,guardian:2},
        null,null,null,null
      ]},
      {side:1,type:1,entries:[
        null,null,null,null,null,
        {battleSlot:5,bid:15,battleSide:1,battleMode:'init',sourceBattleCharMode:1,battleCommands:[3,4,5],modAttack:150,attackPower:100,modDefence:50,defencePower:20,modQuick:200,quick:100,modCharm:100,guardian:4},
        null,null,null,null
      ]}
    ]
  }
};
const result=initializeBattleTurn(context);
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.context.mode,'battle');
assert.equal(result.context.sourceMode,BATTLE_MODE_BATTLE);
assert.equal(result.context.turn,0);
assert.equal(result.rngConsumedCount,0);
assert.equal(result.persistentMutation,false);

const player=result.context.sides[0].entries[0];
assert.equal(player.battleMode,'c_wait');
assert.equal(player.sourceBattleCharMode,BATTLE_CHARMODE_C_WAIT);
assert.equal(player.battleCommands[0],BATTLE_COM_NONE);
assert.deepEqual(player.battleCommands.slice(1),[6,7]);
assert.equal(player.guardian,-1);
assert.equal(player.modAttack,120);
assert.equal(player.attackPower,101);
assert.equal(player.modDefence,40);
assert.equal(player.defencePower,20);
assert.equal(player.modQuick,160);
assert.equal(player.quick,101);
assert.equal(player.modCharm,64);
assert.equal(player.fixCharm,50);

const pet=result.context.sides[0].entries[5];
assert.equal(pet.battleMode,'c_wait');
assert.equal(pet.sourceBattleCharMode,BATTLE_CHARMODE_C_WAIT);
assert.equal(pet.battleCommands[0],BATTLE_COM_NONE);

const enemy=result.context.sides[1].entries[5];
assert.equal(enemy.battleMode,'c_wait');
assert.equal(enemy.sourceBattleCharMode,BATTLE_CHARMODE_C_WAIT);
assert.equal(enemy.battleCommands[0],BATTLE_COM_NONE);
assert.equal(enemy.modAttack,120);
assert.equal(enemy.attackPower,101);
assert.equal(enemy.modDefence,40);
assert.equal(enemy.defencePower,20);
assert.equal(enemy.modQuick,160);
assert.equal(enemy.quick,101);
assert.equal(enemy.modCharm,80);
assert.equal(enemy.guardian,-1);

const charged={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'init',sourceMode:1,turn:0,
    sides:[{side:0,type:0,entries:[{battleSlot:0,bid:0,battleSide:0,battleMode:'init',battleCommands:[9,-1,-1],modAttack:0,attackPower:1,modDefence:0,defencePower:1,modQuick:0,quick:1},null,null,null,null,null,null,null,null,null]},
      {side:1,type:1,entries:Array(10).fill(null)}]
  }
};
const chargedResult=initializeBattleTurn(charged,{chargeEntries:['0:0']});
assert.equal(chargedResult.context.sides[0].entries[0].battleCommands[0],9);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v392-browser-battle-turn-runtime-v1',
  action:'BATTLE_TURN_INITIALIZE',
  battleMode:2,
  characterMode:2,
  commandNone:0,
  playerDoubleCharmDecay:true,
  statDecay:'0.8',
  rngConsumedCount:0,
  persistentMutation:false
},null,2));
