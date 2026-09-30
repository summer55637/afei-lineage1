#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
const audit=JSON.parse(fs.readFileSync('data/generated/stoneage_changeevent_module_audit.json','utf8'));
const closure=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_event_closure.json','utf8'));
assert.equal(audit.format,'stoneage-changeevent-module-audit-v3');
assert.equal(audit.fixedSource.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(audit.status,'runtime-module-resolved');
assert.equal(audit.pinnedTemplate.templateName,'changeevent');
assert.equal(audit.pinnedTemplate.functionset,'ExChangeMan');
assert.equal(closure.owner.runtimeModuleStatus,'resolved_in_pinned_template_functionSet');
assert.equal(closure.moduleSource.functionset,'ExChangeMan');
assert.equal(closure.semantics.runtimeModuleClosed,true);
assert.equal(closure.semantics.rewardMutationChainClosed,true);
console.log(JSON.stringify({pass:true,pinnedTemplate:'changeevent',functionset:'ExChangeMan',runtimeModule:'resolved',rewardMutationChainClosed:true}));
