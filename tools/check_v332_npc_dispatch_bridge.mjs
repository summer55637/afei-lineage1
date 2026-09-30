#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { NPC_DISPATCH_RUNTIME_FORMAT, resolveInteractionModule, dispatchNpcInteraction } from '../src/stoneage_npc_dispatch_runtime.mjs';

const reachability=JSON.parse(fs.readFileSync('data/generated/stoneage_start_npc_reachability.json','utf8'));
const closure=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_event_closure.json','utf8'));
const itemRewardCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_item_reward_runtime.json','utf8'));
const itemMakeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const petCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_pet_runtime.json','utf8'));
const { createFirstRouteRewardHandlers }=await import('../src/stoneage_first_route_reward_handlers.mjs');
const { createAuditedNpcModuleRegistry }=await import('../src/stoneage_npc_module_registry_runtime.mjs');
const audit=JSON.parse(fs.readFileSync('data/generated/stoneage_world_npc_functionset_audit.json','utf8'));

assert.equal(NPC_DISPATCH_RUNTIME_FORMAT,'stoneage-npc-dispatch-runtime-v1');
const changeevent=reachability.rows.find(r=>r.template==='changeevent'&&r.hometown===0);
assert.ok(changeevent);
const registry=createAuditedNpcModuleRegistry(audit,{modules:{ExChangeMan:{marker:'audited'}}});
assert.equal(registry.ok,true);
const resolvedAbsent=resolveInteractionModule(changeevent,{moduleRegistry:registry});
assert.equal(resolvedAbsent.ok,true);
assert.equal(resolvedAbsent.resolved,false);
assert.equal(resolvedAbsent.reason,'npc-runtime-module-unresolved');
const auditedResolved=resolveInteractionModule({templateName:'ExChangeMan'},{moduleRegistry:registry});
assert.equal(auditedResolved.ok,true);
assert.equal(auditedResolved.resolved,true);

const state=freshPersistentState({playerId:'dispatch'});
const blocked=await dispatchNpcInteraction(state,changeevent,{floor:1006,x:15,y:21,facingCell:[1006,15,22]},{
  interactionRule:'unresolved: template name absent from pinned npctemplate.c functionSet[]'
});
assert.equal(blocked.ok,true);
assert.equal(blocked.handled,false);
assert.equal(blocked.stage,'interaction-gate');
assert.equal(blocked.reason,'npc-runtime-module-unresolved');

const bank=reachability.rows.find(r=>r.template==='bankman'&&r.hometown===0);
assert.ok(bank);
const bankMissingModule=await dispatchNpcInteraction(state,bank,{floor:1006,x:18,y:29,facingCell:[1006,18,30]},{
  interactionRule:'NPC_Util_charIsInFrontOfChar distance=1'
});
assert.equal(bankMissingModule.ok,true);
assert.equal(bankMissingModule.handled,false);
assert.equal(bankMissingModule.stage,'module-resolution');

const playerState=freshPersistentState({playerId:'dispatch-exec'});
playerState.player.level=1;
playerState.player.transmigration=0;
const bundle=createFirstRouteRewardHandlers({
  itemRewardCatalog,
  itemMakeCatalog,
  petCatalog,
  petIdFactory:(st,created)=>'pet-'+created.petId,
  itemCapacity:1000,
  itemCursor:500,
  randInclusive:(a,b)=>a===b?a:0
});
const syntheticNpc={templateName:'synthetic-event',floor:1006,npc:[15,22],path:'synthetic.create',blockIndex:0};
const syntheticPlayer={floor:1006,x:15,y:21,facingCell:[1006,15,22]};
const syntheticModule={script:closure.script};
const executed=await dispatchNpcInteraction(playerState,syntheticNpc,syntheticPlayer,{
  interactionRule:'NPC_Util_charIsInFrontOfChar distance=1',
  modules:{'synthetic-event':syntheticModule},
  handlerFactory:()=>bundle.handlers,
  transactionId:'dispatch-exec-1',
  now:()=> '2026-09-30T09:00:00.000Z'
});
assert.equal(executed.ok,true);
assert.equal(executed.handled,true);
assert.equal(executed.execution.applied,true);
assert.equal(executed.state.revision,1);
assert.equal(executed.state.inventory.itemRuntime.slots['500'].itemId,20145);
assert.equal(executed.state.pets.petBox[0].petId,274);

console.log(JSON.stringify({
  pass:true,
  format:NPC_DISPATCH_RUNTIME_FORMAT,
  unresolvedChangeeventBlocked:true,
  resolvedModuleStillExplicit:true,
  syntheticDispatchExecutes:true,
  savedRevision:executed.state.revision,
  savedItem:20145,
  savedPetTempNo:274
}));
