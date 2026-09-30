#!/usr/bin/env node
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const sourceRoot=process.argv[2] ?? '/tmp/StoneAge';
const fixedRef='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const serviceIndexPath='data/generated/stoneage_npc_service_index.json';

function run(file,args,out){
  execFileSync('node',[file,'--source-root',sourceRoot,'--out-dir',out],{stdio:'inherit'});
}
function fail(msg){throw new Error(msg);}
function npcRelativePath(p){
  const value=String(p??'').replaceAll('\\\\','/');
  return value.startsWith('gmsv/data/npc/')?value.slice('gmsv/data/npc/'.length):value;
}
function fixedShopTemplateName(path,blockIndex){
  const normalized=npcRelativePath(path);
  if(normalized!=='genout/npcgen.template')return null;
  if(Number(blockIndex)===8)return 'npcgen_shop';
  if(Number(blockIndex)===9)return 'npcgen_limitshop';
  return null;
}

fs.rmSync('/tmp/v342-world',{recursive:true,force:true});
fs.mkdirSync('/tmp/v342-world',{recursive:true});
execFileSync('node',['tools/generate_world_data_catalog.mjs','--source-root',sourceRoot,'--out-dir','/tmp/v342-world'],{stdio:'inherit'});
execFileSync('node',['tools/generate_npc_itemshop_runtime.mjs','--source-root',sourceRoot,'--out','/tmp/v342-world/stoneage_npc_itemshop_runtime.json'],{stdio:'inherit'});

const world=JSON.parse(fs.readFileSync('/tmp/v342-world/stoneage_world_npc_index.json','utf8'));
const catalog=JSON.parse(fs.readFileSync('/tmp/v342-world/stoneage_npc_itemshop_runtime.json','utf8'));
const service=JSON.parse(fs.readFileSync(serviceIndexPath,'utf8'));
const serviceShop=service.services.find(x=>String(x.functionSet).toLowerCase()==='itemshop');
if(!serviceShop)fail('repo service index missing ItemShop');

const worldBindings=[];
for(const create of world.creates||[]){
  for(const enemy of create.enemy||[]){
    const candidates=(enemy.templateCandidates||[]).filter(t=>String(t.functionSet??'').toLowerCase()==='itemshop');
    for(const candidate of candidates){
      worldBindings.push({
        key:npcRelativePath(create.path)+'#'+create.blockIndex,
        path:create.path,
        blockIndex:create.blockIndex,
        floorId:create.floorId,
        templateName:candidate.templateName,
        candidatePath:candidate.path,
        candidateBlockIndex:candidate.blockIndex,
        fileRef:enemy.fileRef,
        enemyRaw:enemy.raw
      });
    }
  }
}

const catalogBindings=[];
for(const shop of Object.values(catalog.shops)){
  catalogBindings.push({
    key:npcRelativePath(shop.source.create.path)+'#'+shop.source.create.blockIndex,
    path:shop.source.create.path,
    blockIndex:shop.source.create.blockIndex,
    floorId:shop.floorId,
    templateName:shop.templateName,
    fileRef:shop.source.arg?.path??null,
    shopId:shop.shopId,
    sellOnly:shop.sellOnly===true
  });
}
for(const row of catalog.unresolved||[]){
  catalogBindings.push({
    key:npcRelativePath(row.source.path)+'#'+row.source.blockIndex,
    path:row.source.path,
    blockIndex:row.source.blockIndex,
    floorId:null,
    templateName:null,
    fileRef:row.fileRef??null,
    unresolved:true,
    reason:row.reason
  });
}

const worldByKey=new Map(worldBindings.map(x=>[x.key,x]));
const expectedUnresolvedKey='my/magicdou/daochang.create#8';
const unexpectedWorld=worldBindings.filter(x=>!catalogBindings.some(y=>y.key===x.key));
const unexpectedCatalog=catalogBindings.filter(x=>!worldByKey.has(x.key));
if(worldBindings.length!==336)fail('world ItemShop candidate refs expected 336, got '+worldBindings.length);
if(catalogBindings.length!==336)fail('catalog ItemShop bindings including unresolved expected 336, got '+catalogBindings.length);
if(serviceShop.instanceCount!==336)fail('service index ItemShop instances expected 336, got '+serviceShop.instanceCount);
if(serviceShop.uniqueFloorCount!==190)fail('service index ItemShop unique floors expected 190, got '+serviceShop.uniqueFloorCount);
if(unexpectedWorld.length)fail('world ItemShop refs missing from catalog: '+unexpectedWorld.map(x=>x.key).join(','));
if(unexpectedCatalog.length)fail('catalog bindings missing from world index: '+unexpectedCatalog.map(x=>x.key).join(','));

for(const row of catalog.shops ? Object.values(catalog.shops) : []){
  const worldRow=worldByKey.get(npcRelativePath(row.source.create.path)+'#'+row.source.create.blockIndex);
  if(worldRow.floorId!==row.floorId)fail('floor join mismatch '+row.shopId+': world='+worldRow.floorId+' catalog='+row.floorId);
  const worldTemplateName=fixedShopTemplateName(worldRow.candidatePath,worldRow.candidateBlockIndex) ?? worldRow.templateName ?? null;
  if(!worldTemplateName || worldTemplateName.toLowerCase()!==row.templateName.toLowerCase())fail('template join mismatch '+row.shopId+': world='+worldTemplateName+' catalog='+row.templateName);
  if(row.source.arg?.path!==worldRow.fileRef)fail('arg fileRef join mismatch '+row.shopId+': world='+worldRow.fileRef+' catalog='+row.source.arg?.path);
}

const unresolved=catalog.unresolved||[];
if(unresolved.length!==1)fail('expected exactly one unresolved source anomaly, got '+unresolved.length);
const u=unresolved[0];
if(npcRelativePath(u.source?.path)+'#'+u.source?.blockIndex!==expectedUnresolvedKey || u.reason!=='shop-arg-file-missing' || u.fileRef!=='my/ruieryasi/yao.arg'){
  fail('known unresolved source anomaly drifted: '+JSON.stringify(u));
}
const unresolvedWorld=worldByKey.get(expectedUnresolvedKey);
if(!unresolvedWorld)fail('unresolved source create block missing from world index');
if(unresolvedWorld.floorId!==7102)fail('unresolved source floor drift: '+unresolvedWorld.floorId);

const resolvedFloors=[...new Set(Object.values(catalog.shops).map(x=>x.floorId).filter(Number.isFinite))];
const worldItemShopFloors=[...new Set(worldBindings.map(x=>x.floorId).filter(Number.isFinite))];
const itemMake=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const missingSourceItems=[...new Set(Object.keys(catalog.itemIndex).map(Number).filter(id=>!itemMake.byItemId?.[String(id)]))];
if(missingSourceItems.length)fail('formal buy offer Item source templates missing: '+missingSourceItems.slice(0,50).join(','));

console.log(JSON.stringify({
  pass:true,
  fixedSource:'gavinlinasd/StoneAge@'+fixedRef,
  worldItemShopInstances:worldBindings.length,
  catalogBindingsIncludingUnresolved:catalogBindings.length,
  resolvedCatalogBindings:Object.keys(catalog.shops).length,
  unresolvedBindings:unresolved.length,
  serviceIndexItemShopInstances:serviceShop.instanceCount,
  serviceIndexItemShopFloors:serviceShop.uniqueFloorCount,
  worldItemShopFloors:worldItemShopFloors.length,
  resolvedCatalogFloors:resolvedFloors.length,
  formalBuyOfferMissingSourceItems:missingSourceItems.length,
  knownSourceAnomaly:u
}));
