#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const audit=JSON.parse(fs.readFileSync('data/generated/stoneage_changeevent_module_audit.json','utf8'));
const closure=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_event_closure.json','utf8'));

assert.equal(audit.format,'stoneage-changeevent-module-audit-v1');
assert.equal(audit.fixedSource.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(audit.status,'runtime-module-unresolved');
assert.equal(audit.evidence[0].finding,'changeevent is absent');
assert.equal(audit.evidence[1].consequence.includes('cannot become an active NPC instance'),true);
assert.equal(audit.aliasChecks.every(x=>x.status==='not-promoted'),true);
assert.equal(audit.target.affectedNewPlayerInstances,4);
assert.equal(closure.owner.templateName,'changeevent');
assert.equal(closure.owner.runtimeModuleStatus,'unresolved_in_pinned_npctemplate_functionSet');
assert.equal(closure.moduleSource.changeeventPresent,false);
assert.equal(closure.semantics.rewardMutationChainClosed,true);

console.log(JSON.stringify({pass:true,format:audit.format,target:audit.target.templateName,newPlayerInstances:audit.target.affectedNewPlayerInstances,runtimeModule:'unresolved',aliasPromotion:false,rewardMutationChainClosed:true}));
