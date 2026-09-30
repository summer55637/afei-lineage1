#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { NPC_MODULE_REGISTRY_FORMAT, createAuditedNpcModuleRegistry, resolveAuditedNpcModule } from '../src/stoneage_npc_module_registry_runtime.mjs';
const audit=JSON.parse(fs.readFileSync('data/generated/stoneage_world_npc_functionset_audit.json','utf8'));
assert.equal(NPC_MODULE_REGISTRY_FORMAT,'stoneage-npc-module-registry-v1');
assert.equal(audit.sourceTemplateBindings.length,1);
assert.equal(audit.sourceTemplateBindings[0].templateName,'changeevent');
assert.equal(audit.sourceTemplateBindings[0].functionset,'ExChangeMan');
const registry=createAuditedNpcModuleRegistry(audit,{modules:{ExChangeMan:{marker:'explicit-module'}}});
assert.equal(registry.knownCount,55); assert.equal(registry.sourceTemplateCount,1);
const resolved=resolveAuditedNpcModule(registry,'changeevent');
assert.equal(resolved.resolved,true); assert.equal(resolved.functionset,'ExChangeMan'); assert.equal(resolved.sourceBackedTemplate,true); assert.equal(resolved.compatibilityAlias,false);
console.log(JSON.stringify({pass:true,pinnedKnownFunctionSets:55,sourceTemplateBinding:'changeevent -> ExChangeMan',sourceBackedResolution:true}));
