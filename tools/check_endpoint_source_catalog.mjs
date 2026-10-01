#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FILE = path.join(ROOT, 'data', 'generated', 'stoneage_endpoint_source_catalog.json');

function fail(message) {
  throw new Error(message);
}

if (!fs.existsSync(FILE)) fail('Missing endpoint source catalog.');
const catalog = JSON.parse(fs.readFileSync(FILE, 'utf8'));

if (catalog.format !== 'stoneage-endpoint-source-catalog-v1') fail('Unexpected catalog format.');
if (!Array.isArray(catalog.exactManualExternalRules)) fail('Manual provenance rules missing.');

const expectedManual = [
  'ro0000/server/merged-source/wwwroot/'
];

if (JSON.stringify(catalog.exactManualExternalRules) !== JSON.stringify(expectedManual)) {
  fail('Manual endpoint rule changed unexpectedly.');
}

const scopes = Array.isArray(catalog.scopes) ? catalog.scopes : [];
const byId = new Map(scopes.map(scope => [scope.id, scope]));

const manualWebroot = byId.get('manual-webroot');
const vmSetupGuide = byId.get('vm-setup-guide');
const vmMerged = byId.get('vm-merged-source');
const vmDatabase = byId.get('vm-database');
const vmClient = byId.get('vm-android-client');
const vmGuide = byId.get('vm-build-guide');

for (const [id, scope] of [
  ['manual-webroot', manualWebroot],
  ['vm-setup-guide', vmSetupGuide],
  ['vm-merged-source', vmMerged],
  ['vm-database', vmDatabase],
  ['vm-android-client', vmClient],
  ['vm-build-guide', vmGuide]
]) {
  if (!scope) fail('Missing required scope: ' + id);
  if (!scope.stats || !Number.isInteger(scope.stats.fileCount) || scope.stats.fileCount < 1) fail('Invalid file count for ' + id);
}

if (manualWebroot.provenance !== 'manual-external-web') fail('wwwroot provenance is not manual.');
if (vmSetupGuide.provenance !== 'vm-one-click') fail('setup guide provenance is not VM one-click.');
for (const scope of [vmMerged, vmDatabase, vmClient, vmGuide]) {
  if (scope.provenance !== 'vm-one-click') fail('VM scope lost vm-one-click provenance: ' + scope.id);
}

const example = catalog.explicitClassificationExample;
if (!example || example.path !== 'ro0000/server/merged-source/www/wwwroot/' || example.provenance !== 'vm-one-click') {
  fail('www/wwwroot explicit VM classification is missing.');
}

const manualStats = catalog.sourceCorpus.byProvenance?.manualExternalWeb;
const vmStats = catalog.sourceCorpus.byProvenance?.vmOneClick;
if (!manualStats || !vmStats) fail('Aggregated provenance stats missing.');

const scopeManual = manualWebroot.stats.fileCount;
const scopeVm = vmMerged.stats.fileCount + vmDatabase.stats.fileCount + vmClient.stats.fileCount + vmGuide.stats.fileCount + vmSetupGuide.stats.fileCount;

if (manualStats.fileCount !== scopeManual) fail('Manual aggregate does not match scope totals.');
if (vmStats.fileCount !== scopeVm) fail('VM aggregate does not match scope totals.');
if (catalog.sourceCorpus.fileCount !== manualStats.fileCount + vmStats.fileCount) fail('Total corpus file count mismatch.');
if (manualStats.fileCount >= vmStats.fileCount) fail('Expected VM corpus to contain more source files than manual web corpus.');

process.stdout.write('endpoint-source-catalog-invariant-check-ok\n');
