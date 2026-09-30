#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseLS2Map} from './stoneage_ls2map_parser.mjs';
import {sourceMapWalkableAt} from '../src/stoneage_map_runtime.mjs';

const args=process.argv.slice(2);
const root=path.resolve(args[args.indexOf('--source-root')+1]||'/tmp/StoneAge');
const out=path.resolve(args[args.indexOf('--out')+1]||'data/generated/stoneage_start_walkability_audit.json');
const ref='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

function walk(dir,out=[]){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p,out);else if(e.isFile())out.push(p);}return out;}
function findMaps(){
  const mapDir=path.join(root,'gmsv/data/map');
  const found=new Map();
  for(const p of walk(mapDir)){
    const b=fs.readFileSync(p);
    if(b.length<44||b.toString('ascii',0,6)!=='LS2MAP')continue;
    const floor=(b[6]<<8)|b[7];
    if(!found.has(floor))found.set(floor,p);
  }
  return found;
}
function parseWarps(){
  const files=walk(path.join(root,'gmsv/data/npc')).filter(p=>/\.create$|\.creata$/i.test(p));
  const rows=[];
  for(const p of files){
    const lines=fs.readFileSync(p,'utf8').replace(/\r/g,'').split('\n');
    let block=null,idx=0;
    for(let i=0;i<lines.length;i++){
      const line=lines[i].trim();
      if(line==='{'){block={floor:null,born:null,enemies:[],startLine:i+1};continue;}
      if(!block)continue;
      if(line==='}'){
        if(Number.isInteger(block.floor)){
          for(const raw of block.enemies){
            const parts=raw.split('|');
            if(parts[0]?.trim().toLowerCase()!=='npcgen_warp')continue;
            const tx=Number(parts[2]),ty=Number(parts[3]),tf=Number(parts[1]);
            if(Number.isInteger(tf)&&Number.isFinite(tx)&&Number.isFinite(ty)&&block.born){
              rows.push({fromFloor:block.floor,fromX:block.born.x,fromY:block.born.y,toFloor:tf,toX:tx,toY:ty,blockIndex:idx,path:path.relative(root,p).replaceAll(path.sep,'/'),startLine:block.startLine});
            }
          }
        }
        block=null;idx++;continue;
      }
      const eq=line.indexOf('=');
      if(eq>0){
        const k=line.slice(0,eq).trim().toLowerCase(),v=line.slice(eq+1).trim();
        if(k==='floorid')block.floor=Number(v);
        if(k==='borncorner'){const a=v.split(',').map(Number);if(a.length===4&&a.every(Number.isFinite))block.born={x:a[0],y:a[1]};}
        if(k==='enemy')block.enemies.push(v);
      }
    }
  }
  return rows;
}
function loadMap(file){return parseLS2Map(fs.readFileSync(file));}
function neighbors(x,y){return [[x+1,y],[x-1,y],[x,y+1],[x,y-1]];}
function bfs(map,mapset,start,target){
  const sx=start.x,sy=start.y,tx=target.x,ty=target.y;
  const key=(x,y)=>x+','+y;
  if(!sourceMapWalkableAt(map,sx,sy,mapset)||!sourceMapWalkableAt(map,tx,ty,mapset))return {reachable:false,path:null,reason:'start_or_target_not_walkable'};
  const q=[[sx,sy]],prev=new Map([[key(sx,sy),null]]);
  while(q.length){
    const [x,y]=q.shift();
    if(x===tx&&y===ty){
      const rev=[];let k=key(x,y);
      while(k){const [px,py]=k.split(',').map(Number);rev.push({x:px,y:py});k=prev.get(k);}
      rev.reverse();
      return {reachable:true,pathLength:rev.length-1,path:rev};
    }
    for(const [nx,ny] of neighbors(x,y)){
      if(nx<0||ny<0||nx>=map.width||ny>=map.height)continue;
      const nk=key(nx,ny);if(prev.has(nk))continue;
      if(!sourceMapWalkableAt(map,nx,ny,mapset))continue;
      prev.set(nk,key(x,y));q.push([nx,ny]);
    }
  }
  return {reachable:false,path:null,reason:'no_walkable_path'};
}

const mapset=JSON.parse(fs.readFileSync('data/generated/stoneage_mapset_runtime.json','utf8'));
const maps=findMaps();
const warps=parseWarps();
const spawnByHometown=[
 {hometown:0,elder:'samugiru',floor:1006,x:15,y:22},
 {hometown:1,elder:'marinasu',floor:2006,x:20,y:16},
 {hometown:2,elder:'jaja',floor:3006,x:21,y:16},
 {hometown:3,elder:'karutarna',floor:4006,x:14,y:20}
];
const routes=[];
for(const s of spawnByHometown){
  const exits=warps.filter(w=>w.fromFloor===s.floor);
  const map=maps.get(s.floor);
  const exitAudits=exits.map(w=>{
    if(!map)return {...w,reachable:false,reason:'source_map_missing'};
    const result=bfs(map,mapset,{x:s.x,y:s.y},{x:w.fromX,y:w.fromY});
    return {...w,walkToWarpNpc:result};
  });
  routes.push({hometown:s.hometown,elder:s.elder,spawn:s,mapFound:!!map,directWarpCount:exits.length,exitAudits});
}

const index={
  format:'stoneage-start-walkability-audit-v1',
  generatedAt:'2026-09-30',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref},
  sourceContracts:{mapParser:'tools/stoneage_ls2map_parser.mjs',walkability:'src/stoneage_map_runtime.mjs::sourceMapWalkableAt',warp:'gmsv/src/npc/npc_warp.c'},
  statistics:{startMapsFound:routes.filter(r=>r.mapFound).length,totalDirectWarpExits:routes.reduce((n,r)=>n+r.directWarpCount,0),reachableWarpExits:routes.flatMap(r=>r.exitAudits).filter(x=>x.walkToWarpNpc?.reachable).length,unreachableWarpExits:routes.flatMap(r=>r.exitAudits).filter(x=>!x.walkToWarpNpc?.reachable).length},
  routes,
  policy:'This checks only tile walkability from the recorded spawn coordinate to the source warp NPC coordinate. It does not infer quest order or designate a best route.'
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(index,null,2)+'\n');
console.log(JSON.stringify({pass:true,statistics:index.statistics,routes:routes.map(r=>({hometown:r.hometown,elder:r.elder,spawn:r.spawn,mapFound:r.mapFound,directWarpCount:r.directWarpCount,exits:r.exitAudits.map(x=>({from:[x.fromFloor,x.fromX,x.fromY],to:[x.toFloor,x.toX,x.toY],reachable:x.walkToWarpNpc?.reachable,pathLength:x.walkToWarpNpc?.pathLength,reason:x.walkToWarpNpc?.reason}))}))}));
