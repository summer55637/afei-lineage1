#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { applyBattleProfitCredit } from '../src/stoneage_browser_battle_profit_credit_runtime.mjs';
import { applyBattleRelife } from '../src/stoneage_browser_battle_relife_runtime.mjs';
import { commitBattleDeathExtras } from '../src/stoneage_browser_battle_death_extra_commit_runtime.mjs';
import { commitBattleRelife } from '../src/stoneage_browser_battle_relife_commit_runtime.mjs';
import { commitBattleLevelUp } from '../src/stoneage_browser_battle_levelup_commit_runtime.mjs';
import { planBattleEnd } from '../src/stoneage_browser_battle_end_runtime.mjs';
import { commitBattleFinish } from '../src/stoneage_browser_battle_finish_commit_runtime.mjs';
import { requiredSettlementBranches, commitBattleSettlementReceipt } from '../src/stoneage_browser_battle_settlement_runtime.mjs';
import { planBattlePlayerExit } from '../src/stoneage_browser_battle_player_exit_runtime.mjs';
import { commitBattlePlayerExit } from '../src/stoneage_browser_battle_player_exit_commit_runtime.mjs';
import { planBattleExit } from '../src/stoneage_browser_battle_exit_runtime.mjs';
import { commitBattleExit } from '../src/stoneage_browser_battle_exit_commit_runtime.mjs';
import { clearBattleContext } from '../src/stoneage_browser_battle_context_clear_runtime.mjs';

const now=()=> '2026-10-03T21:20:00+08:00';
const state=freshPersistentState({now,playerId:'p1',playerName:'V4.66 Integration'});
state.revision=0;
state.player.level=1;
state.player.exp=0;
state.player.hp=1;
state.player.maxHp=200;
state.player.mp=30;
state.player.maxMp=50;
state.player.charm=20;
state.player.duelPoint=0;
state.player.profession.skillPoint=0;

state.inventory.playerItemSlots[3]=400;
state.inventory.itemRuntime.slots['400']={use:true,itemId:20131,owner:'player',pile:1,data:[20131]};
state.inventory.piles['20131']=1;

const context={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',
    sourceMode:2,
    turn:0,
    norisk:0,
    dpbattle:0,
    sourceEncounter:{encounterId:466},
    finishHookProfile:{auditFormat:'stoneage-battle-finish-hook-audit-v1',profile:'ordinary-world-encounter',winFuncInjected:false,pkFuncInjected:false,dantai:false,linkedBattleCount:0},
    sourcePlayerItemSlotsSnapshot:[null,null,null,400,...Array(20).fill(null)],
    sourcePlayerRelifeCandidates:[{playerSlot:3,existingIndex:400,itemId:20131,itemName:'替身娃娃 Lv1',relifeFunc:'ITEM_DIErelife',equipPlace:3,hpArgument:200}],
    sourceRelifeConsumedExistingIndexes:[],
    sourceRelifeEvents:[],
    sourceDeathExtraEvents:[],
    sourceBattleExitedBids:[],
    sides:[
      {side:0,type:0,flg:0,entries:[{
        bid:0,battleSlot:0,battleSide:0,sourceType:'player',characterId:'p1',
        hp:0,maxHp:200,mp:30,maxMp:50,level:1,
        fixDex:1,quick:1,fixVital:1,attackPower:1,defencePower:1,fixStr:1,fixTgh:1,fixLuck:0,
        battleFlg:0,battleCommands:[-1,-1,-1],sourceBattleCharMode:3,battleMode:'c_ok',
        elements:{fire:0,water:0,earth:0,wind:0},
        damageVanish:0,damageAbsorb:0,damageReflect:0,damageReact:0,
        isDie:true,deadCount:1,ultimate:0,charm:20,deadPetCount:0,variableAi:0,
        sourceAddProfitDeathPending:true,sourceDeathExtraProcessed:false,getitem:[-1,-1,-1]
      },...Array(9).fill(null)]},
      {side:1,type:1,flg:0,entries:Array(10).fill(null)}
    ]
  }
};

const profit=applyBattleProfitCredit(context,{attackerBids:[],allowPlayerCredit:false,allowCommittedDeath:true,hitIndex:0,source:'v466-integration',now});
assert.equal(profit.ok,true,JSON.stringify(profit));
assert.equal(profit.deathExtra.newEvents.length,1);
assert.equal(profit.deathExtra.newEvents[0].kind,'player-normal-death');
assert.equal(profit.context.sides[0].entries[0].charm,19);

const relife=applyBattleRelife({format:'stoneage-browser-battle-context-runtime-v1',context:profit.context},{trigger:'v466-integration-relife',now});
assert.equal(relife.ok,true,JSON.stringify(relife));
assert.equal(relife.applied,true);
assert.equal(relife.event.itemId,20131);
assert.equal(relife.context.sides[0].entries[0].hp,200);
assert.equal(relife.context.sides[0].entries[0].isDie,false);
assert.equal(relife.context.sides[0].entries[0].sourceDeathExtraProcessed,false);

const finishPlan=planBattleEnd({format:'stoneage-browser-battle-context-runtime-v1',context:relife.context});
assert.equal(finishPlan.ok,true,JSON.stringify(finishPlan));
assert.equal(finishPlan.finished,true);
assert.equal(finishPlan.winnerSide,0);

const finished=commitBattleFinish({format:'stoneage-browser-battle-context-runtime-v1',context:relife.context},{finishPlan,winnerSide:0,settlementStartRevision:state.revision});
assert.equal(finished.ok,true,JSON.stringify(finished));
assert.equal(finished.battleContext.context.mode,'finish');
assert.equal(finished.battleContext.context.settlementStartRevision,0);
const finishedContext=finished.battleContext;

const deathExtraCommitted=commitBattleDeathExtras(state,finishedContext,{transactionId:'v466-death-extra-1',expectedRevision:0,now});
assert.equal(deathExtraCommitted.ok,true,JSON.stringify(deathExtraCommitted));
assert.equal(deathExtraCommitted.state.revision,1);
assert.equal(deathExtraCommitted.state.player.charm,19);
let currentState=deathExtraCommitted.state;

const relifeCommitted=commitBattleRelife(currentState,finishedContext,{transactionId:'v466-relife-1',expectedRevision:1,now});
assert.equal(relifeCommitted.ok,true,JSON.stringify(relifeCommitted));
assert.equal(relifeCommitted.state.revision,2);
assert.equal(relifeCommitted.state.player.hp,200);
assert.equal(relifeCommitted.state.inventory.playerItemSlots[3],null);
assert.equal(relifeCommitted.state.inventory.itemRuntime.slots['400'],undefined);
assert.equal(relifeCommitted.state.inventory.piles['20131'],undefined);
currentState=relifeCommitted.state;

const levelPlan={
  ok:true,stage:'battle-levelup-plan-ready',format:'stoneage-v414-browser-battle-levelup-plan-v1',
  player:{levelBefore:1,levelAfter:1,expBefore:0,expAfter:0,duelPointBefore:0,duelPointAfter:0,skillPointBefore:0,skillPointAfter:0,charmBefore:19,charmAfter:19},
  pets:[]
};
const petGrowthPlan={ok:true,stage:'battle-pet-growth-plan-ready',format:'stoneage-v415-browser-battle-pet-growth-plan-v1',pets:[]};
const levelUp=commitBattleLevelUp(currentState,levelPlan,petGrowthPlan,{transactionId:'v466-levelup-1',expectedRevision:2,now});
assert.equal(levelUp.ok,true,JSON.stringify(levelUp));
assert.equal(levelUp.state.revision,3);
currentState=levelUp.state;

const branches=requiredSettlementBranches(finishedContext);
assert.deepEqual(branches.requiredBranches,['levelUp','deathExtra','relife']);

const missingRelife=commitBattleSettlementReceipt(currentState,finishedContext,{
  settlementId:'v466-settlement-missing-relife',
  transactions:[{kind:'levelUp',transactionId:'v466-levelup-1'},{kind:'deathExtra',transactionId:'v466-death-extra-1'}],
  expectedRevision:3,now
});
assert.equal(missingRelife.ok,false);
assert.equal(missingRelife.reason,'settlement-transaction-required');
assert.equal(missingRelife.kind,'relife');

const settlement=commitBattleSettlementReceipt(currentState,finishedContext,{
  settlementId:'v466-settlement-1',
  transactions:[{kind:'levelUp',transactionId:'v466-levelup-1'},{kind:'deathExtra',transactionId:'v466-death-extra-1'},{kind:'relife',transactionId:'v466-relife-1'}],
  expectedRevision:3,now
});
assert.equal(settlement.ok,true,JSON.stringify(settlement));
assert.equal(settlement.revisionAfter,4);
currentState=settlement.state;

const playerExitPlan=planBattlePlayerExit(finishedContext,currentState,{settlementComplete:true,settlementReceiptId:'v466-settlement-1'});
assert.equal(playerExitPlan.ok,true,JSON.stringify(playerExitPlan));
assert.equal(playerExitPlan.player.battleIsDie,false);
assert.equal(playerExitPlan.player.hpAfter,200);

const playerExit=commitBattlePlayerExit(currentState,playerExitPlan,{transactionId:'v466-player-exit-1',expectedRevision:4,now});
assert.equal(playerExit.ok,true,JSON.stringify(playerExit));
assert.equal(playerExit.state.revision,5);
assert.equal(playerExit.state.player.hp,200);
currentState=playerExit.state;

const battleExitPlan=planBattleExit(finishedContext,currentState,{settlementComplete:true,settlementReceiptId:'v466-settlement-1'});
assert.equal(battleExitPlan.ok,true,JSON.stringify(battleExitPlan));
assert.equal(battleExitPlan.playerExitTransactionId,'v466-player-exit-1');
assert.equal(battleExitPlan.pets.length,0);

const battleExit=commitBattleExit(currentState,battleExitPlan,{transactionId:'v466-battle-exit-1',expectedRevision:5,now});
assert.equal(battleExit.ok,true,JSON.stringify(battleExit));
assert.equal(battleExit.state.revision,6);
currentState=battleExit.state;

const cleared=clearBattleContext(currentState,finishedContext,{petExitTransactionId:'v466-battle-exit-1'});
assert.equal(cleared.ok,true,JSON.stringify(cleared));
assert.equal(cleared.battleContextCleared,true);
assert.equal(cleared.persistentMutation,false);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v466-browser-battle-full-settlement-chain-v1',
  revisionChain:[0,1,2,3,4,5,6],
  requiredSettlementBranches:branches.requiredBranches,
  deathExtraCommitted:true,
  relifeCommitted:true,
  levelUpCommitted:true,
  settlementCommitted:true,
  playerExitCommitted:true,
  battleExitCommitted:true,
  contextCleared:true
},null,2));
