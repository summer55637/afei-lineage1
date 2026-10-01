#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  ACTION_BATTLE_CONTEXT_CLEAR,
  BROWSER_BATTLE_CONTEXT_CLEAR_RUNTIME_FORMAT,
  clearBattleContext
} from '../src/stoneage_browser_battle_context_clear_runtime.mjs';

const battleContext={
  format:'stoneage-v422-browser-battle-context-v1',
  context:{
    mode:'finish',
    sourceMode:3,
    settlementStartRevision:5,
    sides:[{
      side:0,
      entries:[{bid:0,sourceType:'player',characterId:'p425',isDie:false}]
    }]
  }
};

const baseState={
  revision:9,
  runtimeMeta:{
    battleSettlementReceipts:{
      'settle-425':{
        settlementId:'settle-425',
        startRevision:5,
        receiptRevision:7,
        finishMode:'finish',
        playerId:'p425'
      }
    },
    battlePlayerExitTransactions:{
      'exit-player-425':{
        settlementReceiptId:'settle-425',
        settlementStartRevision:5,
        settlementReceiptRevision:7,
        revisionBefore:7,
        revisionAfter:8,
        player:{playerId:'p425'}
      }
    },
    battleExitTransactions:{
      'exit-pet-425':{
        settlementReceiptId:'settle-425',
        settlementStartRevision:5,
        settlementReceiptRevision:7,
        playerExitTransactionId:'exit-player-425',
        playerExitRevision:8,
        revisionBefore:8,
        revisionAfter:9,
        pets:[{petId:'pet-425',hpBefore:0,hpAfter:1}]
      }
    }
  }
};

const noPet=clearBattleContext(
  JSON.parse(JSON.stringify(baseState)),
  battleContext,
  {petExitTransactionId:'missing'}
);
assert.equal(noPet.ok,false);
assert.equal(noPet.reason,'pet-exit-commit-required');

const done=clearBattleContext(
  JSON.parse(JSON.stringify(baseState)),
  battleContext,
  {petExitTransactionId:'exit-pet-425'}
);
assert.equal(done.ok,true,JSON.stringify(done));
assert.equal(done.stage,'battle-context-clear-applied');
assert.equal(done.action,ACTION_BATTLE_CONTEXT_CLEAR);
assert.equal(done.format,BROWSER_BATTLE_CONTEXT_CLEAR_RUNTIME_FORMAT);
assert.equal(done.battleContextCleared,true);
assert.equal(done.transientMutation,true);
assert.equal(done.persistentMutation,false);
assert.equal(done.playerExitTransactionId,'exit-player-425');
assert.equal(done.petExitTransactionId,'exit-pet-425');
assert.equal(done.revisionAfter,9);

const tampered=JSON.parse(JSON.stringify(baseState));
tampered.runtimeMeta.battleExitTransactions['exit-pet-425'].playerExitTransactionId='other-player';
const blocked=clearBattleContext(
  tampered,
  battleContext,
  {petExitTransactionId:'exit-pet-425'}
);
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'player-exit-commit-not-found');

console.log('V4.25 Browser Battle Context Clear gate regression: PASS');
