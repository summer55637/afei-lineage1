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
const result={
  format:'stoneage-ro0000-residue-inventory-v1',
  checkedDate:new Date().toISOString().slice(0,10),
  ro0000TreeSha:git(['rev-parse','HEAD:'+RO]),
  scope:'ro0000 raw snapshot; deterministic inventory only; no raw-file mutation',
  counts:{trackedFiles:files.length,backupLike:residue.length,multipartArg:multipart.length},
  rules:{
    backupLike:'review-required-residue; extension alone is not evidence for deletion',
    multipartArg:'preserve-multipart-argument; treat as structured parameter fragments until parser/runtime provenance closes',
    rawSnapshot:'do-not-rearrange-or-delete'
  },
  backupLike:residue.map(x=>mapEntry(x,'historical-or-editing-residue')),
  multipartArg:multipart.map(x=>mapEntry(x,'multipart-argument-fragment'))
};
fs.writeFileSync(OUT,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({format:result.format,ro0000TreeSha:result.ro0000TreeSha,counts:result.counts,out:OUT},null,2));
