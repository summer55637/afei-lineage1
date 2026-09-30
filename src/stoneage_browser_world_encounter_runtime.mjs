const BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT='stoneage-browser-world-encounter-runtime-v1';
const ENCOUNTER_TARGET_INDEX_FORMAT='stoneage-start-encounter-target-index-v1';
const ACTION_WORLD_ENCOUNTER_PREPARE='WORLD_ENCOUNTER_PREPARE';
const ACTION_WORLD_ENCOUNTER_ROLL='WORLD_ENCOUNTER_ROLL';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const SOURCE_ENCOUNT_BLOB_SHA='89da97a15ea866a36f26ec3bb7ab5490f3eccc5f';
const SOURCE_GROUP_BLOB_SHA='1be75eb3e56ab16d4b433146ec59538ad651c874';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));

function intOr(value,fallback=null){
  return Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : fallback;
}

function normalizeCell(value){
  if(Array.isArray(value)&&value.length>=3){
    const floorId=intOr(value[0]),x=intOr(value[1]),y=intOr(value[2]);
    return floorId!=null&&floorId>=0&&x!=null&&x>=0&&y!=null&&y>=0?{floorId,x,y}:null;
  }
  if(isObject(value)){
    const floorId=intOr(value.floorId??value.floor),x=intOr(value.x),y=intOr(value.y);
    return floorId!=null&&floorId>=0&&x!=null&&x>=0&&y!=null&&y>=0?{floorId,x,y}:null;
  }
  return null;
}

function normalizeRect(value){
  if(!Array.isArray(value)||value.length<4)return null;
  const x1=intOr(value[0]),y1=intOr(value[1]),x2=intOr(value[2]),y2=intOr(value[3]);
  if([x1,y1,x2,y2].some(v=>v==null||v<0))return null;
  return {x1:Math.min(x1,x2),y1:Math.min(y1,y2),x2:Math.max(x1,x2),y2:Math.max(y1,y2)};
}

function rectContains(rect,x,y){
  const r=normalizeRect(rect);
  return !!r&&Number.isInteger(Number(x))&&Number.isInteger(Number(y))
    &&Number(x)>=r.x1&&Number(x)<=r.x2&&Number(y)>=r.y1&&Number(y)<=r.y2;
}

function floorRows(index,floorId){
  const floor=index?.floors?.[String(Number(floorId))];
  return Array.isArray(floor?.unconditionalRows)?floor.unconditionalRows:[];
}

function validateEncounterTargetIndex(index){
  const errors=[];
  if(!isObject(index))errors.push('encounter target index must be an object');
  if(index?.format!==ENCOUNTER_TARGET_INDEX_FORMAT)errors.push('encounter target index format mismatch');
  if(index?.fixedSource?.repository!==SOURCE_REPOSITORY)errors.push('encounter target source repository mismatch');
  if(index?.fixedSource?.ref!==SOURCE_REF)errors.push('encounter target source ref mismatch');
  if(index?.fixedSource?.encountBlobSha!==SOURCE_ENCOUNT_BLOB_SHA)errors.push('encount source blob sha mismatch');
  if(index?.fixedSource?.groupBlobSha!==SOURCE_GROUP_BLOB_SHA)errors.push('group source blob sha mismatch');
  if(!isObject(index?.floors))errors.push('encounter target floors missing');
  let rowCount=0;
  for(const [floorKey,floor] of Object.entries(index?.floors??{})){
    if(!Number.isInteger(Number(floorKey))||Number(floorKey)<0)errors.push('encounter floor key invalid: '+floorKey);
    if(!Array.isArray(floor?.unconditionalRows))continue;
    rowCount+=floor.unconditionalRows.length;
    for(const [rowIndex,row] of floor.unconditionalRows.entries()){
      if(!Number.isInteger(Number(row?.encounterId))||Number(row.encounterId)<0)errors.push('encounter row '+floorKey+'#'+rowIndex+' encounterId invalid');
      if(!normalizeRect(row?.rect))errors.push('encounter row '+floorKey+'#'+rowIndex+' rect invalid');
      for(const key of ['probMin','probMax','enemyMax']){
        if(!Number.isInteger(Number(row?.[key]))||Number(row[key])<0)errors.push('encounter row '+floorKey+'#'+rowIndex+' '+key+' invalid');
      }
      if(Number(row?.probMin)>Number(row?.probMax))errors.push('encounter row '+floorKey+'#'+rowIndex+' probability range inverted');
      if(!Array.isArray(row?.groupIds)||row.groupIds.length===0)errors.push('encounter row '+floorKey+'#'+rowIndex+' groupIds missing');
    }
  }
  if(rowCount===0)errors.push('encounter target index contains no unconditional rows');
  return {ok:errors.length===0,errors,rowCount};
}

function resolveWorldEncounterTarget(position,index,{encounterId=null}={}){
  const check=validateEncounterTargetIndex(index);
  if(!check.ok)return {ok:false,reason:'invalid-encounter-target-index',errors:check.errors};
  const cell=normalizeCell(position);
  if(!cell)return {ok:false,reason:'encounter-position-invalid'};
  const wanted=encounterId==null?null:Number(encounterId);
  const rows=floorRows(index,cell.floorId).filter(row=>rectContains(row.rect,cell.x,cell.y));
  const candidates=wanted==null?rows:rows.filter(row=>Number(row.encounterId)===wanted);
  if(!candidates.length){
    return {ok:false,reason:wanted==null?'unconditional-encounter-not-at-position':'encounter-id-not-at-position',position:cell,encounterId:wanted};
  }
  if(candidates.length>1){
    const sorted=[...candidates].sort((a,b)=>Number(b.zorder??0)-Number(a.zorder??0));
    const top=Number(sorted[0].zorder??0);
    const ties=sorted.filter(row=>Number(row.zorder??0)===top);
    if(ties.length!==1){
      return {ok:false,reason:'ambiguous-unconditional-encounter-at-position',position:cell,encounterId:wanted,candidates:clone(candidates)};
    }
    return {ok:true,position:cell,row:clone(sorted[0]),selection:'highest-zorder'};
  }
  return {ok:true,position:cell,row:clone(candidates[0]),selection:'exact'};
}

function prepareBrowserWorldEncounter(state,index,{position=null,encounterId=null}={}){
  const statePosition=normalizeCell(state?.world?.position);
  if(!statePosition)return {ok:false,handled:false,stage:'encounter-gate',reason:'encounter-state-position-required',state:clone(state)};
  if(position!=null){
    const requested=normalizeCell(position);
    if(!requested||requested.floorId!==statePosition.floorId||requested.x!==statePosition.x||requested.y!==statePosition.y){
      return {ok:false,handled:false,stage:'encounter-gate',reason:'encounter-player-state-mismatch',playerPosition:requested,statePosition,state:clone(state)};
    }
  }
  const resolved=resolveWorldEncounterTarget(statePosition,index,{encounterId});
  if(!resolved.ok)return {ok:false,handled:false,stage:'encounter-resolution',reason:resolved.reason,errors:resolved.errors??[],position:statePosition,encounterId:resolved.encounterId??null,state:clone(state)};
  const row=resolved.row;
  const rect=normalizeRect(row.rect);
  const encounter={
    floorId:statePosition.floorId,
    x:statePosition.x,
    y:statePosition.y,
    encounterId:Number(row.encounterId),
    rect:[rect.x1,rect.y1,rect.x2,rect.y2],
    probMin:Number(row.probMin),
    probMax:Number(row.probMax),
    enemyMax:Number(row.enemyMax),
    zorder:Number(row.zorder??0),
    groupIds:row.groupIds.map(Number),
    enemyIds:Array.isArray(row.enemyIds)?row.enemyIds.map(Number):[],
    sourceSelection:resolved.selection
  };
  return {
    ok:true,
    handled:true,
    stage:'encounter-prepare',
    format:BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT,
    source:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF,encountBlobSha:SOURCE_ENCOUNT_BLOB_SHA,groupBlobSha:SOURCE_GROUP_BLOB_SHA},
    position:statePosition,
    encounter,
    readyForRoll:true,
    rngConsumed:false,
    battleStarted:false,
    state:clone(state)
  };
}

function rollPreparedWorldEncounter(encounter,{cep=0,rng120=null,noEnemy=false,battleModeNone=true,warpBlocked=false}={}){
  if(!isObject(encounter))return {ok:false,reason:'prepared-encounter-required'};
  const probMin=intOr(encounter.probMin),probMax=intOr(encounter.probMax);
  if(probMin==null||probMax==null||probMin<0||probMax<probMin)return {ok:false,reason:'encounter-probability-range-invalid'};
  const initialCep=intOr(cep);
  if(initialCep==null||initialCep<0)return {ok:false,reason:'encounter-cep-invalid'};
  const clampedCep=Math.min(probMax,Math.max(probMin,initialCep));
  if(noEnemy===true)return {
    ok:true,
    outcome:'skipped',
    reason:'encounter-disabled-noenemy',
    encounter:clone(encounter),
    cepBefore:initialCep,
    cepAfter:clampedCep,
    rngConsumed:false,
    triggered:false,
    battleStarted:false
  };
  if(battleModeNone!==true)return {
    ok:true,
    outcome:'skipped',
    reason:'battle-mode-not-none',
    encounter:clone(encounter),
    cepBefore:initialCep,
    cepAfter:clampedCep,
    rngConsumed:false,
    triggered:false,
    battleStarted:false
  };
  const roll=intOr(rng120);
  if(roll==null||roll<0||roll>119)return {ok:false,reason:'encounter-rng120-required'};
  const hit=roll<clampedCep;
  if(hit&&warpBlocked===true)return {
    ok:true,
    outcome:'roll-hit-blocked',
    reason:'warp-event-blocked',
    encounter:clone(encounter),
    rng120:roll,
    cepBefore:initialCep,
    cepAfter:clampedCep,
    rngConsumed:true,
    triggered:false,
    battleStarted:false
  };
  if(hit)return {
    ok:true,
    outcome:'encounter',
    reason:'encounter-triggered',
    encounter:clone(encounter),
    rng120:roll,
    cepBefore:initialCep,
    cepAfter:probMin,
    rngConsumed:true,
    triggered:true,
    battleStarted:false
  };
  return {
    ok:true,
    outcome:'no-encounter',
    reason:'encounter-roll-miss',
    encounter:clone(encounter),
    rng120:roll,
    cepBefore:initialCep,
    cepAfter:Math.min(probMax,clampedCep+1),
    rngConsumed:true,
    triggered:false,
    battleStarted:false
  };
}

function rollBrowserWorldEncounter(state,index,{position=null,encounterId=null,cep=0,rng120=null,noEnemy=false,battleModeNone=true,warpBlocked=false}={}){
  const prepared=prepareBrowserWorldEncounter(state,index,{position,encounterId});
  if(!prepared.ok)return prepared;
  const rolled=rollPreparedWorldEncounter(prepared.encounter,{cep,rng120,noEnemy,battleModeNone,warpBlocked});
  return {
    ...rolled,
    handled:rolled.ok===true,
    stage:'encounter-roll',
    format:BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT,
    source:clone(prepared.source),
    position:clone(prepared.position),
    readyForRoll:true,
    state:clone(state)
  };
}

function createBrowserWorldEncounterRuntime({encounterTargetIndex=null}={}){
  const deps=validateEncounterTargetIndex(encounterTargetIndex);
  if(!deps.ok)return {ok:false,format:BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT,reason:'dependency-validation-failed',errors:deps.errors};
  return {
    ok:true,
    format:BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT,
    rowCount:deps.rowCount,
    resolve:(position,options={})=>resolveWorldEncounterTarget(position,encounterTargetIndex,options),
    prepare:(state,options={})=>prepareBrowserWorldEncounter(state,encounterTargetIndex,options),
    roll:(state,options={})=>rollBrowserWorldEncounter(state,encounterTargetIndex,options)
  };
}

export {
  BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT,
  ENCOUNTER_TARGET_INDEX_FORMAT,
  ACTION_WORLD_ENCOUNTER_PREPARE,
  ACTION_WORLD_ENCOUNTER_ROLL,
  SOURCE_REPOSITORY,
  SOURCE_REF,
  SOURCE_ENCOUNT_BLOB_SHA,
  SOURCE_GROUP_BLOB_SHA,
  normalizeCell,
  normalizeRect,
  rectContains,
  floorRows,
  validateEncounterTargetIndex,
  resolveWorldEncounterTarget,
  prepareBrowserWorldEncounter,
  rollPreparedWorldEncounter,
  rollBrowserWorldEncounter,
  createBrowserWorldEncounterRuntime
};
