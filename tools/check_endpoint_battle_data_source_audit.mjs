#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT=process.cwd();
const FIXED_ROOT=path.join(ROOT,process.env.FIXED_C_SOURCE_DIR??'fixed-c-source');
const OUT=path.join(ROOT,'data/generated/stoneage_endpoint_battle_data_source_audit.json');
const FILES={encount:['ro0000/server/merged-source/gmsv/data/encount.txt','gmsv/data/encount.txt','89da97a15ea866a36f26ec3bb7ab5490f3eccc5f'],group:['ro0000/server/merged-source/gmsv/data/group1.txt','gmsv/data/group1.txt','1be75eb3e56ab16d4b433146ec59538ad651c874'],enemy:['ro0000/server/merged-source/gmsv/data/enemy1.txt','gmsv/data/enemy1.txt','bf245a391adeace09915b6e425754b54ab69a8f6'],enemybase:['ro0000/server/merged-source/gmsv/data/enemybase1.txt','gmsv/data/enemybase1.txt','a19a508975e3a982fada323861b35b2edab79349']};
function fail(m){throw new Error(m);}
function clean(f){if(!fs.existsSync(f))fail('Missing '+f);return fs.readFileSync(f,'utf8').split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'));}
function sha(rel){try{return execFileSync('git',['rev-parse','HEAD:'+rel],{cwd:ROOT,encoding:'utf8'}).trim();}catch{return'unknown';}}
function blobSize(repoRoot, rel){
  try{
    return Number(execFileSync('git',['-C',repoRoot,'cat-file','-s','HEAD:'+rel],{cwd:ROOT,encoding:'utf8'}).trim());
  }catch{
    return null;
  }
}
function compare(E,F){const es=new Set(E),fs=new Set(F);return{endpointRows:E.length,fixedRows:F.length,intersection:E.filter(x=>fs.has(x)).length,endpointOnly:E.filter(x=>!fs.has(x)).length,fixedOnly:F.filter(x=>!es.has(x))?.length??0};}
function num(v){return /^-?\d+$/.test(String(v).trim())?Number(String(v).trim()):null;}
function internal(E,G,N,B){
 const groupIds=new Set(G.map(r=>num(r.split(',')[1])).filter(Number.isInteger));
 const enemyIds=new Set(N.map(r=>num(r.split(',')[3])).filter(Number.isInteger));
 const tempNos=new Set(B.map(r=>num(r.split(',')[6])).filter(Number.isInteger));
 const encRefs=[]; for(const r of E){const t=r.split(',');for(let i=10;i<20;i++){const id=num(t[i]),prob=num(t[20+(i-10)]);if(Number.isInteger(id)&&Number.isInteger(prob)&&prob>0)encRefs.push(id);}}
 const groupEnemyRefs=[]; for(const r of G){const t=r.split(',');for(let i=4;i<14;i++){const id=num(t[i]);if(Number.isInteger(id)&&id!==-1)groupEnemyRefs.push(id);}}
 const enemyTempRefs=[]; for(const r of N){const id=num(r.split(',')[4]);if(Number.isInteger(id))enemyTempRefs.push(id);}
 return{uniqueEncounterGroupRefs:new Set(encRefs).size,activeEncounterGroupRefCount:encRefs.length,unresolvedActiveEncounterGroups:[...new Set(encRefs.filter(id=>!groupIds.has(id)))].sort((a,b)=>a-b),uniqueGroupEnemyRefs:new Set(groupEnemyRefs).size,unresolvedGroupEnemyIds:[...new Set(groupEnemyRefs.filter(id=>!enemyIds.has(id)))].sort((a,b)=>a-b),uniqueEnemyTempRefs:new Set(enemyTempRefs).size,unresolvedEnemyBaseTempNos:[...new Set(enemyTempRefs.filter(id=>!tempNos.has(id)))].sort((a,b)=>a-b)};
}
const endpoint={},fixed={};
for(const [key,[ep,fx]] of Object.entries(FILES)){endpoint[key]=clean(path.join(ROOT,ep));fixed[key]=clean(path.join(FIXED_ROOT,fx));}
const result={format:'stoneage-endpoint-battle-data-source-audit-v1',fixedSource:'gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',files:Object.fromEntries(Object.entries(FILES).map(([k,[ep,fx,fxSha]])=>[k,{endpointPath:ep,endpointBlobSha:sha(ep),fixedPath:fx,fixedBlobSha:fxSha,endpointBytes:blobSize(ROOT,ep),fixedBytes:blobSize(FIXED_ROOT,fx),comparison:compare(endpoint[k],fixed[k])}])),endpointInternalReferences:internal(endpoint.encount,endpoint.group,endpoint.enemy,endpoint.enemybase),fixedInternalReferences:internal(fixed.encount,fixed.group,fixed.enemy,fixed.enemybase),interpretation:{endpointIsPrimaryDataSource:true,fixedCIsSemanticValidationBaseline:true,variantIsNotError:true,syntheticSubstitutionForbidden:true,note:'Internal field positions are reported as format evidence based on the existing pinned-C parser contract; endpoint loader semantics still require explicit closure before canonical runtime promotion.'}};
const text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check')){
  if(!fs.existsSync(OUT))fail('Missing generated endpoint battle audit.');
  const current=fs.readFileSync(OUT,'utf8');
  if(current!==text){
    let first=-1;
    for(let i=0;i<Math.min(current.length,text.length);i++){if(current[i]!==text[i]){first=i;break;}}
    const context=first>=0?JSON.stringify({first,expected:text.slice(Math.max(0,first-180),first+420),current:current.slice(Math.max(0,first-180),first+420)}):'length-only mismatch';
    console.error('Endpoint battle audit is stale. expectedLen='+text.length+' currentLen='+current.length);
    console.error(context);
    fail('Endpoint battle audit is stale.');
  }
  process.stdout.write('endpoint-battle-data-source-audit-check-ok\n');
}
else if(process.argv.includes('--write')){fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,text);process.stdout.write(text);}
else process.stdout.write(text);