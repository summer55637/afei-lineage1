#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const audit=JSON.parse(fs.readFileSync('data/generated/stoneage_starter_item_24114_build_closure_audit.json','utf8'));
assert.equal(audit.fixedSource.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(audit.configuredItem.itemId,24114);
assert.equal(audit.itemSource.maxSourceItemId,23009);
assert.equal(audit.itemSource.derivedItemTableLength,23010);
assert.equal(audit.itemSource.configuredIdWithinTable,false);
assert.equal(24114 >= audit.itemSource.derivedItemTableLength,true);
assert.equal(audit.buildDefinition.serverMakefile.definesInjectedByCflags,false);
assert.equal(audit.buildDefinition.itemMakefile.definesInjectedByCflags,false);
assert.equal(audit.buildDefinition.versionHeader.improveItemTableDefined,false);
assert.equal(audit.loader.parser.idTokenIndexOneBased,17);
assert.equal(audit.loader.parser.tableLengthRule,'ITEM_tblen=maxid+1');
assert.equal(audit.exactRow.sourceItemId,11817);
assert.equal(audit.exactRow.imageNumber,24114);
assert.equal(audit.generatedCatalog.templateCount,10737);
assert.equal(audit.generatedCatalog.sourceItemId11817Present,true);
assert.equal(audit.generatedCatalog.sourceItemId11817ImageNumber,24114);
assert.equal(audit.generatedCatalog.configuredItemId24114Present,false);
assert.equal(audit.resolution.outOfRangeAtLookup,true);
assert.equal(audit.resolution.productionStarterGrantAllowed,false);
assert.equal(audit.transformAndMigration.repositoryBuildDoesNotInjectImproveMacro,true);
assert.equal(audit.transformAndMigration.separateSourceIdMigrationFound,false);
assert.equal(audit.transformAndMigration.saveLoadItemTemplateRemapFound,false);
assert.equal(audit.closure.v353Complete,true);
console.log(JSON.stringify({pass:true,format:audit.format,configuredItemId:24114,maxSourceItemId:23009,itemTableLength:23010,effectiveSourceItemId:11817,imageNumber:24114,failClosed:true}));
