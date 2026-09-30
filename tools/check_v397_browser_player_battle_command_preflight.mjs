#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  ACTION_BATTLE_PLAYER_COMMAND_PREFLIGHT,
  BATTLE_COM_ATTACK,
  BATTLE_COM_WAIT,
  BATTLE_CHARMODE_C_OK,
  checkErrorStatus,
  normalizeCommand,
  preflightPlayerBattleCommand,
  setBattlePlayerCommand
} from '../src/stoneage_browser_battle_player_command_runtime.mjs';

const context={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    sides:[
      {side:0,type:0,entries:[
        {battleSlot:0,bid:0,battleSide:0,characterId:'p',hp:100,sourceBattleCharMode:2,battleCommands:[-1,-1,-1]}
      ]},
      {side:1,type:1,entries:Array(10).fill(null)}
    ]
  }
};

let result=preflightPlayerBattleCommand(context,{battleSlot:0,command:'attack',targetBid:10});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.action,ACTION_BATTLE_PLAYER_COMMAND_PREFLIGHT);
assert.equal(result.blocked,false);
assert.deepEqual(result.blockedOn,[]);
assert.equal(checkErrorStatus(context.context.sides[0].entries[0]).blocked,false);

const statuses=['paralysis','stone','sleep','dizzy','dragnet'];
for(const key of statuses){
  const blocked=structuredClone(context);
  blocked.context.sides[0].entries[0].battleStatus={[key]:1};
  result=preflightPlayerBattleCommand(blocked,{battleSlot:0,command:'guard'});
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.blocked,true);
  assert.deepEqual(result.blockedOn,[key]);
  const set=setBattlePlayerCommand(blocked,{battleSlot:0,command:'guard'});
  assert.equal(set.ok,true,JSON.stringify(set));
  assert.equal(set.stage,'battle-player-command-status-blocked');
  assert.equal(set.command.code,BATTLE_COM_WAIT);
  assert.equal(set.command.targetBid,-1);
  assert.equal(set.battleContext.sides[0].entries[0].sourceBattleCharMode,BATTLE_CHARMODE_C_OK);
}

const allBlocked=structuredClone(context);
allBlocked.context.sides[0].entries[0].battleStatus={paralysis:1,stone:2,sleep:0,dizzy:1,dragnet:3,barrier:99};
result=checkErrorStatus(allBlocked.context.sides[0].entries[0]);
assert.equal(result.blocked,true);
assert.deepEqual(result.blockedOn,['paralysis','stone','dizzy','dragnet']);

assert.equal(normalizeCommand('pet_in').ok,true);
assert.equal(normalizeCommand('pet_in',-1).ok,true);
assert.equal(normalizeCommand('pet_out',4).ok,true);
assert.equal(normalizeCommand('pet_out',5).ok,false);
assert.equal(normalizeCommand('pet_out',10).ok,false);
assert.equal(normalizeCommand('attack',19).ok,true);

const petOut=setBattlePlayerCommand(context,{battleSlot:0,command:'pet_out',petIndex:4});
assert.equal(petOut.ok,true,JSON.stringify(petOut));
assert.equal(petOut.command.code,6);
assert.equal(petOut.command.targetBid,4);

const petIn=setBattlePlayerCommand(context,{battleSlot:0,command:'pet_in'});
assert.equal(petIn.ok,true,JSON.stringify(petIn));
assert.equal(petIn.command.targetBid,-1);

const unchanged=structuredClone(context);
assert.equal(unchanged.context.sides[0].entries[0].sourceBattleCharMode,2);
const attack=setBattlePlayerCommand(context,{battleSlot:0,command:'attack',targetBid:19});
assert.equal(attack.ok,true,JSON.stringify(attack));
assert.equal(attack.command.code,BATTLE_COM_ATTACK);
assert.equal(attack.command.targetBid,19);
assert.equal(context.context.sides[0].entries[0].sourceBattleCharMode,2);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v397-browser-player-battle-command-preflight-v1',
  action:'BATTLE_PLAYER_COMMAND_PREFLIGHT',
  blockedStatuses:statuses,
  fallback:{type:'wait',code:11,mode:3},
  petInIndex:-1,
  petOutIndexRange:[0,4],
  battleTargetRange:[0,19],
  barrierNotChecked:true,
  persistentMutation:false,
  rngConsumed:false
},null,2));
