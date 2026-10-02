#!/usr/bin/env node
import assert from 'node:assert/strict';
import { planEnemyAiCommands, commitEnemyAiCommands } from '../src/stoneage_browser_battle_enemy_ai_runtime.mjs';

const ai={format:'stoneage-enemy-ai-source-v1',attackWeight:1,targetType:1,selectMode:1,guardWeight:0,magicWeight:0,escapeWeight:0,skillWeights:[0,0,0,0,0,0,0]};
const context={format:'stoneage-browser-battle-context-runtime-v1',context:{mode:'battle',sourceMode:2,turn:2,sides:[
  {side:0,type:0,entries:[{bid:0,sourceType:'player',hp:80,maxHp:100,isDie:false,sourceBattleCharMode:3,battleCommands:[1,10,-1]},...Array(9).fill(null)]},
  {side:1,type:1,flg:0,entries:[
    {bid:10,sourceType:'enemy',hp:0,maxHp:30,isDie:true,sourceBattleCharMode:2,battleCommands:[-1,-1,-1],sourceEnemyAi:ai},
    {bid:11,sourceType:'enemy',hp:20,maxHp:30,isDie:false,sourceBattleCharMode:2,battleCommands:[-1,-1,-1],sourceEnemyAi:ai},
    ...Array(8).fill(null)
  ]}
]}};

const plan=planEnemyAiCommands(context,{actionRolls:[0,0],targetRolls:[0,0]});
assert.equal(plan.ok,true,JSON.stringify(plan));
assert.equal(plan.commands.length,2);
assert.deepEqual(plan.commands.map(x=>x.actorBid),[10,11]);
assert.deepEqual(plan.commands.map(x=>x.action),['attack','attack']);
assert.deepEqual(plan.commands.map(x=>x.targetBid),[0,0]);
assert.deepEqual(plan.rngConsumed,{action:2,target:2,total:4},'dead entries retain their AI action/target RNG lifecycle');
assert.equal(context.context.sides[1].entries[0].battleCommands[0],-1,'planning must not mutate the original context');

const committed=commitEnemyAiCommands(context,{plan});
assert.equal(committed.ok,true,JSON.stringify(committed));
const dead=committed.battleContext.context.sides[1].entries[0];
const alive=committed.battleContext.context.sides[1].entries[1];
assert.equal(dead.isDie,true);
assert.equal(dead.hp,0);
assert.deepEqual(dead.battleCommands,[1,0,-1]);
assert.equal(dead.sourceBattleCharMode,3);
assert.equal(alive.isDie,false);
assert.deepEqual(alive.battleCommands,[1,0,-1]);
assert.equal(alive.sourceBattleCharMode,3);
assert.equal(committed.persistentMutation,false);
assert.equal(committed.damageExecuted,false);

console.log(JSON.stringify({pass:true,format:'stoneage-v433-browser-battle-enemy-ai-dead-entry-v1',cases:['dead enemy remains in AI pass','dead and live enemies consume ordered action/target rolls','dead entry is marked C_OK without HP resurrection','planning preserves input context','no persistent mutation or damage'],rngConsumed:committed.rngConsumed},null,2));
