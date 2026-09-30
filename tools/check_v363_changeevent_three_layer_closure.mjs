#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
const audit=JSON.parse(fs.readFileSync('data/generated/stoneage_changeevent_module_audit.json','utf8'));
assert.equal(audit.format,'stoneage-changeevent-module-audit-v3');
assert.equal(audit.fixedSource.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(audit.pinnedTemplate.templateName,'changeevent');
assert.equal(audit.pinnedTemplate.functionset,'ExChangeMan');
assert.equal(audit.status,'runtime-module-resolved');
assert.equal(audit.closureClass,'source-resolved-pinned-template-and-module');
console.log(JSON.stringify({pass:true,supersededBy:'V3.64',sourceBacked:true,template:'changeevent',functionset:'ExChangeMan'}));
