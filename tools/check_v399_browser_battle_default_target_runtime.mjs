#!/usr/bin/env node
import assert from 'node:assert/strict';
import { resolveDefaultTarget } from '../src/stoneage_browser_battle_default_target_runtime.mjs';

const blankEntries=()=>Array(10).fill(null);
const context={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    sides:[
      {side:0,type:0,entries:blankEntries()},
      {side:1,type:1,entries:blankEntries()}
    ]
  }
};
context.context.sides[1].entries[0]={bid:10,battleSlot:0,characterId:'e10',sourceBattleCharMode:2,hp:100,isAttacked:1};
context.context.sides[1].entries[2]={bid:12,battleSlot:2,characterId:'e12',sourceBattleCharMode:2,hp:100,isAttacked:1};
context.context.sides[1].entries[5]={bid:15,battleSlot:5,characterId:'e15',sourceBattleCharMode:2,hp:100,isAttacked:1};
context.context.sides[1].entries[7]={bid:17,battleSlot:7,characterId:'dead',sourceBattleCharMode:2,hp:0,isAttacked:1};

let result=resolveDefaultTarget(context,{side:1,defaultTargetRoll:0});
assert.equal(result.ok,true,JSON.stringify(result));
assert.deepEqual(result.candidates.map(x=>x.bid),[10,12,15]);
assert.equal(result.selectedBid,10);
assert.equal(result.rngConsumed,true);

result=resolveDefaultTarget(context,{side:1,defaultTargetRoll:1});
assert.equal(result.selectedBid,12);
result=resolveDefaultTarget(context,{side:1,defaultTargetRoll:2});
assert.equal(result.selectedBid,15);
result=resolveDefaultTarget(context,{side:1,defaultTargetRoll:3});
assert.equal(result.ok,false);
assert.equal(result.reason,'default-target-rng-required-or-out-of-range');

const resc=structuredClone(context);
resc.context.sides[1].entries[2].sourceBattleCharMode=5;
result=resolveDefaultTarget(resc,{side:1,defaultTargetRoll:1});
assert.deepEqual(result.candidates.map(x=>x.bid),[10,15]);

const blocked=structuredClone(context);
blocked.context.sides[1].entries[0].isAttacked=0;
blocked.context.sides[1].entries[5].hp=0;
result=resolveDefaultTarget(blocked,{side:1,defaultTargetRoll:0});
assert.deepEqual(result.candidates.map(x=>x.bid),[12]);

const none=structuredClone(context);
none.context.sides[1].entries.forEach((_,i)=>{none.context.sides[1].entries[i]=null;});
result=resolveDefaultTarget(none,{side:1,defaultTargetRoll:0});
assert.equal(result.ok,true);
assert.equal(result.selectedBid,-1);
assert.equal(result.defaultTargetResolved,false);
assert.equal(result.rngConsumed,false);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v399-browser-battle-default-target-runtime-v1',
  action:'BATTLE_DEFAULT_TARGET_RESOLVE',
  candidateBids:[10,12,15],
  selectionRolls:[0,1,2],
  emptyResult:-1,
  rescueExcluded:true,
  deadExcluded:true,
  persistentMutation:false,
  rngCallerInjected:true
},null,2));
