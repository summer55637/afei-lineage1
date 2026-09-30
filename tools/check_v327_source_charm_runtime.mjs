#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  SOURCE_CHARM_RUNTIME_FORMAT,
  SOURCE_CHARM_MAX,
  applySourceCharm,
  createSourceCharmHandler
} from '../src/stoneage_charm_runtime.mjs';

assert.equal(SOURCE_CHARM_RUNTIME_FORMAT,'stoneage-source-charm-runtime-v1');
assert.equal(SOURCE_CHARM_MAX,100);

assert.deepEqual(applySourceCharm(60,1,-1),{
  ok:true,applied:false,reason:'source-event-no-not-positive',eventNo:-1,currentCharm:60,nextCharm:60
});
assert.deepEqual(applySourceCharm(60,1,174),{
  ok:true,applied:true,eventNo:174,currentCharm:60,amount:1,nextCharm:61
});
assert.equal(applySourceCharm(100,1,174).nextCharm,100);
assert.equal(applySourceCharm(99,5,174).nextCharm,100);

const state=freshPersistentState({playerId:'charm-test'});
state.player.charm=60;
const handler=createSourceCharmHandler();
const skipped=handler(state,{value:1,eventNo:-1});
assert.equal(skipped.ok,true);
assert.equal(skipped.applied,false);
assert.equal(state.player.charm,60);
const applied=handler(state,{value:1,eventNo:174});
assert.equal(applied.ok,true);
assert.equal(applied.applied,true);
assert.equal(state.player.charm,61);

console.log(JSON.stringify({
  pass:true,
  format:SOURCE_CHARM_RUNTIME_FORMAT,
  eventNoMinusOneIsNoOp:true,
  positiveEventAddsCharm:true,
  cap:SOURCE_CHARM_MAX
}));
