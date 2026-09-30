import { canInteractWithNpc } from './stoneage_npc_interaction_runtime.mjs';
import { sourceHealerRecovery } from './stoneage_idle_policy.mjs';

const BROWSER_HEALER_RUNTIME_FORMAT='stoneage-browser-healer-runtime-v1';
const ACTION_NPC_HEALER_USE='NPC_HEALER_USE';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const intOr=(value,fallback=0)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;
const normalizeName=value=>String(value??'').trim().toLowerCase();

function validateBrowserHealerDependencies({moduleAudit}={}){
  const errors=[];
  if(!isObject(moduleAudit)) errors.push('npc functionset audit required');
  if(moduleAudit?.fixedSource?.repository!==SOURCE_REPOSITORY) errors.push('fixed source repository mismatch');
  if(moduleAudit?.fixedSource?.ref!==SOURCE_REF) errors.push('fixed source ref mismatch');
  const known=Array.isArray(moduleAudit?.sourceFunctionSets)
    && moduleAudit.sourceFunctionSets.some(name=>normalizeName(name)==='healer');
  if(!known) errors.push('Healer missing from pinned source functionSet registry');
  return {ok:errors.length===0,errors};
}

function validateHealerNpc(npc){
  if(!isObject(npc)) return {ok:false,reason:'npc-required'};
  const service=(npc.services??[]).find(item=>normalizeName(item?.functionSet)==='healer')??null;
  const functionSet=normalizeName(npc.functionSet);
  const knownService=service?.sourceStatus==='known';
  if(functionSet!=='healer' && !knownService) return {ok:false,reason:'npc-healer-service-unresolved'};
  if(service && service.sourceStatus!=='known') return {ok:false,reason:'npc-healer-service-unresolved'};
  return {ok:true};
}

function interactionGate(npc,player){
  const gate=canInteractWithNpc(npc,player,{interactionRule:'NPC_Util_CharDistance distance=2',maxDistance:2});
  if(!gate.ok)return {ok:false,reason:gate.reason,stage:'interaction-gate'};
  if(!gate.interactable)return {ok:false,reason:gate.reason,stage:'interaction-gate',gate};
  return {ok:true,gate};
}

function healPetBox(next){
  const pets=next?.pets?.petBox;
  if(!Array.isArray(pets))return {ok:false,reason:'pet-box-state-missing'};
  for(let i=0;i<pets.length;i++){
    const pet=pets[i];
    if(!isObject(pet))return {ok:false,reason:'pet-state-invalid',index:i};
    const maxHp=intOr(pet.maxHp,-1),maxMp=intOr(pet.maxMp,-1);
    if(maxHp<0||maxMp<0)return {ok:false,reason:'pet-max-hp-mp-required',index:i};
    pet.hp=maxHp;
    pet.mp=maxMp;
    if(typeof pet.dead==='boolean')pet.dead=false;
  }
  return {ok:true,count:pets.length};
}

function applyBrowserHealer(state,{now=()=>new Date().toISOString()}={}){
  if(!isObject(state))return {applied:false,reason:'state-required',state};
  const base=sourceHealerRecovery(state);
  if(!base.applied)return {applied:false,reason:base.reason??'source-healer-recovery-failed',state};
  const next=base.state;
  const pets=healPetBox(next);
  if(!pets.ok)return {applied:false,reason:pets.reason,petIndex:pets.index??null,state};
  next.revision=intOr(next.revision,0)+1;
  next.runtimeMeta??={};
  next.runtimeMeta.updatedAt=String(now());
  return {applied:true,reason:'source-healer-full-recovery',state:next,healed:{player:true,petCount:pets.count}};
}

function createBrowserHealerRuntime({moduleAudit=null}={}){
  const dependencyCheck=validateBrowserHealerDependencies({moduleAudit});
  if(!dependencyCheck.ok)return {ok:false,format:BROWSER_HEALER_RUNTIME_FORMAT,reason:'dependency-validation-failed',errors:dependencyCheck.errors};
  return {
    ok:true,
    format:BROWSER_HEALER_RUNTIME_FORMAT,
    dispatch:(state,action={},options={})=>{
      if(!isObject(action))return {ok:false,handled:false,stage:'action',reason:'invalid-browser-healer-action',state};
      if(String(action.type??'').trim()!==ACTION_NPC_HEALER_USE)return {ok:false,handled:false,stage:'action',reason:'unsupported-browser-healer-action',type:action.type,state};
      const npcCheck=validateHealerNpc(action.npc);
      if(!npcCheck.ok)return {ok:false,handled:false,stage:'module-resolution',reason:npcCheck.reason,state};
      const gate=interactionGate(action.npc,action.player);
      if(!gate.ok)return {ok:false,handled:false,...gate,state};
      const result=applyBrowserHealer(state,{now:action.now??options.now??(()=>new Date().toISOString())});
      return {ok:result.applied===true,handled:result.applied===true,stage:'healer',reason:result.applied?null:result.reason,result,state:result.state??state,gate:gate.gate};
    }
  };
}

export {
  BROWSER_HEALER_RUNTIME_FORMAT,
  ACTION_NPC_HEALER_USE,
  SOURCE_REPOSITORY,
  SOURCE_REF,
  validateBrowserHealerDependencies,
  validateHealerNpc,
  interactionGate,
  healPetBox,
  applyBrowserHealer,
  createBrowserHealerRuntime
};
