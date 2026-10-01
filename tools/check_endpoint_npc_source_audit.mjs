#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT=process.cwd();
const FIXED_ROOT=path.resolve(process.env.FIXED_C_SOURCE_DIR??'fixed-c-source');
const ENDPOINT_ROOT='ro0000/server/merged-source/gmsv/data/npc';
const FIXED_ROOT_PATH='gmsv/data/npc';
const OUT=path.join(ROOT,'data/generated/stoneage_endpoint_npc_source_audit.json');
const FLOORS=['100','200','300','400'];
function fail(m){throw new Error(m);}
function lsTree(repoRoot,rel){
  const out=execFileSync('git',['-C',repoRoot,'ls-tree','-r','-l','HEAD','--',rel],{cwd:ROOT,encoding:'utf8',maxBuffer:32*1024*1024}).trimEnd();
  if(!out)return[];
  return out.split('\n').map(line=>{
    const m=line.match(/^(\d+)\s+blob\s+([0-9a-f]+)\s+(\d+)\t(.+)$/);
    if(!m)fail('Cannot parse git ls-tree line: '+line);
    return {mode:m[1],sha:m[2],size:Number(m[3]),path:m[4]};
  });
}
function aggregate(files){
  let bytes=0;
  for(const f of files) bytes+=f.size;
  return{files:files.length,bytes};
}
function compare(endpoint,fixed){
  const fMap=new Map(fixed.map(x=>[x.path,x])),eMap=new Map(endpoint.map(x=>[x.path,x]));
  const common=endpoint.filter(x=>fMap.has(x.path));
  return{commonPathFiles:common.length,sameBlob:common.filter(x=>x.sha===fMap.get(x.path).sha).length,changedBlob:common.filter(x=>x.sha!==fMap.get(x.path).sha).length,endpointOnly:endpoint.filter(x=>!fMap.has(x.path)).length,fixedOnly:fixed.filter(x=>!eMap.has(x.path)).length};
}
function floorSummary(endpoint,fixed,floor){
  const ep=endpoint.filter(x=>x.path.startsWith(floor+'/')),fp=fixed.filter(x=>x.path.startsWith(floor+'/'));
  const fMap=new Map(fp.map(x=>[x.path,x])),eMap=new Map(ep.map(x=>[x.path,x]));
  const common=ep.filter(x=>fMap.has(x.path));
  return{floor,endpointFiles:ep.length,fixedFiles:fp.length,commonPathFiles:common.length,sameBlob:common.filter(x=>x.sha===fMap.get(x.path).sha).length,changedBlob:common.filter(x=>x.sha!==fMap.get(x.path).sha).length,endpointOnly:ep.filter(x=>!fMap.has(x.path)).length,fixedOnly:fp.filter(x=>!eMap.has(x.path)).length,changedFiles:common.filter(x=>x.sha!==fMap.get(x.path).sha).map(x=>({path:x.path,endpointSha:x.sha,endpointSize:x.size,fixedSha:fMap.get(x.path).sha,fixedSize:fMap.get(x.path).size})).sort((a,b)=>a.path.localeCompare(b.path))};
}
const endpointAll=lsTree(ROOT,ENDPOINT_ROOT).map(x=>({...x,path:x.path.slice(ENDPOINT_ROOT.length+1)}));
const fixedAll=lsTree(FIXED_ROOT,FIXED_ROOT_PATH);
const fixedSource='gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const result={format:'stoneage-endpoint-npc-source-audit-v1',source:{endpointRoot:'ro0000/server/merged-source/gmsv/data/npc',endpointTreeSha:process.env.ENDPOINT_NPC_TREE_SHA??'unknown',fixedSource,fixedRoot:'gmsv/data/npc',fixedTreeSha:process.env.FIXED_NPC_TREE_SHA??'unknown'},endpoint:aggregate(endpointAll),fixed:aggregate(fixedAll),comparison:compare(endpointAll,fixedAll),hometownFloors:FLOORS.map(floor=>floorSummary(endpointAll,fixedAll,floor)),interpretation:{endpointIsPrimaryDeploymentData:true,fixedCIsEngineSemanticBaseline:true,endpointVariantRetention:true,playableRuntimePromotionRequiresSemanticClosure:true,note:'This audit compares exact endpoint NPC path/blob identity against the pinned fixed-C NPC tree. It does not decide gameplay semantics from blob differences alone.'}};
const text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check')){if(!fs.existsSync(OUT))fail('Missing generated endpoint NPC audit.');if(fs.readFileSync(OUT,'utf8')!==text)fail('Endpoint NPC audit is stale.');process.stdout.write('endpoint-npc-source-audit-check-ok\n');}
else if(process.argv.includes('--write')){fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,text);process.stdout.write(text);}
else process.stdout.write(text);