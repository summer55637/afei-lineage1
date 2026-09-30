import { validatePersistentState } from './stoneage_persistent_state.mjs';
import { commitSave, parseAndValidateSaveEnvelope } from './stoneage_save_transaction.mjs';
import { IDLE_STATES, IDLE_EVENTS, idleInitialState, transitionIdle } from './stoneage_idle_loop.mjs';

const IDLE_PERSISTENT_STATE_RUNTIME_FORMAT='stoneage-idle-persistent-state-runtime-v1';
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));

function persistentIdleProjection(state){
  const idle=state?.idle;
  return {
    state:typeof idle?.mode==='string' ? idle.mode : IDLE_STATES.DISABLED,
    routeId:idle?.routeId??null
  };
}

function syncIdlePersistence(state,nextIdle,event,{now}={}){
  const next=clone(state);
  next.idle??={};
  next.idle.enabled=!([IDLE_STATES.DISABLED,IDLE_STATES.DEAD,IDLE_STATES.OFFLINE_RESUME].includes(nextIdle.state));
  next.idle.mode=nextIdle.state;
  next.idle.routeId=nextIdle.routeId??null;
  const stamp=String((now??(()=>new Date().toISOString()))());
  next.idle.lastSimulatedAt=stamp;
  if(!isObject(next.idle.offline))next.idle.offline={eligible:false,lastClosedAt:null,lastResumedAt:null,elapsedSeconds:0,accruedSeconds:0,resumePending:false,rewardsApplied:false};
  if(event===IDLE_EVENTS.OFFLINE_RESUME){
    next.idle.offline.resumePending=true;
    next.idle.offline.lastResumedAt=stamp;
  }else if(event===IDLE_EVENTS.SAVE_COMMITTED){
    next.idle.offline.resumePending=false;
  }
  if(event===IDLE_EVENTS.DISABLE){
    next.idle.offline.resumePending=false;
  }
  return next;
}

function applyIdleEventToPersistentState(state,event,payload={},{
  now=()=>new Date().toISOString()
}={}){
  const errors=validatePersistentState(state);
  if(errors.length)return {ok:false,reason:'persistent-state-invalid',errors,state:clone(state)};
  const currentIdle=persistentIdleProjection(state);
  const transitioned=transitionIdle(currentIdle,event,payload);
  if(transitioned.accepted!==true){
    return {ok:false,reason:transitioned.lastReason??'no_transition',state:clone(state),idle:currentIdle};
  }
  const next=syncIdlePersistence(state,transitioned,event,{now});
  const nextErrors=validatePersistentState(next);
  if(nextErrors.length)return {ok:false,reason:'persistent-state-invalid-after-idle-transition',errors:nextErrors,state:clone(state)};
  return {
    ok:true,
    format:IDLE_PERSISTENT_STATE_RUNTIME_FORMAT,
    event,
    idle:clone(transitioned),
    state:next,
    sourceBoundary:'Idle Loop consumes route/encounter/battle/reward outcomes; it does not recompute fixed-C battle results'
  };
}

async function commitIdleEvent(state,event,payload={},{
  now=()=>new Date().toISOString(),
  expectedRevision=null,
  source='idle-loop'
}={}){
  const applied=applyIdleEventToPersistentState(state,event,payload,{now});
  if(!applied.ok)return applied;
  const committed=await commitSave(state,applied.state,{expectedRevision,savedAt:now,source});
  if(!committed.ok)return {...committed,stage:'save',state:clone(state)};
  const verified=await parseAndValidateSaveEnvelope(committed.envelope,{now});
  if(!verified.ok)return {...verified,ok:false,stage:'save-verify',state:clone(state)};
  return {
    ok:true,
    format:IDLE_PERSISTENT_STATE_RUNTIME_FORMAT,
    event,
    state:verified.state,
    envelope:committed.envelope,
    verification:verified,
    revision:verified.state.revision,
    sourceBoundary:applied.sourceBoundary
  };
}

export { IDLE_PERSISTENT_STATE_RUNTIME_FORMAT, IDLE_STATES, IDLE_EVENTS, idleInitialState, persistentIdleProjection, applyIdleEventToPersistentState, commitIdleEvent };
