#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const fixture=path.resolve('tools/fixtures/npc-healer/world-index.json');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'afei-v473-healer-'));
const out=path.join(temp,'stoneage_healer_source_catalog.json');

execFileSync(process.execPath,[
  'tools/generate_healer_source_catalog.mjs',
  '--world-index',fixture,
  '--out',out
],{stdio:'inherit'});

const catalog=JSON.parse(fs.readFileSync(out,'utf8'));
assert.equal(catalog.format,'stoneage-healer-source-catalog-v1');
assert.deepEqual(catalog.fixedSource,{
  repository:'gavinlinasd/StoneAge',
  ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'
});
assert.equal(catalog.selection.templateName,'npcgen_healer');
assert.equal(catalog.selection.functionSet,'Healer');
assert.equal(catalog.statistics.healerCreateCount,1);
assert.equal(catalog.statistics.exactPointCount,1);
assert.equal(catalog.statistics.uniqueFloorCount,1);
assert.deepEqual(catalog.instances[0].exactPoint,{x:10,y:10});
assert.equal(catalog.instances[0].floorId,1000);
assert.equal(catalog.instances[0].sourcePath,'fixture/healer.create');
assert.equal(catalog.instances[0].createBlockIndex,0);
assert.ok(catalog.instances[0].createBlobSha);
assert.equal(catalog.floors[0].floorId,1000);

const actualPath=path.resolve('data/generated/stoneage_healer_source_catalog.json');
const actualExists=fs.existsSync(actualPath);
let actualSummary=null;
if(actualExists){
  const actual=JSON.parse(fs.readFileSync(actualPath,'utf8'));
  assert.equal(actual.format,'stoneage-healer-source-catalog-v1');
  assert.deepEqual(actual.fixedSource,catalog.fixedSource);
  assert.ok(Number(actual.statistics.healerCreateCount)>0);
  actualSummary={
    healerCreateCount:actual.statistics.healerCreateCount,
    exactPointCount:actual.statistics.exactPointCount,
    nonPointCount:actual.statistics.nonPointCount,
    uniqueFloorCount:actual.statistics.uniqueFloorCount
  };
}

fs.rmSync(temp,{recursive:true,force:true});
console.log(JSON.stringify({
  pass:true,
  format:catalog.format,
  fixture:{
    healerCreateCount:catalog.statistics.healerCreateCount,
    exactPointCount:catalog.statistics.exactPointCount,
    floorId:catalog.instances[0].floorId,
    exactPoint:catalog.instances[0].exactPoint
  },
  actualGeneratedCatalog:actualSummary
},null,2));
