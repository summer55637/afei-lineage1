#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args=process.argv.slice(2);
const sourceRoot=path.resolve(args[args.indexOf('--source-root')+1]||'/tmp/StoneAge');
const out=path.resolve(args[args.indexOf('--out')+1]||'data/generated/stoneage_npc_savepoint_source_index.json');
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const npcRoot=path.join(sourceRoot,'gmsv/data/npc');

function walk(dir,out=[]){ for(const e of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,e.name); if(e.isDirectory())walk(p,out); else if(e.isFile())out.push(p); } return out; }
function norm(v){ let s=String(v??'').replaceAll('\\\\','/').trim().replace(/^\.\/+/, ''); if(s.startsWith('gmsv/data/npc/'))s=s.slice('gmsv/data/npc/'.length); return s; }
function parseBlocks(text){ const lines=text.replace(/\r/g,'').split('\n'); const out=[]; let cur=null,idx=0; for(let i=0;i<lines.length;i++){ const line=lines[i].trim(); if(line==='{'){cur={startLine:i+1,keys:{}};continue;} if(!cur)continue; if(line==='}'){out.push({...cur,blockIndex:idx++});cur=null;continue;} if(line.startsWith('#')||!line)continue; const eq=line.indexOf('='); if(eq<=0)continue; const k=line.slice(0,eq).trim().toLowerCase(); const v=line.slice(eq+1).trim(); (cur.keys[k]??=[]).push(v); } return out; }
function first(a){return Array.isArray(a)&&a.length?a[0]:null;}
function parseEnemy(v){ if(!v)return {templateName:null,fileRef:null,raw:null}; const parts=v.split('|'); const templateName=String(parts.shift()??'').trim()||null; const extra=parts.map(x=>x.trim()).filter(Boolean); const fp=extra.find(x=>/^file:/i.test(x)); return {templateName,fileRef:fp?norm(fp.slice(5)):null,raw:v}; }
function parseArg(text){ const key={}; let noItem=String(text??'').toUpperCase().includes('NOITEM'); for(const raw of text.replace(/\r/g,'').split('\n')){ const line=raw.trim(); if(!line||line.startsWith('#'))continue; if(/^NOITEM\b/i.test(line)){noItem=true;continue;} const eq=line.indexOf('='); if(eq<=0)continue; const k=line.slice(0,eq).trim(); const v=line.slice(eq+1).trim(); key[k]=v; } return {key,noItem}; }
function parseBorn(v){ if(!v)return null; const a=v.split(',').map(x=>Number(x.trim())); return a.length>=3&&a.slice(0,3).every(Number.isFinite)?{floorId:a[0],x:a[1],y:a[2]}:null; }

if(!fs.existsSync(sourceRoot))throw new Error('source root missing: '+sourceRoot);
const files=walk(npcRoot);
const templates=new Map();
for(const f of files.filter(p=>/\.template$|\.templete$/i.test(p))){ for(const b of parseBlocks(fs.readFileSync(f,'utf8'))){ const name=first(b.keys.templatename); if(name)templates.set(String(name).trim().toLowerCase(),{path:norm(path.relative(npcRoot,f)),blockIndex:b.blockIndex,functionSet:first(b.keys.functionset)}); } }
const rows=[]; const unresolved=[];
for(const f of files.filter(p=>/\.create$|\.creata$/i.test(p))){
  for(const c of parseBlocks(fs.readFileSync(f,'utf8'))){
    for(const rawEnemy of c.keys.enemy??[]){
      const enemy=parseEnemy(rawEnemy);
      if(String(enemy.templateName??'').trim().toLowerCase()!=='npcgen_savepoint')continue;
      const sourceKey=norm(path.relative(npcRoot,f))+'#'+c.blockIndex;
      const template=templates.get('npcgen_savepoint');
      if(!template||String(template.functionSet??'').toLowerCase()!=='savepoint'){ unresolved.push({sourceKey,reason:'savepoint-template-functionset-unresolved'}); continue; }
      if(!enemy.fileRef){ unresolved.push({sourceKey,reason:'savepoint-arg-file-ref-missing'}); continue; }
      const argPath=path.join(npcRoot,enemy.fileRef);
      if(!fs.existsSync(argPath)){ unresolved.push({sourceKey,reason:'savepoint-arg-file-missing',fileRef:enemy.fileRef}); continue; }
      const rawArg=fs.readFileSync(argPath,'utf8'); const parsed=parseArg(rawArg);
      const id=Number(parsed.key.ID); const born=parseBorn(parsed.key.Born);
      if(!Number.isInteger(id)||id<0||id>127){ unresolved.push({sourceKey,reason:'savepoint-id-invalid',id:parsed.key.ID??null}); continue; }
      if(!born){ unresolved.push({sourceKey,reason:'savepoint-born-invalid',Born:parsed.key.Born??null}); continue; }
      const mode=parsed.noItem?'no-item':(parsed.key.GetItem!=null?'item-required':'confirm-only');
      if(!mode){ unresolved.push({sourceKey,reason:'savepoint-item-mode-unresolved'}); continue; }
      rows.push({sourceKey,functionSet:'SavePoint',templateName:'npcgen_savepoint',templatePath:template.path,templateBlockIndex:template.blockIndex,createPath:norm(path.relative(npcRoot,f)),createBlockIndex:c.blockIndex,floorId:Number(c.keys.floorid?.[0]??NaN),born,elderId:id,id,mode,rawArg,sourceArgPath:enemy.fileRef});
    }
  }
}
const catalog={format:'stoneage-npc-savepoint-source-index-v1',generatedAt:'2026-09-30',fixedSource:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF},statistics:{savePointInstanceCount:rows.length,unresolvedCount:unresolved.length,noItemCount:rows.filter(x=>x.mode==='no-item').length,itemRequiredCount:rows.filter(x=>x.mode==='item-required').length,confirmOnlyCount:rows.filter(x=>x.mode==='confirm-only').length},bySourceKey:Object.fromEntries(rows.map(x=>[x.sourceKey,x])),unresolved};
fs.mkdirSync(path.dirname(out),{recursive:true}); fs.writeFileSync(out,JSON.stringify(catalog,null,2)+'\n');
if(rows.length+unresolved.length!==28) { console.error(JSON.stringify({pass:false,reason:'unexpected-savepoint-instance-count',statistics:catalog.statistics})); process.exit(1); }
if(unresolved.length) { console.error(JSON.stringify({pass:false,reason:'savepoint-source-unresolved',statistics:catalog.statistics,unresolved})); process.exit(1); }
if(catalog.statistics.itemRequiredCount!==27||catalog.statistics.confirmOnlyCount!==1||catalog.statistics.noItemCount!==0) { console.error(JSON.stringify({pass:false,reason:'unexpected-savepoint-source-mode-count',statistics:catalog.statistics})); process.exit(1); }
console.log(JSON.stringify({pass:true,fixedSource:SOURCE_REPOSITORY+'@'+SOURCE_REF,statistics:catalog.statistics,output:out}));
