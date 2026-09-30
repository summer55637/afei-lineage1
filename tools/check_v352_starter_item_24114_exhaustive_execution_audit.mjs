#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const audit=JSON.parse(fs.readFileSync('data/generated/stoneage_starter_item_24114_source_audit.json','utf8'));
const catalog=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
assert.equal(audit.format,'stoneage-starter-item-24114-source-audit-v3');
assert.equal(audit.exhaustiveExecutionAudit.closedByV352,true);
assert.deepEqual(audit.exhaustiveExecutionAudit.itemDataFilesInPinnedTree,['gmsv/data/itemset6.txt','gmsv/data/itemset6.txt.bak']);
assert.equal(audit.exhaustiveExecutionAudit.selectedRuntimeItemFile,'gmsv/data/itemset6.txt');
assert.equal(audit.exhaustiveExecutionAudit.generatedCatalogCrossCheck.catalogSourceBlobSha,'eac985796b59286c547db2abce7b3d604a5e6226');
assert.equal(audit.exhaustiveExecutionAudit.generatedCatalogCrossCheck.templateCount,10737);
assert.equal(catalog.stats.templates,10737);
assert.equal(catalog.byItemId['11817'].b[0],0);
assert.equal(catalog.byItemId['11817'].b[1],11817);
assert.equal(catalog.byItemId['11817'].b[2],1);
assert.equal(catalog.byItemId['11817'].b[3],24114);
assert.equal(catalog.byItemId['24114'],undefined);
assert.equal(audit.requestedIdEvidence.selectedFileToken17ExactMatches,0);
assert.equal(audit.requestedIdEvidence.selectedFileToken18ExactMatches,1);
assert.equal(audit.resolution.configuredIdDirectTemplateResolved,false);
assert.equal(audit.resolution.allocatorExecutableForConfiguredId,false);
assert.equal(audit.exhaustiveExecutionAudit.effectiveResult.includes('ITEM_makeItemAndRegist(24114)'),true);
assert.equal(audit.exhaustiveExecutionAudit.effectiveResult.includes('no second loaded item-data file'),true);
console.log(JSON.stringify({pass:true,format:audit.format,configuredItemId:24114,effectiveSourceItemId:11817,imageNumber:24114,catalogHas11817:true,catalogHas24114:false,failClosed:true}));
