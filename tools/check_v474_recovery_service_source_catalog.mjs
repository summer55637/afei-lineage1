#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const fixture=path.resolve('tools/fixtures/npc-healer/world-index.json');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'afei-v474-recovery-'));
const out=path.join(temp,'stoneage_recovery_service_source_catalog.json');

execFileSync(process.execPath,[
  'tools/generate_recovery_service_source_catalog.mjs',
  '--world-index',fixture,
  '--out',out
],{stdio:'inherit'});

const catalog=JSON.parse(fs.readFileSync(out,'utf8'));
assert.equal(catalog.format,'stoneage-recovery-service-source-catalog-v1');
assert.deepEqual(catalog.fixedSource,{
  repository:'gavinlinasd/StoneAge',
  ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56'
});
assert.ok(catalog.serviceProfiles.healer);
assert.equal(catalog.instances.length,1);
assert.equal(catalog.instances[0].service,'healer');
assert.equal(catalog.instances[0].execution,'direct_full_recovery');
assert.equal(catalog.instances[0].routeEligible,true);
assert.deepEqual(catalog.instances[0].exactPoint,{x:10,y:10});

const actualPath=path.resolve('data/generated/stoneage_recovery_service_source_catalog.json');
let actualSummary=null;
if(fs.existsSync(actualPath)){
  const actual=JSON.parse(fs.readFileSync(actualPath,'utf8'));
  assert.equal(actual.format,catalog.format);
  assert.deepEqual(actual.fixedSource,catalog.fixedSource);
  assert.ok(actual.statistics.totalInstances>0);
  for(const key of ['healer','windowhealer','fmhealer']){
    assert.ok(actual.statistics[key]);
  }
  actualSummary={
    totalInstances:actual.statistics.totalInstances,
    healer:actual.statistics.healer,
    windowhealer:actual.statistics.windowhealer,
    fmhealer:actual.statistics.fmhealer
  };
}

fs.rmSync(temp,{recursive:true,force:true});
console.log(JSON.stringify({
  pass:true,
  format:catalog.format,
  fixture:{
    service:catalog.instances[0].service,
    exactPoint:catalog.instances[0].exactPoint,
    routeEligible:catalog.instances[0].routeEligible
  },
  actualGeneratedCatalog:actualSummary
},null,2));
