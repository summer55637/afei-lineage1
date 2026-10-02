#!/usr/bin/env node
import assert from 'node:assert/strict';
import { planEnemyAiCommands, commitEnemyAiCommands } from '../src/stoneage_browser_battle_enemy_ai_runtime.mjs';

const ai={format:'stoneage-enemy-ai-source-v1',attackWeight:1,targetType:1,selectMode:1,guardWeight:0,magicWeight:0,escapeWeight:0,skillWeights:[0,0,0,0,0,0,0]};
function context(status={},statusField='battleStatus'){
  const actor={bid:10,sourceType:'enemy',hp:30,maxHp:30,isDie:false,sourceBattleCharMode:2,battleCommands:[-1,-1,-1],sourceEnemyAi:ai};
  actor[statusField]=status;
  return {format:'stoneage-browser-battle-context-runtime-v1',context:{mode:'battle',sourceMode:2,turn:1,sides:[
    {side:0,type:0,entries:[{bid:0,sourceType:'player',hp:80,maxHp:100,isDie:false,sourceBattleCharMode:3,battleCommands:[1,10,-1]},...Array(9).fill(null)]},
    {side:1,type:1,flg:0,entries:[actor,...Array(9).fill(null)]}
  ]}};
}

for(const key of ['paralysis','stone','sleep','barrier']){
  const input=context({[key]:1});
  const plan=planEnemyAiCommands(input,{actionRolls:[0],targetRolls:[0]});
  assert.equal(plan.ok,true,JSON.stringify({key,plan}));
  assert.equal(plan.commands[0].selectedAction,'attack',key+' should still select the AI action before movement check');
  assert.equal(plan.commands[0].action,'none',key+' should override the selected action to NONE');
  assert.equal(plan.commands[0].commandCode,0);
  assert.deepEqual(plan.commands[0].moveBlockedOn,[key]);
  assert.equal(plan.commands[0].targetBid,0,'attack target selection occurs before the can-move override');
  assert.deepEqual(plan.rngConsumed,{action:1,target:1,total:2});
  const committed=commitEnemyAiCommands(input,{plan});
  assert.equal(committed.ok,true,JSON.stringify({key,committed}));
  const actor=committed.battleContext.context.sides[1].entries[0];
  assert.equal(actor.battleCommands[0],0);
  assert.equal(actor.battleCommands[1],0);
  assert.equal(actor.sourceBattleCharMode,3);
  assert.equal(actor.battleStatus?.[key]??actor.status?.[key]??actor[key],1);
}

for(const key of ['dizzy','dragnet','confusion','nocast','poison','drunk']){
  const plan=planEnemyAiCommands(context({[key]:1},'status'),{actionRolls:[0],targetRolls:[0]});
  assert.equal(plan.ok,true,JSON.stringify({key,plan}));
  assert.equal(plan.commands[0].action,'attack',key+' is not a BATTLE_CanMoveCheck blocker');
  assert.deepEqual(plan.commands[0].moveBlockedOn,[]);
}

const nested=context({sleep:1},'status');
nested.context.sides[1].entries[0].status={sleep:0};
nested.context.sides[1].entries[0].battleStatus={sleep:2};
const nestedPlan=planEnemyAiCommands(nested,{actionRolls:[0],targetRolls:[0]});
assert.equal(nestedPlan.ok,true,JSON.stringify(nestedPlan));
assert.deepEqual(nestedPlan.commands[0].moveBlockedOn,['sleep'],'canonical battleStatus takes precedence');

console.log(JSON.stringify({pass:true,format:'stoneage-v434-browser-battle-enemy-ai-can-move-v1',blockedStatuses:['paralysis','stone','sleep','dizzy','dragnet','barrier'],nonBlockers:['confusion','nocast','poison','drunk'],selectionBeforeMovementOverride:true,rngPreserved:true,command:'NONE',mode:'C_OK'},null,2));
