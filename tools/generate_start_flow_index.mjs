#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args=process.argv.slice(2);
const root=path.resolve(args[args.indexOf('--source-root')+1]||'/tmp/StoneAge');
const out=path.resolve(args[args.indexOf('--out')+1]||'data/generated/stoneage_start_flow_index.json');
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
const m=charData.match(/static EldersPosition elders\[MAXELDERS\]=\s*\{\s*([\s\S]*?)\n\};/);
if(!m)throw new Error('elders table not found');
const positions=[...m[1].matchAll(/\{\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\}/g)].slice(0,4).map((x,i)=>({hometown:i,floor:Number(x[1]),x:Number(x[2]),y:Number(x[3])}));
const trans=fs.readFileSync(path.join(root,'gmsv/src/npc/npc_transmigration.c'),'utf8');
const em=trans.match(/char \*elder\[4\]\s*=\s*\{([^}]+)\}/);
const elderNames=em?[...em[1].matchAll(/"([^"]+)"/g)].map(x=>x[1]):[];
positions.forEach((p,i)=>p.elder=elderNames[i]||null);

const char=fs.readFileSync(path.join(root,'gmsv/src/char/char.c'),'utf8');
const petMap={0:1,1:2,2:3,3:4};
const playerPet=Object.entries(petMap).map(([hometown,defaultPet])=>({hometown:Number(hometown),petSelectionRule:'_NEW_PLAYER_CF getNewplayergivepet(0)',fallbackEnemyId:defaultPet}));
const delBornplace=/getMuseum\(\)\s*\)\s*\{\s*[^}]*hometown\s*=\s*1/.test(char);

const npcRoot=path.join(root,'gmsv/data/npc');
const createFiles=walk(npcRoot).filter(p=>/\.create$|\.creata$/i.test(p));
const floorInstances=[];
for(const p of createFiles){
  const lines=fs.readFileSync(p,'utf8').replace(/\r/g,'').split('\n');
  let cur=null,inBlock=false,idx=0;
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    if(line==='{'){inBlock=true;cur={};continue;}
    if(!inBlock)continue;
    if(line==='}'){
      const floor=Number(cur.floorid?.[0]);
      if(Number.isInteger(floor)&&positions.some(x=>x.floor===floor)){
        floorInstances.push({path:rel(p),blockIndex:idx,floorId:floor,x:Number((cur.borncenter?.[0]||'').split(',')[0]),y:Number((cur.borncenter?.[0]||'').split(',')[1]),name:cur.name?.[0]||null,templateName:(cur.enemy?.[0]||'').split('|')[0]||null,fileRef:(cur.enemy?.[0]||'').match(/\|file:(.+)$/i)?.[1]||null});
      }
      idx++;cur=null;inBlock=false;continue;
    }
    const eq=line.indexOf('=');
    if(eq>0){const k=line.slice(0,eq).trim().toLowerCase();const v=line.slice(eq+1).trim();(cur[k]??=[]).push(v);}
  }
}
const serviceRoot=new Map([
  ['npcgen_healer','recovery'],
  ['npcgen_savepoint','savepoint'],
  ['npcgen_itemshop','shop'],
  ['npcgen_petshop','pet-shop'],
  ['npcgen_petskillshop','pet-skill-shop'],
  ['npcgen_warpman','movement'],
  ['npcgen_warp','movement']
]);
const serviceCounts={};
for(const n of floorInstances){
  const s=serviceRoot.get((n.templateName||'').toLowerCase());
  if(s)serviceCounts[s]=(serviceCounts[s]||0)+1;
}
const mapFloors=[...new Set(floorInstances.map(x=>x.floorId))].sort((a,b)=>a-b);
const index={
  format:'stoneage-start-flow-index-v1',
  generatedAt:'2026-09-30',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref},
  sourceContracts:{
    creation:'gmsv/src/char/char.c::CHAR_createNewChar',
    positionResolver:'gmsv/src/char/char_data.c::CHAR_getInitElderPosition',
    elderNames:'gmsv/src/npc/npc_transmigration.c'
  },
  statistics:{hometowns:positions.length,startFloorCount:mapFloors.length,npcInstancesOnStartFloors:floorInstances.length,serviceCounts},
  hometowns:positions,
  newPlayerPet:{enabledBySourceFlag:char.includes('_NEW_PLAYER_CF'),selection:'default gives pet based on CHAR_LASTTALKELDER: 1=pet 2, 2=pet 3, 3=pet 4, otherwise pet 1',rules:playerPet},
  museumOverrides:{
    delBornPlaceFlag:delBornplace,
    museumPosition:{floor:815,x:29,y:40,lastTalkElder:35},
    museumLaterOverride:{floor:9000,x:40,y:40}
  },
  npcInstancesOnStartFloors:floorInstances,
  policy:'Source reconstruction only; start-flow order and gameplay pacing are not inferred from coordinates.'
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(index,null,2)+'\n');
console.log(JSON.stringify({pass:true,statistics:index.statistics,hometowns:positions,npcSample:floorInstances.slice(0,30),output:out}));
