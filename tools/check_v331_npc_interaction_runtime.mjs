#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { NPC_INTERACTION_RUNTIME_FORMAT, canInteractWithNpc, buildInteractionRequest } from '../src/stoneage_npc_interaction_runtime.mjs';

const reachability=JSON.parse(fs.readFileSync('data/generated/stoneage_start_npc_reachability.json','utf8'));
assert.equal(NPC_INTERACTION_RUNTIME_FORMAT,'stoneage-npc-interaction-runtime-v1');

const changeevent=reachability.rows.find(r=>r.template==='changeevent'&&r.hometown===0);
assert.ok(changeevent);
const blocked=canInteractWithNpc(changeevent,{floor:1006,x:15,y:21,facingCell:[1006,15,22]},{interactionRule:'unresolved: template name absent from pinned npctemplate.c functionSet[]'});
assert.equal(blocked.ok,true);
assert.equal(blocked.interactable,false);
assert.equal(blocked.reason,'npc-runtime-module-unresolved');

const bank=reachability.rows.find(r=>r.template==='bankman'&&r.floor===1006&&r.hometown===0);
assert.ok(bank);
const allowed=canInteractWithNpc(bank,{floor:1006,x:18,y:29,facingCell:[1006,18,30]},{interactionRule:'NPC_Util_charIsInFrontOfChar distance=1'});
assert.equal(allowed.ok,true);
assert.equal(allowed.interactable,true);
assert.equal(allowed.distance,1);
assert.equal(allowed.facingRequired,true);

const wrongFacing=canInteractWithNpc(bank,{floor:1006,x:18,y:29,facingCell:[1006,17,29]},{interactionRule:'NPC_Util_charIsInFrontOfChar distance=1'});
assert.equal(wrongFacing.interactable,false);
assert.equal(wrongFacing.reason,'npc-not-in-facing-cell');

const far=canInteractWithNpc(bank,{floor:1006,x:18,y:28,facingCell:[1006,18,29]},{interactionRule:'NPC_Util_charIsInFrontOfChar distance=1'});
assert.equal(far.interactable,false);
assert.equal(far.reason,'out-of-range');

const request=buildInteractionRequest(bank,{floor:1006,x:18,y:29,facingCell:[1006,18,y=30]},{interactionRule:'NPC_Util_charIsInFrontOfChar distance=1',action:'talk'});
assert.equal(request.ok,true);
assert.equal(request.interactable,true);
assert.equal(request.request.template,'bankman');
assert.equal(request.request.action,'talk');

console.log(JSON.stringify({
  pass:true,
  format:NPC_INTERACTION_RUNTIME_FORMAT,
  unresolvedChangeEventBlocked:true,
  resolvedBankmanFacingGate:true,
  wrongFacingBlocked:true,
  outOfRangeBlocked:true,
  requestBuilt:true
}));
