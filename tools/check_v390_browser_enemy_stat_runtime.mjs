#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { computeEnemyStats } from '../src/stoneage_browser_enemy_stat_runtime.mjs';

const catalog=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_group_runtime.json','utf8'));
const group=catalog.groups.find(row=>Number(row.groupId)===89);
assert.ok(group,'Group 89 missing');
const member=group.members.find(row=>Number(row.enemyId)===120);
assert.ok(member?.enemy,'Enemy 120 missing');
assert.ok(member.enemy.base,'EnemyBase 113 missing');

const result=computeEnemyStats(member.enemy,{
  level:2,
  baseStatRolls:[0,1,2,3],
  allocationRolls:[0,1,2,3,0,1,2,3,0,1]
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.level,2);
assert.deepEqual(result.rawBaseStats,{vital:13,str:20,tgh:17,dex:25});
assert.deepEqual(result.mutatedBaseStats,{vital:14,str:22,tgh:19,dex:28});
assert.deepEqual(result.stats,{vital:273,str:429,tgh:370,dex:546});
assert.equal(result.maxHp,24);
assert.equal(result.hp,24);
assert.equal(result.maxMp,null);
assert.equal(result.petRank,5);
assert.deepEqual(result.elements,{earth:0,water:0,fire:50,wind:50});
assert.deepEqual(result.statusResist,{poison:0,paralysis:0,sleep:0,stone:0,drunk:0,confusion:0});
assert.deepEqual(result.petSkills,[1,2,null,null,null,null,null]);
assert.equal(result.rng.consumedCount,14);
assert.equal(result.persistentMutation,false);

const byRoll=computeEnemyStats(member.enemy,{
  levelRoll:1,
  baseStatRolls:[2,2,2,2],
  allocationRolls:[0,0,0,0,1,1,1,1,2,3]
});
assert.equal(byRoll.ok,true,JSON.stringify(byRoll));
assert.equal(byRoll.level,3);
assert.deepEqual(byRoll.mutatedBaseStats,{vital:17,str:24,tgh:18,dex:26});
assert.deepEqual(byRoll.stats,{vital:408,str:576,tgh:432,dex:624});
assert.equal(byRoll.maxHp,32);

const bad=computeEnemyStats(member.enemy,{
  level:2,
  baseStatRolls:[0,1,2],
  allocationRolls:[0,1,2,3,0,1,2,3,0,1]
});
assert.equal(bad.ok,false);
assert.equal(bad.reason,'base-stat-rngs-four-required');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v390-browser-enemy-stat-runtime-v1',
  enemyId:120,
  tempNo:113,
  level:2,
  rawBaseStats:{vital:13,str:20,tgh:17,dex:25},
  mutatedBaseStats:{vital:14,str:22,tgh:19,dex:28},
  stats:{vital:273,str:429,tgh:370,dex:546},
  maxHp:24,
  petRank:5,
  rngConsumed:14,
  maxMp:'pending-source-closure'
},null,2));
