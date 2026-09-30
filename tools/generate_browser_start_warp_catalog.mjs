
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args=process.argv.slice(2);
const sourceRoot=path.resolve(args[args.indexOf('--source-root')+1]||'/tmp/StoneAge');
const out=path.resolve(args[args.indexOf('--out')+1]||'data/generated/stoneage_browser_start_warp_catalog.json');
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const npcRoot=path.join(sourceRoot,'gmsv/data/npc');
const startFloors=new Set([1006,2006,3006,4006]);

function walk(dir,out=[]){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory())walk(p,out); else if(e.isFile())out.push(p);
  }
  return out;
}
function norm(v){
  let s=String(v??'').replaceAll('\\','/').trim().replace(/^\.\/+/, '');
  if(s.startsWith('gmsv/data/npc/'))s=s.slice('gmsv/data/npc/'.length);
  return s;
}
function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function parseBlocks(text){
  const lines=text.replace(/\r/g,'').split('\n');
  const blocks=[]; let cur=null,index=0;
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    if(line==='{'){cur={blockIndex:index++,startLine:i+1,keys:{}};continue;}
    if(!cur)continue;
    if(line==='}'){blocks.push(cur);cur=null;continue;}
    if(line.startsWith('#')||!line)continue;
    const eq=line.indexOf('=');
    if(eq<=0)continue;
    const k=line.slice(0,eq).trim().toLowerCase(),v=line.slice(eq+1).trim();
    (cur.keys[k]??=[]).push(v);
  }
  return blocks;
}
function first(a){return Array.isArray(a)&&a.length?a[0]:null;}
function parseRect(v){
  if(!v)return null;
  const a=String(v).split(',').map(x=>Number(x.trim()));
  return a.length===4&&a.every(Number.isFinite)?{x1:a[0],y1:a[1],x2:a[2],y2:a[3]}:null;
}
function parseStandardWarp(raw){
  const parts=String(raw??'').split('|').map(x=>x.trim());
  if(parts[0]?.toLowerCase()!=='npcgen_warp')return {ok:false,reason:'not-npcgen-warp'};
  if(parts.length!==4)return {ok:false,reason:'nonstandard-warp-argument'};
  const nums=parts.slice(1).map(Number);
  if(!nums.every(Number.isInteger))return {ok:false,reason:'warp-target-not-integer'};
  const [floorId,x,y]=nums;
  if(floorId<0||x<0||y<0)return {ok:false,reason:'warp-target-negative'};
  return {ok:true,floorId,x,y,standardArg:parts.slice(1).join('|')};
}
if(!fs.existsSync(sourceRoot))throw new Error('source root missing: '+sourceRoot);

const templatePath=path.join(npcRoot,'genout/npcgen.template');
const warpSourcePath=path.join(sourceRoot,'gmsv/src/npc/npc_warp.c');
if(!fs.existsSync(templatePath))throw new Error('pinned npcgen template missing');
if(!fs.existsSync(warpSourcePath))throw new Error('pinned npc_warp.c missing');
const templateSha=sha256(templatePath);
const templateBlock=parseBlocks(fs.readFileSync(templatePath,'utf8')).find(b=>String(first(b.keys.templatename)).trim().toLowerCase()==='npcgen_warp');
if(!templateBlock)throw new Error('npcgen_warp template missing');
if(String(first(templateBlock.keys.functionset)).trim()!=='Warp')throw new Error('npcgen_warp functionset drift');

const files=walk(npcRoot).filter(p=>/\.create$|\.creata$/i.test(p)).sort();
const rows=[]; const unresolved=[];
for(const file of files){
  const rel=norm(path.relative(npcRoot,file));
  const blobSha=sha256(file);
  for(const block of parseBlocks(fs.readFileSync(file,'utf8'))){
    const floor=Number(first(block.keys.floorid));
    if(!startFloors.has(floor))continue;
    const born=parseRect(first(block.keys.borncorner));
    for(const raw of block.keys.enemy??[]){
      const parts=String(raw).split('|').map(x=>x.trim());
      if(parts[0]?.toLowerCase()!=='npcgen_warp')continue;
      const sourceKey=rel+'#'+block.blockIndex;
      if(!born||born.x1!==born.x2||born.y1!==born.y2){unresolved.push({sourceKey,reason:'warp-origin-not-exact-point',born});continue;}
      const parsed=parseStandardWarp(raw);
      if(!parsed.ok){unresolved.push({sourceKey,reason:parsed.reason,raw});continue;}
      rows.push({
        format:'stoneage-browser-start-warp-row-v1',
        sourceKey,
        fixedSource:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF},
        createPath:rel,
        createBlockIndex:block.blockIndex,
        startLine:block.startLine,
        sourceBlobSha:blobSha,
        templateName:'npcgen_warp',
        functionSet:'Warp',
        origin:{floorId:floor,x:born.x1,y:born.y1},
        target:{floorId:parsed.floorId,x:parsed.x,y:parsed.y},
        standardArg:parsed.standardArg,
        rawEnemy:raw
      });
    }
  }
}

rows.sort((a,b)=>a.origin.floorId-b.origin.floorId||a.origin.x-b.origin.x||a.origin.y-b.origin.y||a.sourceKey.localeCompare(b.sourceKey));
const expectedSources=[
  'genout/warp_y.create#23','genout/warp_y.create#25','genout/warp_y.create#153','genout/warp_y.create#155',
  'genout/warp_y2.create#17','genout/warp_y2.create#18','genout/warp_y2.create#63','genout/warp_y2.create#65'
];
const actualSources=rows.map(x=>x.sourceKey);
for(const key of expectedSources)if(!actualSources.includes(key))unresolved.push({sourceKey:key,reason:'expected-start-warp-source-not-found'});

const catalog={
  format:'stoneage-browser-start-warp-catalog-v1',
  generatedAt:'2026-10-01',
  fixedSource:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF},
  sourceContracts:{
    template:{path:'gmsv/data/npc/genout/npcgen.template',templateName:'npcgen_warp',functionSet:'Warp',blobSha:templateSha},
    runtimeInit:{path:'gmsv/src/npc/npc_warp.c',function:'NPC_WarpInit'},
    runtimeWatch:{path:'gmsv/src/npc/npc_warp.c',function:'NPC_WarpWatch'},
    runtimeExecute:{path:'gmsv/src/npc/npc_warp.c',function:'NPC_WarpWarpCharacter',argument:'floor|x|y'}
  },
  scope:{startFloors:[1006,2006,3006,4006]},
  statistics:{rowCount:rows.length,unresolvedCount:unresolved.length,sourceCreateCount:new Set(rows.map(x=>x.createPath)).size,hometownFloorCount:new Set(rows.map(x=>x.origin.floorId)).size},
  policy:{
    activation:'NPC_WarpWatch receives CHAR_ACTWALK when the player walks onto the Warp NPC cell',
    execution:'NPC_WarpWarpCharacter reads the Warp NPC standard floor|x|y argument and calls CHAR_warpToSpecificPoint after coordinate validation',
    unsupported:'FREEMORE/conditional multi-destination Warp arguments are not interpreted in this catalog and remain fail-closed',
    browserBoundary:'Browser runtime persists only world.position and Save Envelope; server-side chat/drop-stake side effects are outside this state boundary'
  },
  rows
};

fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(catalog,null,2)+'\n');
if(rows.length!==8||unresolved.length!==0){
  console.error(JSON.stringify({pass:false,reason:'start-warp-catalog-not-closed',statistics:catalog.statistics,unresolved},null,2));
  process.exit(1);
}
console.log(JSON.stringify({pass:true,fixedSource:SOURCE_REPOSITORY+'@'+SOURCE_REF,statistics:catalog.statistics,output:out}));
