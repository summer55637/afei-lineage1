#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const fail = message => { console.error(`V3.10 encounter source closure FAILED: ${message}`); process.exit(1); };

const runtime = JSON.parse(read('data/generated/stoneage_general_encounter_runtime.json'));
const ledger = JSON.parse(read('data/generated/stoneage_general_encounter_source_closure.json'));
const fixed = ledger.fixedSource ?? {};
if (fixed.repository !== 'gavinlinasd/StoneAge') fail('fixed repository drifted');
if (fixed.ref !== '1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56') fail('fixed ref drifted');
for (const p of ['gmsv/data/group1.txt','gmsv/data/enemy1.txt','gmsv/data/enemybase1.txt']) {
  if (!fixed.requiredTables?.includes(p)) fail(`required source table missing from ledger: ${p}`);
}

const meta = runtime._meta ?? {};
const unresolved = [...new Set((meta.unresolvedGroupIds ?? []).map(Number))].sort((a,b)=>a-b);
const ledgerIds = [...new Set((ledger.unresolvedGroupIds ?? []).map(Number))].sort((a,b)=>a-b);
if (JSON.stringify(unresolved) !== JSON.stringify(ledgerIds)) fail('ledger unresolved group IDs no longer match generated runtime');
if (meta.resolvedGroupIds !== 705) fail(`expected fixed checkpoint resolvedGroupIds=705, got ${meta.resolvedGroupIds}`);
if (meta.referencedGroupIds !== 728) fail(`expected fixed checkpoint referencedGroupIds=728, got ${meta.referencedGroupIds}`);

const impact = Object.values(ledger.impactedReferences ?? {}).flat();
const actualImpact = {};
for (const floor of Object.values(runtime.floors ?? {})) {
  for (const encounter of floor.encounters ?? []) {
    for (const group of encounter.groups ?? []) {
      const id = Number(group.groupId);
      if (!unresolved.includes(id)) continue;
      (actualImpact[id] ??= []).push({floorId: floor.floorId, encounterId: encounter.encounterId, weight: group.weight});
    }
  }
}
for (const id of unresolved) {
  const a = JSON.stringify((actualImpact[id] ?? []).sort((x,y)=>String(x.floorId).localeCompare(String(y.floorId))||Number(x.encounterId)-Number(y.encounterId)));
  const b = JSON.stringify((ledger.impactedReferences?.[id] ?? []).sort((x,y)=>String(x.floorId).localeCompare(String(y.floorId))||Number(x.encounterId)-Number(y.encounterId)));
  if (a !== b) fail(`impacted references drifted for group ${id}`);
}

const invalid = meta.invalidTemplateMembers ?? [];
const expectedInvalid = ledger.invalidTemplateMembers ?? [];
if (JSON.stringify(invalid) !== JSON.stringify(expectedInvalid)) fail('invalidTemplateMembers drifted from ledger');
if (!invalid.some(x=>Number(x.groupId)===1297 && Number(x.enemyId)===2455 && Number(x.tempNo)===145 && x.reason==='enemybase1-missing-temp')) {
  fail('Group 1297 / EnemyID 2455 / TempNo 145 blocker disappeared or changed unexpectedly');
}
if (ledger.closurePolicy?.unresolvedGroupsRemainNonSpawnable !== true) fail('unresolved group policy must stay non-spawnable');
if (ledger.closurePolicy?.invalidTemplateMembersRemainNonSpawnable !== true) fail('invalid template policy must stay non-spawnable');
if (ledger.closurePolicy?.noCrossVersionFallback !== true) fail('cross-version fallback guard missing');
if (ledger.closurePolicy?.candidateSourcesRequirePinnedProvenance !== true) fail('candidate provenance guard missing');

const candidateRoots = ledger.candidateSearchRoots ?? [];
const found = [];
for (const rel of candidateRoots) {
  const abs = path.join(root,rel);
  if (!fs.existsSync(abs)) continue;
  const st = fs.statSync(abs);
  if (st.isDirectory()) found.push(rel);
}

const readme = read('README.md');
const changelog = read('CHANGELOG.md');
if (!readme.includes('encounter source closure')) fail('README missing encounter source closure note');
if (!changelog.includes('GMQUE') || !changelog.includes('encounter')) fail('CHANGELOG missing current source-closure context');

console.log(JSON.stringify({
  pass:true,
  version:'V3.10-groundwork',
  focus:'encounter source closure',
  referencedGroupCount:meta.referencedGroupIds,
  resolvedGroupCount:meta.resolvedGroupIds,
  unresolvedGroupCount:unresolved.length,
  unresolvedGroupIds:unresolved,
  invalidTemplateMembers:invalid,
  candidateRootsPresent:found,
  playableCore:'V3.09'
}));
