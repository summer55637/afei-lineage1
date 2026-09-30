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
const PLAYER_ITEM_SLOT_START=9;
const PLAYER_ITEM_SLOT_END=24;

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
  if(elderId<0||elderId>127)return {ok:false,reason:'savepoint-elder-id-out-of-source-elder-range'};
  if(floorId<0||x<0||y<0)return {ok:false,reason:'savepoint-born-position-required'};
  const mode=normalizeName(binding.mode||'');
  if(!['no-item','item-required','confirm-only'].includes(mode))return {ok:false,reason:'savepoint-source-item-mode-unresolved'};
  return {ok:true,binding:{elderId,born:{floorId,x,y},mode,getItem:binding.getItem??null,itemRequirements:Array.isArray(binding.itemRequirements)?clone(binding.itemRequirements):null,itemRequirementIssues:Array.isArray(binding.itemRequirementIssues)?clone(binding.itemRequirementIssues):[],rawArg:binding.rawArg??null,sourceKey:binding.sourceKey??null}};
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

function normalizeItemRequirement(value){
  if(!isObject(value))return {ok:false,reason:'savepoint-item-requirement-invalid'};
  const itemId=intOr(value.itemId,-1);
  const count=intOr(value.count,0);
  if(itemId<0||count<1)return {ok:false,reason:'savepoint-item-requirement-value-invalid',itemId,count};
  return {ok:true,requirement:{itemId,count}};
}

function normalizeItemRequirements(binding){
  if(!Array.isArray(binding?.itemRequirements))return {ok:false,reason:'savepoint-item-requirement-catalog-missing'};
  if(binding.itemRequirements.length<1)return {ok:false,reason:'savepoint-item-requirement-catalog-empty'};
  const branches=[];
  const issues=[];
  for(const [branchIndex,rawBranch] of binding.itemRequirements.entries()){
    if(!Array.isArray(rawBranch)||rawBranch.length<1){issues.push({branchIndex,reason:'savepoint-item-requirement-branch-invalid'});continue;}
    const seen=new Set(), branch=[];
    let branchInvalid=false;
    for(const raw of rawBranch){
      const normalized=normalizeItemRequirement(raw);
      if(!normalized.ok){issues.push({branchIndex,reason:normalized.reason,itemId:raw?.itemId??null});branchInvalid=true;break;}
      if(seen.has(normalized.requirement.itemId)){issues.push({branchIndex,reason:'savepoint-item-requirement-duplicate-item-id-in-and-branch',itemId:normalized.requirement.itemId});branchInvalid=true;break;}
      seen.add(normalized.requirement.itemId);
      branch.push(normalized.requirement);
    }
    if(!branchInvalid)branches.push(branch);
  }
  if(!branches.length)return {ok:false,reason:'savepoint-item-requirement-no-satisfiable-branches',issues};
  return {ok:true,branches,issues};
}

function inventoryItemId(state,slot){
  const index=intOr(slot,-1);
  if(index<PLAYER_ITEM_SLOT_START||index>=PLAYER_ITEM_SLOT_END)return -1;
  const ref=intOr(state?.inventory?.playerItemSlots?.[index],-1);
  if(ref<1)return -1;
  const item=state?.inventory?.itemRuntime?.slots?.[String(ref)];
  if(!isObject(item))return -1;
  return intOr(item.itemId??item.data?.[0],-1);
}

function selectSavePointItemRequirement(state,binding){
  const normalized=normalizeItemRequirements(binding);
  if(!normalized.ok)return normalized;
  for(let branchIndex=0;branchIndex<normalized.branches.length;branchIndex++){
    const branch=normalized.branches[branchIndex];
    const selectedSlots=[];
    const selectedSet=new Set();
    let branchOk=true;
    for(const requirement of branch){
      const matches=[];
      for(let slot=PLAYER_ITEM_SLOT_START;slot<PLAYER_ITEM_SLOT_END;slot++){
        if(selectedSet.has(slot))continue;
        if(inventoryItemId(state,slot)===requirement.itemId)matches.push(slot);
      }
      if(matches.length<requirement.count){branchOk=false;break;}
      for(const slot of matches.slice(0,requirement.count)){selectedSet.add(slot);selectedSlots.push(slot);}
    }
    if(branchOk)return {ok:true,branchIndex,requirements:branch,selectedSlots};
  }
  return {ok:false,reason:'savepoint-item-requirement-not-met',branches:normalized.branches};
}

function consumeSavePointItems(state,selection){
  if(!isObject(state))return {ok:false,reason:'state-required',state};
  if(!isObject(state.inventory)||!Array.isArray(state.inventory.playerItemSlots)||!isObject(state.inventory.itemRuntime)||!isObject(state.inventory.itemRuntime.slots))return {ok:false,reason:'canonical-item-state-required',state};
  const slots=selection?.selectedSlots;
  if(!Array.isArray(slots)||slots.length<1||new Set(slots).size!==slots.length)return {ok:false,reason:'savepoint-item-selection-invalid',state};
  const next=clone(state);
  const consumed=[];
  for(const slotRaw of slots){
    const slot=intOr(slotRaw,-1);
    if(slot<PLAYER_ITEM_SLOT_START||slot>=PLAYER_ITEM_SLOT_END)return {ok:false,reason:'savepoint-item-selection-slot-invalid',state};
    const existingIndex=intOr(next.inventory.playerItemSlots[slot],-1);
    const item=next.inventory.itemRuntime.slots[String(existingIndex)];
    if(existingIndex<1||!isObject(item))return {ok:false,reason:'savepoint-item-selection-item-missing',slot,state};
    const itemId=intOr(item.itemId??item.data?.[0],-1);
    if(itemId<0)return {ok:false,reason:'savepoint-item-selection-item-id-invalid',slot,state};
    const pile=Math.max(1,intOr(item.pile,1));
    next.inventory.playerItemSlots[slot]=null;
    delete next.inventory.itemRuntime.slots[String(existingIndex)];
    if(isObject(next.inventory.piles)){
      const key=String(itemId);
      if(Object.prototype.hasOwnProperty.call(next.inventory.piles,key)){
        const remaining=Math.max(0,intOr(next.inventory.piles[key],0)-pile);
        if(remaining===0)delete next.inventory.piles[key]; else next.inventory.piles[key]=remaining;
      }
    }
    consumed.push({slot,existingIndex,itemId,pile});
  }
  return {ok:true,state:next,consumed};
}
function applySavePoint(state,binding,{now=()=>new Date().toISOString()}={}){
  if(!isObject(state))return {applied:false,reason:'state-required',state};
  const normalized=normalizeBinding(binding);
  if(!normalized.ok)return {applied:false,reason:normalized.reason,state};
  const b=normalized.binding;
  const existing=state.world?.savePoint;
  if(existing!=null && !isObject(existing))return {applied:false,reason:'existing-savepoint-state-invalid',state};
  const oldUnlocked=Array.isArray(existing?.unlockedElderIds) ? existing.unlockedElderIds.map(x=>intOr(x,-1)).filter(x=>x>=0&&x<=127) : [];
  const unlockedElderIds=[...new Set([...oldUnlocked,b.elderId])].sort((a,c)=>a-c);
  const oldMask=Number.isInteger(existing?.definedBitmask32)&&existing.definedBitmask32>=0?existing.definedBitmask32:0;
  const definedBitmask32=b.elderId<31?((oldMask | (1<<b.elderId))>>>0):oldMask;
  const next=clone(state);
  next.world??={position:{floorId:null,x:null,y:null},savePoint:null};
  next.world.savePoint={
    elderId:b.elderId,
    unlockedElderIds,
    definedBitmask32,
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
      if(!binding && savePointCatalog) {
        const resolved=resolveSavePointBinding(action.npc,savePointCatalog);
        if(!resolved.ok)return {ok:false,handled:false,stage:'source-binding',reason:resolved.reason,sourceKey:resolved.sourceKey??null,state};
        binding=resolved.binding;
      }
      const checked=normalizeBinding(binding);
      if(!checked.ok)return {ok:false,handled:false,stage:'source-binding',reason:checked.reason,state};
      const gate=interactionGate(action.npc,action.player);
      if(!gate.ok)return {ok:false,handled:false,...gate,state};
      const existingUnlocked=Array.isArray(state?.world?.savePoint?.unlockedElderIds)
        && state.world.savePoint.unlockedElderIds.some(x=>intOr(x,-1)===checked.binding.elderId);
      if(checked.binding.mode==='item-required' && !existingUnlocked){
        const selection=selectSavePointItemRequirement(state,checked.binding);
        if(!selection.ok){
          const reason=selection.reason==='savepoint-item-requirement-catalog-missing'||selection.reason==='savepoint-item-requirement-catalog-empty'
            ?'savepoint-item-requirement-not-yet-closed'
            :selection.reason;
          return {ok:false,handled:false,stage:'item-requirement',reason,state,sourceBinding:checked.binding,itemRequirement:selection};
        }
        if(type===ACTION_NPC_SAVEPOINT_SET)return {ok:false,handled:false,stage:'confirmation',reason:'savepoint-confirmation-required',state,sourceBinding:checked.binding,itemRequirement:selection};
        const consumed=consumeSavePointItems(state,selection);
        if(!consumed.ok)return {ok:false,handled:false,stage:'item-consume',reason:consumed.reason,state,sourceBinding:checked.binding,itemRequirement:selection};
        const result=applySavePoint(consumed.state,checked.binding,{now:action.now??options.now??(()=>new Date().toISOString())});
        return {ok:result.applied===true,handled:result.applied===true,stage:'savepoint',reason:result.applied?null:result.reason,result,state:result.state??consumed.state,savePoint:result.savePoint??null,consumedItems:consumed.consumed,gate:gate.gate};
      }
      if(checked.binding.mode==='confirm-only' && type===ACTION_NPC_SAVEPOINT_SET && !existingUnlocked)return {ok:false,handled:false,stage:'confirmation',reason:'savepoint-confirmation-required',state,sourceBinding:checked.binding};
      if(checked.binding.mode==='item-required' && type===ACTION_NPC_SAVEPOINT_CONFIRM && existingUnlocked)return {ok:false,handled:false,stage:'confirmation',reason:'savepoint-confirmation-not-applicable',state,sourceBinding:checked.binding};
      if(checked.binding.mode==='no-item' && type===ACTION_NPC_SAVEPOINT_CONFIRM)return {ok:false,handled:false,stage:'confirmation',reason:'savepoint-confirmation-not-applicable',state,sourceBinding:checked.binding};
      const result=applySavePoint(state,checked.binding,{now:action.now??options.now??(()=>new Date().toISOString())});
      return {ok:result.applied===true,handled:result.applied===true,stage:'savepoint',reason:result.applied?null:result.reason,result,state:result.state??state,savePoint:result.savePoint??null,gate:gate.gate};
    }
  };
}

export { BROWSER_SAVEPOINT_RUNTIME_FORMAT, ACTION_NPC_SAVEPOINT_SET, ACTION_NPC_SAVEPOINT_CONFIRM, SOURCE_REPOSITORY, SOURCE_REF, PLAYER_ITEM_SLOT_START, PLAYER_ITEM_SLOT_END, validateBrowserSavePointDependencies, normalizeBinding, normalizeItemRequirement, normalizeItemRequirements, selectSavePointItemRequirement, consumeSavePointItems, resolveSavePointBinding, interactionGate, applySavePoint, createBrowserSavePointRuntime };
