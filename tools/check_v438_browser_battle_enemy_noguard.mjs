#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEnemyEntryLayout } from '../src/stoneage_browser_battle_context_runtime.mjs';
import { planEnemyAiCommands, commitEnemyAiCommands, BATTLE_COM_S_NOGUARD } from '../src/stoneage_browser_battle_enemy_ai_runtime.mjs';
import { duckCheck } from '../src/stoneage_browser_battle_attack_seq_prelude_runtime.mjs';
import { counterCheck } from '../src/stoneage_browser_battle_counter_runtime.mjs';
import { initializeBattleTurn } from '../src/stoneage_browser_battle_turn_runtime.mjs';

const petSkillCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const skillIds=[150,151,152];
const ai={format:'stoneage-enemy-ai-source-v1',attackWeight:0,targetType:1,selectMode:1,targetRollRange:1,guardWeight:0,magicWeight:0,escapeWeight:0,skillWeights:[1,0,0,0,0,0,0]};
const team=skillIds.map((skillId,index)=>({enemyId:2000+index,size:0,createMaxNum:1,enemy:{
  tempNo:500+index,ai,base:{petSkills:[skillId,-1,-1,-1,-1,-1,-1]},dropTable:[]
}}));
const layout=buildEnemyEntryLayout(team,{petSkillCatalog});
assert.equal(layout.ok,true,JSON.stringify(layout));
const enemyEntries=layout.entries.map((entry,slot)=>entry?({
  ...entry,bid:10+slot,sourceType:'enemy',hp:100,maxHp:100,fixDex:40,isDie:false,
  sourceBattleCharMode:2,battleCommands:[-1,-1,-1]
}):null);
const ctx={format:'stoneage-browser-battle-context-runtime-v1',context:{mode:'battle',sourceMode:2,turn:1,sides:[
  {side:0,type:0,flg:0,entries:[{bid:0,sourceType:'player',hp:80,maxHp:100,fixDex:20,isDie:false,sourceBattleCharMode:3,battleCommands:[1,10,-1]},...Array(9).fill(null)]},
  {side:1,type:1,flg:0,entries:enemyEntries}
]}};

const plan=planEnemyAiCommands(ctx,{actionRolls:[0,0,0],targetRolls:[0,0,0]});
assert.equal(plan.ok,true,JSON.stringify(plan));
assert.equal(plan.commands.length,3);
assert.deepEqual(plan.commands.map(x=>x.action),['petskill-noguard','petskill-noguard','petskill-noguard']);
assert.deepEqual(plan.commands.map(x=>x.commandCode),[BATTLE_COM_S_NOGUARD,BATTLE_COM_S_NOGUARD,BATTLE_COM_S_NOGUARD]);
assert.deepEqual(plan.commands.map(x=>x.skillId),skillIds);
assert.deepEqual(plan.commands.map(x=>x.targetBid),[0,0,0]);
assert.deepEqual(plan.commands.map(x=>x.command3),[
  30*65536+50*256+20,
  40*65536+60*256+30,
  50*65536+80*256+40
]);
assert.deepEqual(plan.commands.map(x=>[x.noguardDuckBonus,x.noguardCounterBonus,x.noguardCriticalBonus]),[[30,50,20],[40,60,30],[50,80,40]]);
assert.deepEqual(plan.rngConsumed,{action:3,target:3,total:6});

const committed=commitEnemyAiCommands(ctx,{plan});
assert.equal(committed.ok,true,JSON.stringify(committed));
for(let i=0;i<3;i++){
  const actor=committed.battleContext.context.sides[1].entries[5+i];
  assert.equal(actor.battleCommands[0],BATTLE_COM_S_NOGUARD);
  assert.equal(actor.battleCommands[1],0);
  assert.equal(actor.battleCommands[2],plan.commands[i].command3);
  assert.deepEqual([actor.noguardDuckBonus,actor.noguardCounterBonus,actor.noguardCriticalBonus],[plan.commands[i].noguardDuckBonus,plan.commands[i].noguardCounterBonus,plan.commands[i].noguardCriticalBonus]);
  assert.equal(actor.noguardSourceSkillId,skillIds[i]);
  assert.equal(actor.sourceBattleCharMode,3);
}
assert.equal(committed.persistentMutation,false);
assert.equal(committed.damageExecuted,false);

const defender=committed.battleContext.context.sides[1].entries[5];
const attacker={bid:0,sourceType:'enemy',hp:80,fixDex:40,battleCommands:[1,5,-1]};
const boostedDuck=duckCheck(attacker,defender,{duckRoll:1});
const baselineDuck=duckCheck(attacker,{...defender,battleCommands:[0,0,0],noguardDuckBonus:0},{duckRoll:1});
assert.equal(boostedDuck.ok,true,JSON.stringify(boostedDuck));
assert.equal(baselineDuck.ok,true,JSON.stringify(baselineDuck));
assert.equal(boostedDuck.per-baselineDuck.per,3000,'NoGuard +30 adds 30 percentage points to dodge before cap');
assert.equal(boostedDuck.dodged,true);

const counter=counterCheck(committed.battleContext,{
  attackerBid:15,targetBid:0,attackerWeaponClass:'claw',defenderWeaponClass:'claw',counterRoll:1
});
assert.equal(counter.ok,true,JSON.stringify(counter));
assert.equal(counter.noguardCounterAdjust,50);
assert.ok(counter.probabilityPercent>=50);
assert.equal(counter.triggered,true);

const nextTurn=initializeBattleTurn(committed.battleContext);
assert.equal(nextTurn.ok,true,JSON.stringify(nextTurn));
for(let i=0;i<3;i++){
  const actor=nextTurn.context.sides[1].entries[5+i];
  assert.deepEqual(actor.battleCommands,[0,0,0],'NoGuard command3 is cleared when its command expires next turn');
  assert.deepEqual([actor.noguardDuckBonus,actor.noguardCounterBonus,actor.noguardCriticalBonus],[0,0,0]);
  assert.equal(actor.noguardSourceSkillId,null);
}

const blockedCtx=JSON.parse(JSON.stringify(ctx));
blockedCtx.context.sides[1].entries[5].battleStatus={sleep:1};
const blockedPlan=planEnemyAiCommands(blockedCtx,{actionRolls:[0,0,0],targetRolls:[0,0,0]});
assert.equal(blockedPlan.ok,true,JSON.stringify(blockedPlan));
assert.equal(blockedPlan.commands[0].commandCode,0,'cannot-move override takes precedence over NoGuard');
const blockedCommit=commitEnemyAiCommands(blockedCtx,{plan:blockedPlan});
assert.equal(blockedCommit.ok,true,JSON.stringify(blockedCommit));
const blockedActor=blockedCommit.battleContext.context.sides[1].entries[5];
assert.equal(blockedActor.noguardDuckBonus??0,0,'blocked NoGuard must not grant bonuses');

console.log(JSON.stringify({pass:true,format:'stoneage-v438-browser-battle-enemy-noguard-v1',skillIds,sourceCommands:[BATTLE_COM_S_NOGUARD],cases:['catalog profile hydration','NoGuard options parsed for 150/151/152','COM1/2/3 source encoding','duck bonus applied','counter bonus applied','critical bonus retained but not applied','can-move override blocks skill','next-turn reset'],persistentMutation:false,damageExecuted:false},null,2));
