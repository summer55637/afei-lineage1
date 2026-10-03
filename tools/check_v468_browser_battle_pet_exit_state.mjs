#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { planBattlePetExit } from '../src/stoneage_browser_battle_pet_exit_runtime.mjs';
import { commitBattlePetExit } from '../src/stoneage_browser_battle_pet_exit_commit_runtime.mjs';
import { planBattleExit } from '../src/stoneage_browser_battle_exit_runtime.mjs';
import { commitBattleExit } from '../src/stoneage_browser_battle_exit_commit_runtime.mjs';

const now='2026-10-03T22:10:00+08:00';
const state=freshPersistentState({now,playerId:'p1',playerName:'V4.68 Pet Exit'});
state.revision=4;
state.player.hp=200;state.player.mp=30;
state.pets.petBox=[{id:'pet-1',name:'Pet-1',hp:300,maxHp:500,mp:20,maxMp:50,isDie:false,mailMode:0,variableAi:0}];
state.runtimeMeta.battleLevelUpTransactions={'l-468':{revisionAfter:2}};
state.runtimeMeta.battleSettlementReceipts={'s-468':{settlementId:'s-468',finishMode:'finish',startRevision:0,receiptRevision:3,playerId:'p1',requiredBranches:['levelUp'],transactions:[{kind:'levelUp',transactionId:'l-468'}]}};
state.runtimeMeta.battlePlayerExitTransactions={'p-468':{revisionBefore:3,revisionAfter:4,settlementReceiptId:'s-468',settlementStartRevision:0,settlementReceiptRevision:3}};

const ctx={format:'stoneage-browser-battle-context-runtime-v1',context:{
  mode:'finish',sourceMode:3,settlementStartRevision:0,
  sides:[{side:0,type:0,entries:[
    {bid:0,sourceType:'player',characterId:'p1',hp:200,isDie:false},
    null,null,null,null,
    {bid:5,sourceType:'pet',characterId:'pet-1',stateId:'pet-1',hp:0,maxHp:500,isDie:true}
  ]},{side:1,type:1,entries:Array(10).fill(null)}]
}};
const plan=planBattlePetExit(ctx,state,{settlementComplete:true,settlementReceiptId:'s-468',playerExitTransactionId:'p-468'});
assert.equal(plan.ok,true,JSON.stringify(plan));
assert.equal(plan.pets.length,1);
assert.equal(plan.pets[0].hpAfter,1);
assert.equal(plan.pets[0].sourceDeathCleanup,true);

const committed=commitBattlePetExit(state,ctx,plan,{transactionId:'tx-468',expectedRevision:4,now});
assert.equal(committed.ok,true,JSON.stringify(committed));
assert.equal(committed.state.revision,5);
assert.equal(committed.state.pets.petBox[0].hp,1);
assert.equal(committed.state.pets.petBox[0].isDie,false);

const replay=commitBattlePetExit(committed.state,ctx,plan,{transactionId:'tx-468',expectedRevision:5,now});
assert.equal(replay.ok,true);
assert.equal(replay.idempotent,true);
assert.equal(replay.state.revision,5);

const liveCtx={...ctx,context:{...ctx.context,sides:[{...ctx.context.sides[0],entries:[{bid:0,sourceType:'player',characterId:'p1',hp:200,isDie:false},null,null,null,null,{bid:5,sourceType:'pet',characterId:'pet-1',stateId:'pet-1',hp:275,maxHp:500,isDie:false}]},ctx.context.sides[1]]}};
state.pets.petBox[0].hp=300;
const livePlan=planBattlePetExit(liveCtx,state,{settlementComplete:true,settlementReceiptId:'s-468',playerExitTransactionId:'p-468'});
assert.equal(livePlan.ok,true,JSON.stringify(livePlan));
assert.equal(livePlan.pets[0].hpAfter,275);
const exitPlanMissing=planBattleExit(ctx,state,{settlementComplete:true,settlementReceiptId:'s-468'});
assert.equal(exitPlanMissing.ok,false);
assert.equal(exitPlanMissing.reason,'pet-exit-state-transaction-required');

state.pets.petBox[0].hp=1;
state.pets.petBox[0].isDie=false;
const exitPlan=planBattleExit(ctx,state,{
  settlementComplete:true,
  settlementReceiptId:'s-468',
  petExitStateTransactionId:'tx-468'
});
assert.equal(exitPlan.ok,true,JSON.stringify(exitPlan));
assert.equal(exitPlan.petExitStateRequired,true);
assert.equal(exitPlan.petExitStateTransactionId,'tx-468');

const exitCommit=commitBattleExit(state,exitPlan,{transactionId:'battle-exit-468',expectedRevision:5,now});
assert.equal(exitCommit.ok,true,JSON.stringify(exitCommit));
assert.equal(exitCommit.state.revision,6);
assert.equal(exitCommit.state.pets.petBox[0].hp,1);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v468-browser-battle-pet-exit-state-v1',
  deadPetClampedToOne:true,
  alivePetHpSnapshot:true,
  idempotent:true,
  finalBattleExitBound:true
},null,2));
