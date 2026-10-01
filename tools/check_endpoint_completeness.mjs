#!/usr/bin/env node
import fs from 'node:fs';

const auditPath='data/generated/stoneage_endpoint_completeness_audit.json';
const catalogPath='data/generated/stoneage_endpoint_source_catalog.json';
const a=JSON.parse(fs.readFileSync(auditPath,'utf8'));
const c=JSON.parse(fs.readFileSync(catalogPath,'utf8'));

if(a.format!=='stoneage-endpoint-completeness-audit-v1') throw new Error('Unexpected endpoint completeness format');
if(a.status?.snapshotStructure!=='complete-for-defined-key-artifacts') throw new Error('Unexpected endpoint snapshot status');
if(a.status?.keyArtifactCoverage!=='12/12') throw new Error('Key artifact coverage changed unexpectedly');
if(a.keyArtifacts?.length!==12 || a.keyArtifacts.some(x=>x.present!==true)) throw new Error('Endpoint key artifact presence invariant failed');

const sourceCorpus=c.sourceCorpus;
if(!sourceCorpus || sourceCorpus.fileCount!==8749) throw new Error('Endpoint source catalog file count drifted');
if(sourceCorpus.totalBytes!==185166100) throw new Error('Endpoint source catalog byte count drifted');
if(a.corpus?.ro0000TrackedBlobs!==8751) throw new Error('ro0000 tracked blob count drifted');
if(a.corpus?.ro0000TrackedBytes!==185172647) throw new Error('ro0000 tracked byte count drifted');

if(a.corpus?.endpointCatalogPresent!==true) throw new Error('Endpoint source catalog is missing');
if(!a.keyArtifacts.some(x=>x.id==='setup'&&x.path.endsWith('/gmsv/setup.cf')&&x.provenance==='vm-one-click')) throw new Error('Setup key artifact binding drifted');
if(!a.keyArtifacts.some(x=>x.id==='item-table'&&x.path.endsWith('/gmsv/data/itemset6.csv')&&x.provenance==='vm-one-click')) throw new Error('Item table key artifact binding drifted');
if(!a.keyArtifacts.some(x=>x.id==='mapwarp'&&x.path.endsWith('/gmsv/data/map/mapwarp.txt')&&x.provenance==='vm-one-click')) throw new Error('MapWarp key artifact binding drifted');

const top=a.mergedSourceTop||{};
if(top.gmsv!==8348 || top.www!==362 || top.wwwroot!==22 || top.saac!==13) throw new Error('Merged-source distribution drifted');

process.stdout.write('endpoint-completeness-audit-check-ok\n');
