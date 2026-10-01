#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { requiredSettlementBranches, commitBattleSettlementReceipt } from '../src/stoneage_browser_battle_settlement_runtime.mjs';

const state=freshPersistentState({playerId:'p1'});
state.player.hp=100; state.player.mp=20;
state.runtimeMeta.battleLevelUpTransactions={
  'lvl-1':{revisionBefore:1,revisionAfter:2}
};
state.runtimeMeta.battleItemTransactions={
  'item-1':{revisionBefore:2,revisionAfter:3}
};
const context={context:{
  mode:'finish',sourceMode:3,settlementStartRevision:1,dpbattle:0,
  sourceEncounter:{encounterId:65},
  sides:[{side:0,entries:[{bid:0,sourceType:'player',characterId:'p1',isDie:false,getitem:[-1,7]}]}]
}};
const branches=requiredSettlementBranches(context);
assert.deepEqual(branches.requiredBranches,['levelUp','item']);

const deadDuelContext={context:{mode:'finish',sourceMode:3,settlementStartRevision:5,dpbattle:1,sides:[{side:0,entries:[{bid:0,sourceType:'player',characterId:'p1',isDie:true,getitem:[-1,-1,-1]}]}]}};
const deadDuelBranches=requiredSettlementBranches(deadDuelContext);
assert.deepEqual(deadDuelBranches.requiredBranches,['duelPoint']);

const missing=commitBattleSettlementReceipt(state,context,{
  settlementId:'settle-missing',
  transactions:[{kind:'levelUp',transactionId:'lvl-1'}],
  expectedRevision:3
});
assert.equal(missing.ok,false);
assert.equal(missing.reason,'settlement-transaction-required');

state.revision=3;
const done=commitBattleSettlementReceipt(state,context,{
  settlementId:'settle-1',
  transactions:[{kind:'levelUp',transactionId:'lvl-1'},{kind:'item',transactionId:'item-1'}],
  expectedRevision:3,
  now:()=> '2026-10-01T12:30:00+08:00'
});
assert.equal(done.ok,true,JSON.stringify(done));
assert.equal(done.revisionBefore,3);
assert.equal(done.revisionAfter,4);
assert.equal(done.state.runtimeMeta.battleSettlementReceipts['settle-1'].startRevision,1);

const valid=commitBattleSettlementReceipt(done.state,context,{
  settlementId:'settle-1',
  transactions:[{kind:'levelUp',transactionId:'lvl-1'},{kind:'item',transactionId:'item-1'}],
  expectedRevision:3
});
assert.equal(valid.ok,true);
assert.equal(valid.idempotent,true);

const oldState=freshPersistentState({playerId:'p1'});
oldState.revision=3;
oldState.runtimeMeta.battleLevelUpTransactions={'old':{revisionAfter:1}};
const stale=commitBattleSettlementReceipt(oldState,context,{
  settlementId:'stale',
  transactions:[{kind:'levelUp',transactionId:'old'}],
  expectedRevision:3
});
assert.equal(stale.ok,false);
assert.equal(stale.reason,'settlement-transaction-outside-battle-window');

console.log('V4.24 Browser Battle settlement receipt regression: PASS');
