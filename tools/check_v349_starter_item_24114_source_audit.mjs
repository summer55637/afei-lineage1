#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const audit=JSON.parse(fs.readFileSync('data/generated/stoneage_starter_item_24114_source_audit.json','utf8'));
assert.equal(audit.fixedSource.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(audit.requestedItem.itemId,24114);
assert.equal(audit.compileFlags.itemset6Txt,true);
assert.equal(audit.sourceFiles.itemset6.sizeBytes,0);
assert.equal(audit.resolution.sourceTemplateResolved,false);
assert.equal(audit.resolution.allocatorPathResolved,false);
assert.equal(audit.resolution.syntheticTemplateAllowed,false);
assert.match(audit.evidence.selectedItemFile,/itemset6\.txt/);
assert.match(audit.evidence.itemLoader,/maxid <= 0/);
assert.match(audit.evidence.itemMaker,/ITEM_tbl\[24114\]\.itm/);
console.log(JSON.stringify({pass:true,format:'stoneage-starter-item-24114-source-audit-regression-v1',itemId:24114,itemFile:'gmsv/data/itemset6.txt',itemFileBytes:0,templateResolved:false,allocatorPromoted:false,failClosed:true}));
