#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_INITIALIZE,
  ACTION_BATTLE_IDLE_STRATEGY_APPLY,
  ACTION_BATTLE_ENEMY_AI_APPLY,
  ACTION_BATTLE_ENEMY_STEAL_PLAN,
  ACTION_BATTLE_ENEMY_STEAL_COMMIT,
  ACTION_BATTLE_END_PLAN,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';
import { planEnemySteal,commitEnemySteal,BATTLE_COM_S_STEAL } from '../src/stoneage_browser_battle_enemy_steal_runtime.mjs';

const groups=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_group_runtime.json','utf8'));
const skillCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const sourceGroup=groups.groups.find(g=>g.groupId===349);
assert.ok(sourceGroup,'source encounter group 349 must exist');
const member=sourceGroup.members.find(m=>m.enemyId===473);
assert.ok(member,'source Enemy 473 must exist in group 349');
assert.equal(member.enemy.base.petSkills[0],140,'Enemy 473 WAZA slot 0 must be Steal skill 140');
assert.equal(member.enemy.ai.skillWeights[0],1,'Enemy 473 must have positive Steal WAZA weight');
assert.equal(skillCatalog.byId['140'].f,'PETSKILL_Steal');

async function setup({gold=100000,items=[]}={}){
  const state=freshPersistentState({playerId:'v442-steal-player',now:()=> '2026-10-02T10:00:00+08:00'});
  state.player.name='阿肥';
  state.player.hp=1000;state.player.maxHp=1000;
  state.player.mp=100;state.player.maxMp=100;
  state.player.gold=gold;
  state.player.stats={str:100,dex:100,tgh:100,vital:100};
  state.world.position={floorId:100,x:610,y:538};
  state.idle.enabled=true;state.idle.mode='encounter_pending';
  state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
  for(const x of items){
    state.inventory.playerItemSlots[x.slot]=x.existingIndex;
    state.inventory.itemRuntime.slots[String(x.existingIndex)]={use:true,itemId:x.itemId,owner:'player',pile:x.pile};
    state.inventory.piles[String(x.itemId)]=(state.inventory.piles[String(x.itemId)]??0)+x.pile;
  }
  const controller=createBrowserStateController({state,idleRouteCatalog:routeCatalog,petSkillCatalog:skillCatalog,battleFieldNoProvider:0});
  const encounter={encounterId:65,floorId:100,x:610,y:538};
  const enemyTeam=[{enemyId:member.enemyId,size:member.enemy.size,createMaxNum:member.enemy.createMaxNum,enemy:member.enemy}];
  const statRoll={levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:Array(10).fill(0)};
  const built=await controller.dispatch({
    type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,enemyTeam,groupId:349,battleFieldNo:0,
    encounter,materializeEnemyStats:true,enemyStatRolls:[statRoll]
  });
  assert.equal(built.ok,true,JSON.stringify(built));
  const initialized=await controller.dispatch({type:ACTION_BATTLE_INITIALIZE,fixedLuck:0,surpriseRoll:100});
  assert.equal(initialized.ok,true,JSON.stringify(initialized));
  const player=await controller.dispatch({type:ACTION_BATTLE_IDLE_STRATEGY_APPLY,defaultTargetRoll:0,weaponKind:'none'});
  assert.equal(player.ok,true,JSON.stringify(player));
  const ai=await controller.dispatch({type:ACTION_BATTLE_ENEMY_AI_APPLY,actionRolls:[3],targetRolls:[0]});
  assert.equal(ai.ok,true,JSON.stringify(ai));
  const command=ai.commands.find(c=>c.action==='petskill-steal');
  assert.ok(command,'weighted WAZA slot 0 must resolve to Steal');
  assert.equal(command.skillId,140);
  assert.equal(command.commandCode,BATTLE_COM_S_STEAL);
  assert.equal(command.targetBid,0);
  assert.deepEqual(ai.rngConsumed,{action:1,target:1,total:2});
  return {state,controller,command};
}

async function runAttempt(options,rolls,transactionId){
  const {state,controller,command}=await setup(options);
  const beforeRevision=controller.getState().revision;
  const planned=await controller.dispatch({
    type:ACTION_BATTLE_ENEMY_STEAL_PLAN,attackerBid:command.actorBid,
    targetBid:command.targetBid,stealRolls:rolls
  });
  assert.equal(planned.ok,true,JSON.stringify(planned));
  const battleBefore=controller.getBattleContext();
  const commit=await controller.dispatch({
    type:ACTION_BATTLE_ENEMY_STEAL_COMMIT,battleEnemyStealPlan:planned,
    transactionId,expectedRevision:beforeRevision,now:()=> '2026-10-02T10:01:00+08:00'
  });
  assert.equal(commit.ok,true,JSON.stringify(commit));
  return {state,controller,command,planned,commit,beforeRevision,battleBefore};
}

const gold=await runAttempt({gold:100000},[49,49,12],'v442-gold-steal');
assert.equal(gold.planned.outcome,'stolen-gold');
assert.equal(gold.planned.goldAmount,12000);
assert.deepEqual(gold.planned.rngConsumed,{targetAdjust:0,steal:3,total:3});
assert.equal(gold.commit.stolen,true);
assert.equal(gold.commit.actorExited,true);
assert.equal(gold.commit.state.player.gold,88000,'stolen gold is removed from the player and is not credited to the enemy');
assert.equal(gold.commit.state.revision,gold.beforeRevision+1);
assert.equal(gold.commit.battleContext.sides[1].entries[5],null,'successful Steal calls BATTLE_Exit for the enemy');
assert.equal(gold.commit.exitedEnemy.isDie,false,'stealing exits; it does not kill');
assert.equal(gold.commit.deathCredit,false);
assert.equal(gold.commit.rewardMutation,false);
const ended=await gold.controller.dispatch({type:ACTION_BATTLE_END_PLAN});
assert.equal(ended.ok,true,JSON.stringify(ended));
assert.equal(ended.finished,true,'a successfully stolen-away last enemy leaves an empty enemy side');

const replay=await gold.controller.dispatch({
  type:ACTION_BATTLE_ENEMY_STEAL_COMMIT,battleEnemyStealPlan:gold.planned,
  transactionId:'v442-gold-steal',expectedRevision:gold.beforeRevision
});
assert.equal(replay.ok,true,JSON.stringify(replay));
assert.equal(replay.idempotent,true);
assert.equal(replay.state.player.gold,88000);
assert.equal(replay.state.revision,gold.beforeRevision+1);

const item=await runAttempt({gold:100000,items:[
  {slot:9,existingIndex:201,itemId:201,pile:1},
  {slot:11,existingIndex:202,itemId:202,pile:2}
]},[49,50,1],'v442-item-steal');
assert.equal(item.planned.outcome,'stolen-item');
assert.deepEqual(item.planned.item,{slot:11,existingIndex:202,itemId:202,pile:2});
assert.deepEqual(item.planned.rngConsumed,{targetAdjust:0,steal:3,total:3});
assert.equal(item.commit.state.inventory.playerItemSlots[9],201);
assert.equal(item.commit.state.inventory.playerItemSlots[11],null);
assert.equal(item.commit.state.inventory.itemRuntime.slots['202'],undefined);
assert.equal(item.commit.state.inventory.piles['201'],1);
assert.equal(item.commit.state.inventory.piles['202'],undefined,'source ITEM_endExistItemsOne removes the whole stolen instance stack');
assert.equal(item.commit.state.revision,item.beforeRevision+1);
assert.equal(item.commit.actorExited,true);

const missed=await runAttempt({gold:100000},[50],'v442-steal-miss');
assert.equal(missed.planned.outcome,'chance-failed','source uses RAND(1,100) < 50, not <= 50');
assert.deepEqual(missed.planned.rngConsumed,{targetAdjust:0,steal:1,total:1});
assert.equal(missed.commit.stolen,false);
assert.equal(missed.commit.actorExited,false);
assert.ok(missed.commit.battleContext.sides[1].entries[5]);
assert.equal(missed.commit.state.revision,missed.beforeRevision);

const zeroGold=await runAttempt({gold:1},[49,49,12],'v442-zero-gold');
assert.equal(zeroGold.planned.outcome,'zero-gold');
assert.equal(zeroGold.planned.goldAmount,0);
assert.deepEqual(zeroGold.planned.rngConsumed,{targetAdjust:0,steal:3,total:3});
assert.equal(zeroGold.commit.actorExited,false);
assert.equal(zeroGold.commit.state.revision,zeroGold.beforeRevision);

const empty=await runAttempt({gold:100000},[49,50],'v442-empty-inventory');
assert.equal(empty.planned.outcome,'inventory-empty');
assert.deepEqual(empty.planned.rngConsumed,{targetAdjust:0,steal:2,total:2},'empty backpack consumes no item-index RNG');
assert.equal(empty.commit.actorExited,false);
assert.equal(empty.commit.state.revision,empty.beforeRevision);

const petTargetContext=JSON.parse(JSON.stringify(gold.battleBefore));
const stealActor=petTargetContext.sides[1].entries[5];
stealActor.battleCommands[1]=5;
petTargetContext.sides[0].entries[5]={
  sourceType:'pet',bid:5,battleSlot:5,sourceBattleCharMode:3,isAttacked:1,
  isDie:false,hp:80,maxHp:80,battleCommands:[1,15,-1]
};
const petPlan=planEnemySteal({format:'stoneage-browser-battle-context-runtime-v1',context:petTargetContext},gold.state,{
  attackerBid:stealActor.bid,targetBid:5,stealRolls:[1]
});
assert.equal(petPlan.ok,true,JSON.stringify(petPlan));
assert.equal(petPlan.outcome,'chance-failed','non-player target has source steal chance 0');
assert.deepEqual(petPlan.rngConsumed,{targetAdjust:0,steal:1,total:1});

const fallbackContext=JSON.parse(JSON.stringify(gold.battleBefore));
const fallbackActor=fallbackContext.sides[1].entries[5];
fallbackActor.battleCommands[1]=19;
fallbackContext.sides[0].entries[5]={
  sourceType:'pet',bid:5,battleSlot:5,sourceBattleCharMode:3,isAttacked:1,
  isDie:false,hp:80,maxHp:80,battleCommands:[1,15,-1]
};
const fallbackPlan=planEnemySteal({format:'stoneage-browser-battle-context-runtime-v1',context:fallbackContext},gold.state,{
  attackerBid:fallbackActor.bid,targetBid:19,defaultTargetRoll:0,stealRolls:[49,49,12]
});
assert.equal(fallbackPlan.ok,true,JSON.stringify(fallbackPlan));
assert.equal(fallbackPlan.targetAdjusted,true);
assert.equal(fallbackPlan.finalTargetBid,0,'BATTLE_DefaultAttacker fallback follows eligible slot order');
assert.deepEqual(fallbackPlan.rngConsumed,{targetAdjust:1,steal:3,total:4});
const fallbackCommit=commitEnemySteal({format:'stoneage-browser-battle-context-runtime-v1',context:fallbackContext},gold.state,{
  plan:fallbackPlan,transactionId:'v442-fallback-steal',expectedRevision:gold.state.revision
});
assert.equal(fallbackCommit.ok,true,JSON.stringify(fallbackCommit));
assert.equal(fallbackCommit.stolen,true);
assert.equal(fallbackCommit.battleContext.sides[1].entries[5],null);
assert.equal(fallbackCommit.exitedEnemy.battleCommands[1],0,'TargetAdjust writes the fallback target before Steal executes');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v442-browser-enemy-steal-v1',
  source:{groupId:349,enemyId:473,skillId:140},
  cases:[
    'WAZA selection and COM1/COM2 binding',
    'gold branch amount and player-only deduction',
    'item branch uniformly chooses an eligible backpack slot',
    'whole item-instance stack removal and pile aggregate update',
    '49 success / 50 failure boundary',
    'zero-gold and empty-inventory failures do not exit',
    'non-player target consumes only source success RNG',
    'invalid target consumes DefaultAttacker RNG before Steal RNG',
    'successful steal exits enemy without death/reward credit',
    'persistent and transient replay idempotency'
  ],
  persistentMutationOnActualStealOnly:true
},null,2));
