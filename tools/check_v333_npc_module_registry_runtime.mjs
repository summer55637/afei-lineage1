#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { NPC_MODULE_REGISTRY_FORMAT, createAuditedNpcModuleRegistry, resolveAuditedNpcModule } from '../src/stoneage_npc_module_registry_runtime.mjs';
const audit=JSON.parse(fs.readFileSync('data/generated/stoneage_world_npc_functionset_audit.json','utf8'));
assert.equal(NPC_MODULE_REGISTRY_FORMAT,'stoneage-npc-module-registry-v1');
assert.equal(audit.unknown.some(x=>x.name==='changeevent'),false);
assert.ok(audit.sourceFunctionSets.includes('ExChangeMan'));
assert.ok(audit.sourceFunctionSets.includes('Charm'));
assert.equal(audit.statistics.knownFunctionSetCount,55);
const registry=createAuditedNpcModuleRegistry(audit,{modules:{ExChangeMan:{marker:'explicit-module'},changeevent:{marker:'must-not-promote'}}});
assert.equal(registry.ok,true); assert.equal(registry.knownCount,55);
assert.ok(registry.resolved.ExChangeMan); assert.equal(registry.resolved.changeevent,undefined);
assert.equal(registry.unresolved.find(x=>x.requested==='changeevent').status,'not-in-pinned-functionset-registry');
const resolved=resolveAuditedNpcModule(registry,'ExChangeMan'); assert.equal(resolved.ok,true); assert.equal(resolved.resolved,true);
const unresolved=resolveAuditedNpcModule(registry,'changeevent'); assert.equal(unresolved.ok,true); assert.equal(unresolved.resolved,false);
const unknown=resolveAuditedNpcModule(registry,'BrandNew'); assert.equal(unknown.ok,true); assert.equal(unknown.resolved,false);
console.log(JSON.stringify({pass:true,format:NPC_MODULE_REGISTRY_FORMAT,pinnedKnownFunctionSets:55,changeeventNotInKnownRegistry:true,explicitAliasPromotionBlocked:true,ExChangeManResolved:true,changeeventResolved:false}));
