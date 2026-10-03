#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createBrowserBattleAttackCountRuntime } from '../src/stoneage_browser_battle_attack_count_runtime.mjs';

const runtime=createBrowserBattleAttackCountRuntime();
assert.equal(runtime.ok,true);

const lv9=runtime.resolve({itemPresent:false,actorType:'player',level:9,luck:0});
assert.equal(lv9.ok,true,JSON.stringify(lv9));
assert.equal(lv9.attackCount,1);
assert.equal(lv9.rngConsumed,0);

const lv10One=runtime.resolve({itemPresent:false,actorType:'player',level:10,luck:0,fallbackRoll:71});
assert.equal(lv10One.ok,true,JSON.stringify(lv10One));
assert.equal(lv10One.attackCount,1);
assert.equal(lv10One.rngConsumed,1);

const lv10Two=runtime.resolve({itemPresent:false,actorType:'player',level:10,luck:0,fallbackRoll:31});
assert.equal(lv10Two.ok,true,JSON.stringify(lv10Two));
assert.equal(lv10Two.attackCount,2);
assert.equal(lv10Two.rngConsumed,1);

const lv10Three=runtime.resolve({itemPresent:false,actorType:'player',level:10,luck:0,fallbackRoll:11});
assert.equal(lv10Three.ok,true,JSON.stringify(lv10Three));
assert.equal(lv10Three.attackCount,3);
assert.equal(lv10Three.rngConsumed,1);
assert.equal(lv10Three.unarmedPlayer.damageDivisor,1);

const lv10LuckBurst=runtime.resolve({itemPresent:false,actorType:'player',level:10,luck:0,fallbackRoll:10,fallbackAttackRoll:8});
assert.equal(lv10LuckBurst.ok,true,JSON.stringify(lv10LuckBurst));
assert.equal(lv10LuckBurst.attackCount,8);
assert.equal(lv10LuckBurst.rngConsumed,2);
assert.equal(lv10LuckBurst.unarmedPlayer.damageDivisor,1);

const luckClamp=runtime.resolve({itemPresent:false,actorType:'player',level:10,luck:8,fallbackRoll:56});
assert.equal(luckClamp.ok,true,JSON.stringify(luckClamp));
assert.equal(luckClamp.unarmedPlayer.luckWork,25);
assert.equal(luckClamp.attackCount,2);

const missingFirst=runtime.resolve({itemPresent:false,actorType:'player',level:10,luck:0});
assert.equal(missingFirst.ok,false);
assert.equal(missingFirst.reason,'unarmed-player-attack-count-rng-required-or-out-of-range');

const missingSecond=runtime.resolve({itemPresent:false,actorType:'player',level:10,luck:0,fallbackRoll:1});
assert.equal(missingSecond.ok,false);
assert.equal(missingSecond.reason,'unarmed-player-attack-count-extra-rng-required-or-out-of-range');

const enemyNoItem=runtime.resolve({itemPresent:false,actorType:'enemy',level:50,luck:0});
assert.equal(enemyNoItem.ok,true,JSON.stringify(enemyNoItem));
assert.equal(enemyNoItem.attackCount,1);
assert.equal(enemyNoItem.rngConsumed,0);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v453-browser-battle-attack-count-v1',
  thresholds:{luck0:[10,30,70]},
  levels:{lv9:1,lv10Roll11:3},
  highBurst:{firstRoll:10,secondRoll:8,attackCount:8,rngConsumed:2},
  luckClamp:{inputLuck:8,luckWork:25},
  noItemEnemy:{attackCount:1,rngConsumed:0},
  failClosed:true
},null,2));
