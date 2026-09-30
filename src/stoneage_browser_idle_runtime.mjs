import {
  commitIdleEvent,
  IDLE_EVENTS,
  IDLE_PERSISTENT_STATE_RUNTIME_FORMAT
} from './stoneage_idle_persistent_state_runtime.mjs';
import { simulateFirstEncounter } from './stoneage_idle_simulation.mjs';

const BROWSER_IDLE_RUNTIME_FORMAT='stoneage-browser-idle-runtime-v1';
const ACTION_IDLE_LIST_ROUTES='IDLE_LIST_ROUTES';
const ACTION_IDLE_ENABLE='IDLE_ENABLE';
const ACTION_IDLE_EVENT='IDLE_EVENT';
const ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER='IDLE_SIMULATE_FIRST_ENCOUNTER';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));

const STATE_EVENTS=new Set([
  IDLE_EVENTS.DISABLE,
  IDLE_EVENTS.MOVE_TICK,
  IDLE_EVENTS.ENCOUNTER_ROLLED,
  IDLE_EVENTS.BATTLE_STARTED,
  IDLE_EVENTS.BATTLE_FINISHED,
  IDLE_EVENTS.REWARD_APPLIED,
  IDLE_EVENTS.SUPPLY_REQUIRED,
  IDLE_EVENTS.SUPPLY_DONE,
  IDLE_EVENTS.PLAYER_DEAD,
  IDLE_EVENTS.REVIVE_READY
]);

function routeIdForVariant(route,variant){
  return `hometown-${route?.hometown}/floor-${route?.entryFloor}-to-${route?.encounterFloor}/${variant?.portalId??'unknown'}`;
}

function normalizeRouteSelection(catalog,selection={}){
  if(!isObject(catalog)||catalog.format!=='stoneage-first-idle-route-catalog-v1')return {ok:false,reason:'idle-route-catalog-invalid'};
  const routeList=Array.isArray(catalog.routes)?catalog.routes:[];
  if(selection.routeId!=null){
    const id=String(selection.routeId).trim();
    for(const route of routeList)for(const variant of Array.isArray(route.variants)?route.variants:[]){
      if(routeIdForVariant(route,variant)===id)return {ok:true,route,variant,routeId:id};
    }
    return {ok:false,reason:'idle-route-not-found',routeId:id};
  }
  const hometown=Number.isFinite(Number(selection.hometown))?Math.trunc(Number(selection.hometown)):null;
  const portalId=selection.portalId==null?null:String(selection.portalId).trim();
  const route=routeList.find(x=>hometown!=null&&Number(x.hometown)===hometown);
  if(!route)return {ok:false,reason:'idle-hometown-route-not-found',hometown};
  const variant=(route.variants??[]).find(x=>portalId==null||String(x.portalId)===portalId);
  if(!variant)return {ok:false,reason:'idle-route-variant-not-found',hometown,portalId};
  return {ok:true,route,variant,routeId:routeIdForVariant(route,variant)};
}

function validateBrowserIdleDependencies({routeCatalog=null}={}){
  const errors=[];
  if(!isObject(routeCatalog))errors.push('first idle route catalog required');
  if(routeCatalog?.format!=='stoneage-first-idle-route-catalog-v1')errors.push('first idle route catalog format mismatch');
  if(routeCatalog?.fixedSource?.repository!==SOURCE_REPOSITORY)errors.push('fixed source repository mismatch');
  if(routeCatalog?.fixedSource?.ref!==SOURCE_REF)errors.push('fixed source ref mismatch');
  const variants=(routeCatalog?.routes??[]).flatMap(route=>(route.variants??[]).map(variant=>({route,variant})));
  const usable=variants.filter(({route,variant})=>route?.status!=='source_blocked_before_portal'&&Number(variant?.usableLandingCount)>0);
  if(usable.length<1)errors.push('no source-backed usable idle route variants');
  return {ok:errors.length===0,errors,usableCount:usable.length};
}

function listUsableRoutes(catalog){
  return (catalog.routes??[]).flatMap(route=>(route.variants??[]).map(variant=>({
    hometown:route.hometown,
    name:route.name,
    entryFloor:route.entryFloor,
    encounterFloor:route.encounterFloor,
    routeId:routeIdForVariant(route,variant),
    portalId:variant.portalId,
    encounterId:variant.encounterId??null,
    totalWalkBeforeEncounterMin:variant.totalWalkBeforeEncounterMin??null,
    usableLandingCount:variant.usableLandingCount??0,
    totalLandingCount:variant.totalLandingCount??0,
    eligible:route.status!=='source_blocked_before_portal'&&Number(variant.usableLandingCount)>0
  }))).filter(x=>x.eligible);
}

function validateActionPayload(event,payload){
  if(!STATE_EVENTS.has(event))return {ok:false,reason:'idle-event-not-browser-boundary',event};
  if(event===IDLE_EVENTS.MOVE_TICK&&typeof payload.encounterTriggered!=='boolean')return {ok:false,reason:'idle-move-tick-encounter-trigger-required'};
  if(event===IDLE_EVENTS.ENCOUNTER_ROLLED&&typeof payload.active!=='boolean')return {ok:false,reason:'idle-encounter-active-required'};
  if(event===IDLE_EVENTS.REWARD_APPLIED&&typeof payload.supplyRequired!=='boolean')return {ok:false,reason:'idle-reward-supply-required'};
  return {ok:true};
}

function createBrowserIdleRuntime({routeCatalog=null}={}){
  const deps=validateBrowserIdleDependencies({routeCatalog});
  if(!deps.ok)return {ok:false,format:BROWSER_IDLE_RUNTIME_FORMAT,reason:'dependency-validation-failed',errors:deps.errors};
  return {
    ok:true,
    format:BROWSER_IDLE_RUNTIME_FORMAT,
    routeCatalogFormat:routeCatalog.format,
    usableRouteCount:deps.usableCount,
    listRoutes:()=>listUsableRoutes(routeCatalog),
    dispatch:async(state,action={},options={})=>{
      if(!isObject(action))return {ok:false,handled:false,stage:'action',reason:'invalid-browser-idle-action',state};
      const type=String(action.type??'').trim();
      if(type===ACTION_IDLE_LIST_ROUTES)return {ok:true,handled:true,stage:'route-catalog',routes:listUsableRoutes(routeCatalog),state:clone(state)};
      if(type===ACTION_IDLE_ENABLE){
        const selection=normalizeRouteSelection(routeCatalog,action);
        if(!selection.ok)return {ok:false,handled:false,stage:'route-selection',reason:selection.reason,state:clone(state)};
        if(selection.route.status==='source_blocked_before_portal'||Number(selection.variant.usableLandingCount)<=0){
          return {ok:false,handled:false,stage:'route-selection',reason:'idle-route-not-eligible',routeId:selection.routeId,state:clone(state)};
        }
        const committed=await commitIdleEvent(state,IDLE_EVENTS.ENABLE,{routeId:selection.routeId},{
          now:action.now??options.now??(()=>new Date().toISOString()),
          expectedRevision:action.expectedRevision==null?Number(state?.revision??0):action.expectedRevision,
          source:'browser-idle'
        });
        return {...committed,handled:committed.ok===true,stage:committed.ok===true?'idle-enable':'save',route:clone(selection.route),variant:clone(selection.variant),routeId:selection.routeId};
      }
      if(type===ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER){
        const selection=normalizeRouteSelection(routeCatalog,action);
        if(!selection.ok)return {ok:false,handled:false,stage:'route-selection',reason:selection.reason,state:clone(state)};
        if(selection.route.status==='source_blocked_before_portal'||Number(selection.variant.usableLandingCount)<=0){
          return {ok:false,handled:false,stage:'route-selection',reason:'idle-route-not-eligible',routeId:selection.routeId,state:clone(state)};
        }
        const expectedRevision=action.expectedRevision==null?Number(state?.revision??0):Number(action.expectedRevision);
        if(expectedRevision!==Number(state?.revision??0)){
          return {ok:false,handled:false,stage:'save',reason:'revision-conflict',currentRevision:Number(state?.revision??0),expectedRevision,state:clone(state)};
        }
        const simulation=await simulateFirstEncounter(state,selection.route,selection.variant,{
          encounter:action.encounter??{floorId:selection.route.encounterFloor,encounterId:selection.variant.encounterId??null},
          battleResult:action.battleResult??null,
          sourceBattleResult:action.sourceBattleResult??null,
          policy:isObject(action.policy)?action.policy:{},
          knownExistingItemIds:action.knownExistingItemIds??null,
          now:action.now??options.now??(()=>new Date().toISOString()),
          save:action.save!==false
        });
        if(!simulation.ok){
          return {ok:false,handled:false,stage:'idle-simulation',reason:simulation.reason??'idle-simulation-failed',errors:simulation.errors??[],state:clone(simulation.state??state),route:clone(selection.route),variant:clone(selection.variant),routeId:selection.routeId};
        }
        return {ok:true,handled:true,stage:'idle-simulation',route:clone(selection.route),variant:clone(selection.variant),routeId:selection.routeId,simulation,state:clone(simulation.state??state)};
      }
      if(type===ACTION_IDLE_EVENT){
        const event=String(action.event??'').trim();
        const payload=isObject(action.payload)?clone(action.payload):{};
        const checked=validateActionPayload(event,payload);
        if(!checked.ok)return {ok:false,handled:false,stage:'event-validation',reason:checked.reason,event,state:clone(state)};
        if(isObject(state?.idle)&&state.idle.routeId!=null){
          const routeCheck=normalizeRouteSelection(routeCatalog,{routeId:String(state.idle.routeId)});
          if(!routeCheck.ok&&event!==IDLE_EVENTS.DISABLE)return {ok:false,handled:false,stage:'route-binding',reason:'idle-state-route-not-in-catalog',routeId:state.idle.routeId,state:clone(state)};
        }else if(event!==IDLE_EVENTS.DISABLE){
          return {ok:false,handled:false,stage:'route-binding',reason:'idle-route-not-enabled',state:clone(state)};
        }
        const committed=await commitIdleEvent(state,event,payload,{
          now:action.now??options.now??(()=>new Date().toISOString()),
          expectedRevision:action.expectedRevision==null?Number(state?.revision??0):action.expectedRevision,
          source:'browser-idle'
        });
        return {...committed,handled:committed.ok===true,stage:committed.ok===true?'idle-event':'save'};
      }
      return {ok:false,handled:false,stage:'action',reason:'unsupported-browser-idle-action',type,state:clone(state)};
    }
  };
}

export {
  BROWSER_IDLE_RUNTIME_FORMAT,
  ACTION_IDLE_LIST_ROUTES,
  ACTION_IDLE_ENABLE,
  ACTION_IDLE_EVENT,
  ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER,
  SOURCE_REPOSITORY,
  SOURCE_REF,
  IDLE_PERSISTENT_STATE_RUNTIME_FORMAT,
  routeIdForVariant,
  normalizeRouteSelection,
  validateBrowserIdleDependencies,
  listUsableRoutes,
  validateActionPayload,
  createBrowserIdleRuntime
};
