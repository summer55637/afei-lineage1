#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const ROOT=process.cwd();
const OUT=path.join(ROOT,'data/generated/stoneage_endpoint_completeness_audit.json');
const KEY=[
 ['vm-setup-guide','ro0000/docs/搭建教程.txt','vm-one-click'],
 ['vm-build-guide','ro0000/docs/隐盟文本教程.txt','vm-one-click'],
 ['database','ro0000/server/database/175sa.sql','vm-one-click'],
 ['android','ro0000/client/android/冰河石器-隐盟.apk','vm-one-click'],
 ['setup','ro0000/server/merged-source/gmsv/setup.cf','vm-one-click'],
 ['server-binary','ro0000/server/merged-source/gmsv/gmsvjt','vm-one-click'],
 ['item-table','ro0000/server/merged-source/gmsv/data/itemset6.csv','vm-one-click'],
 ['encounter','ro0000/server/merged-source/gmsv/data/encount.txt','vm-one-click'],
 ['group','ro0000/server/merged-source/gmsv/data/group1.txt','vm-one-click'],
 ['enemy','ro0000/server/merged-source/gmsv/data/enemy1.txt','vm-one-click'],
 ['enemybase','ro0000/server/merged-source/gmsv/data/enemybase1.txt','vm-one-click'],
 ['mapwarp','ro0000/server/merged-source/gmsv/data/map/mapwarp.txt','vm-one-click']
];
function git(args){return execFileSync('git',['-c','core.quotePath=false',...args],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024}).trimEnd();}
const rows=git(['ls-tree','-r','-l','HEAD','--','ro0000']).split('\n').filter(Boolean).map(line=>{const m=line.match(/^\d+\s+blob\s+([0-9a-f]+)\s+(\d+)\t(.+)$/);if(!m)throw new Error('Cannot parse git tree line: '+line);return {sha:m[1],size:Number(m[2]),path:m[3]};});
const byPath=new Map(rows.map(x=>[x.path,x]));
const artifacts=KEY.map(([id,p,prov])=>({id,path:p,sha:byPath.get(p)?.sha??null,size:byPath.get(p)?.size??null,provenance:prov,present:byPath.has(p)}));
const merged=rows.filter(x=>x.path.startsWith('ro0000/server/merged-source/'));
const top={};for(const x of merged){const t=x.path.slice('ro0000/server/merged-source/'.length).split('/')[0];top[t]=(top[t]??0)+1;}
const catalogFile='data/generated/stoneage_endpoint_source_catalog.json';
const catalogExists=fs.existsSync(path.join(ROOT,catalogFile));
const result={format:'stoneage-endpoint-completeness-audit-v1',updated:new Date().toISOString().slice(0,10),source:{root:'ro0000/',description:'目前最完整、最接近可直接架設版本的實機／部署資料 snapshot'},status:{snapshotStructure:artifacts.every(x=>x.present)?'complete-for-defined-key-artifacts':'missing-key-artifact',keyArtifactCoverage:artifacts.filter(x=>x.present).length+'/'+artifacts.length,runtimeBehavior:'not-yet-complete',playablePromotion:'blocked-until-runtime-closure'},corpus:{endpointCatalogFile:catalogFile,endpointCatalogPresent:catalogExists,ro0000TrackedBlobs:rows.length,ro0000TrackedBytes:rows.reduce((a,x)=>a+x.size,0)},keyArtifacts:artifacts,mergedSourceTop:top,semanticGaps:['Endpoint LS2MAP / connected-component re-audit for reopened 4000→200 and 3000→200 landing blockers.','Endpoint Item loader / ITEM1=32003 semantics.','Endpoint Encounter→Group unresolved active IDs.','Endpoint GMQUE RANDGMQUE / QUEPART and reward-pet closure.','Persistent State final long-run field coverage.']};
const text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check')){if(!fs.existsSync(OUT))throw new Error('Missing completeness audit');if(fs.readFileSync(OUT,'utf8')!==text)throw new Error('Endpoint completeness audit is stale.');process.stdout.write('endpoint-completeness-audit-check-ok\n');}else if(process.argv.includes('--write')){fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,text);process.stdout.write(text);}else process.stdout.write(text);