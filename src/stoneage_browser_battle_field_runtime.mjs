import {
  loadSourceMapRuntime,
  sourceMapBattleFieldNoAt
} from './stoneage_map_runtime.mjs';

const BROWSER_BATTLE_FIELD_RUNTIME_FORMAT='stoneage-browser-battle-field-runtime-v1';
const ACTION_BATTLE_FIELD_RESOLVE='BATTLE_FIELD_RESOLVE';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const CANDIDATE_COUNT=3;

const clone=value=>JSON.parse(JSON.stringify(value));
const intOr=value=>{const s=String(value??'').trim();if(s==='')return null;const m=s.match(/^[+-]?\d+/);return m?Number(m[0]):null;};

function resolveBattleFieldFromMap(map,floorId,x,y,{battleFieldRoll=null}={}){
  if(!map)return {ok:false,handled:false,stage:'battle-field',reason:'source-map-runtime-missing'};
  const roll=intOr(battleFieldRoll);
  if(roll==null||roll<0||roll>=CANDIDATE_COUNT){
    return {ok:false,handled:false,stage:'battle-field',reason:'battle-field-rng-required-or-out-of-range',battleFieldRoll:roll};
  }
  const resolved=sourceMapBattleFieldNoAt(map,x,y,{randIndex:()=>roll});
  if(!resolved)return {ok:false,handled:false,stage:'battle-field',reason:'battle-field-candidates-unresolved'};
  if(!Array.isArray(resolved.battleCandidates)||resolved.battleCandidates.length!==CANDIDATE_COUNT){
    return {ok:false,handled:false,stage:'battle-field',reason:'battle-field-candidates-invalid',resolved:clone(resolved)};
  }
  const fieldNo=intOr(resolved.battleFieldNo);
  if(fieldNo==null||fieldNo<0)return {ok:false,handled:false,stage:'battle-field',reason:'battle-field-no-invalid',resolved:clone(resolved)};
  return {
    ok:true,handled:true,stage:'battle-field-resolved',
    format:BROWSER_BATTLE_FIELD_RUNTIME_FORMAT,
    action:ACTION_BATTLE_FIELD_RESOLVE,
    floorId:intOr(floorId),x:intOr(x),y:intOr(y),
    candidates:resolved.battleCandidates.map(intOr),
    selection:roll,
    battleFieldNo:fieldNo,
    rngConsumed:true,
    sourceBoundary:'BATTLE_getBattleFieldNo -> MAP_getTileAndObjData -> MAP_getImageInt(MAP_BATTLEMAP/BATTLEMAP2/BATTLEMAP3)',
    source:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF}
  };
}

async function resolveBattleFieldAt(floorId,x,y,{battleFieldRoll=null,fetchImpl=globalThis.fetch}={}){
  const id=intOr(floorId);
  const xi=intOr(x),yi=intOr(y);
  if(id==null||xi==null||yi==null)return {ok:false,handled:false,stage:'battle-field',reason:'battle-field-position-required'};
  let map;
  try{map=await loadSourceMapRuntime(id,{fetchImpl});}
  catch(error){return {ok:false,handled:false,stage:'battle-field',reason:'source-map-runtime-load-failed',error:String(error?.message??error)};}
  return resolveBattleFieldFromMap(map,id,xi,yi,{battleFieldRoll});
}

function createBrowserBattleFieldRuntime({mapRuntimeOptions={}}={}){
  return {
    ok:true,
    format:BROWSER_BATTLE_FIELD_RUNTIME_FORMAT,
    resolve:(floorId,x,y,options={})=>resolveBattleFieldAt(floorId,x,y,{...mapRuntimeOptions,...options}),
    resolveFromMap:(map,floorId,x,y,options={})=>resolveBattleFieldFromMap(map,floorId,x,y,options)
  };
}

export {
  BROWSER_BATTLE_FIELD_RUNTIME_FORMAT,
  ACTION_BATTLE_FIELD_RESOLVE,
  CANDIDATE_COUNT,
  resolveBattleFieldFromMap,
  resolveBattleFieldAt,
  createBrowserBattleFieldRuntime
};
