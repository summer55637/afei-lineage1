#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const args=process.argv.slice(2);
const value=(name,fallback=null)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback;};
const root=path.resolve(value('--source-root','/tmp/StoneAge'));
const out=path.resolve(value('--out','data/generated/stoneage_npc_itemshop_runtime.json'));
const fixedRef='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

function fail(m){console.error('NPC ItemShop generation FAILED:',m);process.exit(1);}
if(!fs.existsSync(root))fail('source root missing: '+root);
const npcRoot=path.join(root,'gmsv/data/npc');
if(!fs.existsSync(npcRoot))fail('NPC root missing: '+npcRoot);
if(fs.existsSync(path.join(root,'.git'))){
  try{
    const head=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
    if(head!==fixedRef)fail('source checkout HEAD must equal pinned ref '+fixedRef+'; got '+head);
  }catch(error){
    fail('could not verify source checkout ref: '+String(error?.message??error));
  }
}

function walk(dir,out=[]){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory())walk(p,out);
    else if(e.isFile())out.push(p);
  }
  return out;
}
function gitBlobSha(bytes){
  const header=Buffer.from('blob '+bytes.length+'\\0','utf8');
  return crypto.createHash('sha1').update(Buffer.concat([header,bytes])).digest('hex');
}
function sha256(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
function rel(p){return path.relative(root,p).replaceAll(path.sep,'/');}
function relNpc(p){return path.relative(npcRoot,p).replaceAll(path.sep,'/');}

function parseBlocks(text){
  const lines=text.replace(/\\r/g,'').split('\\n');
  const out=[];let cur=null,blockIndex=0;
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    if(line==='{'){cur={startLine:i+1,keys:{}};continue;}
    if(!cur)continue;
    if(line==='}'){out.push({...cur,blockIndex});blockIndex++;cur=null;continue;}
    if(line.startsWith('#'))continue;
    const eq=line.indexOf('=');
    if(eq>0){
      const k=line.slice(0,eq).trim().toLowerCase();
      const v=line.slice(eq+1).trim();
      (cur.keys[k]??=[]).push(v);
    }
  }
  return out;
}
const first=a=>Array.isArray(a)&&a.length?a[0]:null;
const numberOrNull=v=>{const n=Number(v);return Number.isFinite(n)?n:null;};
function rect(v){
  if(!v)return null;
  const a=v.split(',').map(Number);
  return a.length===4&&a.every(Number.isFinite)?{x1:a[0],y1:a[1],x2:a[2],y2:a[3]}:null;
}
function parseEnemy(v){
  if(!v)return null;
  const parts=v.split('|');
  const template=parts.shift()?.trim()||null;
  const file=parts.find(x=>x.trim().toLowerCase().startsWith('file:'));
  return {raw:v,templateName:template,fileRef:file?file.trim().slice(5).replaceAll('\\\\','/'):null};
}
function parseEntry(raw){
  const token=String(raw??'').trim();if(!token)return null;
  if(!token.includes('-')){
    const id=Number(token);
    return Number.isInteger(id)&&id>=0?{raw:token,kind:'item',itemId:id}:null;
  }
  const p=token.split('-');if(p.length!==2)return null;
  const start=Number(p[0]),end=Number(p[1]);
  if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<0)return null;
  return {raw:token,kind:'range',start,end,inclusive:true};
}
function expandBuy(entry){
  if(entry.kind==='item')return [entry.itemId];
  let start=entry.start,end=entry.end+1;
  if(start>end){const t=start;start=end;end=t;}
  const out=[];
  for(let x=start;x<end;x++)out.push(x);
  return out;
}
function parseList(text){
  if(!text)return {entries:[],itemIds:[]};
  const entries=text.split(',').map(parseEntry).filter(Boolean);
  const ids=[];for(const entry of entries)ids.push(...expandBuy(entry));
  return {entries,itemIds:[...new Set(ids)]};
}
function parseArg(text){
  const obj={};
  for(const raw of text.replace(/\\r/g,'').split('\\n')){
    const line=raw.trim();
    if(!line||line.startsWith('#'))continue;
    const idx=line.indexOf(':');
    if(idx<=0)continue;
    obj[line.slice(0,idx).trim()]=line.slice(idx+1).trim();
  }
  return obj;
}

const shops=[];
const unresolved=[];
for(const f of walk(npcRoot).sort()){
  if(!/\\.create$/i.test(f))continue;
  const createBytes=fs.readFileSync(f);
  for(const b of parseBlocks(createBytes.toString('utf8'))){
    const k=b.keys;
    for(const enemyRaw of (k.enemy??[])){
      const enemy=parseEnemy(enemyRaw);
      if(!enemy||String(enemy.templateName??'').toLowerCase()!=='npcgen_shop')continue;
      const createSource={path:rel(f),blobSha:gitBlobSha(createBytes),sha256:sha256(createBytes),blockIndex:b.blockIndex,startLine:b.startLine};
      if(!enemy.fileRef){
        unresolved.push({source:createSource,reason:'shop-arg-file-ref-missing'});
        continue;
      }
      const argPath=path.join(npcRoot,enemy.fileRef);
      if(!fs.existsSync(argPath)){
        unresolved.push({source:createSource,reason:'shop-arg-file-missing',fileRef:enemy.fileRef});
        continue;
      }
      const argBytes=fs.readFileSync(argPath);
      const argText=argBytes.toString('utf8');
      const arg=parseArg(argText);
      const list=parseList(arg.ItemList);
      const shopId=rel(f)+'#'+b.blockIndex;
      shops.push({
        shopId,
        floorId:numberOrNull(first(k.floorid)),
        bornCorner:rect(first(k.borncorner)),
        name:first(k.name),
        templateName:'npcgen_shop',
        source:{
          create:createSource,
          arg:{path:relNpc(argPath),blobSha:gitBlobSha(argBytes),sha256:sha256(argBytes)}
        },
        argKeys:Object.keys(arg).sort(),
        buyRate:numberOrNull(arg.buy_rate)??1,
        sellRate:numberOrNull(arg.sell_rate),
        itemListRaw:arg.ItemList??'',
        itemEntries:list.entries,
        itemIds:list.itemIds,
        limitItemType:(arg.LimitItemType??'').split(',').map(x=>x.trim()).filter(Boolean),
        limitItemNo:(arg.LimitItemNo??'').split(',').map(parseEntry).filter(Boolean),
        specialRate:numberOrNull(arg.special_rate),
        specialItemEntries:(arg.special_item??'').split(',').map(parseEntry).filter(Boolean),
        sourceFlags:{
          limitShop:argText.includes('LIMITSHOP'),
          event:argText.includes('EVENT'),
          express:argText.includes('EXPRESS')
        }
      });
    }
  }
}
shops.sort((a,b)=>a.source.create.path.localeCompare(b.source.create.path)||a.source.create.blockIndex-b.source.create.blockIndex);
const byShopId=Object.fromEntries(shops.map(x=>[x.shopId,x]));
const itemIndex={};
for(const shop of shops){
  shop.itemIds.forEach((itemId,offerIndex)=>{
    (itemIndex[String(itemId)]??=[]).push({shopId:shop.shopId,offerIndex,buyRate:shop.buyRate,source:shop.source});
  });
}
for(const rows of Object.values(itemIndex))rows.sort((a,b)=>String(a.shopId).localeCompare(String(b.shopId))||a.offerIndex-b.offerIndex);

const catalog={
  format:'stoneage-npc-itemshop-runtime-v1',
  generatedAt:'2026-09-30',
  fixedSource:{repository:'gavinlinasd/StoneAge',ref:fixedRef},
  parser:{
    createFileGlob:'gmsv/data/npc/**/*.create',
    shopTemplate:'npcgen_shop',
    argFileReference:'enemy=npcgen_shop|file:...',
    itemList:'comma-separated ItemList; single IDs and inclusive ranges',
    buyRangeCompatibility:'matches NPC_SetNewItem range ordering, including end++ before reverse-order swap behavior',
    buyPrice:'trunc(ITEM_getcostFromITEMtabl(itemId) * buy_rate)',
    sellRate:'special_item/special_rate takes precedence over sell_rate when Item matches',
    sellEligibility:'LimitItemType is evaluated before LimitItemNo'
  },
  stats:{
    shopBindings:shops.length,
    unresolvedBindings:unresolved.length,
    totalOfferRows:shops.reduce((n,s)=>n+s.itemIds.length,0),
    distinctItemIds:Object.keys(itemIndex).length,
    shopsWithLimitItemType:shops.filter(s=>s.limitItemType.length).length,
    shopsWithLimitItemNo:shops.filter(s=>s.limitItemNo.length).length,
    shopsWithSpecialSellRate:shops.filter(s=>s.specialItemEntries.length).length
  },
  shops:byShopId,
  itemIndex,
  unresolved
};

fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(catalog,null,2)+'\\n');
console.log(JSON.stringify({pass:true,fixedSource:'gavinlinasd/StoneAge@'+fixedRef,stats:catalog.stats,output:out}));
