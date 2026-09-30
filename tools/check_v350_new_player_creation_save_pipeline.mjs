#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState, validatePersistentState } from '../src/stoneage_persistent_state.mjs';
import { runNewPlayerCreationSave, NEW_PLAYER_CREATION_SAVE_FORMAT } from '../src/stoneage_new_player_creation_save_runtime.mjs';

const seed=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_seed_runtime.json','utf8'));
assert.equal(NEW_PLAYER_CREATION_SAVE_FORMAT,'stoneage-new-player-creation-save-v1');

const base=freshPersistentState({playerId:'v350-headless'});
const pending=await runNewPlayerCreationSave(base,{
  seed, hometown:0,
  stats:{vital:5,str:5,tgh:5,dex:5},
  elements:{earth:10,water:0,fire:0,wind:0},
  randInclusive:()=>0,
  idFactory:()=> 'starter-pet-v350',
  now:()=> '2026-09-30T18:00:00.000Z'
});
assert.equal(pending.ok,false);
assert.equal(pending.stage,'starter-item');
assert.equal(pending.reason,'starter-item-template-unresolved');
assert.equal(pending.petGranted,true);
assert.equal(pending.saveCommitted,false);
assert.equal(pending.state.creation.completed,false);
assert.equal(pending.state.creation.starterPetGranted,true);
assert.equal(pending.state.world.position.floorId,1006);
assert.equal(pending.state.world.position.x,15);
assert.equal(pending.state.world.position.y,22);
assert.deepEqual(validatePersistentState(pending.state),[]);

const fullBase=freshPersistentState({playerId:'v350-fixture'});
const full=await runNewPlayerCreationSave(fullBase,{
  seed, hometown:0,
  stats:{vital:5,str:5,tgh:5,dex:5},
  elements:{earth:10,water:0,fire:0,wind:0},
  randInclusive:()=>0,
  idFactory:()=> 'starter-pet-fixture',
  itemGrantAdapter:async (state,{itemId})=>{
    assert.equal(itemId,24114);
    state.inventory.playerItemSlots[9]=1;
    state.inventory.itemRuntime.slots['1']={fixture:true,itemId:24114,source:'test-only'};
    return {ok:true,state};
  },
  now:()=> '2026-09-30T18:01:00.000Z'
});
assert.equal(full.ok,true);
assert.equal(full.state.creation.completed,true);
assert.equal(full.state.creation.starterPetGranted,true);
assert.equal(full.state.creation.starterItemGranted,true);
assert.equal(full.state.world.position.floorId,1006);
assert.equal(full.state.world.position.x,15);
assert.equal(full.state.world.position.y,22);
assert.equal(full.state.pets.petBox.length,1);
assert.equal(full.state.inventory.playerItemSlots[9],1);
assert.equal(full.state.revision,1);
assert.equal(full.envelope.schemaVersion,1);
assert.equal(full.verification.ok,true);
assert.equal(full.verification.state.creation.completed,true);
assert.deepEqual(validatePersistentState(full.state),[]);

const conflict=await runNewPlayerCreationSave(freshPersistentState({playerId:'v350-conflict'}),{
  seed,hometown:0,stats:{vital:5,str:5,tgh:5,dex:5},elements:{earth:10,water:0,fire:0,wind:0},
  randInclusive:()=>0,idFactory:()=> 'conflict-pet',expectedRevision:1,
  itemGrantAdapter:async state=>({ok:true,state}),
  now:()=> '2026-09-30T18:02:00.000Z'
});
assert.equal(conflict.ok,false);
assert.equal(conflict.stage,'save');
assert.equal(conflict.reason,'revision-conflict');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-new-player-creation-save-regression-v1',
  homePositionPersisted:[1006,15,22],
  pendingItem24114:true,
  starterPetPersisted:true,
  fixtureFullSaveRoundTrip:true,
  revisionGuard:true
}));
