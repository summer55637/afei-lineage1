#!/usr/bin/env node
import assert from 'node:assert/strict';
import { planEnemyAiCommands, commitEnemyAiCommands, BATTLE_ENEMY_AI_CHARGE_COMMANDS } from '../src/stoneage_browser_battle_enemy_ai_runtime.mjs';

const ai={format:'stoneage-enemy-ai-source-v1',attackWeight:1,targetType:1,selectMode:1,guardWeight:0,magicWeight:0,escapeWeight:0,skillWeights:[0,0,0,0,0,0,0]};
function makeContext(enemyEntries,{surprise=false}={}){
  return {format:'stoneage-browser-battle-context-runtime-v1',context:{mode:'battle',sourceMode:2,turn:2,sides:[
    {side:0,type:0,entries:[{bid:0,sourceType:'player',hp:80,maxHp:100,isDie:false,sourceBattleCharMode:3,battleCommands:[1,10,-1]},...Array(9).fill(null)]},
    {side:1,type:1,flg:surprise?1:0,entries:[...enemyEntries,...Array(10-enemyEntries.length).fill(null)]}
  ]}};
}
const chargeRows=BATTLE_ENEMY_AI_CHARGE_COMMANDS.map((commandCode,index)=>({
  bid:10+index,sourceType:'enemy',hp:30,maxHp:30,isDie:false,sourceBattleCharMode:2,
  battleCommands:[commandCode,index,70+index]
}));

const onlyCharge=makeContext(chargeRows);
const preserved=planEnemyAiCommands(onlyCharge,{actionRolls:[],targetRolls:[]});
assert.equal(preserved.ok,true,JSON.stringify(preserved));
assert.deepEqual(preserved.commands.map(x=>x.action),['charge-retained','charge-retained','charge-retained']);
assert.deepEqual(preserved.commands.map(x=>x.commandCode),BATTLE_ENEMY_AI_CHARGE_COMMANDS);
assert.deepEqual(preserved.commands.map(x=>x.targetBid),[0,1,2]);
assert.ok(preserved.commands.every(x=>x.preserveCommand===true));
assert.deepEqual(preserved.rngConsumed,{action:0,target:0,total:0});
const committedCharges=commitEnemyAiCommands(onlyCharge,{plan:preserved});
assert.equal(committedCharges.ok,true,JSON.stringify(committedCharges));
for(let i=0;i<3;i++){
  const actor=committedCharges.battleContext.context.sides[1].entries[i];
  assert.deepEqual(actor.battleCommands,chargeRows[i].battleCommands,'charge command and target must be retained exactly');
  assert.equal(actor.sourceBattleCharMode,3);
}

const mixed=makeContext([
  ...chargeRows.slice(0,1),
  {bid:11,sourceType:'enemy',hp:30,maxHp:30,isDie:false,sourceBattleCharMode:2,battleCommands:[-1,-1,-1],sourceEnemyAi:ai}
]);
const mixedPlan=planEnemyAiCommands(mixed,{actionRolls:[0],targetRolls:[0]});
assert.equal(mixedPlan.ok,true,JSON.stringify(mixedPlan));
assert.deepEqual(mixedPlan.commands.map(x=>x.action),['charge-retained','attack']);
assert.deepEqual(mixedPlan.rngConsumed,{action:1,target:1,total:2});
const mixedCommit=commitEnemyAiCommands(mixed,{plan:mixedPlan});
assert.equal(mixedCommit.ok,true,JSON.stringify(mixedCommit));
assert.deepEqual(mixedCommit.battleContext.context.sides[1].entries[0].battleCommands,chargeRows[0].battleCommands);
assert.deepEqual(mixedCommit.battleContext.context.sides[1].entries[1].battleCommands,[1,0,-1]);

const surprised=makeContext([
  ...chargeRows.slice(0,1),
  {bid:11,sourceType:'enemy',hp:30,maxHp:30,isDie:false,sourceBattleCharMode:2,battleCommands:[-1,-1,-1]}
],{surprise:true});
const surprisePlan=planEnemyAiCommands(surprised,{actionRolls:[],targetRolls:[]});
assert.equal(surprisePlan.ok,true,JSON.stringify(surprisePlan));
assert.deepEqual(surprisePlan.commands.map(x=>x.action),['charge-retained','surprised-none'],'charge retention has priority over surprise handling');
assert.deepEqual(surprisePlan.rngConsumed,{action:0,target:0,total:0});
const surpriseCommit=commitEnemyAiCommands(surprised,{plan:surprisePlan});
assert.equal(surpriseCommit.ok,true,JSON.stringify(surpriseCommit));
assert.deepEqual(surpriseCommit.battleContext.context.sides[1].entries[0].battleCommands,chargeRows[0].battleCommands);
assert.deepEqual(surpriseCommit.battleContext.context.sides[1].entries[1].battleCommands,[0,-1,-1]);
assert.equal(surpriseCommit.battleContext.context.sides[1].entries[0].sourceBattleCharMode,3);
assert.equal(surpriseCommit.battleContext.context.sides[1].entries[1].sourceBattleCharMode,3);

console.log(JSON.stringify({pass:true,format:'stoneage-v435-browser-battle-enemy-ai-charge-retention-v1',chargeCommands:BATTLE_ENEMY_AI_CHARGE_COMMANDS,cases:['all source charge commands retained without RNG','mixed charged and normal enemies','charged command takes precedence over surprise','charge command and target unchanged after commit'],persistentMutation:false,damageExecuted:false},null,2));
