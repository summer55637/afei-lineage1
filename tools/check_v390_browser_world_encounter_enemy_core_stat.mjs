#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  materializeEnemyCoreStats,
  rankFromBase,
  BROWSER_ENEMY_CORE_STAT_RUNTIME_FORMAT
} from '../src/stoneage_browser_world_encounter_enemy_core_stat_runtime.mjs';

const template={
  enemyId:120,
  tempNo:113,
  levelMin:2,
  levelMax:3,
  createMaxNum:10,
  createMinNum:1,
  base:{
    tempNo:113,
    size:0,
    initNum:15,
    lvupPoint:4.5,
    baseVital:13,
    baseStr:20,
    baseTgh:17,
    baseDex:25,
    modAi:150,
    get:11,
    earth:0,
    water:0,
    fire:50,
    wind:50,
    poison:0,
    paralysis:0,
    sleep:0,
    stone:0,
    drunk:0,
    confusion:0,
    petSkills:[1,2,0,0,0,0,0],
    rare:0,
    critical:0,
    counter:0,
    slot:1,
    imageNo:100297,
    petFlg:1
  }
};

const rank=rankFromBase(template.base);
assert.deepEqual(rank,{ok:true,rank:5,paramsum:75,multiplier:0});

const result=materializeEnemyCoreStats(template,{
  levelRoll:0,
  baseStatRolls:[2,2,2,2],
  allocationRolls:[0,0,0,0,0,0,0,0,0,0]
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.format,BROWSER_ENEMY_CORE_STAT_RUNTIME_FORMAT);
assert.equal(result.enemyId,120);
assert.equal(result.tempNo,113);
assert.equal(result.level,2);
assert.equal(result.rngConsumedCount,15);
assert.deepEqual(result.baseBefore,{vital:13,str:20,tgh:17,dex:25});
assert.deepEqual(result.baseAfterRandomized,{vital:13,str:20,tgh:17,dex:25});
assert.deepEqual(result.baseAfterAllocation,{vital:23,str:20,tgh:17,dex:25});
assert.equal(result.levelGrowthFactor,19.5);
assert.deepEqual(result.stats,{vital:448,str:390,tgh:331,dex:487});
assert.deepEqual(result.derived,{
  fixVital:4,
  fixStr:4,
  fixTgh:4,
  fixDex:4,
  attackPower:4,
  defencePower:4,
  quick:4,
  maxHp:30,
  hp:30,
  maxMp:null,
  mp:null
});
assert.deepEqual(result.sourceTemplate.element,{earth:0,water:0,fire:50,wind:50});
assert.deepEqual(result.sourceTemplate.resist,{poison:0,paralysis:0,sleep:0,stone:0,drunk:0,confusion:0});
assert.deepEqual(result.sourceTemplate.petSkills,[1,2,0,0,0,0,0]);
assert.equal(result.persistentMutation,false);
assert.equal(result.battleStarted,false);
assert.equal(result.postCompliance.maxMp,'pending CHAR_getDefaultChar/CHAR_MAXMP source join');

const missing=materializeEnemyCoreStats(template,{
  levelRoll:0,
  baseStatRolls:[2,2,2],
  allocationRolls:Array(10).fill(0)
});
assert.equal(missing.ok,false);
assert.equal(missing.reason,'enemy-base-stat-rng-required-or-out-of-range');

const outOfRange=materializeEnemyCoreStats(template,{
  levelRoll:2,
  baseStatRolls:[2,2,2,2],
  allocationRolls:Array(10).fill(0)
});
assert.equal(outOfRange.ok,false);
assert.equal(outOfRange.reason,'enemy-level-rng-required-or-out-of-range');

console.log(JSON.stringify({
  pass:true,
  format:BROWSER_ENEMY_CORE_STAT_RUNTIME_FORMAT,
  enemyId:120,
  level:2,
  stats:{vital:448,str:390,tgh:331,dex:487},
  maxHp:30,
  rank:5,
  rngConsumedCount:15,
  maxMpPending:true,
  persistentMutation:false
},null,2));
