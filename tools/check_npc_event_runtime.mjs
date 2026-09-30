#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  NPC_EVENT_RUNTIME_FORMAT,
  parseConditionAtom,
  parseConditionExpression,
  evaluateConditionExpression,
  selectEventBranch,
  buildEventActionPlan,
  compileSourceEventScript
} from '../src/stoneage_npc_event_runtime.mjs';

const closure=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_event_closure.json','utf8'));
const script=closure.script;

assert.equal(NPC_EVENT_RUNTIME_FORMAT,'stoneage-npc-event-runtime-v1');
assert.equal(parseConditionAtom('LV<100').key,'LV');
assert.equal(parseConditionAtom('ENDEV!=366').operator,'!=');
assert.equal(parseConditionAtom('TRANS=0').value,0);

const parsed=parseConditionExpression('TRANS=0&LV>99&LV<140&ENDEV!=365');
assert.equal(parsed.ok,true);
assert.equal(parsed.alternatives.length,1);
assert.equal(parsed.alternatives[0].length,4);

const branch1=script.branches[1];
const ctx120={
  level:120,
  transmigration:0,
  gold:0,
  isEventEnd:id=>id===366,
  isEventNow:id=>false
};
const eval120=evaluateConditionExpression(branch1.condition,ctx120);
assert.equal(eval120.ok,true);
assert.equal(eval120.matched,true);

const selected120=selectEventBranch(script.branches,ctx120);
assert.equal(selected120.ok,true);
assert.equal(selected120.matched,true);
assert.equal(selected120.index,1);
assert.deepEqual(selected120.branch.getItem,[20866,2912,2909,2911]);
assert.deepEqual(selected120.branch.getPet,[2057]);

const ctx150={
  level:150,
  transmigration:0,
  gold:0,
  isEventEnd:()=>false,
  isEventNow:()=>false
};
const selected150=selectEventBranch(script.branches,ctx150);
assert.equal(selected150.ok,true);
assert.equal(selected150.index,3);
assert.deepEqual(selected150.branch.getPet,[1479,2547]);

const ended100={
  level:1,
  transmigration:0,
  gold:0,
  isEventEnd:id=>id===366,
  isEventNow:()=>false
};
const selectedEnded=selectEventBranch(script.branches,ended100);
assert.equal(selectedEnded.ok,true);
assert.equal(selectedEnded.matched,false);
assert.equal(selectedEnded.index,-1);

const plan=buildEventActionPlan(script.branches[0]);
assert.equal(plan.ok,true);
assert.deepEqual(plan.actions.literalGetItem,[20145,2849,20228,18537].map(itemId=>({itemId,role:'GetItem'})));
assert.deepEqual(plan.actions.literalGetPet,[{petId:341,role:'GetPet'}]);
assert.deepEqual(plan.actions.setEndEvents,[{eventId:366,role:'EndSetFlg'}]);
assert.equal(plan.actions.charm.value,1);

const compiled=compileSourceEventScript(script);
assert.equal(compiled.ok,true);
assert.equal(compiled.branches.length,4);
assert.equal(compiled.branches[0].plan.semantics.getItem.includes('literal source role'),true);

const unsupported=selectEventBranch([{condition:'CLASS=0&LV<10',getItem:[],getPet:[]}],{level:1,transmigration:0,gold:0});
assert.equal(unsupported.ok,false);
assert.equal(unsupported.reason,'unsupported-event-condition');

console.log(JSON.stringify({
  pass:true,
  format:NPC_EVENT_RUNTIME_FORMAT,
  sourceScript:script.path,
  sourceEventNo:script.eventNo,
  branches:compiled.branches.length,
  branchAtLevel120:selected120.index,
  branchAtLevel150:selected150.index,
  completedBranchBlocked:selectedEnded.matched===false,
  unsupportedConditionFailClosed:true
}));
