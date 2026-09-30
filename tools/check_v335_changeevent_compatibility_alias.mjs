#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createAuditedNpcModuleRegistry, createCompatibilityNpcModuleRegistry, resolveAuditedNpcModule } from '../src/stoneage_npc_module_registry_runtime.mjs';
const audit=JSON.parse(fs.readFileSync('data/generated/stoneage_world_npc_functionset_audit.json','utf8'));
const compatibility=JSON.parse(fs.readFileSync('data/generated/stoneage_changeevent_compatibility_reference.json','utf8'));
assert.equal(compatibility.pinnedCanonical.status,'source-resolved');
const strict=createAuditedNpcModuleRegistry(audit,{modules:{ExChangeMan:{kind:'module'}}});
const strictChange=resolveAuditedNpcModule(strict,'changeevent');
assert.equal(strictChange.resolved,true); assert.equal(strictChange.sourceBackedTemplate,true); assert.equal(strictChange.compatibilityAlias,false);
const disabled=createCompatibilityNpcModuleRegistry(audit,compatibility,{modules:{ExChangeMan:{kind:'module'}},allowExternalCompatibilityAliases:false});
const disabledChange=resolveAuditedNpcModule(disabled,'changeevent');
assert.equal(disabledChange.resolved,true); assert.equal(disabledChange.sourceBackedTemplate,true); assert.equal(disabledChange.compatibilityAlias,false);
const enabled=createCompatibilityNpcModuleRegistry(audit,compatibility,{modules:{ExChangeMan:{kind:'module'}},allowExternalCompatibilityAliases:true});
const enabledChange=resolveAuditedNpcModule(enabled,'changeevent');
assert.equal(enabledChange.resolved,true); assert.equal(enabledChange.sourceBackedTemplate,true); assert.equal(enabledChange.compatibilityAlias,false); assert.equal(enabledChange.functionset,'ExChangeMan');
console.log(JSON.stringify({pass:true,pinnedSourceResolved:true,compatibilityModeNotRequired:true,sourceBackedPrecedence:true}));
