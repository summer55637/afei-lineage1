import {
  loadSourceMapRuntime,
  loadSourceMapsetRuntime,
  sourceMapWalkableAt,
  sourceMapTileAt
} from './stoneage_map_runtime.mjs';
import { ro0000SourceMapWalkableAt } from './stoneage_ro0000_4000_repair.mjs';
import { commitSave, parseAndValidateSaveEnvelope } from './stoneage_save_transaction.mjs';

const BROWSER_WORLD_MOVEMENT_RUNTIME_FORMAT='stoneage-browser-world-movement-runtime-v1';
const ACTION_WORLD_MOVE_STEP='WORLD_MOVE_STEP';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const intOr=(value,fallback=null)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;

function normalizeCell(value){
  if(Array.isArray(value)&&value.length>=3){
    const floor=intOr(value[0]),x=intOr(value[1]),y=intOr(value[2]);
    return floor!=null&&floor>=0&&x!=null&&x>=0&&y!=null&&y>=0?{floorId:floor,x,y}:null;
  }
  if(isObject(value)){
    const floor=intOr(value.floorId??value.floor);
    const x=intOr(value.x),y=intOr(value.y);
    return floor!=null&&floor>=0&&x!=null&&x>=0&&y!=null&&y>=0?{floorId:floor,x,y}:null;
  }
  return null;
}

function sameCell(a,b){
  const aa=normalizeCell(a),bb=normalizeCell(b);
  return !!aa&&!!bb&&aa.floorId===bb.floorId&&aa.x===bb.x&&aa.y===bb.y;
}

function normalizeDirection(dx,dy){
  const x=intOr(dx),y=intOr(dy);
  if(x==null||y==null||![-1,0,1].includes(x)||![-1,0,1].includes(y)||(x===0&&y===0))return null;
  return {dx:x,dy:y,diagonal:x!==0&&y!==0};
}

function mapWalkableAtForRo0000(map,x,y,mapset,{flying=false}={}){
  return ro0000SourceMapWalkableAt(map,x,y,mapset,{flying,sourceMapWalkableAt});
}

function validateMoveStep(from,direction,map,mapset){
  const origin=normalizeCell(from);
  const dir=normalizeDirection(direction?.dx,direction?.dy);
  if(!origin)return {ok:false,reason:'movement-origin-invalid'};
  if(!dir)return {ok:false,reason:'movement-direction-invalid'};
  if(!map||Number(map.floorId)!==origin.floorId)return {ok:false,reason:'movement-map-unresolved',floorId:origin.floorId};
  const originTile=sourceMapTileAt(map,origin.x,origin.y);
  if(!originTile)return {ok:false,reason:'movement-origin-out-of-map'};
  const destination={floorId:origin.floorId,x:origin.x+dir.dx,y:origin.y+dir.dy};
  const destinationTile=sourceMapTileAt(map,destination.x,destination.y);
  if(!destinationTile)return {ok:false,reason:'movement-destination-out-of-map',destination};
  const destinationWalkable=mapWalkableAtForRo0000(map,destination.x,destination.y,mapset,{flying:false});
  if(!destinationWalkable)return {ok:false,reason:'movement-destination-not-walkable',from:origin,to:destination,diagonal:dir.diagonal};
  const sideCells=[];
  if(dir.diagonal){
    const xSide={floorId:origin.floorId,x:origin.x+dir.dx,y:origin.y};
    const ySide={floorId:origin.floorId,x:origin.x,y:origin.y+dir.dy};
    const xSideWalkable=mapWalkableAtForRo0000(map,xSide.x,xSide.y,mapset,{flying:false});
    const ySideWalkable=mapWalkableAtForRo0000(map,ySide.x,ySide.y,mapset,{flying:false});
    sideCells.push({cell:xSide,walkable:xSideWalkable},{cell:ySide,walkable:ySideWalkable});
    if(!xSideWalkable||!ySideWalkable){
      return {ok:false,reason:'movement-diagonal-side-cell-blocked',from:origin,to:destination,diagonal:true,sideCells};
    }
  }
  return {ok:true,from:origin,to:destination,diagonal:dir.diagonal,sideCells};
}

function validateMovementDependencies({loadMap=loadSourceMapRuntime,loadMapset=loadSourceMapsetRuntime}={}){
  const errors=[];
  if(typeof loadMap!=='function')errors.push('world movement map loader required');
  if(typeof loadMapset!=='function')errors.push('world movement mapset loader required');
  return {ok:errors.length===0,errors};
}

function createBrowserWorldMovementRuntime({
  loadMap=loadSourceMapRuntime,
  loadMapset=loadSourceMapsetRuntime,
  now=()=>new Date().toISOString()
}={}){
  const deps=validateMovementDependencies({loadMap,loadMapset});
  if(!deps.ok)return {ok:false,format:BROWSER_WORLD_MOVEMENT_RUNTIME_FORMAT,reason:'dependency-validation-failed',errors:deps.errors};
  return {
    ok:true,
    format:BROWSER_WORLD_MOVEMENT_RUNTIME_FORMAT,
    async dispatch(state,action={},{
      expectedRevision=action.expectedRevision==null?Number(state?.revision??0):Number(action.expectedRevision),
      savedAt=action.savedAt??action.now??now,
      source='browser-world-movement'
    }={}){
      if(!isObject(action))return {ok:false,handled:false,stage:'movement',reason:'invalid-browser-movement-action',state:clone(state)};
      const origin=normalizeCell(state?.world?.position);
      if(!origin)return {ok:false,handled:false,stage:'movement-gate',reason:'movement-state-position-required',state:clone(state)};
      const player=action.player??null;
      if(player!=null&&!normalizeCell(player))return {ok:false,handled:false,stage:'movement-gate',reason:'movement-player-position-invalid',state:clone(state)};
      if(player!=null&&!sameCell(player,origin))return {ok:false,handled:false,stage:'movement-gate',reason:'movement-player-state-mismatch',player:normalizeCell(player),statePosition:origin,state:clone(state)};
      const direction=normalizeDirection(action.dx,action.dy);
      if(!direction)return {ok:false,handled:false,stage:'movement-gate',reason:'movement-direction-invalid',state:clone(state)};
      const expected=Number(expectedRevision);
      const currentRevision=Number(state?.revision??0);
      if(!Number.isInteger(expected)||expected!==currentRevision)return {ok:false,handled:false,stage:'save',reason:'revision-conflict',currentRevision,expectedRevision,state:clone(state)};
      let map,mapset;
      try{
        [map,mapset]=await Promise.all([loadMap(origin.floorId),loadMapset()]);
      }catch(error){
        return {ok:false,handled:false,stage:'movement-map-load',reason:'movement-map-load-failed',error:String(error?.message??error),state:clone(state)};
      }
      if(!map)return {ok:false,handled:false,stage:'movement-map-load',reason:'movement-map-unresolved',floorId:origin.floorId,state:clone(state)};
      const checked=validateMoveStep(origin,direction,map,mapset);
      if(!checked.ok)return {ok:false,handled:false,stage:'movement-gate',reason:checked.reason,from:checked.from??origin,to:checked.to??null,sideCells:checked.sideCells??[],state:clone(state)};
      const next=clone(state);
      next.world??={position:{floorId:null,x:null,y:null},savePoint:null};
      next.world.position={floorId:checked.to.floorId,x:checked.to.x,y:checked.to.y};
      const committed=await commitSave(state,next,{expectedRevision:currentRevision,savedAt,source});
      if(!committed.ok)return {...committed,handled:false,stage:'save',state:clone(state)};
      const verified=await parseAndValidateSaveEnvelope(committed.envelope,{now:action.now??now});
      if(!verified.ok)return {ok:false,handled:false,stage:'save-verify',reason:verified.reason??'movement-save-verification-failed',errors:verified.errors??[],state:clone(state)};
      return {
        ok:true,
        handled:true,
        stage:'movement',
        format:BROWSER_WORLD_MOVEMENT_RUNTIME_FORMAT,
        from:checked.from,
        to:checked.to,
        diagonal:checked.diagonal,
        sideCells:checked.sideCells,
        envelope:committed.envelope,
        verification:verified,
        state:clone(verified.state)
      };
    }
  };
}

export {
  BROWSER_WORLD_MOVEMENT_RUNTIME_FORMAT,
  ACTION_WORLD_MOVE_STEP,
  SOURCE_REPOSITORY,
  SOURCE_REF,
  normalizeCell,
  sameCell,
  normalizeDirection,
  validateMoveStep,
  validateMovementDependencies,
  createBrowserWorldMovementRuntime
};
