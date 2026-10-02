#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  DEFAULT_SAVE_STORAGE_KEY,
  validateSaveStoragePort,
  writeSaveEnvelopeToStorage,
  loadPersistentStateFromStorage,
  commitAndPersistSave
} from '../src/stoneage_save_storage.mjs';

function memoryStorage(seed={}){
  const values=new Map(Object.entries(seed));
  return {
    values,
    async read(key){return values.has(key)?values.get(key):null;},
    async write(key,value){values.set(key,value);return {ok:true};}
  };
}

const now='2026-10-02T04:30:00.000Z';
const storage=memoryStorage();
const initial=freshPersistentState({now:()=>now,playerId:'save-storage-test',playerName:'contract'});
assert.deepEqual(validateSaveStoragePort(storage),[]);
assert.equal((await loadPersistentStateFromStorage(storage)).found,false);

const next={...initial,player:{...initial.player,gold:30000}};
const committed=await commitAndPersistSave(initial,next,{storage,expectedRevision:0,savedAt:()=>now,now:()=>now,source:'save-storage-regression'});
assert.equal(committed.ok,true);
assert.equal(committed.persisted,true);
assert.equal(committed.state.revision,1);
assert.equal(committed.envelope.revision,1);
assert.equal(storage.values.has(DEFAULT_SAVE_STORAGE_KEY),true);

const restored=await loadPersistentStateFromStorage(storage,{now:()=>now});
assert.equal(restored.ok,true);
assert.equal(restored.found,true);
assert.equal(restored.state.player.gold,30000);
assert.equal(restored.state.revision,1);
assert.deepEqual(restored.state,committed.state);

const invalidPort=await loadPersistentStateFromStorage({read:async()=>null});
assert.equal(invalidPort.ok,false);
assert.equal(invalidPort.reason,'storage-port-invalid');

const badJsonStorage=memoryStorage({[DEFAULT_SAVE_STORAGE_KEY]:'{broken'});
const badJson=await loadPersistentStateFromStorage(badJsonStorage,{now:()=>now});
assert.equal(badJson.ok,false);
assert.equal(badJson.found,true);
assert.equal(badJson.reason,'invalid-storage-json');

const corrupt=JSON.parse(storage.values.get(DEFAULT_SAVE_STORAGE_KEY));
corrupt.payload=corrupt.payload+' ';
const corruptStorage=memoryStorage({[DEFAULT_SAVE_STORAGE_KEY]:JSON.stringify(corrupt)});
const corruptLoad=await loadPersistentStateFromStorage(corruptStorage,{now:()=>now});
assert.equal(corruptLoad.ok,false);
assert.equal(corruptLoad.reason,'payload-hash-mismatch');

const failWriteStorage={
  async read(){return null;},
  async write(){throw new Error('quota exceeded');}
};
const failed=await commitAndPersistSave(initial,next,{storage:failWriteStorage,expectedRevision:0,savedAt:()=>now,now:()=>now});
assert.equal(failed.ok,false);
assert.equal(failed.reason,'storage-write-failed');
assert.equal(failed.state.revision,0);
assert.equal(failed.state.player.gold,0);
assert.equal(failed.candidateRevision,1);

const before=storage.values.get(DEFAULT_SAVE_STORAGE_KEY);
const conflict=await commitAndPersistSave(initial,next,{storage,expectedRevision:5,savedAt:()=>now,now:()=>now});
assert.equal(conflict.ok,false);
assert.equal(conflict.reason,'revision-conflict');
assert.equal(storage.values.get(DEFAULT_SAVE_STORAGE_KEY),before);

const readError=await loadPersistentStateFromStorage({read:async()=>{throw new Error('unavailable');},write:async()=>{}},{now:()=>now});
assert.equal(readError.ok,false);
assert.equal(readError.reason,'storage-read-failed');

console.log(JSON.stringify({pass:true,format:'stoneage-save-storage-port-v1',durableWriteReadback:true,reloadRestore:true,corruptSaveFailClosed:true,storageFailuresFailClosed:true,revisionConflictVerified:true}));
