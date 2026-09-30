#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args=process.argv.slice(2);
const root=path.resolve(args[args.indexOf('--source-root')+1] || '/tmp/StoneAge');
const out=path.resolve(args[args.indexOf('--out')+1] || 'data/generated/stoneage_item_reward_gap_clusters.json');
const itemPath=path.join(root,'gmsv/data/itemset6.txt');
const npcRoot=path.join(root,'gmsv/data/npc');

function walk(dir,out=[]){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) walk(p,out);
    else if(e.isFile()) out.push(p);
  }
  return out;
}
function rel(p){return path.relative(root,p).replaceAll(path.sep,'/');}
function nonEmpty(text){return text.replace(/\r/g,'').split('\n').filter(x=>{const t=x.trim();return t&&!t.startsWith('#');});}

const itemMap=new Map();
for(const [n,line] of nonEmpty(fs.readFileSync(itemPath,'utf8')).entries()){
  const cols=line.trim().split(',');
  const id=Number((cols[16]??'').trim());
  if(Number.isInteger(id)&&id>=0)itemMap.set(id,{id,line:n+1,name:(cols[0]??'').trim(),secretName:(cols[1]??'').trim()});
}

const files=walk(npcRoot).sort();
const roles=[
  ['AddItem',/\bAddItem\s*[:=]\s*([^|&}]+)/gi],
  ['GetRandItem',/\bGetRandItem\s*[:=]\s*([^|&}]+)/gi]
];
const rows=new Map();
let totalRewardOccurrences=0;
let unresolvedRewardOccurrences=0;
const unresolvedIds=new Set();

for(const p of files){
  const relp=rel(p);
  const txt=fs.readFileSync(p,'utf8').replace(/\r/g,'');
  for(const [lineNo,raw0] of txt.split('\n').entries()){
    const line=raw0.trim();
    if(!line||line.startsWith('#'))continue;
    for(const [role,rx] of roles){
      for(const m of line.matchAll(rx)){
        const rhs=m[1]||'';
        for(const token of rhs.split(',')){
          const mt=token.trim().match(/^(-?\d+)/);
          if(!mt)continue;
          const id=Number(mt[1]);
          totalRewardOccurrences++;
          if(itemMap.has(id))continue;
          unresolvedRewardOccurrences++;
          unresolvedIds.add(id);
          const x=rows.get(id)||{id,occurrences:0,roles:new Set(),files:new Set(),samples:[]};
          x.occurrences++;
          x.roles.add(role);
          x.files.add(relp);
          if(x.samples.length<12)x.samples.push({path:relp,line:lineNo+1,role,expression:m[0].slice(0,500),raw:line.slice(0,800)});
          rows.set(id,x);
        }
      }
    }
  }
}

const unresolvedRows=[...rows.values()].map(x=>({
  id:x.id,
  occurrences:x.occurrences,
  roles:[...x.roles].sort(),
  uniqueFiles:x.files.size,
  samples:x.samples
})).sort((a,b)=>b.occurrences-a.occurrences||a.id-b.id);

const clusters=new Map();
for(const r of unresolvedRows){
  const prefixes=new Set(r.samples.map(s=>s.path.split('/').slice(0,4).join('/')));
  for(const prefix of prefixes){
    const x=clusters.get(prefix)||{pathPrefix:prefix,uniqueIds:new Set(),roles:new Set(),files:new Set(),sampleRows:[]};
    x.uniqueIds.add(r.id); for(const role of r.roles)x.roles.add(role);
    for(const s of r.samples){x.files.add(s.path); if(x.sampleRows.length<40)x.sampleRows.push({id:r.id,...s});}
    clusters.set(prefix,x);
  }
}
const clusterRows=[...clusters.values()].map(x=>({
  pathPrefix:x.pathPrefix,
  uniqueIds:x.uniqueIds.size,
  uniqueFiles:x.files.size,
  roles:[...x.roles].sort(),
  sampleRows:x.sampleRows
})).sort((a,b)=>b.uniqueIds-a.uniqueIds||a.pathPrefix.localeCompare(b.pathPrefix));

const roleSummary={};
for(const role of ['AddItem','GetRandItem']){
  const rs=unresolvedRows.filter(r=>r.roles.includes(role));
  roleSummary[role]={
    uniqueIds:rs.length,
    occurrences:rs.reduce((n,r)=>n+r.occurrences,0)
  };
}
const report={
  format:'stoneage-item-reward-gap-cluster-v2',
  generatedAt:'2026-09-30',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref,itemPath:'gmsv/data/itemset6.txt',idColumn1Based:17},
  statistics:{
    npcFiles:files.length,
    totalRewardOccurrences,
    unresolvedRewardOccurrences,
    resolvedRewardOccurrences:totalRewardOccurrences-unresolvedRewardOccurrences,
    uniqueUnresolvedRewardIds:unresolvedIds.size,
    roleSummary,
    clusterCount:clusterRows.length
  },
  unresolvedRewardItems:unresolvedRows,
  clusters:clusterRows,
  policy:'Counts are computed from direct source occurrences. No gameplay priority is inferred from frequency; unresolved IDs remain non-promoted.'
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:true,statistics:report.statistics,topUnresolved:unresolvedRows.slice(0,40).map(x=>({id:x.id,occurrences:x.occurrences,roles:x.roles,uniqueFiles:x.uniqueFiles})),output:out}));
