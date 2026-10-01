#!/usr/bin/env node
import assert from 'node:assert/strict';
import { planBattleExit } from '../src/stoneage_browser_battle_exit_runtime.mjs';
import { planBattlePlayerExit } from '../src/stoneage_browser_battle_player_exit_runtime.mjs';
import { commitBattleExit } from '../src/stoneage_browser_battle_exit_commit_runtime.mjs';
import { commitBattlePlayerExit } from '../src/stoneage_browser_battle_player_exit_commit_runtime.mjs';

const context={context:{mode:'finish',sourceMode:3,settlementStartRevision:5,sides:[{side:0,entries:[{bid:0,sourceType:'player',characterId:'p425',hp:25,maxHp:100,mp:8,maxMp:20,isDie:false,getitem:[-1,-1,-1]}]}]}};
const baseState={revision:7,player:{id:'p425',hp:25,mp:8,maxHp:100,maxMp:20},pets:{petBox:[{id:'pet-425',hp:0,maxHp:20,mailMode:0}],team:['pet-425'],activePetId:'pet-425'},runtimeMeta:{}};

const noReceiptPlayer=planBattlePlayerExit(context,baseState,{settlementComplete:true});
assert.equal(noReceiptPlayer.ok,false);
assert.equal(noReceiptPlayer.reason,'settlement-receipt-required');

const noReceiptPet=planBattleExit(context,baseState,{settlementComplete:true});
assert.equal(noReceiptPet.ok,false);
assert.equal(noReceiptPet.reason,'settlement-receipt-required');

const state=JSON.parse(JSON.stringify(baseState));
state.runtimeMeta.battleLevelUpTransactions={'lvl-425':{revisionBefore:5,revisionAfter:6}};
state.runtimeMeta.battleSettlementReceipts={'settle-425':{settlementId:'settle-425',startRevision:5,receiptRevision:7,finishMode:'finish',playerId:'p425',encounterId:null,dpbattle:0,playerDead:false,requiredBranches:['levelUp'],transactions:[{kind:'levelUp',transactionId:'lvl-425'}]}};

const playerPlan=planBattlePlayerExit(context,state,{settlementComplete:true});
assert.equal(playerPlan.ok,true,JSON.stringify(playerPlan));
assert.equal(playerPlan.settlementReceiptBound,true);
assert.equal(playerPlan.settlementReceiptId,'settle-425');
assert.equal(playerPlan.settlementReceiptRevision,7);

const petBeforePlayer=planBattleExit(context,state,{settlementComplete:true});
assert.equal(petBeforePlayer.ok,false);
assert.equal(petBeforePlayer.reason,'player-exit-commit-required');


const tamperedPlayer={...playerPlan,settlementReceiptRevision:6};
const tamperedPlayerCommit=commitBattlePlayerExit(state,tamperedPlayer,{transactionId:'exit-player-425',expectedRevision:7});
assert.equal(tamperedPlayerCommit.ok,false);
assert.equal(tamperedPlayerCommit.reason,'settlement-receipt-revision-mismatch');

const playerDone=commitBattlePlayerExit(state,playerPlan,{transactionId:'exit-player-425',expectedRevision:7});
assert.equal(playerDone.ok,true,JSON.stringify(playerDone));
assert.equal(playerDone.state.revision,8);
assert.equal(playerDone.state.runtimeMeta.battlePlayerExitTransactions['exit-player-425'].settlementReceiptId,'settle-425');

const petPlan=planBattleExit(context,playerDone.state,{settlementComplete:true});
assert.equal(petPlan.ok,true,JSON.stringify(petPlan));
assert.equal(petPlan.settlementReceiptBound,true);
assert.equal(petPlan.settlementReceiptId,'settle-425');
assert.equal(petPlan.playerExitTransactionId,'exit-player-425');
assert.equal(petPlan.playerExitRevision,8);

const tamperedPet={...petPlan,settlementReceiptRevision:6};
const tamperedPetCommit=commitBattleExit(playerDone.state,tamperedPet,{transactionId:'exit-pet-425',expectedRevision:8});
assert.equal(tamperedPetCommit.ok,false);
assert.equal(tamperedPetCommit.reason,'settlement-receipt-revision-mismatch');

const petDone=commitBattleExit(playerDone.state,petPlan,{transactionId:'exit-pet-425',expectedRevision:8});
assert.equal(petDone.ok,true,JSON.stringify(petDone));
assert.equal(petDone.state.revision,9);
assert.equal(petDone.state.pets.petBox[0].hp,1);
assert.equal(petDone.state.runtimeMeta.battleExitTransactions['exit-pet-425'].playerExitTransactionId,'exit-player-425');

const petReplay=commitBattleExit(petDone.state,petPlan,{transactionId:'exit-pet-425',expectedRevision:8});
assert.equal(petReplay.ok,true,JSON.stringify(petReplay));
assert.equal(petReplay.idempotent,true);
assert.equal(petReplay.applied,false);
assert.equal(petReplay.state.revision,9);

console.log('V4.25 Browser Battle settlement receipt-bound exit gate regression: PASS');
