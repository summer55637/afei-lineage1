#!/usr/bin/env node
import assert from 'node:assert/strict';
import { commandWaitStatus, BROWSER_BATTLE_COMMAND_WAIT_RUNTIME_FORMAT } from '../src/stoneage_browser_battle_command_wait_runtime.mjs';

const base={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    sides:[
      {side:0,type:0,entries:[
        {battleSlot:0,bid:0,characterId:'p0',sourceBattleCharMode:2,hp:100},
        {battleSlot:5,bid:5,characterId:'pet',sourceBattleCharMode:3,hp:40}
      ].concat(Array(8).fill(null))},
      {side:1,type:1,entries:[
        null,null,null,null,null,
        {battleSlot:5,bid:15,characterId:'e0',sourceBattleCharMode:2,hp:30},
        null,null,null,null
      ]}
    ]
  }
};
let result=commandWaitStatus(base);
assert.equal(result.ok,true);
assert.equal(result.format,BROWSER_BATTLE_COMMAND_WAIT_RUNTIME_FORMAT);
assert.equal(result.ready,false);
assert.equal(result.sides[0].ready,false);
assert.deepEqual(result.sides[0].blockingEntries,[{battleSlot:0,bid:0,characterId:'p0'}]);
assert.equal(result.sides[0].cOkCount,1);
assert.equal(result.sides[1].ready,true);
assert.equal(result.rngConsumed,false);
assert.equal(result.mutation,false);

const ok=structuredClone(base);
ok.context.sides[0].entries[0].sourceBattleCharMode=3;
result=commandWaitStatus(ok);
assert.equal(result.ready,true);
assert.equal(result.sides[0].cOkCount,2);

const dead=structuredClone(base);
dead.context.sides[0].entries[0].hp=0;
result=commandWaitStatus(dead);
assert.equal(result.ready,true);
assert.deepEqual(result.sides[0].blockingEntries,[]);

const init=structuredClone(base);
init.context.sides[0].entries[0].sourceBattleCharMode=1;
result=commandWaitStatus(init);
assert.equal(result.ready,true);

const timeout=structuredClone(base);
result=commandWaitStatus(timeout,{timeoutExpired:true});
assert.equal(result.ready,true);
assert.equal(result.timeoutExpired,true);

const invalid=commandWaitStatus(null);
assert.equal(invalid.ok,false);
assert.equal(invalid.reason,'battle-context-required');

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_BATTLE_COMMAND_WAIT_RUNTIME_FORMAT,
  action:'BATTLE_COMMAND_WAIT_STATUS',
  cWaitBlocks:true,
  cOkReady:true,
  deadIgnored:true,
  enemyAutoReady:true,
  timeoutCompatibility:true,
  mutation:false,
  rngConsumed:false
},null,2));
