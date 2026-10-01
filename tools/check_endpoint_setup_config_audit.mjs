#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const ROOT=process.cwd();
const ENDPOINT=path.join(ROOT,'ro0000/server/merged-source/gmsv/setup.cf');
const FIXED_ROOT=path.resolve(process.env.FIXED_C_SOURCE_DIR??'fixed-c-source');
const FIXED=path.join(FIXED_ROOT,'gmsv/setup.cf');
const OUT=path.join(ROOT,'data/generated/stoneage_endpoint_setup_config_audit.json');

const keys=['CHARTRANS','PETTRANS','REVLEVEL','MAXLEVEL','LEVEL','battleexp','TRANS','LV','NPRIDE','PET1','PET2','PET3','PET4','PETLV','GOLD',...Array.from({length:15},(_,i)=>'ITEM'+(i+1)),'mapdir','maptilefile','battlemapfile','itemset6file','itemset5file','itemset4file','itemset3file','invinciblefile','appearpositionfile','titlenamefile','titleconfigfile','encountfile','enemyfile','enemybasefile','groupfile','magicfile','attmagicfile','petskillfile2','itematomfile','effectfile','quizfile','npcdir','profession','itemquitparty','EXPSHARE'];
function fail(m){throw new Error(m);}
function parse(file){
 if(!fs.existsSync(file)) fail('Missing setup file: '+file);
 const map=new Map();
 for(const raw of fs.readFileSync(file,'utf8').split(/\r?\n/)){
  const line=raw.trim(); if(!line||line.startsWith('#')||!line.includes('=')) continue;
  const i=line.indexOf('='); const k=line.slice(0,i).trim(); const v=line.slice(i+1).trim();
  if(/^[A-Za-z0-9_]+$/.test(k)&&!map.has(k)) map.set(k,v);
 }
 return map;
}
function sha(rel){try{return execFileSync('git',['rev-parse','HEAD:'+rel],{cwd:ROOT,encoding:'utf8'}).trim();}catch{return'unknown';}}
const E=parse(ENDPOINT),F=parse(FIXED);
const rows=keys.map(key=>({key,endpoint:E.has(key)?E.get(key):null,fixed:F.has(key)?F.get(key):null,status:E.has(key)&&F.has(key)?(E.get(key)===F.get(key)?'same':'changed'):E.has(key)?'endpoint-only': 'fixed-only'}));
const changed=rows.filter(r=>r.status!=='same');
const endpointItems=rows.filter(r=>/^ITEM\d+$/.test(r.key)&&r.endpoint);
const result={format:'stoneage-endpoint-setup-config-audit-v1',source:{endpointPath:'ro0000/server/merged-source/gmsv/setup.cf',endpointBlobSha:sha('ro0000/server/merged-source/gmsv/setup.cf'),fixedSource:'gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',fixedPath:'gmsv/setup.cf',fixedBlobSha:process.env.FIXED_SETUP_BLOB_SHA??'unknown'},selectedKeys:rows,summary:{selectedKeyCount:rows.length,changedCount:changed.length,endpointConfiguredItemCount:endpointItems.length,endpointConfiguredItems:endpointItems.map(r=>({key:r.key,value:r.endpoint}))},safety:{sensitiveKeysExcluded:true,excluded:'passwords, addresses, ports, account/server credentials',numericMissingValuesAreNotInterpretedAsZero:true},interpretation:{endpointConfigIsPrimaryDeploymentConfig:true,fixedCIsSemanticBaseline:true,configMismatchIsVariantUntilRuntimeClosure:true,noRemapFromConfigAlone:true}};
const text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check')){if(!fs.existsSync(OUT))fail('Missing endpoint setup audit.');if(fs.readFileSync(OUT,'utf8')!==text)fail('Endpoint setup audit is stale.');process.stdout.write('endpoint-setup-config-audit-check-ok\n');}
else if(process.argv.includes('--write')){fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,text);process.stdout.write(text);}
else process.stdout.write(text);