import { CURRENT_STATE_SCHEMA_VERSION, normalizePersistentState, validatePersistentState } from './stoneage_persistent_state.mjs';

const SAVE_ENVELOPE_FORMAT='stoneage-save-envelope-v1';
const HASH_ALGORITHM='sha256';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

function stableClone(value){
  if(Array.isArray(value)) return value.map(stableClone);
  if(isObject(value)){const out={};for(const key of Object.keys(value).sort())out[key]=stableClone(value[key]);return out;}
  if(typeof value==='number'&&!Number.isFinite(value)) throw new Error('non-finite number is not serializable');
  if(typeof value==='undefined'||typeof value==='function'||typeof value==='symbol'||typeof value==='bigint') throw new Error('unsupported value in save state');
  return value;
}

function stableStringify(value){return JSON.stringify(stableClone(value));}
async function sha256(value){
  const bytes=new TextEncoder().encode(String(value));
  const subtle=globalThis.crypto?.subtle;
  if(!subtle) throw new Error('Web Crypto SHA-256 is unavailable');
  const digest=await subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}

async function buildSaveEnvelope(state,{savedAt=()=>new Date().toISOString(),source='runtime'}={}){
  const errors=validatePersistentState(state);
  if(errors.length)return {ok:false,errors};
  const payload=stableStringify(state);
  return {ok:true,envelope:{
    format:SAVE_ENVELOPE_FORMAT,
    schemaVersion:CURRENT_STATE_SCHEMA_VERSION,
    revision:Number.isInteger(state.revision)?state.revision:0,
    savedAt:String(savedAt()),
    source:String(source),
    payloadHash:await sha256(payload),
    payload
  }};
}

async function parseAndValidateSaveEnvelope(envelope,{now=()=>new Date().toISOString(),allowMigration=true}={}){
  if(!isObject(envelope)||envelope.format!==SAVE_ENVELOPE_FORMAT)return {ok:false,reason:'invalid-envelope-format'};
  if(envelope.schemaVersion!==CURRENT_STATE_SCHEMA_VERSION)return {ok:false,reason:'unsupported-envelope-schema',schemaVersion:envelope.schemaVersion};
  if(typeof envelope.payload!=='string'||typeof envelope.payloadHash!=='string')return {ok:false,reason:'missing-payload'};
  if(await sha256(envelope.payload)!==envelope.payloadHash)return {ok:false,reason:'payload-hash-mismatch'};
  let raw;
  try{raw=JSON.parse(envelope.payload);}catch{return {ok:false,reason:'invalid-payload-json'};}
  if(!isObject(raw))return {ok:false,reason:'payload-not-object'};
  if(allowMigration){
    const migrated=normalizePersistentState(raw,{now});
    const errors=validatePersistentState(migrated.state);
    if(errors.length)return {ok:false,reason:'migrated-state-invalid',errors,migration:migrated.migration};
    return {ok:true,state:migrated.state,migration:migrated.migration,envelope};
  }
  const errors=validatePersistentState(raw);
  return errors.length?{ok:false,reason:'state-invalid',errors}:{ok:true,state:raw,migration:null,envelope};
}

async function commitSave(currentState,nextState,{expectedRevision=null,savedAt=()=>new Date().toISOString(),source='runtime'}={}){
  const currentRevision=Number.isInteger(currentState?.revision)?currentState.revision:0;
  if(expectedRevision!=null&&currentRevision!==expectedRevision)return {ok:false,reason:'revision-conflict',currentRevision,expectedRevision};
  if(!isObject(nextState))return {ok:false,reason:'state-missing'};
  const candidate=JSON.parse(JSON.stringify(nextState));
  candidate.revision=currentRevision+1;
  candidate.runtimeMeta??={};
  candidate.runtimeMeta.lastSavedAt=String(savedAt());
  candidate.runtimeMeta.updatedAt=String(savedAt());
  const built=buildSaveEnvelope(candidate,{savedAt,source});
  if(!built.ok)return built;
  return {ok:true,state:candidate,envelope:built.envelope};
}

export { SAVE_ENVELOPE_FORMAT,HASH_ALGORITHM,stableStringify,sha256,buildSaveEnvelope,parseAndValidateSaveEnvelope,commitSave };
