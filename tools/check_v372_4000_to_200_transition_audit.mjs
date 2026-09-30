#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourceRoot=path.resolve(process.argv[2]??'/tmp/StoneAge');
const fixedRef='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const read=p=>fs.readFileSync(path.join(sourceRoot,p),'utf8');
const files=[];
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(ent.isFile())files.push(p);}}
walk(path.join(sourceRoot,'gmsv'));

const mapwarp=read('gmsv/data/map/mapwarp.txt').replace(/\r/g,'').split('\n').map((line,i)=>({line:i+1,raw:line.trim()})).filter(x=>x.raw&&!x.raw.startsWith('#'));
const point=s=>{const a=String(s??'').split(',').map(Number);return a.length===3&&a.every(Number.isFinite)?{floor:a[0],x:a[1],y:a[2]}:null;};
const mapwarpTransitions=mapwarp.filter(row=>{const p=row.raw.split(':');return p.length>=4&&point(p[2])?.floor===4000&&point(p[3])?.floor===200;}).map(row=>({line:row.line,raw:row.raw}));

function parseCreate(text){
  const lines=text.replace(/\r/g,'').split('\n');
  const rows=[]; let floor=null; let bornCorner=null; let blockStart=0; let enemy=[]; let inBlock=false;
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    if(line==='{'){inBlock=true;floor=null;bornCorner=null;enemy=[];blockStart=i+1;continue;}
    if(!inBlock)continue;
    if(line==='}'){rows.push({startLine:blockStart,floor,bornCorner,enemy:enemy.slice()});inBlock=false;continue;}
    const eq=line.indexOf('='); if(eq<=0)continue;
    const k=line.slice(0,eq).trim().toLowerCase(),v=line.slice(eq+1).trim();
    if(k==='floorid')floor=Number(v);
    if(k==='borncorner')bornCorner=v.split(',').map(Number);
    if(k==='enemy')enemy.push(v);
  }
  return rows;
}
const npcWarpRows=[];
for(const file of files.filter(f=>/\.create$/i.test(f))){
  const rel=path.relative(sourceRoot,file).replaceAll(path.sep,'/');
  for(const block of parseCreate(fs.readFileSync(file,'utf8'))){
    for(const raw of block.enemy){
      const parts=raw.split('|');
      if(String(parts[0]).trim().toLowerCase()!=='npcgen_warp')continue;
      const targetFloor=Number(parts[1]);
      if(block.floor===4000&&targetFloor===200)npcWarpRows.push({path:rel,startLine:block.startLine,origin:block.bornCorner,target:[Number(parts[1]),Number(parts[2]),Number(parts[3])],raw});
    }
  }
}

const sourceTextCandidates=[];
const srcFiles=files.filter(f=>/\.(c|h|cpp|cc|inc|mak|cf)$/i.test(f));
for(const file of srcFiles){
  const lines=fs.readFileSync(file,'utf8').replace(/\r/g,'').split('\n');
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(!/4000/.test(line)||!/200/.test(line))continue;
    const window=lines.slice(Math.max(0,i-8),Math.min(lines.length,i+9)).join('\n');
    if(!/(warp|teleport|transfer|floor|mapwarp)/i.test(window))continue;
    sourceTextCandidates.push({path:path.relative(sourceRoot,file).replaceAll(path.sep,'/'),line:i+1,text:line.trim()});
  }
}
const literal200WarpCalls=[];
for(const file of srcFiles){
  const lines=fs.readFileSync(file,'utf8').replace(/\r/g,'').split('\n');
  for(let i=0;i<lines.length;i++){
    if(!/warp/i.test(lines[i])||!/200/.test(lines[i]))continue;
    if(/(?:CHAR|NPC|MAP|WARP|teleport|warpTo)/i.test(lines[i])) literal200WarpCalls.push({path:path.relative(sourceRoot,file).replaceAll(path.sep,'/'),line:i+1,text:lines[i].trim()});
  }
}

assert.equal(mapwarpTransitions.length,4);
assert.equal(npcWarpRows.length,4);
const normalizeTarget=row=>row.from?[row.from[1],row.from[2],row.to?.[1],row.to?.[2]]:null;
const mapwarpPairs=mapwarpTransitions.map(row=>{const p=row.raw.split(':');return {from:p[2].split(',').map(Number),to:p[3].split(',').map(Number)};}).sort((a,b)=>a.from[1]-b.from[1]||a.from[2]-b.from[2]);
const npcTargets=npcWarpRows.map(x=>x.target.slice(1)).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
const npcPairs=npcWarpRows.map(x=>({from:[4000,Number(x.origin?.[0]),Number(x.origin?.[1])],to:[200,x.target[1],x.target[2]]})).sort((a,b)=>a.from[1]-b.from[1]||a.from[2]-b.from[2]);
const expectedTargets=[[101,96,301,640],[101,97,301,641],[104,55,304,599],[104,56,304,600]];
assert.deepEqual(mapwarpPairs.map(x=>[x.from[1],x.from[2],x.to[1],x.to[2]]),expectedTargets);
assert.deepEqual(npcPairs.map(x=>[x.from[1],x.from[2],x.to?.[1],x.to?.[2]]),expectedTargets);

const knownNpcCreate=npcWarpRows.map(x=>x.path+'#'+x.startLine).join('|');
const mapwarpKnown=mapwarpTransitions.map(x=>({line:x.line,raw:x.raw}));
const directLiteralCandidates=sourceTextCandidates.filter(x=>/CHAR_warpToSpecificPoint|npcgen_warp|NPC_Warp|MAP_warp|warpToSpecificPoint/i.test(x.text));

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v372-4000-to-200-transition-audit-v1',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:fixedRef},
  mapwarpDirect4000To200Rows:mapwarpTransitions.length,
  npcDirect4000To200Rows:npcWarpRows.length,
  npcDirectTargets:npcTargets,
  source4000And200WarpContextCandidates:sourceTextCandidates.length,
  directLiteral200WarpCallLines:literal200WarpCalls.length,
  directLiteralCandidates,
  knownNpcCreateBlocks:knownNpcCreate,
  transitionRepresentationsMatch:true,
  conclusion:'pinned source exposes four 4000->200 mapwarp rows and four matching NPC warp rows; they are the same two double-cell transitions. No alternate transition was found. V3.62 movement blocker remains unresolved because reaching the warp origins is still required.'
},null,2));