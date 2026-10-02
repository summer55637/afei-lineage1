#!/usr/bin/env node
import assert from 'node:assert/strict';
import { planEnemyAiCommands } from '../src/stoneage_browser_battle_enemy_ai_runtime.mjs';
import { buildBattleContext } from '../src/stoneage_browser_battle_context_runtime.mjs';

const ai=(targetType,selectMode,targetRollRange=1,actorElements={earth:10,water:0,fire:0,wind:0})=>({
  format:'stoneage-enemy-ai-source-v1',attackWeight:1,targetType,selectMode,targetRollRange,
  guardWeight:0,magicWeight:0,escapeWeight:0,skillWeights:[0,0,0,0,0,0,0]
});
function context({targetType=1,selectMode=1,targetRollRange=1,actorElements,targets,partyModes={}}={}){
  const rows=targets??[
    {bid:0,sourceType:'player',hp:30,stats:{str:100,dex:30},elements:{earth:1,water:2,fire:3,wind:4}},
    {bid:1,sourceType:'player',hp:50,stats:{str:200,dex:50},elements:{earth:2,water:4,fire:6,wind:8}},
    {bid:5,sourceType:'pet',hp:80,stats:{str:150,dex:40},elements:{earth:3,water:3,fire:3,wind:3}},
    {bid:6,sourceType:'pet',hp:0,isDie:true,stats:{str:999,dex:999},elements:{earth:99,water:99,fire:99,wind:99}},
    {bid:7,sourceType:'pet',hp:99,sourceBattleCharMode:5,stats:{str:999,dex:999},elements:{earth:99,water:99,fire:99,wind:99}}
  ];
  return {context:{mode:'battle',sourceMode:2,turn:1,sides:[
    {side:0,type:0,entries:rows.map(e=>({...e,sourceAiTargetStats:e.stats,sourceAiElements:e.elements,sourcePartyMode:partyModes[e.bid]??e.sourcePartyMode??0,isDie:e.isDie??false,sourceBattleCharMode:e.sourceBattleCharMode??2}))},
    {side:1,type:1,flg:0,entries:[{bid:10,sourceType:'enemy',hp:30,isDie:false,sourceBattleCharMode:2,battleCommands:[-1,-1,-1],sourceAiElements:actorElements===undefined?{earth:10,water:0,fire:0,wind:0}:actorElements,sourceEnemyAi:ai(targetType,selectMode,targetRollRange)} ,...Array(9).fill(null)]}
  ]}};
}
function run(opts,rolls){
  return planEnemyAiCommands(context(opts),{actionRolls:[0],targetRolls:rolls});
}

const random=run({selectMode:1},[2]);
assert.equal(random.ok,true,JSON.stringify(random));
assert.equal(random.commands[0].targetBid,5);
assert.deepEqual(random.rngConsumed,{action:1,target:1,total:2});

const hpMax=run({selectMode:2},[1]);
assert.equal(hpMax.ok,true,JSON.stringify(hpMax));
assert.equal(hpMax.commands[0].targetBid,5);
assert.equal(hpMax.commands[0].targetSelectorRoll,1);
assert.deepEqual(hpMax.rngConsumed,{action:1,target:1,total:2});

const hpMin=run({selectMode:3},[1]);
assert.equal(hpMin.ok,true,JSON.stringify(hpMin));
assert.equal(hpMin.commands[0].targetBid,0);

const strMax=run({selectMode:4},[1]);
assert.equal(strMax.ok,true,JSON.stringify(strMax));
assert.equal(strMax.commands[0].targetBid,1,'STR_MAX compares source target STR');
const dexMax=run({selectMode:5},[1]);
assert.equal(dexMax.ok,true,JSON.stringify(dexMax));
assert.equal(dexMax.commands[0].targetBid,1,'DEX_MAX compares source target DEX');
const dexMin=run({selectMode:6},[1]);
assert.equal(dexMin.ok,true,JSON.stringify(dexMin));
assert.equal(dexMin.commands[0].targetBid,0,'DEX_MIN compares source target DEX');

const subdue=run({selectMode:7},[1]);
assert.equal(subdue.ok,true,JSON.stringify(subdue));
assert.equal(subdue.commands[0].targetBid,1,'Earth-attuned actor selects the target with highest Water attribute');
assert.equal(subdue.commands[0].elementKey,'water');

const subdueTie=run({selectMode:7,targets:[
  {bid:0,sourceType:'player',hp:10,sourceAiTargetStats:{str:1,dex:1},sourceAiElements:{earth:1,water:8,fire:1,wind:1}},
  {bid:1,sourceType:'player',hp:20,sourceAiTargetStats:{str:2,dex:2},sourceAiElements:{earth:1,water:8,fire:1,wind:1}}
]},[1]);
assert.equal(subdueTie.ok,true,JSON.stringify(subdueTie));
assert.equal(subdueTie.commands[0].targetBid,0,'equal elemental values keep the first candidate');

const leader=run({targetType:4,selectMode:1,partyModes:{0:1}},[2,2,0]);
assert.equal(leader.ok,true,JSON.stringify(leader));
assert.equal(leader.commands[0].targetBid,0,'party leader is included without a filter roll');
assert.deepEqual(leader.rngConsumed,{action:1,target:3,total:4},'non-leaders each consume RAND(0,2), then selection consumes RAND(0,cnt-1)');

const leaderFallback=run({targetType:4,selectMode:1},[1,2,1,2]);
assert.equal(leaderFallback.ok,true,JSON.stringify(leaderFallback));
assert.equal(leaderFallback.commands[0].targetBid,5,'empty TARGET_LEADER list falls back to ALL');
assert.deepEqual(leaderFallback.rngConsumed,{action:1,target:4,total:5});

const unknownType=run({targetType:99,selectMode:1},[2]);
assert.equal(unknownType.ok,true,JSON.stringify(unknownType));
assert.equal(unknownType.commands[0].targetBid,5,'Fixed-C switch default maps unknown target type to ALL');

const rangeZero=run({selectMode:3,targetRollRange:0},[0,1]);
assert.equal(rangeZero.ok,true,JSON.stringify(rangeZero));
assert.equal(rangeZero.commands[0].targetBid,1,'rn=0 always takes the random override branch');
assert.deepEqual(rangeZero.rngConsumed,{action:1,target:2,total:3});

const missingStats=run({selectMode:4,targets:[{bid:0,sourceType:'player',hp:20,elements:{earth:1,water:1,fire:1,wind:1}}]},[1]);
assert.equal(missingStats.ok,false);
assert.equal(missingStats.reason,'enemy-ai-target-stats-required');
const missingElements=run({selectMode:7,targets:[{bid:0,sourceType:'player',hp:20,sourceAiTargetStats:{str:10,dex:10}}]},[1]);
assert.equal(missingElements.ok,false);
assert.equal(missingElements.reason,'enemy-ai-target-elements-required');
const missingActorElements=run({selectMode:7,actorElements:null,targets:[{bid:0,sourceType:'player',hp:20,sourceAiTargetStats:{str:10,dex:10},sourceAiElements:{earth:1,water:1,fire:1,wind:1}}]},[1]);
assert.equal(missingActorElements.ok,false);\nassert.equal(missingActorElements.reason,'enemy-ai-subdue-actor-elements-required');
const badFilterRng=run({targetType:4,selectMode:1},[]);
assert.equal(badFilterRng.ok,false);
assert.equal(badFilterRng.reason,'enemy-ai-leader-filter-rng-required-or-out-of-range');

const built=buildBattleContext({
  player:{id:'p',hp:50,maxHp:50,mp:0,maxMp:0,stats:{str:5,dex:6,tgh:1,vital:1}},
  playerElements:{earth:10,water:20,fire:30,wind:40},
  activePet:{id:'pet',petId:1,hp:20,maxHp:20,mp:0,maxMp:0,stats:{str:700,dex:800},elements:{earth:4,water:3,fire:2,wind:1}},
  team:[{enemyId:1,size:0,enemy:{tempNo:1,ai:ai(1,1),base:null}}],battleFieldNo:0
});
assert.equal(built.ok,true,JSON.stringify(built));
assert.deepEqual(built.context.sides[0].entries[0].sourceAiTargetStats,{str:500,dex:600});
assert.deepEqual(built.context.sides[0].entries[0].sourceAiElements,{earth:10,water:20,fire:30,wind:40});
assert.equal(built.context.sides[0].entries[0].sourcePartyMode,0);
assert.deepEqual(built.context.sides[0].entries[5].sourceAiTargetStats,{str:700,dex:800});
assert.deepEqual(built.context.sides[0].entries[5].sourceAiElements,{earth:4,water:3,fire:2,wind:1});
assert.equal(built.context.sides[0].entries[5].sourcePartyMode,0);

console.log(JSON.stringify({pass:true,format:'stoneage-v436-browser-battle-enemy-ai-target-parity-v1',supportedSelectModes:[1,2,3,4,5,6,7],targetTypes:[0,1,2,3,4,'unknown=>ALL'],cases:['random mode','HP max/min plus rn RNG','STR/DEX max/min','ATT_SUBDUE comparison tree','stable tie order','TARGET_LEADER filtering and fallback','unknown target switch default','rn=0 random override','missing stat/element fail-closed','Battle Context target data'],persistentMutation:false,damageExecuted:false},null,2));
