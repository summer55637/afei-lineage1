#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { executeNpcSourceEvent, NPC_EVENT_ORCHESTRATOR_FORMAT } from '../src/stoneage_npc_event_orchestrator.mjs';

const closure=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_event_closure.json','utf8'));
const script=closure.script;
assert.equal(NPC_EVENT_ORCHESTRATOR_FORMAT,'stoneage-npc-event-orchestrator-v1');

const state=freshPersistentState({now:()=> '2026-09-30T06:00:00.000Z',playerId:'orchestrator'});
state.player.level=120;
state.player.transmigration=0;

const itemIds=[];
const petIds=[];
const eventEnd=[];
const calls=[];
const handlers={
  GetItem(st,p){calls.push(['GetItem',p.itemId]);itemIds.push(p.itemId);},
  GetPet(st,p){calls.push(['GetPet',p.petId]);petIds.push(p.petId);},
  Charm(st,p){calls.push(['Charm',p.value]);st.runtimeTest??={};st.runtimeTest.charm=p.value;},
  EndSetFlg(st,p){calls.push(['EndSetFlg',p.eventId]);eventEnd.push(p.eventId);}
};
const context={
  level:120,
  transmigration:0,
  gold:0,
  isEventEnd:id=>id===366,
  isEventNow:()=>false
};

const planned=executeNpcSourceEvent(state,script,{context,execute:false});
assert.equal(planned.ok,true);
assert.equal(planned.matched,true);
assert.equal(planned.plannedOnly,true);
assert.equal(planned.branchIndex,1);
assert.equal(planned.state.revision,0);

const executed=executeNpcSourceEvent(state,script,{
  context,
  handlers,
  transactionId:'orchestrator-1',
  now:()=> '2026-09-30T06:01:00.000Z'
});
assert.equal(executed.ok,true);
assert.equal(executed.applied,true);
assert.equal(executed.branchIndex,1);
assert.deepEqual(itemIds,[20866,2912,2909,2911]);
assert.deepEqual(petIds,[2057]);
assert.deepEqual(eventEnd,[365]);
assert.equal(executed.state.runtimeTest.charm,1);
assert.equal(executed.state.revision,1);
assert.equal(calls.length,7);
assert.equal(executed.state.runtimeMeta.npcEventTransactions['orchestrator-1'].actionCount,7);

const repeat=executeNpcSourceEvent(executed.state,script,{
  context,
  handlers,
  transactionId:'orchestrator-1'
});
assert.equal(repeat.ok,true);
assert.equal(repeat.idempotent,true);
assert.equal(repeat.applied,false);
assert.equal(repeat.state.revision,1);

const completedContext={
  level:120,
  transmigration:0,
  gold:0,
  isEventEnd:id=>id===365,
  isEventNow:()=>false
};
const blocked=executeNpcSourceEvent(state,script,{context:completedContext});
assert.equal(blocked.ok,true);
assert.equal(blocked.matched,false);
assert.equal(blocked.applied,false);
assert.equal(blocked.branchIndex,-1);
assert.equal(blocked.state.revision,0);

const failed=executeNpcSourceEvent(state,script,{
  context,
  handlers:{
    GetItem:handlers.GetItem,
    GetPet:handlers.GetPet,
    EndSetFlg:handlers.EndSetFlg
  },
  transactionId:'orchestrator-fail'
});
assert.equal(failed.ok,false);
assert.equal(failed.applied,false);
assert.equal(failed.transaction.reason,'event-action-handler-required');
assert.equal(failed.transaction.role,'Charm');
assert.equal(failed.state.revision,0);

console.log(JSON.stringify({
  pass:true,
  format:NPC_EVENT_ORCHESTRATOR_FORMAT,
  sourceScript:script.path,
  selectedLevel120Branch:executed.branchIndex,
  executedActions:executed.transaction.actionCount,
  idempotentRepeat:repeat.idempotent,
  completedBranchBlocked:blocked.matched===false,
  atomicFailure:failed.applied===false
}));
