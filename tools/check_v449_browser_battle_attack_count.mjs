#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createBrowserBattleAttackCountRuntime } from '../src/stoneage_browser_battle_attack_count_runtime.mjs';

const runtime=createBrowserBattleAttackCountRuntime();
assert.equal(runtime.ok,true);

const bowMin=runtime.resolve({itemPresent:true,attackNumMin:1,attackNumMax:3,roll:1});
assert.equal(bowMin.ok,true,JSON.stringify(bowMin));
assert.equal(bowMin.attackCount,1);
assert.equal(bowMin.rngConsumed,1);

const bowMax=runtime.resolve({itemPresent:true,attackNumMin:1,attackNumMax:3,roll:3});
assert.equal(bowMax.ok,true,JSON.stringify(bowMax));
assert.equal(bowMax.attackCount,3);

const enemyBow=runtime.resolve({itemPresent:true,attackNumMin:3,attackNumMax:5,roll:4});
assert.equal(enemyBow.ok,true,JSON.stringify(enemyBow));
assert.equal(enemyBow.attackCount,4);

const zero=runtime.resolve({itemPresent:true,attackNumMin:0,attackNumMax:0,roll:0});
assert.equal(zero.ok,true,JSON.stringify(zero));
assert.equal(zero.attackCount,1);

const noItem=runtime.resolve({itemPresent:false});
assert.equal(noItem.ok,true,JSON.stringify(noItem));
assert.equal(noItem.attackCount,0);
assert.equal(noItem.rngConsumed,0);

const missingRng=runtime.resolve({itemPresent:true,attackNumMin:1,attackNumMax:3});
assert.equal(missingRng.ok,false);
assert.equal(missingRng.reason,'attack-num-rng-required-or-out-of-range');

const outOfRange=runtime.resolve({itemPresent:true,attackNumMin:3,attackNumMax:5,roll:2});
assert.equal(outOfRange.ok,false);
assert.equal(outOfRange.reason,'attack-num-rng-required-or-out-of-range');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v449-browser-battle-attack-count-v1',
  item400:{range:[1,3],rolls:[1,3]},
  item2498:{range:[3,5],roll:4},
  zeroRange:{roll:0,attackCount:1},
  noItem:{attackCount:0},
  failClosed:true
},null,2));
