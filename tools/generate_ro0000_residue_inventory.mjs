#!/usr/bin/env node
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT=process.cwd();
const RO='ro0000';
const OUT='data/generated/stoneage_ro0000_residue_inventory.json';
function git(args){
  return execFileSync('git',['-c','core.quotePath=false',...args],{
    cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024
  }).trimEnd();
}
const raw=git(['ls-tree','-r','-l','HEAD','--',RO]);
const files=raw?raw.split(/\n/).filter(Boolean).map(line=>{
  const m=line.match(/^(\d+)\s+(blob|tree)\s+([0-9a-f]+)(?:\s+(\d+))?\t(.+)$/);
  if(!m) throw new Error('Cannot parse git tree line: '+line);
  return {mode:m[1],type:m[2],sha:m[3],size:m[4]==null?null:Number(m[4]),path:m[5]};
}).filter(x=>x.type==='blob'):[];

const backupRe=/(?:\.bak|\.old|\.new|\.tmp|~|\.arg--|\.create---|\.template--|\.conf1|\.lua--)$/i;
const argRe=/\.arg[1-9]$/i;
const residue=files.filter(x=>backupRe.test(x.path));
const multipart=files.filter(x=>argRe.test(x.path));
const dataRoot='ro0000/server/merged-source/gmsv/data/';
const hyRoot='ro0000/server/merged-source/gmsv/hydata/data/';
const dataMap=new Map(files.filter(x=>x.path.startsWith(dataRoot)).map(x=>[x.path.slice(dataRoot.length),x]));
const hyMap=new Map(files.filter(x=>x.path.startsWith(hyRoot)).map(x=>[x.path.slice(hyRoot.length),x]));
function counterpart(x){
  if(x.path.startsWith(dataRoot)){
    const rel=x.path.slice(dataRoot.length), y=hyMap.get(rel);
    return y?{path:y.path,sha:y.sha,sameBlob:x.sha===y.sha}:null;
  }
  if(x.path.startsWith(hyRoot)){
    const rel=x.path.slice(hyRoot.length), y=dataMap.get(rel);
    return y?{path:y.path,sha:y.sha,sameBlob:x.sha===y.sha}:null;
  }
  return null;
}
function mapEntry(x,classification){
  return {path:x.path,sourceRole:'vm-one-click',size:x.size,sha:x.sha,classification,counterpart:counterpart(x)};
}
function isIndexedFamilyArgument(x){
  return x.path.includes('/npc/family/manorsman.arg') || x.path.includes('/npc/family/scheduleman.arg');
}
function argumentClassification(x){
  return isIndexedFamilyArgument(x)?'indexed-npc-init-argument-record':'numbered-argument-file-unresolved';
}
function argumentGroup(stem){
  const marker='/npc/family/'+stem+'.arg';
  const entries=multipart.filter(x=>x.path.includes(marker));
  const index=x=>Number(x.path.slice(-1));
  const data=entries.filter(x=>x.path.startsWith(dataRoot)).sort((a,b)=>index(a)-index(b));
  const hydata=entries.filter(x=>x.path.startsWith(hyRoot)).sort((a,b)=>index(a)-index(b));
  const indices=[...new Set(entries.map(index))].sort((a,b)=>a-b);
  let sameBlob=0,differentBlob=0,missing=0;
  for(const i of indices){
    const a=data.find(x=>index(x)===i),b=hydata.find(x=>index(x)===i);
    if(!a||!b) missing++;
    else if(a.sha===b.sha) sameBlob++;
    else differentBlob++;
  }
  return {
    stem,
    classification:'indexed-npc-init-argument-records',
    data:{count:data.length,indices:data.map(index)},
    hydata:{count:hydata.length,indices:hydata.map(index)},
    counterpartComparison:{sameBlob,differentBlob,missing}
  };
}
const argumentGroups=['manorsman','scheduleman'].map(argumentGroup);
const result={
  format:'stoneage-ro0000-residue-inventory-v1',
  checkedDate:new Date().toISOString().slice(0,10),
  ro0000TreeSha:git(['rev-parse','HEAD:'+RO]),
  scope:'ro0000 raw snapshot; deterministic inventory only; no raw-file mutation',
  counts:{trackedFiles:files.length,backupLike:residue.length,multipartArg:multipart.length,indexedNpcInitArgumentRecords:multipart.filter(isIndexedFamilyArgument).length},
  rules:{
    backupLike:'review-required-residue; extension alone is not evidence for deletion',
    multipartArg:'legacy inventory key for numbered .argN paths; do not assume byte fragments; family manorsman/scheduleman files are indexed NPC initialization records',
    rawSnapshot:'do-not-rearrange-or-delete'
  },
  backupLike:residue.map(x=>mapEntry(x,'historical-or-editing-residue')),
  multipartArg:multipart.map(x=>mapEntry(x,argumentClassification(x))),
  argumentGroups
};
fs.writeFileSync(OUT,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({format:result.format,ro0000TreeSha:result.ro0000TreeSha,counts:result.counts,out:OUT},null,2));
