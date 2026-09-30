import { commitSave, parseAndValidateSaveEnvelope } from './stoneage_save_transaction.mjs';
import { loadSourceMapRuntime, sourceMapTileAt } from './stoneage_map_runtime.mjs';

const BROWSER_WORLD_WARPPOINT_RUNTIME_FORMAT='stoneage-browser-world-warppoint-runtime-v1';
const WARPPOINT_CATALOG_FORMAT='stoneage-start-destination-warp-coordinates-v2';
const ACTION_WORLD_WARPPOINT_EXECUTE='WORLD_WARPPOINT_EXECUTE';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const SOURCE_PATH='gmsv/data/map/mapwarp.txt';
const SOURCE_BLOB_SHA='617d2d02cbf17561d0eafc379a015d949055e922';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));

function intOr(value,fallback=null){
  return Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : fallback;
}

function normalizeCell(value){
  if(Array.isArray(value)&&value.length>=3){
    const floor=intOr(value[0]),x=intOr(value[1]),y=intOr(value[2]);
    return floor!=null&&floor>=0&&x!=null&&x>=0&&y!=null&&y>=0?{floorId:floor,x,y}:null;
  }
  if(isObject(value)){
    const floor=intOr(value.floorId??value.floor),x=intOr(value.x),y=intOr(value.y);
    return floor!=null&&floor>=0&&x!=null&&x>=0&&y!=null&&y>=0?{floorId:floor,x,y}:null;
  }
  return null;
}

function sameCell(a,b){
  const aa=normalizeCell(a),bb=normalizeCell(b);
  return !!aa&&!!bb&&aa.floorId===bb.floorId&&aa.x===bb.x&&aa.y===bb.y;
}

function flattenPortalRows(catalog){
  const groups=[
    ...(catalog?.nextFloorPortals?.to100??[]),
    ...(catalog?.nextFloorPortals?.to200??[])
  ];
  return groups.flatMap(group=>(group.rows??[]).map(row=>({
    portalId:String(group.id),
    fromFloor:Number(group.fromFloor),
    toFloor:Number(group.toFloor),
    sourceLines:Array.isArray(group.sourceLines)?group.sourceLines.map(Number):[],
    line:Number(row.line),
    from:normalizeCell([group.fromFloor,row.from?.[0],row.from?.[1]]),
    to:normalizeCell([group.toFloor,row.to?.[0],row.to?.[1]])
  })));
}

function validateWarpPointCatalog(catalog){
  const errors=[];
  if(!isObject(catalog))errors.push('warppoint catalog must be an object');
  if(catalog?.format!==WARPPOINT_CATALOG_FORMAT)errors.push('warppoint catalog format mismatch');
  if(catalog?.fixedSource?.repository!==SOURCE_REPOSITORY)errors.push('fixed source repository mismatch');
  if(catalog?.fixedSource?.ref!==SOURCE_REF)errors.push('fixed source ref mismatch');
  if(catalog?.fixedSource?.path!==SOURCE_PATH)errors.push('fixed source path mismatch');
  if(catalog?.fixedSource?.blobSha!==SOURCE_BLOB_SHA)errors.push('fixed source blob sha mismatch');
  const rows=flattenPortalRows(catalog);
  if(!rows.length)errors.push('warppoint catalog contains no portal rows');
  const seen=new Set();
  for(const [index,row] of rows.entries()){
    if(!row.from)errors.push('warppoint row '+index+' source coordinate invalid');
    if(!row.to)errors.push('warppoint row '+index+' destination coordinate invalid');
    if(!Number.isInteger(row.line)||row.line<=0)errors.push('warppoint row '+index+' source line invalid');
    if(!row.portalId)errors.push('warppoint row '+index+' portal id missing');
    const key=row.portalId+'#'+row.line;
    if(seen.has(key))errors.push('warppoint row duplicate: '+key);
    seen.add(key);
  }
  return {ok:errors.length===0,errors,rows};
}

function resolveWorldWarpPointBinding(position,catalog,{portalId=null}={}){
  const deps=validateWarpPointCatalog(catalog);
  if(!deps.ok)return {ok:false,reason:'invalid-warppoint-catalog',errors:deps.errors};
  const cell=normalizeCell(position);
  if(!cell)return {ok:false,reason:'warppoint-position-invalid'};
  const wanted=portalId==null?null:String(portalId).trim();
  const candidates=deps.rows.filter(row=>sameCell(row.from,cell)&&(wanted==null||row.portalId===wanted));
  if(!candidates.length)return {ok:false,reason:wanted==null?'warppoint-at-position-not-found':'warppoint-id-not-at-position',position:cell,portalId:wanted};
  if(candidates.length!==1)return {ok:false,reason:'ambiguous-warppoint-at-position',position:cell,portalId:wanted,candidates:candidates.map(clone)};
  const binding=candidates[0];
  return {ok:true,binding:clone(binding)};
}

async function validateWarpPointDestination(binding,loadMap){
  if(typeof loadMap!=='function')return {ok:false,reason:'warppoint-destination-map-loader-required'};
  let map;
  try{ map=await loadMap(binding.to.floorId); }
  catch(error){ return {ok:false,reason:'warppoint-destination-map-load-failed',error:String(error?.message??error)}; }
  if(!map)return {ok:false,reason:'warppoint-destination-map-unresolved',floorId:binding.to.floorId};
  if(Number(map.floorId)!==binding.to.floorId)return {ok:false,reason:'warppoint-destination-floor-mismatch',floorId:binding.to.floorId};
  if(!sourceMapTileAt(map,binding.to.x,binding.to.y))return {ok:false,reason:'warppoint-destination-coordinate-invalid',destination:binding.to};
  return {ok:true,map};
}

async function executeBrowserWorldWarpPoint(state,{
  catalog,
  position=null,
  portalId=null,
  expectedRevision=null,
  loadMap=loadSourceMapRuntime,
  savedAt=()=>new Date().toISOString(),
  now=()=>new Date().toISOString(),
  source='browser-world-warppoint'
}={}){
  const currentPosition=normalizeCell(state?.world?.position);
  if(!currentPosition)return {ok:false,handled:false,stage:'warppoint-gate',reason:'warppoint-state-position-required',state:clone(state)};
  if(position!=null&&!sameCell(position,currentPosition)){
    return {ok:false,handled:false,stage:'warppoint-gate',reason:'warppoint-player-state-mismatch',playerPosition:normalizeCell(position),statePosition:currentPosition,state:clone(state)};
  }
  const resolved=resolveWorldWarpPointBinding(currentPosition,catalog,{portalId});
  if(!resolved.ok)return {ok:false,handled:false,stage:'warppoint-resolution',reason:resolved.reason,errors:resolved.errors??[],candidates:resolved.candidates??[],state:clone(state)};
  const destination=await validateWarpPointDestination(resolved.binding,loadMap);
  if(!destination.ok)return {ok:false,handled:false,stage:'warppoint-destination',reason:destination.reason,error:destination.error??null,floorId:destination.floorId??null,destination:destination.destination??resolved.binding.to,state:clone(state)};
  const currentRevision=Number(state?.revision??0);
  const expected=expectedRevision==null?currentRevision:Number(expectedRevision);
  if(!Number.isInteger(expected)||expected!==currentRevision)return {ok:false,handled:false,stage:'save',reason:'revision-conflict',currentRevision,expectedRevision,state:clone(state)};
  const next=clone(state);
  next.world??={position:{floorId:null,x:null,y:null},savePoint:null};
  next.world.position={floorId:resolved.binding.to.floorId,x:resolved.binding.to.x,y:resolved.binding.to.y};
  const committed=await commitSave(state,next,{expectedRevision:expected,savedAt,source});
  if(!committed.ok)return {...committed,handled:false,stage:'save',state:clone(state)};
  const verified=await parseAndValidateSaveEnvelope(committed.envelope,{now});
  if(!verified.ok)return {ok:false,handled:false,stage:'save-verify',reason:verified.reason??'warppoint-save-verification-failed',errors:verified.errors??[],state:clone(state)};
  return {
    ok:true,
    handled:true,
    stage:'warppoint',
    format:BROWSER_WORLD_WARPPOINT_RUNTIME_FORMAT,
    portalId:resolved.binding.portalId,
    sourceLine:resolved.binding.line,
    sourceLines:resolved.binding.sourceLines,
    from:resolved.binding.from,
    to:resolved.binding.to,
    envelope:committed.envelope,
    verification:verified,
    state:clone(verified.state)
  };
}

function createBrowserWorldWarpPointRuntime({catalog=null,loadMap=loadSourceMapRuntime}={}){
  const deps=validateWarpPointCatalog(catalog);
  if(!deps.ok)return {ok:false,format:BROWSER_WORLD_WARPPOINT_RUNTIME_FORMAT,reason:'dependency-validation-failed',errors:deps.errors};
  if(typeof loadMap!=='function')return {ok:false,format:BROWSER_WORLD_WARPPOINT_RUNTIME_FORMAT,reason:'dependency-validation-failed',errors:['destination map loader required']};
  return {
    ok:true,
    format:BROWSER_WORLD_WARPPOINT_RUNTIME_FORMAT,
    catalogFormat:catalog.format,
    rowCount:deps.rows.length,
    resolve:(position,options={})=>resolveWorldWarpPointBinding(position,catalog,options),
    execute:(state,options={})=>executeBrowserWorldWarpPoint(state,{...options,catalog,loadMap})
  };
}

export {
  BROWSER_WORLD_WARPPOINT_RUNTIME_FORMAT,
  WARPPOINT_CATALOG_FORMAT,
  ACTION_WORLD_WARPPOINT_EXECUTE,
  SOURCE_REPOSITORY,
  SOURCE_REF,
  SOURCE_PATH,
  SOURCE_BLOB_SHA,
  normalizeCell,
  sameCell,
  flattenPortalRows,
  validateWarpPointCatalog,
  resolveWorldWarpPointBinding,
  validateWarpPointDestination,
  executeBrowserWorldWarpPoint,
  createBrowserWorldWarpPointRuntime
};
