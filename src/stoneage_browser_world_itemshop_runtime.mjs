const BROWSER_WORLD_ITEMSHOP_RUNTIME_FORMAT='stoneage-browser-world-itemshop-runtime-v1';
const WORLD_NPC_INDEX_FORMAT='stoneage-world-npc-index-v1';
const NPC_ITEMSHOP_CATALOG_FORMAT='stoneage-npc-itemshop-runtime-v1';

import {
  createBrowserItemShopRuntime,
  BROWSER_ITEMSHOP_RUNTIME_FORMAT
} from './stoneage_browser_itemshop_runtime.mjs';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const intOr=(value,fallback=0)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;
const clone=value=>JSON.parse(JSON.stringify(value));

function normalizeSourcePath(value){
  let path=String(value??'').replaceAll('\\','/').trim();
  path=path.replace(/^\.\/+/, '');
  if(path.startsWith('gmsv/data/npc/'))path=path.slice('gmsv/data/npc/'.length);
  return path;
}

function npcSourceKey(value){
  if(!isObject(value))return null;
  const path=normalizeSourcePath(value.path??value.sourcePath);
  const blockIndex=intOr(value.blockIndex,-1);
  if(!path||blockIndex<0)return null;
  return path+'#'+blockIndex;
}

function validateWorldNpcIndex(worldNpcIndex){
  const errors=[];
  if(!isObject(worldNpcIndex))errors.push('world NPC index must be an object');
  if(worldNpcIndex?.format!==WORLD_NPC_INDEX_FORMAT)errors.push('world NPC index format drift');
  if(!Array.isArray(worldNpcIndex?.creates))errors.push('world NPC index creates must be an array');
  if(!isObject(worldNpcIndex?.fixedSource))errors.push('world NPC index fixedSource required');
  return {ok:errors.length===0,errors};
}

function validateJoinedSources(worldNpcIndex,catalog){
  const errors=[];
  const world=worldNpcIndex?.fixedSource??{};
  const shop=catalog?.fixedSource??{};
  if(String(world.repository??'')!==String(shop.repository??'') || String(world.ref??'')!==String(shop.ref??'')){
    errors.push('world NPC index and ItemShop catalog fixedSource mismatch');
  }
  return {ok:errors.length===0,errors};
}

function isItemShopEnemy(enemy){
  if(!isObject(enemy))return false;
  return (enemy.templateCandidates??[]).some(candidate=>String(candidate?.functionSet??'').trim().toLowerCase()==='itemshop');
}

function buildWorldItemShopBindingIndex(worldNpcIndex,catalog){
  const worldValidation=validateWorldNpcIndex(worldNpcIndex);
  if(!worldValidation.ok)return {ok:false,reason:'invalid-world-npc-index',errors:worldValidation.errors};
  if(!isObject(catalog)||catalog.format!==NPC_ITEMSHOP_CATALOG_FORMAT){
    return {ok:false,reason:'invalid-itemshop-catalog'};
  }
  const sourceValidation=validateJoinedSources(worldNpcIndex,catalog);
  if(!sourceValidation.ok)return {ok:false,reason:'fixed-source-mismatch',errors:sourceValidation.errors};

  const byNpcKey={};
  const unresolved=[];
  const errors=[];
  for(const create of worldNpcIndex.creates){
    const key=npcSourceKey(create);
    if(!key)continue;
    const enemies=Array.isArray(create.enemy)?create.enemy:[];
    for(const enemy of enemies){
      if(!isItemShopEnemy(enemy))continue;
      if(byNpcKey[key]){
        errors.push('duplicate ItemShop world binding: '+key);
        continue;
      }
      const shop=Object.values(catalog.shops??{}).find(row=>npcSourceKey(row?.source?.create)===key)??null;
      const binding={
        npcKey:key,
        shopId:shop?.shopId??key,
        floorId:create.floorId??null,
        templateName:enemy.templateName??null,
        fileRef:enemy.fileRef??null,
        sourceWorld:{
          path:normalizeSourcePath(create.path),
          blockIndex:intOr(create.blockIndex,-1),
          startLine:create.startLine??null
        },
        sourceCandidate:clone((enemy.templateCandidates??[]).find(candidate=>String(candidate?.functionSet??'').trim().toLowerCase()==='itemshop')??null),
        resolved:!!shop,
        shop:shop?clone(shop):null
      };
      if(shop){
        const shopKey=npcSourceKey(shop.source?.create);
        if(shopKey!==key)errors.push('catalog source key mismatch: '+key);
        if(shop.floorId!=null&&create.floorId!=null&&Number(shop.floorId)!==Number(create.floorId)){
          errors.push('catalog/world floor mismatch: '+key);
        }
      }else{
        binding.unresolvedReason='itemshop-catalog-missing-for-world-npc';
        unresolved.push(binding);
      }
      byNpcKey[key]=binding;
    }
  }

  for(const [shopId,shop] of Object.entries(catalog.shops??{})){
    const key=npcSourceKey(shop.source?.create);
    if(!key)errors.push('catalog ItemShop source key missing: '+shopId);
    else if(!byNpcKey[key])errors.push('catalog ItemShop has no world NPC binding: '+key);
  }

  return {
    ok:errors.length===0,
    reason:errors.length?'world-itemshop-join-invalid':null,
    errors,
    counts:{
      worldItemShopBindings:Object.keys(byNpcKey).length,
      resolvedBindings:Object.values(byNpcKey).filter(row=>row.resolved).length,
      unresolvedBindings:unresolved.length,
      catalogShops:Object.keys(catalog.shops??{}).length
    },
    byNpcKey,
    unresolved
  };
}

function resolveWorldItemShopBinding(bindingIndex,npc,{shopId=null}={}){
  const key=npcSourceKey(npc);
  if(!key)return {ok:false,reason:'npc-source-key-required'};
  const binding=bindingIndex?.byNpcKey?.[key]??null;
  if(!binding)return {ok:false,reason:'npc-not-itemshop-world-binding',npcKey:key};
  if(!binding.resolved){
    return {
      ok:false,
      reason:binding.unresolvedReason??'itemshop-world-binding-unresolved',
      npcKey:key,
      binding:clone(binding)
    };
  }
  const requestedShopId=String(shopId??'').trim();
  if(requestedShopId&&requestedShopId!==binding.shopId){
    return {
      ok:false,
      reason:'shop-id-mismatch',
      npcKey:key,
      expectedShopId:binding.shopId,
      requestedShopId
    };
  }
  if(npc.floor!=null&&binding.floorId!=null&&intOr(npc.floor,-1)!==intOr(binding.floorId,-1)){
    return {
      ok:false,
      reason:'npc-floor-mismatch',
      npcKey:key,
      expectedFloorId:intOr(binding.floorId,-1),
      actualFloorId:intOr(npc.floor,-1)
    };
  }
  return {ok:true,npcKey:key,shopId:binding.shopId,binding:clone(binding)};
}

function createBrowserWorldItemShopRuntime({
  worldNpcIndex,
  catalog,
  itemMakeCatalog,
  itemCapacity=28000,
  cursor=1,
  randInclusive,
  initHandlers={}
}={}){
  const baseRuntime=createBrowserItemShopRuntime({
    catalog,
    itemMakeCatalog,
    itemCapacity,
    cursor,
    ...(typeof randInclusive==='function'?{randInclusive}:{}),
    initHandlers
  });
  if(!baseRuntime.ok){
    return {
      ok:false,
      format:BROWSER_WORLD_ITEMSHOP_RUNTIME_FORMAT,
      reason:'browser-itemshop-runtime-invalid',
      errors:baseRuntime.errors??[]
    };
  }
  const bindingIndex=buildWorldItemShopBindingIndex(worldNpcIndex,catalog);
  if(!bindingIndex.ok){
    return {
      ok:false,
      format:BROWSER_WORLD_ITEMSHOP_RUNTIME_FORMAT,
      reason:bindingIndex.reason??'world-itemshop-join-invalid',
      errors:bindingIndex.errors??[]
    };
  }

  const dispatch=(state,action={},options={})=>{
    const requestedShopId=String(action?.shopId??'').trim();
    const resolved=resolveWorldItemShopBinding(bindingIndex,action?.npc??null,{shopId:requestedShopId});
    if(!resolved.ok){
      return {
        ok:false,
        handled:false,
        stage:'shop-resolution',
        reason:resolved.reason,
        worldBinding:resolved,
        state
      };
    }
    const result=baseRuntime.dispatch(state,{...action,shopId:resolved.shopId},options);
    return {...result,worldBinding:resolved};
  };

  return {
    ok:true,
    format:BROWSER_WORLD_ITEMSHOP_RUNTIME_FORMAT,
    bindingIndex,
    getCursor:()=>baseRuntime.getCursor(),
    resolveBinding:(npc,options={})=>resolveWorldItemShopBinding(bindingIndex,npc,options),
    resolveOffers:(npc)=> {
      const resolved=resolveWorldItemShopBinding(bindingIndex,npc);
      if(!resolved.ok)return resolved;
      return baseRuntime.resolveOffers(resolved.shopId);
    },
    dispatch
  };
}

export {
  BROWSER_WORLD_ITEMSHOP_RUNTIME_FORMAT,
  WORLD_NPC_INDEX_FORMAT,
  NPC_ITEMSHOP_CATALOG_FORMAT,
  normalizeSourcePath,
  npcSourceKey,
  validateWorldNpcIndex,
  validateJoinedSources,
  buildWorldItemShopBindingIndex,
  resolveWorldItemShopBinding,
  createBrowserWorldItemShopRuntime
};
