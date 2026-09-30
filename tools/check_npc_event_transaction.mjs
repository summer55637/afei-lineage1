#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { buildEventActionPlan } from '../src/stoneage_npc_event_runtime.mjs';
import { NPC_EVENT_TRANSACTION_FORMAT, applyNpcEventActionPlan } from '../src/stoneage_npc_event_transaction.mjs';

const closure=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_event_closure.json','utf8'));
const sourceBranch=closure.script.branches[0];
const plan=buildEventActionPlan(sourceBranch);
assert.equal(plan.ok,true);
assert.equal(NPC_EVENT_TRANSACTION_FORMAT,'stoneage-npc-event-transaction-v1');

const base=freshPersistentState({now:()=> '2026-09-30T05:00:00.000Z',playerId:'event-tx'});
let calls=[];
const handlers={
  GetItem(state,payload){
    calls.push(['GetItem',payload.itemId]);
    state.runtimeTest??={};
    state.runtimeTest.items??=[];
    state.runtimeTest.items.push(payload.itemId);
  },
  GetPet(state,payload){
    calls.push(['GetPet',payload.petId]);
    state.runtimeTest??={};
    state.runtimeTest.pets??=[];
    state.runtimeTest.pets.push(payload.petId);
  },
  Charm(state,payload){
    calls.push(['Charm',payload.value]);
    state.runtimeTest.charm=payload.value;
  },
  EndSetFlg(state,payload){
    calls.push(['EndSetFlg',payload.eventId]);
    state.runtimeTest.end??=[];
    state.runtimeTest.end.push(payload.eventId);
  }
};

const applied=applyNpcEventActionPlan(base,plan,{
  handlers,
  transactionId:'event-tx-1',
  now:()=> '2026-09-30T05:01:00.000Z'
});
assert.equal(applied.applied,true);
assert.equal(applied.actionCount,7);
assert.deepEqual(applied.state.runtimeTest.items,[20145,2849,20228,18537]);
assert.deepEqual(applied.state.runtimeTest.pets,[341]);
assert.equal(applied.state.runtimeTest.charm,1);
assert.deepEqual(applied.state.runtimeTest.end,[366]);
assert.equal(applied.state.revision,1);
assert.equal(applied.state.runtimeMeta.npcEventTransactions['event-tx-1'].actionCount,7);
assert.deepEqual(base.runtimeTest,undefined);
assert.equal(base.revision,0);
assert.equal(calls.length,7);

const idempotent=applyNpcEventActionPlan(applied.state,plan,{
  handlers,
  transactionId:'event-tx-1',
  now:()=> '2026-09-30T05:02:00.000Z'
});
assert.equal(idempotent.idempotent,true);
assert.equal(idempotent.state.revision,1);

const noCharmHandlers={GetItem:handlers.GetItem,GetPet:handlers.GetPet,EndSetFlg:handlers.EndSetFlg};
const rejected=applyNpcEventActionPlan(base,plan,{
  handlers:noCharmHandlers,
  transactionId:'event-tx-2'
});
assert.equal(rejected.applied,false);
assert.equal(rejected.reason,'event-action-handler-required');
assert.equal(rejected.role,'Charm');
assert.equal(rejected.state.revision,0);
assert.equal(rejected.state.runtimeTest,undefined);

const exploding=applyNpcEventActionPlan(base,plan,{
  handlers:{
    ...handlers,
    GetItem:handlers.GetItem,
    GetPet(){throw new Error('pet factory missing');}
  },
  transactionId:'event-tx-3'
});
assert.equal(exploding.applied,false);
assert.equal(exploding.reason,'event-action-handler-error');
assert.equal(exploding.role,'GetPet');
assert.equal(exploding.state.revision,0);
assert.equal(exploding.state.runtimeTest,undefined);

const noPlan=applyNpcEventActionPlan(base,{format:'bad',actions:{}},{});
assert.equal(noPlan.applied,false);
assert.equal(noPlan.reason,'invalid-event-action-plan');

console.log(JSON.stringify({
  pass:true,
  format:NPC_EVENT_TRANSACTION_FORMAT,
  sourceBranch:'TRANS=0&LV<100&ENDEV!=366',
  actionsApplied:7,
  atomicRollback:true,
  idempotent:true,
  allMutationRolesExplicit:true
}));
