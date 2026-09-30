#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  normalizeCommand,
  setBattlePlayerCommand,
  BATTLE_COM_ATTACK,
  BATTLE_COM_BOOMERANG,
  BATTLE_COM_GUARD,
  BATTLE_COM_WAIT,
  BATTLE_COM_ESCAPE,
  BATTLE_COM_CAPTURE,
  BATTLE_COM_PETIN,
  BATTLE_COM_PETOUT
} from '../src/stoneage_browser_battle_player_command_runtime.mjs';

for(const [command,code] of [
  ['attack',BATTLE_COM_ATTACK],
  ['guard',BATTLE_COM_GUARD],
  ['wait',BATTLE_COM_WAIT],
  ['escape',BATTLE_COM_ESCAPE],
  ['capture',BATTLE_COM_CAPTURE],
  ['pet_in',BATTLE_COM_PETIN],
  ['pet_out',BATTLE_COM_PETOUT]
]){
  const target=(command==='attack'||command==='capture')?10:(command==='pet_out'?4:null);
  const n=normalizeCommand(command,target);
  assert.equal(n.ok,true);
  assert.equal(n.commandCode,code);
}
assert.equal(normalizeCommand('attack',20).ok,false);
assert.equal(normalizeCommand('guard',10).ok,false);
assert.equal(normalizeCommand('unknown',null).ok,false);

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

let result=setBattlePlayerCommand(context,{battleSlot:0,command:'attack',targetBid:10});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.command.type,'attack');
assert.equal(result.command.code,BATTLE_COM_ATTACK);
assert.equal(result.command.targetBid,10);
assert.equal(result.command.command3,1);
assert.equal(result.battleContext.sides[0].entries[0].sourceBattleCharMode,3);
assert.equal(result.battleContext.sides[0].entries[0].battleMode,'c_ok');
assert.equal(context.context.sides[0].entries[0].sourceBattleCharMode,2);

result=setBattlePlayerCommand(context,{battleSlot:0,command:'attack',targetBid:10,weaponKind:'boomerang'});
assert.equal(result.command.code,BATTLE_COM_BOOMERANG);

result=setBattlePlayerCommand(context,{battleSlot:0,command:'guard'});
assert.equal(result.command.code,BATTLE_COM_GUARD);
assert.equal(result.command.targetBid,-1);

result=setBattlePlayerCommand(context,{battleSlot:0,command:'wait'});
assert.equal(result.command.code,BATTLE_COM_WAIT);

result=setBattlePlayerCommand(context,{battleSlot:0,command:'escape'});
assert.equal(result.command.code,BATTLE_COM_ESCAPE);

result=setBattlePlayerCommand(context,{battleSlot:0,command:'capture',targetBid:19});
assert.equal(result.command.code,BATTLE_COM_CAPTURE);

result=setBattlePlayerCommand(context,{battleSlot:0,command:'pet_in'});
assert.equal(result.command.code,BATTLE_COM_PETIN);

result=setBattlePlayerCommand(context,{battleSlot:0,command:'pet_out',targetBid:4});
assert.equal(result.command.code,BATTLE_COM_PETOUT);

const bad=structuredClone(context);
bad.context.sides[0].entries[0].sourceBattleCharMode=3;
result=setBattlePlayerCommand(bad,{battleSlot:0,command:'guard'});
assert.equal(result.ok,false);
assert.equal(result.reason,'player-entry-not-waiting-for-command');

const dead=structuredClone(context);
dead.context.sides[0].entries[0].hp=0;
result=setBattlePlayerCommand(dead,{battleSlot:0,command:'guard'});
assert.equal(result.ok,false);
assert.equal(result.reason,'dead-player-entry-cannot-command');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-browser-player-battle-command-runtime-v1',
  action:'BATTLE_PLAYER_COMMAND_SET',
  commands:{attack:1,guard:2,wait:11,escape:4,capture:3,petIn:5,petOut:6,boomerang:8},
  targetRange:[0,19],
  cOkMode:3,
  persistentMutation:false,
  rngConsumed:false,
  battleResolution:false
},null,2));
