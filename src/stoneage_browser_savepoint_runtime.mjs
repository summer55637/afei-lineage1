import { canInteractWithNpc } from './stoneage_npc_interaction_runtime.mjs';

const BROWSER_SAVEPOINT_RUNTIME_FORMAT='stoneage-browser-savepoint-runtime-v1';
const ACTION_NPC_SAVEPOINT_SET='NPC_SAVEPOINT_SET';
const ACTION_NPC_SAVEPOINT_CONFIRM='NPC_SAVEPOINT_CONFIRM';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const intOr=(value,fallback=0)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;
const normalizeName=value=>String(value??'').trim().toLowerCase();

function validateBrowserSavePointDependencies({moduleAudit,savePointCatalog=null}={}){
  const errors=[];
  if(!isObject(moduleAudit))errors.push('npc functionset audit required');
  if(moduleAudit?.fixedSource?.repository!==SOURCE_REPOSITORY)errors.push('fixed source repository mismatch');
  if(moduleAudit?.fixedSource?.ref!==SOURCE_REF)errors.push('fixed source ref mismatch');
  if(!Array.isArray(moduleAudit?.sourceFunctionSets)||!moduleAudit.sourceFunctionSets.some(x=>normalizeName(x)==='savepoint'))errors.push('SavePoint missing from pinned source functionSet registry');
  if(savePointCatalog!=null){
    if(!isObject(savePointCatalog)||savePointCatalog.format!=='stoneage-npc-savepoint-source-index-v1')errors.push('invalid SavePoint source catalog');
    else if(savePointCatalog.fixedSource?.repository!==SOURCE_REPOSITORY||savePointCatalog.fixedSource?.ref!==SOURCE_REF)errors.push('SavePoint source catalog fixed source mismatch');
  }
  return {ok:errors.length===0,errors};
}

function normalizeBinding(binding){
  if(!isObject(binding))return {ok:false,reason:'savepoint-source-binding-required'};
  const elderId=intOr(binding.elderId??binding.id,-1);
  const born=isObject(binding.born)?binding.born:null;
  const floorId=intOr(born?.floorId??born?.floor,-1);
  const x=intOr(born?.x,-1),y=intOr(born?.y,-1);
  if(elderId<0||elderId>30)return {ok:false,reason:'savepoint-elder-id-out-of-supported-source-range'};
  if(floorId<0||x<0||y<0)return {ok:false,reason:'savepoint-born-position-required'};
  const mode=normalizeName(binding.mode||'');
  if(!['no-item','item-required'].includes(mode))return {ok:false,reason:'savepoint-source-item-mode-unresolved'};
  return {ok:true,binding:{elderId,born:{floorId,x,y},mode,rawArg:binding.rawArg??null,sourceKey:binding.sourceKey??null}};
}

function resolveSavePointBinding(npc,savePointCatalog){
  if(!isObject(npc))return {ok:false,reason:'npc-required'};
  if(!isObject(savePointCatalog))return {ok:false,reason:'savepoint-source-catalog-required'};
  const key=String(npc.path??'').trim()+'#'+intOr(npc.blockIndex,-1);
  const row=savePointCatalog.bySourceKey?.[key]??null;
  if(!row)return {ok:false,reason:'savepoint-source-binding-missing',sourceKey:key};
  const sourceCheck=normalizeName(row.functionSet)==='savepoint';
  if(!sourceCheck)return {ok:false,reason:'savepoint-source-functionset-mismatch',sourceKey:key};
  return normalizeBinding({...row,sourceKey:key});
}

function currentUnlockedMask(savePoint){
  const mask=savePoint?.unlockedMask;
  return Number.isInteger(mask)&&mask>=0?mask:0;
}

function applySavePoint(state,binding,{now=()=>new Date().toISOString()}={}){
  if(!isObject(state))return {applied:false,reason:'state-required',state};
  const normalized=normalizeBinding(binding);
  if(!normalized.ok)return {applied:false,reason:normalized.reason,state};
  const b=normalized.binding;
  const existing=state.world?.savePoint;
  if(existing!=null && !isObject(existing))return {applied:false,reason:'existing-savepoint-state-invalid',state};
  const oldMask=currentUnlockedMask(existing);
  const mask=(oldMask | (1<<b.elderId)) >>> 0;
  const next=clone(state);
  next.world??={position:{floorId:null,x:null,y:null},savePoint:null};
  next.world.savePoint={
    elderId:b.elderId,
    unlockedMask:mask,
    position:{floorId:b.born.floorId,x:b.born.x,y:b.born.y},
    sourceKey:b.sourceKey??null,
    sourceMode:b.mode
  };
  next.revision=intOr(next.revision,0)+1;
  next.runtimeMeta??={};
  next.runtimeMeta.updatedAt=String(now());
  return {applied:true,reason:'source-savepoint-set',state:next,savePoint:clone(next.world.savePoint)};
}

function interactionGate(npc,player){
  const gate=canInteractWithNpc(npc,player,{interactionRule:'NPC_Util_charIsInFrontOfChar distance=2',maxDistance:2});
  if(!gate.ok)return {ok:false,reason:gate.reason,stage:'interaction-gate'};
  if(!gate.interactable)return {ok:false,reason:gate.reason,stage:'interaction-gate',gate};
  return {ok:true,gate};
}

function createBrowserSavePointRuntime({moduleAudit=null,savePointCatalog=null}={}){
  const dependencyCheck=validateBrowserSavePointDependencies({moduleAudit,savePointCatalog});
  if(!dependencyCheck.ok)return {ok:false,format:BROWSER_SAVEPOINT_RUNTIME_FORMAT,reason:'dependency-validation-failed',errors:dependencyCheck.errors};
  return {
    ok:true,format:BROWSER_SAVEPOINT_RUNTIME_FORMAT,
    dispatch:(state,action={},options={})=>{
      if(!isObject(action))return {ok:false,handled:false,stage:'action',reason:'invalid-browser-savepoint-action',state};
      const type=String(action.type??'').trim();
      if(type!==ACTION_NPC_SAVEPOINT_SET&&type!==ACTION_NPC_SAVEPOINT_CONFIRM)return {ok:false,handled:false,stage:'action',reason:'unsupported-browser-savepoint-action',type,state};
      let binding=action.sourceBinding??null;
      if(!binding && action.savePointCatalog) {
        const resolved=resolveSavePointBinding(action.npc,action.savePointCatalog);
        if(!resolved.ok)return {ok:false,handled:false,stage:'source-binding',reason:resolved.reason,sourceKey:resolved.sourceKey??null,state};
        binding=resolved.binding;
      }
      const checked=normalizeBinding(binding);
      if(!checked.ok)return {ok:false,handled:false,stage:'source-binding',reason:checked.reason,state};
      const gate=interactionGate(action.npc,action.player);
      if(!gate.ok)return {ok:false,handled:false,...gate,state};
      if(checked.binding.mode==='item-required')return {ok:false,handled:false,stage:'source-binding',reason:'savepoint-item-requirement-not-yet-closed',state,sourceBinding:checked.binding};
      const result=applySavePoint(state,checked.binding,{now:action.now??options.now??(()=>new Date().toISOString())});
      return {ok:result.applied===true,handled:result.applied===true,stage:'savepoint',reason:result.applied?null:result.reason,result,state:result.state??state,savePoint:result.savePoint??null,gate:gate.gate};
    }
  };
}

export { BROWSER_SAVEPOINT_RUNTIME_FORMAT, ACTION_NPC_SAVEPOINT_SET, ACTION_NPC_SAVEPOINT_CONFIRM, SOURCE_REPOSITORY, SOURCE_REF, validateBrowserSavePointDependencies, normalizeBinding, resolveSavePointBinding, interactionGate, applySavePoint, createBrowserSavePointRuntime };
