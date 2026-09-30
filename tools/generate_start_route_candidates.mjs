#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args=process.argv.slice(2);
const root=path.resolve(args[args.indexOf('--source-root')+1]||'/tmp/StoneAge');
const out=path.resolve(args[args.indexOf('--out')+1]||'data/generated/stoneage_start_route_candidates.json');
const ref='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

function walk(dir,out=[]){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory())walk(p,out);
    else if(e.isFile())out.push(p);
  }
  return out;
}
function rel(p){return path.relative(root,p).replaceAll(path.sep,'/');}

const charData=fs.readFileSync(path.join(root,'gmsv/src/char/char_data.c'),'utf8');
const elderMatch=charData.match(/static EldersPosition elders\[MAXELDERS\]=\s*\{\s*([\s\S]*?)\n\};/);
const hometowns=[...elderMatch[1].matchAll(/\{\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\}/g)].slice(0,4).map((m,i)=>({hometown:i,floor:Number(m[1]),x:Number(m[2]),y:Number(m[3])}));
const trans=fs.readFileSync(path.join(root,'gmsv/src/npc/npc_transmigration.c'),'utf8');
const names=trans.match(/char \*elder\[4\]\s*=\s*\{([^}]+)\}/)?.[1]||'';
[...names.matchAll(/"([^"]+)"/g)].forEach((m,i)=>{if(hometowns[i])hometowns[i].elder=m[1];});

const warpEdges=[];
const createFiles=walk(path.join(root,'gmsv/data/npc')).filter(p=>/\.create$|\.creata$/i.test(p)).sort();
for(const p of createFiles){
  const lines=fs.readFileSync(p,'utf8').replace(/\r/g,'').split('\n');
  let block=null,blockIndex=0;
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    if(line==='{'){block={floor:null,enemies:[],startLine:i+1};continue;}
    if(!block)continue;
    if(line==='}'){
      if(Number.isInteger(block.floor)){
        for(const raw of block.enemies){
          const parts=raw.split('|');
          if((parts[0]||'').trim().toLowerCase()!=='npcgen_warp')continue;
          const toFloor=Number(parts[1]),toX=Number(parts[2]),toY=Number(parts[3]);
          if(!Number.isInteger(toFloor))continue;
          warpEdges.push({
            fromFloor:block.floor,toFloor,toX:Number.isFinite(toX)?toX:null,toY:Number.isFinite(toY)?toY:null,
            time:parts[4]||null,path:rel(p),blockIndex,startLine:block.startLine,raw
          });
        }
      }
      block=null;blockIndex++;continue;
    }
    const eq=line.indexOf('=');
    if(eq>0){
      const k=line.slice(0,eq).trim().toLowerCase(),v=line.slice(eq+1).trim();
      if(k==='floorid')block.floor=Number(v);
      if(k==='enemy')block.enemies.push(v);
    }
  }
}

const encountPath=path.join(root,'gmsv/data/encount.txt');
const encounterRows=[];
let lineNo=0;
for(const raw0 of fs.readFileSync(encountPath,'utf8').replace(/\r/g,'').split('\n')){
  lineNo++; const raw=raw0.trim();
  if(!raw||raw.startsWith('#'))continue;
  const c=raw.split(',');
  const n=i=>Number((c[i-1]??'').trim());
  const row={line:lineNo,index:n(1),floor:n(2),x1:n(3),y1:n(4),x2:n(5),y2:n(6),probMin:n(7),probMax:n(8),enemyMax:n(9),zorder:n(10)};
  row.groupIds=[];
  for(let i=11;i<=20;i++){const v=n(i);if(Number.isInteger(v))row.groupIds.push(v);}
  row.eventNow=n(31);row.eventEnd=n(32);row.enemyGroup=n(33);
  encounterRows.push(row);
}
const encounterByFloor=new Map();
for(const e of encounterRows){
  if(!Number.isInteger(e.floor))continue;
  const arr=encounterByFloor.get(e.floor)||[];arr.push(e);encounterByFloor.set(e.floor,arr);
}
const adj=new Map();
for(const e of warpEdges){
  const set=adj.get(e.fromFloor)||new Set();set.add(e.toFloor);adj.set(e.fromFloor,set);
}
function bfs(start,maxDepth=8){
  const q=[{floor:start,depth:0,path:[start]}];
  const seen=new Set([start]);
  const hits=[];
  while(q.length){
    const cur=q.shift();
    const rows=encounterByFloor.get(cur.floor)||[];
    if(rows.length && cur.floor!==start) hits.push({floor:cur.floor,depth:cur.depth,path:cur.path,encounterCount:rows.length});
    if(cur.depth>=maxDepth)continue;
    for(const next of adj.get(cur.floor)||[]){
      if(seen.has(next))continue;
      seen.add(next);q.push({floor:next,depth:cur.depth+1,path:[...cur.path,next]});
    }
  }
  return hits;
}

const routes=hometowns.map(h=>{
  const direct=warpEdges.filter(e=>e.fromFloor===h.floor).map(e=>({toFloor:e.toFloor,toX:e.toX,toY:e.toY,time:e.time,path:e.path,blockIndex:e.blockIndex}));
  const encounterRoutes=bfs(h.floor,8).slice(0,20);
  return {
    hometown:h.hometown,elder:h.elder,spawn:h,
    directWarpExits:direct,
    directWarpFloorCount:new Set(direct.map(x=>x.toFloor)).size,
    nearestEncounterRoutes:encounterRoutes
  };
});

const summary={
  format:'stoneage-start-route-candidates-v1',
  generatedAt:'2026-09-30',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref},
  sourceContracts:{
    warp:'gmsv/src/npc/npc_warp.c::NPC_WarpInit + NPC_WarpWarpCharacter',
    encounter:'gmsv/src/char/encount.c::ENCOUNT_initEncount'
  },
  statistics:{
    hometowns:hometowns.length,
    warpEdges:warpEdges.length,
    encounterRows:encounterRows.length,
    encounterFloors:encounterByFloor.size,
    routeHorizonDepth:8
  },
  routes,
  policy:'Route candidates use source warp connectivity only. Walkability, NPC dialogue intent and quest priority are not inferred.'
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({pass:true,statistics:summary.statistics,routes:routes.map(r=>({hometown:r.hometown,elder:r.elder,spawn:r.spawn,uniqueDirectWarpFloors:r.directWarpFloorCount,directWarpExits:r.directWarpExits.slice(0,12),nearestEncounterRoutes:r.nearestEncounterRoutes.slice(0,6)})),output:out}));
