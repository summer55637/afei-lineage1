import { validatePersistentState } from './stoneage_persistent_state.mjs';
import { applyIdleEventToPersistentState, IDLE_EVENTS, IDLE_PERSISTENT_STATE_RUNTIME_FORMAT } from './stoneage_idle_persistent_state_runtime.mjs';
import { commitSave, parseAndValidateSaveEnvelope } from './stoneage_save_transaction.mjs';
import { createBrowserWorldEncounterRuntime } from './stoneage_browser_world_encounter_runtime.mjs';

const BROWSER_WORLD_ENCOUNTER_IDLE_BRIDGE_FORMAT='stoneage-browser-world-encounter-idle-bridge-runtime-v1';
const ACTION_WORLD_ENCOUNTER_ROLL_IDLE_COMMIT='WORLD_ENCOUNTER_ROLL_IDLE_COMMIT';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const intOr=value=>{const s=String(value??'').trim();if(s==='')return null;const m=s.match(/^[+-]?\d+/);return m?Number(m[0]):null;};

function commitWorldEncounterRollToIdle(state,encounterTargetIndex,{
  position=null,encounterId=null,cep=null,rng120=null,expectedRevision=null,
  savedAt=()=>new Date().toISOString(),source='browser-world-encounter-idle'
}={}){
  const clock=typeof savedAt==='function'?savedAt:()=>String(savedAt??new Date().toISOString());
  const stateErrors=validatePersistentState(state);
  if(stateErrors.length)return Promise.resolve({ok:false,handled:false,stage:'persistent-state-validation',reason:'persistent-state-invalid',errors:stateErrors,state:clone(state)});
  const idleMode=String(state?.idle?.mode??'');
  if(idleMode!=='moving')return Promise.resolve({ok:false,handled:false,stage:'idle-bridge',reason:'idle-state-not-moving',idleMode,state:clone(state)});
  if(state?.idle?.routeId==null)return Promise.resolve({ok:false,handled:false,stage:'idle-bridge',reason:'idle-route-required',state:clone(state)});
  const encounterRuntime=createBrowserWorldEncounterRuntime({encounterTargetIndex});
  if(encounterRuntime.ok!==true)return Promise.resolve({ok:false,handled:false,stage:'encounter-runtime',reason:encounterRuntime.reason??'encounter-runtime-invalid',errors:encounterRuntime.errors??[],state:clone(state)});
  const currentCep=cep==null?Math.max(0,intOr(state?.world?.encounter?.cep)??0):Math.max(0,intOr(cep)??0);
  const roll=encounterRuntime.roll(state,{position,encounterId,cep:currentCep,rng120});
  if(!roll.ok)return Promise.resolve({...roll,handled:false,stage:roll.stage??'encounter-roll',state:clone(state)});
  const next=clone(roll.state??state);
  next.world??={};
  next.world.encounter??={cep:0};
  next.world.encounter.cep=Math.max(0,intOr(roll.cepAfter)??0);
  const idleApplied=applyIdleEventToPersistentState(next,IDLE_EVENTS.MOVE_TICK,{
    encounterTriggered:roll.triggered===true,
    encounter:roll.encounter?{
      floorId:roll.encounter.floorId,
      x:roll.encounter.x,
      y:roll.encounter.y,
      encounterId:roll.encounter.encounterId
    }:null
  },{now:clock});
  if(!idleApplied.ok)return {...idleApplied,handled:false,stage:'idle-bridge',state:clone(state)};
  const commit=commitSave(state,idleApplied.state,{
    expectedRevision:expectedRevision==null?Number(state?.revision??0):Number(expectedRevision),
    savedAt:clock,
    source
  });
  return commit.then(async saved=>{
    if(!saved.ok)return {...saved,handled:false,stage:'save',state:clone(state)};
    const verification=await parseAndValidateSaveEnvelope(saved.envelope,{now:clock});
    if(!verification.ok)return {...verification,ok:false,handled:false,stage:'save-verify',state:clone(state)};
    return {
      ...roll,
      ok:true,
      handled:true,
      stage:'encounter-roll-idle-commit',
      format:BROWSER_WORLD_ENCOUNTER_IDLE_BRIDGE_FORMAT,
      idleEvent:IDLE_EVENTS.MOVE_TICK,
      idleModeBefore:idleMode,
      idleModeAfter:verification.state.idle.mode,
      persistentCepBefore:currentCep,
      persistentCepAfter:verification.state.world.encounter.cep,
      state:verification.state,
      envelope:saved.envelope,
      verification,
      revision:verification.state.revision,
      idlePersistentRuntimeFormat:IDLE_PERSISTENT_STATE_RUNTIME_FORMAT,
      source:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF}
    };
  });
}

function createBrowserWorldEncounterIdleBridge({encounterTargetIndex=null}={}){
  const runtime=createBrowserWorldEncounterRuntime({encounterTargetIndex});
  if(runtime.ok!==true)return {ok:false,format:BROWSER_WORLD_ENCOUNTER_IDLE_BRIDGE_FORMAT,reason:'encounter-runtime-invalid',errors:runtime.errors??[runtime.reason]};
  return {
    ok:true,
    format:BROWSER_WORLD_ENCOUNTER_IDLE_BRIDGE_FORMAT,
    commit:(state,options={})=>commitWorldEncounterRollToIdle(state,encounterTargetIndex,options)
  };
}

export {
  BROWSER_WORLD_ENCOUNTER_IDLE_BRIDGE_FORMAT,
  ACTION_WORLD_ENCOUNTER_ROLL_IDLE_COMMIT,
  SOURCE_REPOSITORY,
  SOURCE_REF,
  commitWorldEncounterRollToIdle,
  createBrowserWorldEncounterIdleBridge
};
