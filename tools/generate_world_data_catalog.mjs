#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args=process.argv.slice(2);
function argValue(name, fallback=null){
  const i=args.indexOf(name);
  return i>=0 ? args[i+1] : fallback;
}
const sourceRoot=path.resolve(argValue('--source-root','/tmp/StoneAge'));
const outDir=path.resolve(argValue('--out-dir','.'));
const npcRoot=path.join(sourceRoot,'gmsv/data/npc');
const sourceRef=argValue('--source-ref','1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
const sourceRepo=argValue('--source-repo','gavinlinasd/StoneAge');
const sourceRole=argValue('--source-role','pinned-fixed-c');


function fail(message){ console.error('World data generation FAILED:',message); process.exit(1); }
if(!fs.existsSync(sourceRoot)) fail('source root missing: '+sourceRoot);

function walk(dir){
  const out=[];
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) out.push(...walk(p));
    else if(ent.isFile()) out.push(p);
  }
  return out;
}
function sha256(buf){return crypto.createHash('sha256').update(buf).digest('hex');}
function readText(p){return fs.readFileSync(p,'utf8');}
function relNpc(p){return path.relative(npcRoot,p).replaceAll(path.sep,'/');}
function clean(v){return v?.trim() ?? '';}
function parseBlocks(text){
  const lines=text.replace(/\r/g,'').split('\n');
  const blocks=[]; let current=null; let startLine=0;
  for(let i=0;i<lines.length;i++){
    const raw=lines[i], line=raw.trim();
    if(line==='{'){
      if(current) current={keys:{},startLine:i+1,rawLines:[]};
      else current={keys:{},startLine:i+1,rawLines:[]};
      continue;
    }
    if(current){
      current.rawLines.push(raw);
      if(line==='}'){
        const body=current.rawLines.slice(0,-1);
        for(const b of body){
          const t=b.trim();
          if(!t || t.startsWith('#')) continue;
          const eq=t.indexOf('=');
          if(eq<=0) continue;
          const k=clean(t.slice(0,eq)).toLowerCase();
          const v=clean(t.slice(eq+1));
          (current.keys[k]??=[]).push(v);
        }
        blocks.push(current); current=null;
      }
    }
  }
  return blocks;
}
function first(a){return Array.isArray(a)&&a.length?a[0]:null;}
function num(v){const n=Number(v); return Number.isFinite(n)?n:null;}
function parseRect(v){
  if(!v) return null;
  const a=v.split(',').map(x=>Number(x.trim()));
  return a.length===4 && a.every(Number.isFinite) ? {x1:a[0],y1:a[1],x2:a[2],y2:a[3]} : null;
}
function parseCenter(v){
  if(!v) return null;
  const a=v.split(',').map(x=>Number(x.trim()));
  return a.length===4 && a.every(Number.isFinite) ? {x:a[0],y:a[1],width:a[2],height:a[3]} : null;
}
function functionSetNamesFromC(c){
  const s=c.indexOf('static FunctionNameSet  functionSet[]={');
  if(s<0) return [];
  const e=c.indexOf('\n};',s);
  return [...c.slice(s,e<0?c.length:e).matchAll(/\{\s*"([^"]+)"/g)].map(m=>m[1]);
}
function normalize(s){return clean(s).toLowerCase();}
function parseEnemy(v){
  if(!v) return {raw:null,templateName:null,normalizedTemplateName:null,extra:[],fileRef:null};
  const parts=v.split('|'); const templateName=clean(parts.shift()); const extra=parts.map(clean).filter(Boolean);
  const fp=extra.find(x=>x.toLowerCase().startsWith('file:'));
  return {raw:v,templateName:templateName||null,normalizedTemplateName:normalize(templateName),extra,fileRef:fp?fp.slice(5).replaceAll('\\','/'):null};
}
function argDirectives(text){
  const set=new Set();
  for(const raw of text.replace(/\r/g,'').split('\n')){
    const line=raw.trim();
    if(!line || line.startsWith('#')) continue;
    const m=line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*(?::|=)/);
    if(m) set.add(m[1]);
    else { const u=line.match(/^([A-Z][A-Z0-9_]{2,})(?:\d+)?\b/); if(u) set.add(u[1]); }
  }
  return [...set].sort();
}

const allFiles=walk(npcRoot).sort();
const extCounts={};
for(const f of allFiles){
  const ext=(path.extname(f)||'[no-extension]').toLowerCase();
  extCounts[ext]=(extCounts[ext]??0)+1;
}

const cPath=path.join(sourceRoot,'gmsv/src/npc/npctemplate.c');
const sourceFunctionSets=fs.existsSync(cPath)?functionSetNamesFromC(readText(cPath)):[];
const sourceFunctionMap=new Map(sourceFunctionSets.map(x=>[normalize(x),x]));
const templateRecords=[], createRecords=[], argRecords=[], otherFiles=[];

for(const f of allFiles){
  const base=path.basename(f), ext=(path.extname(f)||'[no-extension]').toLowerCase(), data=fs.readFileSync(f);
  const common={path:relNpc(f),sha256:sha256(data),sizeBytes:data.length,lineCount:data.toString('utf8').split(/\r?\n/).length};
  if(ext==='.template' || ext==='.templete'){
    for(const [blockIndex,b] of parseBlocks(data.toString('utf8')).entries()){
      const k=b.keys, fn=first(k.functionset), tn=first(k.templatename);
      templateRecords.push({
        ...common,blockIndex,startLine:b.startLine,templateName:tn,functionSet:fn,
        normalizedFunctionSet:normalize(fn),
        functionSetStatus:fn?(sourceFunctionMap.has(normalize(fn))?'known':'unknown'):'missing',
        sourceFunctionSet:fn?(sourceFunctionMap.get(normalize(fn))??null):null,
        graphicName:first(k.graphicname),type:first(k.type),
        hp:num(first(k.hp)),mp:num(first(k.mp)),str:num(first(k.str)),tough:num(first(k.tough)),fly:num(first(k.fly)),
        itemNum:num(first(k.itemnum)),loopFuncTime:num(first(k.loopfunctime)),
        flags:{makeAtNoBody:num(first(k.makeatnobody)),makeAtNoSee:num(first(k.makeatnosee))}
      });
    }
  } else if(ext==='.create' || ext==='.creata'){
    for(const [blockIndex,b] of parseBlocks(data.toString('utf8')).entries()){
      const k=b.keys;
      const enemy=(k.enemy??[]).map(parseEnemy);
      createRecords.push({
        ...common,blockIndex,startLine:b.startLine,floorId:num(first(k.floorid)),
        bornCenter:parseCenter(first(k.borncenter)),bornCorner:parseRect(first(k.borncorner)),
        moveCenter:parseCenter(first(k.movecenter)),moveCorner:parseRect(first(k.movecorner)),
        dir:num(first(k.dir)),graphicName:first(k.graphicname),name:first(k.name),
        time:num(first(k.time)),date:num(first(k.date)),createNum:num(first(k.createnum)),
        boundary:num(first(k.boundary)),ignoreInvincible:num(first(k.ignoreinvincible)),
        family:num(first(k.family)),action:num(first(k.action)),enemy,enemyTemplateCount:enemy.length
      });
    }
  } else if(ext==='.arg' || /^\.arg\d+$/.test(ext)){
    const text=data.toString('utf8');
    argRecords.push({...common,directives:argDirectives(text),
      firstNonEmptyLine:(text.replace(/\r/g,'').split('\n').find(x=>{const t=x.trim();return t&&!t.startsWith('#');})??'').trim().slice(0,300)});
  } else {
    otherFiles.push(common);
  }
}

const templateByName=new Map();
for(const t of templateRecords){
  const key=normalize(t.templateName); if(!key) continue;
  (templateByName.get(key)??templateByName.set(key,[]).get(key)).push({path:t.path,blockIndex:t.blockIndex,functionSet:t.functionSet});
}

const serviceCounts={}, unknownFunctionSets={}, floorCounts={};
let resolvedTemplateRefs=0, unresolvedTemplateRefs=0, unresolvedFileRefs=0;
const creates= createRecords.map(c=>{
  if(c.floorId!=null) floorCounts[String(c.floorId)]=(floorCounts[String(c.floorId)]??0)+1;
  const enemy=c.enemy.map(e=>{
    const candidates=templateByName.get(e.normalizedTemplateName)??[];
    if(candidates.length) resolvedTemplateRefs++; else unresolvedTemplateRefs++;
    let fileExists=null;
    if(e.fileRef){
      const target=path.join(npcRoot,e.fileRef); fileExists=fs.existsSync(target);
      if(!fileExists) unresolvedFileRefs++;
    }
    return {...e,templateCandidates:candidates,fileExists};
  });
  return {...c,enemy};
});
for(const t of templateRecords){
  if(t.functionSet) serviceCounts[t.functionSet]=(serviceCounts[t.functionSet]??0)+1;
  if(t.functionSetStatus==='unknown') unknownFunctionSets[t.functionSet]=(unknownFunctionSets[t.functionSet]??0)+1;
}

const mapwarpPath=path.join(sourceRoot,'gmsv/data/map/mapwarp.txt');
const mapwarp=[];
if(fs.existsSync(mapwarpPath)){
  let lineNo=0;
  for(const raw of readText(mapwarpPath).replace(/\r/g,'').split('\n')){
    lineNo++; const line=raw.trim(); if(!line||line.startsWith('#')) continue;
    const parts=line.split(':'); if(parts.length<4) continue;
    const point=s=>{const a=s.split(',').map(Number);return a.length===3&&a.every(Number.isFinite)?{floor:a[0],x:a[1],y:a[2]}:null};
    mapwarp.push({line:lineNo,pointType:(parts[0]??'NONE').trim(),eventType:(parts[1]??'NULL').trim(),from:point(parts[2]),to:point(parts[3]),raw:line});
  }
}

const configPath=path.join(sourceRoot,'gmsv/setup.cf');
const configPairs=[], configMap={}; let configLine=0;
for(const raw of readText(configPath).replace(/\r/g,'').split('\n')){
  configLine++; const line=raw.trim(); if(!line||line.startsWith('#')||line.startsWith('=')) continue;
  const eq=line.indexOf('='); if(eq<=0) continue;
  const key=clean(line.slice(0,eq)), value=clean(line.slice(eq+1)); if(!key) continue;
  configPairs.push({line:configLine,key,value}); (configMap[key]??=[]).push(value);
}

const worldNpc={
  format:'stoneage-world-npc-index-v1',generatedAt:'2026-09-30',
  sourceRole,
  sourceIdentity:{repository:sourceRepo,ref:sourceRef},
  fixedSource:{repository:sourceRepo,ref:sourceRef},
  statistics:{
    npcFiles:allFiles.length,templateFiles:extCounts['.template']??0,templateBlocks:templateRecords.length,
    createFiles:(extCounts['.create']??0)+(extCounts['.creata']??0),createBlocks:createRecords.length,
    argFiles:Object.entries(extCounts).filter(([k])=>k==='.arg'||/^\.arg\d+$/.test(k)).reduce((n,[,v])=>n+v,0),
    otherNpcFiles:otherFiles.length,sourceFunctionSetCount:sourceFunctionSets.length,
    dataFunctionSetCount:Object.keys(serviceCounts).length,
    unknownDataFunctionSetCount:Object.keys(unknownFunctionSets).length,
    resolvedTemplateRefs,unresolvedTemplateRefs,unresolvedFileRefs,uniqueFloorCount:Object.keys(floorCounts).length,mapWarpRows:mapwarp.length
  },
  sourceFunctionSets,
  dataFunctionSets:Object.entries(serviceCounts).sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count,status:sourceFunctionMap.has(normalize(name))?'known':'unknown',sourceName:sourceFunctionMap.get(normalize(name))??null})),
  unknownFunctionSets:Object.entries(unknownFunctionSets).sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count})),
  templates:templateRecords,creates,args:argRecords,otherFiles
};

const serverConfig={
  format:'stoneage-server-config-index-v1',generatedAt:'2026-09-30',
  sourceRole,
  sourceIdentity:{repository:sourceRepo,ref:sourceRef,path:'gmsv/setup.cf',
  fixedSource:{repository:sourceRepo,ref:sourceRef,path:'gmsv/setup.cf',sha256:sha256(fs.readFileSync(configPath)),sizeBytes:fs.statSync(configPath).size},
  statistics:{pairCount:configPairs.length,uniqueKeyCount:Object.keys(configMap).length,duplicateKeyCount:Object.values(configMap).filter(a=>a.length>1).length},
  keyIndex:configPairs,valuesByKey:configMap,
  wiring:Object.fromEntries(['mapdir','maptilefile','battlemapfile','itemset6file','encountfile','groupfile','enemyfile','enemybasefile','magicfile','petskillfile2','profession','itematomfile','effectfile','quizfile','titlenamefile','titleconfigfile','invinciblefile','appearpositionfile','npcdir'].map(k=>[k,configMap[k]?.[0]??null]))
};

const warpIndex={
  format:'stoneage-mapwarp-source-index-v1',generatedAt:'2026-09-30',
  sourceRole,
  sourceIdentity:{repository:sourceRepo,ref:sourceRef,path:'gmsv/data/map/mapwarp.txt',
  fixedSource:{repository:sourceRepo,ref:sourceRef,path:'gmsv/data/map/mapwarp.txt',sha256:sha256(fs.readFileSync(mapwarpPath)),sizeBytes:fs.statSync(mapwarpPath).size},
  statistics:{
    rows:mapwarp.length,
    pointTypes:Object.fromEntries(Object.entries(mapwarp.reduce((a,r)=>(a[r.pointType]=(a[r.pointType]??0)+1,a),{})).sort((a,b)=>b[1]-a[1])),
    eventTypes:Object.fromEntries(Object.entries(mapwarp.reduce((a,r)=>(a[r.eventType]=(a[r.eventType]??0)+1,a),{})).sort((a,b)=>b[1]-a[1])),
    nullFrom:mapwarp.filter(r=>!r.from).length,nullTo:mapwarp.filter(r=>!r.to).length,
    uniqueFromFloors:new Set(mapwarp.filter(r=>r.from).map(r=>r.from.floor)).size,
    uniqueToFloors:new Set(mapwarp.filter(r=>r.to).map(r=>r.to.floor)).size
  },
  rows:mapwarp
};

fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'stoneage_world_npc_index.json'),JSON.stringify(worldNpc,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'stoneage_server_config_index.json'),JSON.stringify(serverConfig,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'stoneage_mapwarp_source_index.json'),JSON.stringify(warpIndex,null,2)+'\n');
console.log(JSON.stringify({pass:true,fixedSource:sourceRepo+'@'+sourceRef,statistics:worldNpc.statistics,outputs:['data/generated/stoneage_world_npc_index.json','data/generated/stoneage_server_config_index.json','data/generated/stoneage_mapwarp_source_index.json']}));
