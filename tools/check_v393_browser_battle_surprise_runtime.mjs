#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  surpriseThresholds,
  surpriseCheck,
  applySurpriseToBattleContext,
  BSIDE_FLG_SURPRISE,
  BROWSER_BATTLE_SURPRISE_RUNTIME_FORMAT
} from '../src/stoneage_browser_battle_surprise_runtime.mjs';

assert.deepEqual(surpriseThresholds(5),{fixedLuck:5,a:20,b:0});
assert.deepEqual(surpriseThresholds(4),{fixedLuck:4,a:15,b:2});
assert.deepEqual(surpriseThresholds(3),{fixedLuck:3,a:10,b:3});
assert.deepEqual(surpriseThresholds(2),{fixedLuck:2,a:5,b:5});
assert.deepEqual(surpriseThresholds(0),{fixedLuck:0,a:0,b:7});

let result=surpriseCheck({fixedLuck:5,surpriseRoll:20});
assert.equal(result.ok,true);
assert.equal(result.result,1);
assert.equal(result.sideFlags.side1.surprised,true);
assert.equal(result.sideFlags.side1.flagDelta,BSIDE_FLG_SURPRISE);
assert.equal(result.sideFlags.side0.surprised,false);

result=surpriseCheck({fixedLuck:5,surpriseRoll:21});
assert.equal(result.ok,true);
assert.equal(result.result,0);

result=surpriseCheck({fixedLuck:4,surpriseRoll:16});
assert.equal(result.result,2);
result=surpriseCheck({fixedLuck:4,surpriseRoll:17});
assert.equal(result.result,0);

result=surpriseCheck({fixedLuck:3,surpriseRoll:12});
assert.equal(result.result,2);
result=surpriseCheck({fixedLuck:3,surpriseRoll:13});
assert.equal(result.result,0);

result=surpriseCheck({fixedLuck:2,surpriseRoll:9});
assert.equal(result.result,2);
result=surpriseCheck({fixedLuck:2,surpriseRoll:10});
assert.equal(result.result,0);

result=surpriseCheck({fixedLuck:1,surpriseRoll:6});
assert.equal(result.result,2);
result=surpriseCheck({fixedLuck:1,surpriseRoll:7});
assert.equal(result.result,0);

result=surpriseCheck({fixedLuck:1,surpriseRoll:1,battleType:2});
assert.equal(result.result,0);
assert.equal(result.rngConsumed,false);

result=surpriseCheck({fixedLuck:1,surpriseRoll:1,winFuncPresent:true});
assert.equal(result.result,0);
assert.equal(result.rngConsumed,false);

result=surpriseCheck({fixedLuck:1,surpriseRoll:1,playerPresent:false});
assert.equal(result.result,0);
assert.equal(result.rngConsumed,false);

result=surpriseCheck({fixedLuck:null,surpriseRoll:1});
assert.equal(result.ok,false);
assert.equal(result.reason,'fixed-luck-required');

result=surpriseCheck({fixedLuck:1,surpriseRoll:101});
assert.equal(result.ok,false);
assert.equal(result.reason,'surprise-rng-required-or-out-of-range');

const context={
  context:{
    sides:[
      {side:0,type:0,flg:0},
      {side:1,type:1,flg:0}
    ]
  }
};
result=surpriseCheck({fixedLuck:4,surpriseRoll:16});
const applied=applySurpriseToBattleContext(context,result);
assert.equal(applied.ok,true);
assert.equal(applied.context.surprise.result,2);
assert.equal(applied.context.sides[0].flg,BSIDE_FLG_SURPRISE);
assert.equal(applied.context.sides[1].flg,0);
assert.equal(context.context.sides[0].flg,0);

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_BATTLE_SURPRISE_RUNTIME_FORMAT,
  action:'BATTLE_SURPRISE_CHECK',
  rollMapping:{
    luck5:{20:1,21:0},
    luck4:{16:2,17:0},
    luck3:{12:2,13:0},
    luck2:{9:2,10:0},
    default:{6:2,7:0}
  },
  sideFlag:1,
  persistentMutation:false,
  battleStarted:false
},null,2));
