#!/usr/bin/env node
import assert from 'node:assert/strict';
import { adaptSourceBattleResult, assertBattleResultForIdle, BATTLE_RESULT_FORMAT, SOURCE_PVE_TYPE } from '../src/stoneage_battle_result_adapter.mjs';

const win=adaptSourceBattleResult({battleIndex:12,winside:0,finished:true,player:{hp:80,mp:10,maxHp:100,maxMp:20},onlyRescue:{side0:0,side1:1}});
assert.equal(win.ok,true);
assert.equal(win.result.format,BATTLE_RESULT_FORMAT);
assert.equal(win.result.outcome,'victory');
assert.equal(win.result.source.battleType,SOURCE_PVE_TYPE);
assert.equal(win.result.player.hp,80);

const lose=adaptSourceBattleResult({battleIndex:13,winside:1,finished:true,player:{hp:0,mp:0}});
assert.equal(lose.ok,true);
assert.equal(lose.result.outcome,'defeat');

const badType=adaptSourceBattleResult({battleIndex:1,winside:0,finished:true},{battleType:'P_vs_P'});
assert.equal(badType.ok,false);
const unfinished=adaptSourceBattleResult({battleIndex:1,winside:0,finished:false});
assert.equal(unfinished.ok,false);
const badWin=adaptSourceBattleResult({battleIndex:1,winside:2,finished:true});
assert.equal(badWin.ok,false);

assert.equal(assertBattleResultForIdle(win.result).ok,true);
assert.equal(assertBattleResultForIdle({format:'x'}).ok,false);

console.log(JSON.stringify({pass:true,format:BATTLE_RESULT_FORMAT,pvePlayerSide:0,pveEnemySide:1,doesNotCompute:['damage','reward RNG']}));
