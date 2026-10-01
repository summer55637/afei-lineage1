#!/usr/bin/env node
import fs from 'node:fs';
const file='data/generated/stoneage_endpoint_completeness_audit.json';
const a=JSON.parse(fs.readFileSync(file,'utf8'));
if(a.status?.snapshotStructure!=='complete-for-defined-key-artifacts') throw new Error('Unexpected endpoint snapshot status');
if(a.status?.keyArtifactCoverage!=='12/12') throw new Error('Key artifact coverage changed unexpectedly');
if(a.keyArtifacts?.length!==12 || a.keyArtifacts.some(x=>x.present!==true)) throw new Error('Endpoint key artifact presence invariant failed');
if(a.corpus?.endpointCatalogFiles!==8749) throw new Error('Endpoint catalog file count drifted');
if(a.corpus?.endpointCatalogBytes!==185166100) throw new Error('Endpoint catalog byte count drifted');
if(a.mergedSourceTop?.gmsv!==8348 || a.mergedSourceTop?.www!==362 || a.mergedSourceTop?.wwwroot!==22 || a.mergedSourceTop?.saac!==13) throw new Error('Merged-source distribution drifted');
process.stdout.write('endpoint-completeness-audit-check-ok\n');