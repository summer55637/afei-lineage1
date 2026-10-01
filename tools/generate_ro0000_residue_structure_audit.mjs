#!/usr/bin/env node
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const ROOT=process.cwd();
const RO='ro0000';
const OUT='data/generated/stoneage_ro0000_residue_structure_audit.json';
const git=a=>execFileSync('git',['-c','core.quotePath=false',...a],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024}).trimEnd();
const raw=git(['ls-tree','-r','-l','HEAD','--',RO]);
const files=raw.split(/\n/).filter(Boolean).map(line=>{const m=line.match(/^(\d+)\s+(blob|tree)\s+([0-9a-f]+)(?:\s+(\d+))?\t(.+)$/);if(!m)throw new Error('Cannot parse git tree line: '+line);return{mode:m[1],type:m[2],sha:m[3],size:m[4]==null?null:Number(m[4]),path:m[5]};}).filter(x=>x.type==='blob');
const byPath=new Map(files.map(x=>[x.path,x]));
const bySha=new Map();for(const x of files){const a=bySha.get(x.sha)||[];a.push(x.path);bySha.set(x.sha,a);}
const backupRe=/(?:\.bak|\.old|\.new|\.tmp|~|\.arg--|\.create---|\.template--|\.conf1|\.lua--)$/i;
const argRe=/\.arg[1-9]$/i;
function argumentKind(x){return x.path.includes('/npc/family/manorsman.arg')||x.path.includes('/npc/family/scheduleman.arg')?'indexed-npc-init-argument-record':'numbered-argument-file-unresolved';}
const dataP='ro0000/server/merged-source/gmsv/data/';
const hyP='ro0000/server/merged-source/gmsv/hydata/data/';
const dataMap=new Map(files.filter(x=>x.path.startsWith(dataP)).map(x=>[x.path.slice(dataP.length),x]));
const hyMap=new Map(files.filter(x=>x.path.startsWith(hyP)).map(x=>[x.path.slice(hyP.length),x]));
function base(p){const rules=[[/\.lua~$/i,'.lua'],[/\.lua--$/i,'.lua'],[/\.bak$/i,''],[/\.old$/i,''],[/\.new$/i,''],[/\.tmp$/i,''],[/\.arg--$/i,'.arg'],[/\.create---$/i,'.create'],[/\.template--$/i,'.template'],[/\.conf1$/i,'.conf'],[/\.arg~$/i,'.arg'],[/\.create~$/i,'.create']];for(const [rx,s] of rules)if(rx.test(p))return p.replace(rx,s);return null;}
function counterpart(x){let y=null;if(x.path.startsWith(dataP))y=hyMap.get(x.path.slice(dataP.length));else if(x.path.startsWith(hyP))y=dataMap.get(x.path.slice(hyP.length));return y?{path:y.path,sha:y.sha,sameBlob:x.sha===y.sha}:null;}
function row(x){const b=base(x.path),bp=b?byPath.get(b):null,dup=(bySha.get(x.sha)||[]).filter(p=>p!==x.path);const out={path:x.path,size:x.size,sha:x.sha,baseCandidate:b,baseExists:!!bp,sameAsBase:!!bp&&bp.sha===x.sha,duplicatePathCount:dup.length,duplicatePaths:dup.slice(0,12),counterpart:counterpart(x)};if(argRe.test(x.path))out.argumentKind=argumentKind(x);return out;}
const residue=files.filter(x=>backupRe.test(x.path)).map(row);
const args=files.filter(x=>argRe.test(x.path)).map(row);
const result={format:'stoneage-ro0000-residue-structure-audit-v1',checkedDate:new Date().toISOString().slice(0,10),ro0000TreeSha:git(['rev-parse','HEAD:'+RO]),scope:'structural classification from Git tree/blob identity only; no raw-file mutation',summary:{trackedFiles:files.length,backupLike:residue.length,backupLikeWithDuplicateElsewhere:residue.filter(x=>x.duplicatePathCount>0).length,backupLikeIsolatedSha:residue.filter(x=>x.duplicatePathCount===0).length,backupLikeWithFormalBase:residue.filter(x=>x.baseExists).length,backupLikeExactFormalBaseMatch:residue.filter(x=>x.sameAsBase).length,multipartArg:args.length,multipartExactCounterpart:args.filter(x=>x.counterpart&&x.counterpart.sameBlob).length,multipartVariantCounterpart:args.filter(x=>x.counterpart&&!x.counterpart.sameBlob).length},interpretation:{exactDuplicate:'provenance evidence only; never delete the raw path solely because SHA repeats',formalBaseDifferent:'requires semantic/provenance review; do not replace formal base automatically',isolatedResidue:'highest priority for content-level provenance review',multipartArg:'legacy inventory key for numbered .argN paths; suffix does not imply byte concatenation; family manorsman/scheduleman files are indexed NPC initialization records'},backupLike:residue,multipartArg:args};
fs.writeFileSync(OUT,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({format:result.format,ro0000TreeSha:result.ro0000TreeSha,summary:result.summary,out:OUT},null,2));