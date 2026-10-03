#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args=process.argv.slice(2);
const value=(flag,fallback=null)=>{
  const i=args.indexOf(flag);
  return i>=0?args[i+1]:fallback;
};
const root=path.resolve(value('--source-root','/tmp/StoneAge'));
const out=path.resolve(value('--out','data/generated/stoneage_idle_supply_warp_catalog.json'));
const sourcePath='gmsv/data/map/mapwarp.txt';
const expectedSha='617d2d02cbf17561d0eafc379a015d949055e922';

const startCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_start_destination_warp_coordinates.json','utf8'));
if(startCatalog.fixedSource?.blobSha!==expectedSha)throw new Error('start destination catalog mapwarp SHA mismatch');

const raw=fs.readFileSync(path.join(root,sourcePath),'utf8');
const blobSha=crypto.createHash('sha1')
  .update(Buffer.from(`blob ${Buffer.byteLength(raw,'utf8')}\0`,'utf8'))
  .update(raw).digest('hex');
if(blobSha!==expectedSha)throw new Error(`mapwarp blob SHA mismatch: expected ${expectedSha}, got ${blobSha}`);

function parse(lineText,line){
  const p=lineText.trim().split(':');
  if(p.length<5)return null;
  const from=p[2].split(',').map(Number);
  const to=p[3].split(',').map(Number);
  if(from.length!==3||to.length!==3||from.some(v=>!Number.isFinite(v))||to.some(v=>!Number.isFinite(v)))return null;
  return {line,type:p[0],condition:p[1],fromFloor:from[0],fromX:from[1],fromY:from[2],toFloor:to[0],toX:to[1],toY:to[2],extra:p.slice(4).join(':')};
}
const rows=raw.split(/\r?\n/).map((v,i)=>parse(v,i+1)).filter(Boolean);

const groups=[];

function addReverseStartGroups(){
  const all=[...(startCatalog.nextFloorPortals?.to100??[]),...(startCatalog.nextFloorPortals?.to200??[])];
  for(const group of all){
    groups.push({
      id:String(group.id).replace(/^([0-9]+)_to_([0-9]+)_/, '$2_to_$1_'),
      kind:'encounter-return',
      hometown:null,
      fromFloor:Number(group.toFloor),
      toFloor:Number(group.fromFloor),
      sourceLines:(group.sourceLines??[]).map(Number),
      rows:(group.rows??[]).map(row=>({
        line:Number(row.line),
        from:[Number(row.to?.[0]),Number(row.to?.[1])],
        to:[Number(row.from?.[0]),Number(row.from?.[1])]
      })),
      sourceDerivedFrom:String(group.id)
    });
  }
}

function addExactPair({id,kind,hometown,fromFloor,toFloor,expectedCount}){
  const hits=rows.filter(r=>r.type==='NONE'&&r.condition==='NULL'&&r.fromFloor===fromFloor&&r.toFloor===toFloor);
  if(hits.length!==expectedCount){
    throw new Error(`${id}: expected ${expectedCount} exact rows, got ${hits.length}`);
  }
  groups.push({
    id,kind,hometown,fromFloor,toFloor,
    sourceLines:hits.map(x=>x.line),
    rows:hits.map(x=>({line:x.line,from:[x.fromX,x.fromY],to:[x.toX,x.toY]})),
    sourceDerivedFrom:'gmsv/data/map/mapwarp.txt exact pair'
  });
}

addReverseStartGroups();

addExactPair({id:'1000_to_1005_hospital',kind:'town-to-hospital',hometown:0,fromFloor:1000,toFloor:1005,expectedCount:2});
addExactPair({id:'1005_to_1000_hospital_return',kind:'hospital-to-town',hometown:0,fromFloor:1005,toFloor:1000,expectedCount:2});
addExactPair({id:'2000_to_2005_hospital',kind:'town-to-hospital',hometown:1,fromFloor:2000,toFloor:2005,expectedCount:1});
addExactPair({id:'2005_to_2000_hospital_return',kind:'hospital-to-town',hometown:1,fromFloor:2005,toFloor:2000,expectedCount:2});
addExactPair({id:'3000_to_3005_hospital',kind:'town-to-hospital',hometown:2,fromFloor:3000,toFloor:3005,expectedCount:1});
addExactPair({id:'3005_to_3000_hospital_return',kind:'hospital-to-town',hometown:2,fromFloor:3005,toFloor:3000,expectedCount:2});
addExactPair({id:'4000_to_4005_hospital',kind:'town-to-hospital',hometown:3,fromFloor:4000,toFloor:4005,expectedCount:1});
addExactPair({id:'4005_to_4000_hospital_return',kind:'hospital-to-town',hometown:3,fromFloor:4005,toFloor:4000,expectedCount:2});

const encounterReturn=groups.filter(g=>g.kind==='encounter-return');
const hospitalForward=groups.filter(g=>g.kind==='town-to-hospital');

if(encounterReturn.length!==8)throw new Error('expected 8 encounter-return groups');
if(hospitalForward.length!==4)throw new Error('expected 4 town-to-hospital groups');

const result={
  format:'stoneage-idle-supply-warp-catalog-v1',
  generatedAt:new Date().toISOString().slice(0,10),
  purpose:'Exact source-backed portal subset for idle supply return routing. No synthetic portal rows.',
  fixedSource:{
    repository:'gavinlinasd/StoneAge',
    ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
    path:sourcePath,
    blobSha
  },
  sourceContracts:{
    reverseEncounterPortals:'data/generated/stoneage_start_destination_warp_coordinates.json, rows reversed without coordinate alteration',
    hospitalPortals:'gmsv/data/map/mapwarp.txt exact NONE:NULL pair rows'
  },
  statistics:{
    encounterReturnGroupCount:encounterReturn.length,
    encounterReturnRowCount:encounterReturn.reduce((n,g)=>n+g.rows.length,0),
    townHospitalGroupCount:hospitalForward.length,
    townHospitalRowCount:hospitalForward.reduce((n,g)=>n+g.rows.length,0),
    totalGroupCount:groups.length,
    totalRowCount:groups.reduce((n,g)=>n+g.rows.length,0)
  },
  groups
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pass:true,format:result.format,fixedSource:result.fixedSource,statistics:result.statistics,output:out},null,2));
