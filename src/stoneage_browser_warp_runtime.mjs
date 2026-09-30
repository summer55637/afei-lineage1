
import { commitSave, parseAndValidateSaveEnvelope } from './stoneage_save_transaction.mjs';

const BROWSER_WARP_RUNTIME_FORMAT='stoneage-browser-warp-runtime-v1';
const WARP_CATALOG_FORMAT='stoneage-browser-start-warp-catalog-v1';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const intOr=(value,fallback=-1)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;

function normalizeSourcePath(value){
  let path=String(value??'').replaceAll('\\','/').trim().replace(/^\.\/+/, '');
  if(path.startsWith('gmsv/data/npc/'))path=path.slice('gmsv/data/npc/'.length);
  return path;
}

function sourceKey(value){
  if(!isObject(value))return null;
  const path=normalizeSourcePath(value.path??value.createPath??value.sourcePath);
  const blockIndex=intOr(value.blockIndex,-1);
  return path&&blockIndex>=0?path+'#'+blockIndex:null;
}

function normalizeCell(value){
  if(Array.isArray(value)&&value.length>=3){
    const floor=intOr(value[0]),x=intOr(value[1]),y=intOr(value[2]);
    if(floor>=0&&x>=0&&y>=0)return {floor,x,y};
    return null;
  }
  if(isObject(value)){
    const floor=intOr(value.floor??value.floorId),x=intOr(value.x),y=intOr(value.y);
    if(floor>=0&&x>=0&&y>=0)return {floor,x,y};
  }
  return null;
}

function sameCell(a,b){
  const aa=normalizeCell(a),bb=normalizeCell(b);
  return !!aa&&!!bb&&aa.floor===bb.floor&&aa.x===bb.x&&aa.y===bb.y;
}

function validateWarpCatalog(catalog){
  const errors=[];
  if(!isObject(catalog))errors.push('warp catalog must be an object');
  if(catalog?.format!==WARP_CATALOG_FORMAT)errors.push('warp catalog format mismatch');
  if(catalog?.fixedSource?.repository!==SOURCE_REPOSITORY)errors.push('fixed source repository mismatch');
  if(catalog?.fixedSource?.ref!==SOURCE_REF)errors.push('fixed source ref mismatch');
  if(!Array.isArray(catalog?.rows))errors.push('warp catalog rows must be an array');
  for(const [index,row] of (catalog?.rows??[]).entries()){
    if(!isObject(row))errors.push('warp catalog row '+index+' must be an object');
    if(isObject(row)&&row.templateName!=='npcgen_warp')errors.push('warp catalog row '+index+' template must be npcgen_warp');
    if(isObject(row)&&row.functionSet!=='Warp')errors.push('warp catalog row '+index+' functionSet must be Warp');
    if(isObject(row)&&!sourceKey(row))errors.push('warp catalog row '+index+' source key invalid');
    if(isObject(row)&&!normalizeCell(row.origin))errors.push('warp catalog row '+index+' origin invalid');
    if(isObject(row)&&!normalizeCell(row.target))errors.push('warp catalog row '+index+' target invalid');
    if(isObject(row)&&typeof row.standardArg!=='string')errors.push('warp catalog row '+index+' standardArg missing');
  }
  const keys=(catalog?.rows??[]).map(sourceKey).filter(Boolean);
  if(new Set(keys).size!==keys.length)errors.push('warp catalog source keys must be unique');
  return {ok:errors.length===0,errors};
}

function resolveBrowserWarpBinding(npc,catalog){
  const deps=validateWarpCatalog(catalog);
  if(!deps.ok)return {ok:false,reason:'invalid-warp-catalog',errors:deps.errors};
  if(!isObject(npc))return {ok:false,reason:'warp-npc-required'};
  const template=String(npc.template??npc.templateName??'').trim();
  if(template!=='npcgen_warp')return {ok:false,reason:'warp-template-mismatch',template};
  const key=sourceKey(npc);
  if(!key)return {ok:false,reason:'warp-source-key-required'};
  const binding=(catalog.rows??[]).find(row=>sourceKey(row)===key);
  if(!binding)return {ok:false,reason:'warp-source-binding-unresolved',sourceKey:key};
  if(binding.fixedSource?.repository&&binding.fixedSource.repository!==SOURCE_REPOSITORY)return {ok:false,reason:'warp-row-fixed-source-repository-mismatch'};
  if(binding.fixedSource?.ref&&binding.fixedSource.ref!==SOURCE_REF)return {ok:false,reason:'warp-row-fixed-source-ref-mismatch'};
  if(binding.templateName!=='npcgen_warp'||binding.functionSet!=='Warp')return {ok:false,reason:'warp-row-template-module-mismatch'};
  const npcCell=normalizeCell(npc);
  const sourceOrigin=normalizeCell({...binding.origin,floor:binding.origin.floorId});
  if(!sameCell(npcCell,sourceOrigin))return {ok:false,reason:'warp-origin-mismatch',npcOrigin:npcCell,sourceOrigin};
  const target=normalizeCell({...binding.target,floor:binding.target.floorId});
  if(!target)return {ok:false,reason:'warp-target-invalid'};
  return {ok:true,binding:clone(binding),sourceKey:key,target};
}

function validateWarpActorPosition(npc,player,state){
  const npcCell=normalizeCell(npc);
  if(!npcCell)return {ok:false,reason:'warp-npc-position-invalid'};
  const playerCell=normalizeCell(player);
  const stateCell=normalizeCell(state?.world?.position);
  if(player!==undefined&&player!==null&&!playerCell)return {ok:false,reason:'warp-player-position-invalid'};
  const effective=playerCell??stateCell;
  if(!effective)return {ok:false,reason:'warp-player-position-required'};
  if(!sameCell(effective,npcCell))return {ok:false,reason:'warp-player-not-on-npc-cell',playerCell:effective,npcCell};
  if(stateCell&&!sameCell(stateCell,effective))return {ok:false,reason:'warp-state-position-mismatch',stateCell,playerCell:effective};
  return {ok:true,playerCell:effective,npcCell};
}

async function executeBrowserWarp(state,npc,player,{
  catalog,
  expectedRevision=null,
  savedAt=()=>new Date().toISOString(),
  now=()=>new Date().toISOString(),
  source='browser-warp'
}={}){
  const binding=resolveBrowserWarpBinding(npc,catalog);
  if(!binding.ok)return {ok:false,handled:false,stage:'warp-resolution',reason:binding.reason,errors:binding.errors??[],state:clone(state)};
  const actor=validateWarpActorPosition(npc,player,state);
  if(!actor.ok)return {ok:false,handled:false,stage:'warp-gate',reason:actor.reason,playerCell:actor.playerCell??null,npcCell:actor.npcCell??null,state:clone(state)};
  const currentRevision=Number(state?.revision??0);
  const expected=expectedRevision==null?currentRevision:Number(expectedRevision);
  if(!Number.isInteger(expected)||expected!==currentRevision)return {ok:false,handled:false,stage:'save',reason:'revision-conflict',currentRevision,expectedRevision,state:clone(state)};
  const next=clone(state);
  next.world??={position:{floorId:null,x:null,y:null},savePoint:null};
  next.world.position={floorId:binding.target.floor,x:binding.target.x,y:binding.target.y};
  const committed=await commitSave(state,next,{expectedRevision:expected,savedAt,source});
  if(!committed.ok)return {...committed,handled:false,stage:'save',state:clone(state)};
  const verified=await parseAndValidateSaveEnvelope(committed.envelope,{now});
  if(!verified.ok)return {ok:false,handled:false,stage:'save-verify',reason:verified.reason??'warp-save-verification-failed',errors:verified.errors??[],state:clone(state)};
  return {ok:true,handled:true,stage:'warp',format:BROWSER_WARP_RUNTIME_FORMAT,sourceKey:binding.sourceKey??sourceKey(binding.binding),origin:binding.binding.origin?clone(binding.binding.origin):clone(actor.npcCell),target:clone(binding.target),envelope:committed.envelope,verification:verified,state:clone(verified.state)};
}

function createBrowserWarpRuntime({warpCatalog=null}={}){
  const deps=validateWarpCatalog(warpCatalog);
  if(!deps.ok)return {ok:false,format:BROWSER_WARP_RUNTIME_FORMAT,reason:'dependency-validation-failed',errors:deps.errors};
  return {ok:true,format:BROWSER_WARP_RUNTIME_FORMAT,warpCatalogFormat:warpCatalog.format,rowCount:warpCatalog.rows.length,resolve:npc=>resolveBrowserWarpBinding(npc,warpCatalog),execute:(state,npc,player,options={})=>executeBrowserWarp(state,npc,player,{...options,catalog:warpCatalog})};
}

export {
  BROWSER_WARP_RUNTIME_FORMAT,
  WARP_CATALOG_FORMAT,
  SOURCE_REPOSITORY,
  SOURCE_REF,
  normalizeSourcePath,
  sourceKey,
  normalizeCell,
  sameCell,
  validateWarpCatalog,
  resolveBrowserWarpBinding,
  validateWarpActorPosition,
  executeBrowserWarp,
  createBrowserWarpRuntime
};
