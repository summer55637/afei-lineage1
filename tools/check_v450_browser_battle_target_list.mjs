#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createBrowserBattleTargetListRuntime } from '../src/stoneage_browser_battle_target_list_runtime.mjs';

const runtime=createBrowserBattleTargetListRuntime();
assert.equal(runtime.ok,true);

const basic=runtime.resolve({attackNo:0,requestedTargetBid:10,weaponType:'axe'});
assert.equal(basic.ok,true,JSON.stringify(basic));
assert.deepEqual(basic.targets,[10]);
assert.equal(basic.rngConsumed,0);

const bow0=runtime.resolve({attackNo:0,requestedTargetBid:10,weaponType:'bow',bowRowRoll:0});
assert.equal(bow0.ok,true,JSON.stringify(bow0));
assert.deepEqual(bow0.targets,[10,15,11,16,13,18,12,17,14,19]);
assert.equal(bow0.targetCount,10);
assert.equal(bow0.rngConsumed,1);
assert.equal(bow0.revalidateAliveAtExecution,true);

const bowSelf=runtime.resolve({attackNo:10,requestedTargetBid:10,weaponType:'bow',bowRowRoll:0});
assert.equal(bowSelf.ok,true,JSON.stringify(bowSelf));
assert.equal(bowSelf.targets[0],-1);

const bowReverse=runtime.resolve({attackNo:10,requestedTargetBid:15,weaponType:'bow',bowRowRoll:1});
assert.equal(bowReverse.ok,true,JSON.stringify(bowReverse));
assert.equal(bowReverse.bowRowRoll,1);
assert.equal(bowReverse.deftop,10);

const missingRoll=runtime.resolve({attackNo:0,requestedTargetBid:10,weaponType:'bow'});
assert.equal(missingRoll.ok,false);
assert.equal(missingRoll.reason,'bow-row-rng-required-or-out-of-range');

const invalidRoll=runtime.resolve({attackNo:0,requestedTargetBid:10,weaponType:'bow',bowRowRoll:2});
assert.equal(invalidRoll.ok,false);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v450-browser-battle-target-list-v1',
  basic:[10],
  bowRow0:bow0.targets,
  bowRow1Deftop:bowReverse.deftop,
  rngConsumed:{basic:basic.rngConsumed,bow:bow0.rngConsumed},
  failClosed:true
},null,2));
