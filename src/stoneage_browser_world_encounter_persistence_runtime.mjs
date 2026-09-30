import {
  createBrowserWorldEncounterRuntime,
  BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT
} from './stoneage_browser_world_encounter_runtime.mjs';
import { commitSave, parseAndValidateSaveEnvelope } from './stoneage_save_transaction.mjs';
import { validatePersistentState } from './stoneage_persistent_state.mjs';

const BROWSER_WORLD_ENCOUNTER_PERSISTENCE_RUNTIME_FORMAT='stoneage-browser-world-encounter-persistence-runtime-v1';
const ACTION_WORLD_ENCOUNTER_ROLL_COMMIT='WORLD_ENCOUNTER_ROLL_COMMIT';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const intOr=(value,fallback=null)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;

function persistentEncounterCep(state){
  return intOr(state?.world?.encounter?.cep,0);
}

function applyEncounterRollToPersistentState(state,roll){
  const next=clone(state);
  next.world??={};
  next.world.encounter??={cep:0};
  next.world.encounter.cep=Math.max(0,intOr(roll?.cepAfter,0));
  return next;
}

async function commitWorldEncounterRoll(state,encounterRuntime,{position=null,encounterId=null,cep=null,rng120=null,noEnemy=false,battleModeNone=true,warpBlocked=false,expectedRevision=null,savedAt=()=>new Date().toISOString(),source='browser-world-encounter'}={}){
  const errors=validatePersistentState(state);
  if(errors.length)return {ok:false,handled:false,stage:'persistent-state-validation',reason:'persistent-state-invalid',errors,state:clone(state)};
  const currentCep=cep==null?persistentEncounterCep(state):intOr(cep,0);
  if(currentCep==null||currentCep<0)return {ok:false,handled:false,stage:'encounter-roll',reason:'persistent-encounter-cep-invalid',state:clone(state)};
  const rolled=encounterRuntime.roll(state,{
    position,
    encounterId,
    cep:currentCep,
    rng120,
    noEnemy,
    battleModeNone,
    warpBlocked
  });
  if(!rolled.ok)return {...rolled,handled:false,stage:rolled.stage??'encounter-roll',state:clone(state)};
  const next=applyEncounterRollToPersistentState(state,rolled);
  const commit=await commitSave(state,next,{
    expectedRevision:expectedRevision==null?Number(state?.revision??0):Number(expectedRevision),
    savedAt,
    source
  });
  if(!commit.ok)return {...commit,handled:false,stage:'save',state:clone(state)};
  const verification=await parseAndValidateSaveEnvelope(commit.envelope,{now:savedAt});
  if(!verification.ok)return {...verification,ok:false,handled:false,stage:'save-verify',state:clone(state)};
  return {
    ...rolled,
    ok:true,
    handled:true,
    stage:'encounter-roll-persist',
    format:BROWSER_WORLD_ENCOUNTER_PERSISTENCE_RUNTIME_FORMAT,
    sourceBoundary:'Single-player persistence adapter; fixed-C CEP is connection-scoped, while this runtime persists the latest CEP in world.encounter.cep for save/offline continuity.',
    persistentCepBefore:currentCep,
    persistentCepAfter:verification.state.world.encounter.cep,
    envelope:commit.envelope,
    verification,
    revision:verification.state.revision,
    state:verification.state,
    encounterRuntimeFormat:BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT,
    fixedSource:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF}
  };
}

function createBrowserWorldEncounterPersistenceRuntime({encounterTargetIndex=null}={}){
  const encounterRuntime=createBrowserWorldEncounterRuntime({encounterTargetIndex});
  if(encounterRuntime.ok!==true){
    return {
      ok:false,
      format:BROWSER_WORLD_ENCOUNTER_PERSISTENCE_RUNTIME_FORMAT,
      reason:'encounter-runtime-invalid',
      errors:encounterRuntime.errors??[encounterRuntime.reason]
    };
  }
  return {
    ok:true,
    format:BROWSER_WORLD_ENCOUNTER_PERSISTENCE_RUNTIME_FORMAT,
    encounterRuntimeFormat:encounterRuntime.format,
    persistentCep:(state)=>persistentEncounterCep(state),
    commit:(state,options={})=>commitWorldEncounterRoll(state,encounterRuntime,options)
  };
}

export {
  BROWSER_WORLD_ENCOUNTER_PERSISTENCE_RUNTIME_FORMAT,
  ACTION_WORLD_ENCOUNTER_ROLL_COMMIT,
  SOURCE_REPOSITORY,
  SOURCE_REF,
  persistentEncounterCep,
  applyEncounterRollToPersistentState,
  commitWorldEncounterRoll,
  createBrowserWorldEncounterPersistenceRuntime
};
