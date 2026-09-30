#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { SAVE_ENVELOPE_FORMAT, stableStringify, sha256, buildSaveEnvelope, parseAndValidateSaveEnvelope, commitSave } from '../src/stoneage_save_transaction.mjs';

const state=freshPersistentState({now:()=> '2026-09-30T04:00:00.000Z',playerId:'p1',playerName:'save-test'});
state.player.gold=1234;state.player.exp=55;
const built=await buildSaveEnvelope(state,{savedAt:()=> '2026-09-30T04:01:00.000Z',source:'test'});
assert.equal(built.ok,true);
assert.equal(built.envelope.format,SAVE_ENVELOPE_FORMAT);
assert.equal(built.envelope.payloadHash,await sha256(built.envelope.payload));

const orderA=stableStringify({b:2,a:{z:1,y:2}});
const orderB=stableStringify({a:{y:2,z:1},b:2});
assert.equal(orderA,orderB);

const loaded=await parseAndValidateSaveEnvelope(built.envelope,{now:()=> '2026-09-30T04:02:00.000Z'});
assert.equal(loaded.ok,true);
assert.equal(loaded.state.player.gold,1234);
assert.equal(loaded.state.player.exp,55);

const tampered={...built.envelope,payload:built.envelope.payload.replace('1234','1235')};
assert.equal((await parseAndValidateSaveEnvelope(tampered)).reason,'payload-hash-mismatch');

const saved=await commitSave(state,{...state,player:{...state.player,gold:2000}},{expectedRevision:0,savedAt:()=> '2026-09-30T04:03:00.000Z',source:'test'});
assert.equal(saved.ok,true);
assert.equal(saved.state.revision,1);
assert.equal(saved.state.runtimeMeta.lastSavedAt,'2026-09-30T04:03:00.000Z');
const conflict=await commitSave(state,{...state},{expectedRevision:1});
assert.equal(conflict.ok,false);
assert.equal(conflict.reason,'revision-conflict');

const badEnvelope={...built.envelope,schemaVersion:99};
assert.equal((await parseAndValidateSaveEnvelope(badEnvelope)).reason,'unsupported-envelope-schema');
const revisionMismatch={...built.envelope,revision:99};
assert.equal((await parseAndValidateSaveEnvelope(revisionMismatch)).reason,'revision-mismatch');

await Promise.resolve(console.log(JSON.stringify({pass:true,format:SAVE_ENVELOPE_FORMAT,hash:'sha256',deterministic:true,revisionGuard:true,failClosed:true})));
