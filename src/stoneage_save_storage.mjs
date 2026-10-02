import { commitSave, parseAndValidateSaveEnvelope } from './stoneage_save_transaction.mjs';

const SAVE_STORAGE_PORT_FORMAT='stoneage-save-storage-port-v1';
const DEFAULT_SAVE_STORAGE_KEY='stoneage-save-v1';
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));

function validateSaveStoragePort(port){
  const errors=[];
  if(!isObject(port))return ['storage port must be an object'];
  if(typeof port.read!=='function')errors.push('storage port read(key) must be a function');
  if(typeof port.write!=='function')errors.push('storage port write(key,value) must be a function');
  return errors;
}

function normalizeKey(key){
  const value=String(key??DEFAULT_SAVE_STORAGE_KEY).trim();
  return value||null;
}

async function writeSaveEnvelopeToStorage(storage,envelope,{key=DEFAULT_SAVE_STORAGE_KEY,now=()=>new Date().toISOString(),allowMigration=true}={}){
  const portErrors=validateSaveStoragePort(storage);
  if(portErrors.length)return {ok:false,reason:'storage-port-invalid',errors:portErrors};
  const storageKey=normalizeKey(key);
  if(!storageKey)return {ok:false,reason:'storage-key-invalid'};
  const validated=await parseAndValidateSaveEnvelope(envelope,{now,allowMigration});
  if(!validated.ok)return {ok:false,reason:'save-envelope-invalid',details:validated};
  const serialized=JSON.stringify(envelope);
  try{
    const writeResult=await storage.write(storageKey,serialized);
    if(writeResult===false||writeResult?.ok===false)return {ok:false,reason:writeResult?.reason??'storage-write-rejected',key:storageKey};
    return {ok:true,key:storageKey,revision:envelope.revision,payloadHash:envelope.payloadHash};
  }catch(error){
    return {ok:false,reason:'storage-write-failed',key:storageKey,error:String(error?.message??error)};
  }
}

async function loadPersistentStateFromStorage(storage,{key=DEFAULT_SAVE_STORAGE_KEY,now=()=>new Date().toISOString(),allowMigration=true}={}){
  const portErrors=validateSaveStoragePort(storage);
  if(portErrors.length)return {ok:false,reason:'storage-port-invalid',errors:portErrors};
  const storageKey=normalizeKey(key);
  if(!storageKey)return {ok:false,reason:'storage-key-invalid'};
  let stored;
  try{stored=await storage.read(storageKey);}catch(error){
    return {ok:false,found:false,reason:'storage-read-failed',key:storageKey,error:String(error?.message??error)};
  }
  if(stored===null||stored===undefined)return {ok:true,found:false,key:storageKey,state:null,migration:null};
  if(typeof stored!=='string')return {ok:false,found:true,reason:'invalid-storage-value',key:storageKey};
  let envelope;
  try{envelope=JSON.parse(stored);}catch{return {ok:false,found:true,reason:'invalid-storage-json',key:storageKey};}
  const loaded=await parseAndValidateSaveEnvelope(envelope,{now,allowMigration});
  if(!loaded.ok)return {ok:false,found:true,reason:loaded.reason,key:storageKey,details:loaded};
  return {ok:true,found:true,key:storageKey,state:loaded.state,envelope,migration:loaded.migration};
}

async function commitAndPersistSave(currentState,nextState,{storage,key=DEFAULT_SAVE_STORAGE_KEY,expectedRevision=null,savedAt=()=>new Date().toISOString(),source='runtime',now=()=>new Date().toISOString()}={}){
  const portErrors=validateSaveStoragePort(storage);
  if(portErrors.length)return {ok:false,reason:'storage-port-invalid',errors:portErrors,state:clone(currentState)};
  const committed=await commitSave(currentState,nextState,{expectedRevision,savedAt,source});
  if(!committed.ok)return {...committed,state:clone(currentState)};
  const persisted=await writeSaveEnvelopeToStorage(storage,committed.envelope,{key,now});
  if(!persisted.ok)return {ok:false,reason:persisted.reason,storage:persisted,state:clone(currentState),candidateRevision:committed.state.revision};
  return {...committed,persisted:true,storage:persisted};
}

export { SAVE_STORAGE_PORT_FORMAT, DEFAULT_SAVE_STORAGE_KEY, validateSaveStoragePort, writeSaveEnvelopeToStorage, loadPersistentStateFromStorage, commitAndPersistSave };
