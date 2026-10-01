#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const RO = 'ro0000';
const GMSV = path.join(ROOT, RO, 'server', 'merged-source', 'gmsv');

function git(args) {
  return execFileSync('git', ['-c', 'core.quotePath=false', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  }).trimEnd();
}
function assert(ok, msg) { if (!ok) throw new Error(msg); }

const raw = git(['ls-tree', '-r', '-l', 'HEAD', '--', RO]);
const nodes = raw ? raw.split('\n').filter(Boolean).map(line => {
  const m = line.match(/^(\d+)\s+(blob|tree)\s+([0-9a-f]+)(?:\s+(\d+))?\t(.+)$/);
  if (!m) throw new Error('Cannot parse git tree line: ' + line);
  return { mode:m[1], type:m[2], sha:m[3], size:m[4] == null ? null : Number(m[4]), path:m[5] };
}) : [];
const files = nodes.filter(x => x.type === 'blob');
const dirs = new Set();
for (const node of nodes) {
  const parts = node.path.split('/');
  for (let i = 1; i < parts.length; i++) {
    dirs.add(parts.slice(0, i).join('/'));
  }
}
const fileByPath = new Map(files.map(x => [x.path, x]));
const ro0000TreeSha = git(['rev-parse', 'HEAD:' + RO]);

assert(fileByPath.has('ro0000/README.md'), 'missing ro0000/README.md');
assert(fileByPath.has('ro0000/SOURCE_PROVENANCE.md'), 'missing ro0000/SOURCE_PROVENANCE.md');

for (const p of [
  'ro0000/server/merged-source/gmsv',
  'ro0000/server/merged-source/gmsv/data',
  'ro0000/server/merged-source/gmsv/hydata/data',
  'ro0000/server/merged-source/wwwroot',
  'ro0000/server/merged-source/www/wwwroot',
  'ro0000/server/database',
  'ro0000/client/android',
  'ro0000/docs'
]) assert(dirs.has(p), 'missing required directory: ' + p);

const required = [
  'ro0000/server/merged-source/gmsv/setup.cf',
  'ro0000/server/merged-source/gmsv/data/itemset6.csv',
  'ro0000/server/merged-source/gmsv/data/encount.txt',
  'ro0000/server/merged-source/gmsv/data/group1.txt',
  'ro0000/server/merged-source/gmsv/data/enemy1.txt',
  'ro0000/server/merged-source/gmsv/data/enemybase1.txt',
  'ro0000/server/merged-source/gmsv/data/map/mapwarp.txt',
  'ro0000/server/merged-source/gmsv/gmsvjt',
  'ro0000/server/database/175sa.sql',
  'ro0000/client/android/冰河石器-隐盟.apk',
  'ro0000/docs/搭建教程.txt',
  'ro0000/docs/隐盟文本教程.txt'
];
for (const p of required) {
  assert(fileByPath.has(p), 'missing required file: ' + p);
  assert((fileByPath.get(p).size ?? 0) > 0, 'required file is empty: ' + p);
}

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT,'data/generated/stoneage_endpoint_source_catalog.json'),'utf8'));
const completeness = JSON.parse(fs.readFileSync(path.join(ROOT,'data/generated/stoneage_endpoint_completeness_audit.json'),'utf8'));
const metadata = new Set(['ro0000/README.md','ro0000/SOURCE_PROVENANCE.md']);
const catalogFiles = files.filter(x => !metadata.has(x.path));
const trackedBytes = files.reduce((n,x) => n + (x.size ?? 0), 0);
const catalogBytes = catalogFiles.reduce((n,x) => n + (x.size ?? 0), 0);

assert(catalog.sourceCorpus?.fileCount === catalogFiles.length, 'endpoint source catalog file count drift');
assert(catalog.sourceCorpus?.totalBytes === catalogBytes, 'endpoint source catalog byte count drift');
assert(completeness.corpus?.ro0000TrackedBlobs === files.length, 'endpoint completeness blob count drift');
assert(completeness.corpus?.ro0000TrackedBytes === trackedBytes, 'endpoint completeness byte count drift');

const manualPrefix='ro0000/server/merged-source/wwwroot/';
const nestedPrefix='ro0000/server/merged-source/www/wwwroot/';
const dataPrefix='ro0000/server/merged-source/gmsv/data/';
const hyPrefix='ro0000/server/merged-source/gmsv/hydata/data/';
const manualMap=new Map(files.filter(x=>x.path.startsWith(manualPrefix)).map(x=>[x.path.slice(manualPrefix.length),x]));
const nestedMap=new Map(files.filter(x=>x.path.startsWith(nestedPrefix)).map(x=>[x.path.slice(nestedPrefix.length),x]));
const dataMap=new Map(files.filter(x=>x.path.startsWith(dataPrefix)).map(x=>[x.path.slice(dataPrefix.length),x]));
const hyMap=new Map(files.filter(x=>x.path.startsWith(hyPrefix)).map(x=>[x.path.slice(hyPrefix.length),x]));

let mirrorSame=0, mirrorDifferent=0, dataOnly=0, hyOnly=0;
for(const [rel,x] of dataMap){
  if(!hyMap.has(rel)) dataOnly++;
  else if(x.sha===hyMap.get(rel).sha) mirrorSame++;
  else mirrorDifferent++;
}
for(const rel of hyMap.keys()) if(!dataMap.has(rel)) hyOnly++;

let webSame=0, webDifferent=0, webManualOnly=0, webNestedOnly=0;
const webDifferentPaths=[];
for(const [rel,x] of manualMap){
  if(!nestedMap.has(rel)) webManualOnly++;
  else if(x.sha===nestedMap.get(rel).sha) webSame++;
  else { webDifferent++; webDifferentPaths.push(rel); }
}
for(const rel of nestedMap.keys()) if(!manualMap.has(rel)) webNestedOnly++;

const backupLike=files.filter(x=>/(?:\.bak|\.old|\.new|\.tmp|~|\.arg--|\.create---|\.template--|\.conf1|\.lua--)$/i.test(x.path));
const multipartArg=files.filter(x=>/\.arg[1-9]$/i.test(x.path));
const zeroSize=files.filter(x=>(x.size??0)===0);

const shaGroups=new Map();
for(const x of files){
  if(!x.sha) continue;
  if(!shaGroups.has(x.sha)) shaGroups.set(x.sha,[]);
  shaGroups.get(x.sha).push(x.path);
}
const duplicateGroups=[...shaGroups.values()].filter(v=>v.length>1);
const crossMirrorDuplicateGroups=duplicateGroups.filter(v=>v.some(p=>p.startsWith(dataPrefix))&&v.some(p=>p.startsWith(hyPrefix)));

const setup=fs.readFileSync(path.join(GMSV,'setup.cf'),'utf8');
const treePaths=new Set(nodes.map(x=>x.path));
const setupRefs=[];
for(const line of setup.split(/\r?\n/)){
  if(!line || /^\s*#/.test(line)) continue;
  const m=line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.+)$/);
  if(!m || !/(file|dir|path)$/i.test(m[1])) continue;
  const value=m[2].trim();
  if(!/^(?:\.\/)?data\//.test(value)) continue;
  const clean=value.replace(/^\.\//,'').split(/[,#\s]/)[0];
  if(!clean) continue;
  const p='ro0000/server/merged-source/gmsv/'+clean;
  setupRefs.push({key:m[1],value:clean,kind:fileByPath.has(p)?'file':dirs.has(p)?'directory':'missing'});
}
const setupMissing=setupRefs.filter(x=>x.kind==='missing');

function magic(rel, expected){
  const b=fs.readFileSync(path.join(ROOT,rel));
  return {path:rel,size:b.length,signature:b.subarray(0,expected.length).toString('ascii'),matches:b.subarray(0,expected.length).equals(Buffer.from(expected,'ascii'))};
}
const binaryChecks=[
  magic('ro0000/server/merged-source/gmsv/gmsvjt', '\x7fELF'),
  magic('ro0000/client/android/冰河石器-隐盟.apk', 'PK\x03\x04')
];
assert(binaryChecks.every(x=>x.matches),'binary signature check failed');

const sql=fs.readFileSync(path.join(ROOT,'ro0000/server/database/175sa.sql'),'utf8');
const tables=[...sql.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?[\\`'"]?([A-Za-z0-9_]+)[\\`'"]?/gi)].map(m=>m[1]);
const sqlCheck={
  mysqlDumpHeader:/^-- MySQL dump/m.test(sql),
  createTableStatements:tables.length,
  uniqueCreateTables:new Set(tables).size,
  duplicateCreateTableNames:tables.filter((x,i,a)=>a.indexOf(x)!==i),
  dumpCompletedMarker:/-- Dump completed on /i.test(sql),
  bytes:Buffer.byteLength(sql)
};
assert(sqlCheck.mysqlDumpHeader,'175sa.sql does not look like a MySQL dump');
assert(sqlCheck.createTableStatements>0,'175sa.sql has no CREATE TABLE');
assert(sqlCheck.duplicateCreateTableNames.length===0,'175sa.sql has duplicate CREATE TABLE names');
assert(sqlCheck.dumpCompletedMarker,'175sa.sql missing completed marker');

const mapPrefix='ro0000/server/merged-source/gmsv/data/map/';
const mapFiles=files.filter(x=>x.path.startsWith(mapPrefix)&&!path.posix.basename(x.path).includes('.'));
let ls2map=0, nonLs2map=0; const mapNonMatches=[];
for(const entry of mapFiles){
  const b=fs.readFileSync(path.join(ROOT,entry.path));
  if(b.subarray(0,6).toString('ascii')==='LS2MAP') ls2map++;
  else { nonLs2map++; if(mapNonMatches.length<20) mapNonMatches.push(entry.path); }
}
const signatureCounts=new Map();
for(const entry of mapFiles){
  const b=fs.readFileSync(path.join(ROOT,entry.path));
  const sig=b.subarray(0,6).toString('hex');
  signatureCounts.set(sig,(signatureCounts.get(sig)||0)+1);
}

const coreFiles=[
  'ro0000/server/merged-source/gmsv/data/encount.txt',
  'ro0000/server/merged-source/gmsv/data/group1.txt',
  'ro0000/server/merged-source/gmsv/data/enemy1.txt',
  'ro0000/server/merged-source/gmsv/data/enemybase1.txt',
  'ro0000/server/merged-source/gmsv/data/map/mapwarp.txt'
];
const coreDataChecks=coreFiles.map(rel=>{
  const c=fs.readFileSync(path.join(ROOT,rel),'utf8');
  return {path:rel,bytes:Buffer.byteLength(c),nonEmptyLines:c.split(/\r?\n/).filter(Boolean).length};
});

console.log(JSON.stringify({
  format:'stoneage-ro0000-integrity-audit-v1',
  scope:'ro0000 raw endpoint snapshot; read-only integrity audit',
  ro0000TreeSha,
  totals:{trackedFiles:files.length,trackedBytes,trackedDirectories:dirs.size,catalogDataFiles:catalogFiles.length,catalogDataBytes:catalogBytes},
  requiredArtifactCount:required.length,
  provenance:{manualWebrootFiles:manualMap.size,nestedVmWebrootFiles:nestedMap.size},
  gmsvDataMirror:{dataFiles:dataMap.size,hydataFiles:hyMap.size,sameBlob:mirrorSame,differentBlob:mirrorDifferent,dataOnly,hyOnly},
  webrootMirror:{manualFiles:manualMap.size,nestedVmFiles:nestedMap.size,sameBlob:webSame,differentBlob:webDifferent,manualOnly:webManualOnly,nestedOnly:webNestedOnly,differentPaths:webDifferentPaths},
  rawResidue:{backupLikeFiles:backupLike.length,multipartArgFiles:multipartArg.length,zeroSizeFiles:zeroSize.length,duplicateBlobGroups:duplicateGroups.length,crossGmsvDataHydataDuplicateGroups:crossMirrorDuplicateGroups.length},
  setupDataPathCheck:{references:setupRefs.length,missingCount:setupMissing.length,missing:setupMissing},
  binaryChecks,
  sqlCheck,
  coreDataChecks,
  mapSignatureCheck:{
    candidateFiles:mapFiles.length,
    ls2map,
    nonLs2map,
    commonFirst6Bytes:[...signatureCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([signature,count])=>({signature,count})),
    sampleNonMatches:mapNonMatches
  },
  policy:{
    rawSnapshotMustNotBePhysicallyRearranged:true,
    backupLikeFilesMustNotBeDeletedWithoutProvenanceReview:true,
    gmsvHydataDuplicatesMustNotBeDeletedAsGarbage:true,
    endpointVariantsMustBePreserved:true
  }
},null,2));
