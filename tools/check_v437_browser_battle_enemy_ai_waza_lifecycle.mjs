#!/usr/bin/env node
import assert from 'node:assert/strict';
import { planEnemyAiCommands, commitEnemyAiCommands } from '../src/stoneage_browser_battle_enemy_ai_runtime.mjs';
import { buildEnemyEntryLayout } from '../src/stoneage_browser_battle_context_runtime.mjs';

const ai=(slot=0,targetType=1,selectMode=1)=>({
  format:'stoneage-enemy-ai-source-v1',raw:'at:0;1;1|gu:0|es:0|wa:1;0;0;0;0;0;0;',
  attackWeight:0,targetType,selectMode,targetRollRange:1,
  guardWeight:0,magicWeight:0,escapeWeight:0,
  skillWeights:[1,0,0,0,0,0,0].map((v,i)=>i===slot?v:0)
});
function context({skillId=0,slot=0,targets=true,selectMode=1}={}){
  const entries=targets?[
    {bid:0,sourceType:'player',hp:80,isDie:false,sourceBattleCharMode:3},
    {bid:5,sourceType:'pet',hp:35,isDie:false,sourceBattleCharMode:3},
    {bid:6,sourceType:'pet',hp:0,isDie:true,sourceBattleCharMode:3},
    {bid:7,sourceType:'pet',hp:10,isDie:false,sourceBattleCharMode:5}
  ]:[{bid:6,sourceType:'pet',hp:0,isDie:true,sourceBattleCharMode:3},{bid:7,sourceType:'pet',hp:10,isDie:false,sourceBattleCharMode:5}];
  return {format:'stoneage-browser-battle-context-runtime-v1',context:{mode:'battle',sourceMode:2,turn:1,sides:[
    {side:0,type:0,entries:[...entries,...Array(10-entries.length).fill(null)]},
    {side:1,type:1,flg:0,entries:[{bid:10,sourceType:'enemy',hp:30,isDie:false,sourceBattleCharMode:2,battleCommands:[-1,-1,-1],sourceEnemyPetSkills:Array.from({length:7},(_,i)=>i===slot?skillId:0),sourceEnemyAi:ai(slot,1,selectMode)},...Array(9).fill(null)]}
  ]}};
}

const input=context();
const plan=planEnemyAiCommands(input,{actionRolls:[0],targetRolls:[1]});
assert.equal(plan.ok,true,JSON.stringify(plan));
assert.equal(plan.commands.length,1);
assert.equal(plan.commands[0].selectedAction,'petskill');
assert.equal(plan.commands[0].action,'petskill-none');
assert.equal(plan.commands[0].commandCode,0,'PETSKILL_None sets BATTLE_COM_NONE');
assert.equal(plan.commands[0].skillSlot,0);
assert.equal(plan.commands[0].skillId,0);
assert.equal(plan.commands[0].sourceAiPickedSkill,true);
assert.equal(plan.commands[0].targetBid,5,'WAZA target selection runs before PETSKILL_None callback');
assert.deepEqual(plan.rngConsumed,{action:1,target:1,total:2});
const committed=commitEnemyAiCommands(input,{plan});
assert.equal(committed.ok,true,JSON.stringify(committed));
const actor=committed.battleContext.context.sides[1].entries[0];
assert.deepEqual(actor.battleCommands,[0,5,-1]);
assert.equal(actor.sourceBattleCharMode,3);
assert.equal(actor.battleMode,'c_ok');
assert.equal(committed.persistentMutation,false);
assert.equal(committed.damageExecuted,false);
assert.equal(input.context.sides[1].entries[0].battleCommands[0],-1,'plan/commit do not mutate original context');

const layout=buildEnemyEntryLayout([{enemyId:1074,size:0,createMaxNum:1,enemy:{tempNo:557,ai:ai(),base:{petSkills:[0,0,0,0,0,0,0]},dropTable:[]}}]);
assert.equal(layout.ok,true,JSON.stringify(layout));
assert.deepEqual(layout.entries[5].sourceEnemyPetSkills,[0,0,0,0,0,0,0]);

const unsupportedInput=context({skillId:100,slot:0});
const unsupported=planEnemyAiCommands(unsupportedInput,{actionRolls:[0],targetRolls:[0]});
assert.equal(unsupported.ok,false);
assert.equal(unsupported.reason,'enemy-ai-petskill-runtime-required');
assert.equal(unsupported.skillSlot,0);
assert.equal(unsupported.skillId,100);
assert.equal(unsupported.targetBid,0,'unsupported callback is reported only after source target RNG lifecycle');
assert.deepEqual(unsupported.rngConsumed,{action:1,target:1,total:2});

const noTargets=planEnemyAiCommands(context({targets:false}),{actionRolls:[0],targetRolls:[]});
assert.equal(noTargets.ok,false);
assert.equal(noTargets.reason,'enemy-ai-no-valid-targets');
assert.deepEqual(noTargets.rngConsumed,{action:1,target:0,total:1},'source returns before skill callback when candidate list is empty');

console.log(JSON.stringify({pass:true,format:'stoneage-v437-browser-battle-enemy-ai-waza-lifecycle-v1',cases:['WAZA weighted slot selection','WAZA target RNG before callback','PETSKILL_None commits NONE/C_OK','pet skill slots preserved in battle layout','unsupported callback exposes consumed RNG','empty target list fails before callback'],supportedSkillIds:[0],unsupportedSkillCallbackFailsClosed:true,persistentMutation:false,damageExecuted:false},null,2));
