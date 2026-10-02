import assert from 'node:assert/strict';
import { commitBattleExit } from '../src/stoneage_browser_battle_exit_commit_runtime.mjs';
const state={revision:5,player:{hp:0,mp:0},pets:{petBox:[
 {id:'dead',hp:0,maxHp:20},{id:'alive',hp:7,maxHp:20}
 ]},runtimeMeta:{battleSettlementReceipts:{'settlement-1':{settlementId:'settlement-1',startRevision:1,receiptRevision:4,finishMode:'finish'}},battlePlayerExitTransactions:{'player-exit-1':{settlementReceiptId:'settlement-1',settlementStartRevision:1,settlementReceiptRevision:4,revisionBefore:4,revisionAfter:5,player:{playerId:'player1'}}}}};
const plan={ok:true,stage:'battle-exit-plan-ready',format:'stoneage-v421-browser-battle-exit-plan-v1',settlementComplete:true,settlementReceiptBound:true,settlementReceiptId:'settlement-1',settlementStartRevision:1,settlementReceiptRevision:4,playerExitTransactionId:'player-exit-1',playerExitRevision:5,pets:[{petId:'dead',hpBefore:0,hpAfter:1,mailMode:0}]};
const done=commitBattleExit(state,plan,{transactionId:'battle-v421-1',expectedRevision:5,now:()=> '2026-10-01T12:30:00+08:00'});
assert.equal(done.ok,true); assert.equal(done.applied,true); assert.equal(done.revisionAfter,6);
assert.equal(done.state.pets.petBox[0].hp,1); assert.equal(done.state.pets.petBox[1].hp,7);
assert.equal(done.state.player.hp,0); assert.equal(done.state.player.mp,0);
const badPlan={...plan}; delete badPlan.settlementComplete;
const blocked=commitBattleExit(state,badPlan,{transactionId:'battle-v421-no-settlement',expectedRevision:5});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'settlement-complete-flag-required');
const retry=commitBattleExit(done.state,plan,{transactionId:'battle-v421-1',expectedRevision:4});
assert.equal(retry.ok,true); assert.equal(retry.idempotent,true); assert.equal(retry.applied,false);
const stale=commitBattleExit({...state,pets:{petBox:[{id:'dead',hp:2}]}},plan,{transactionId:'battle-v421-stale',expectedRevision:4});
assert.equal(stale.ok,false); assert.equal(stale.reason,'pet-hp-stale-plan');
console.log('V4.21 Browser Battle exit commit regression: PASS');
