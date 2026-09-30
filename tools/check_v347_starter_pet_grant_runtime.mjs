#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { applyPlayerCreationInput } from '../src/stoneage_player_creation_runtime.mjs';
import { createSourceStarterPet, grantSourceStarterPet, NEW_PLAYER_STARTER_PET_GRANT_FORMAT } from '../src/stoneage_new_player_starter_pet_runtime.mjs';
import { validatePersistentState, normalizePersistentState } from '../src/stoneage_persistent_state.mjs';

const seed=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_seed_runtime.json','utf8'));
assert.equal(NEW_PLAYER_STARTER_PET_GRANT_FORMAT,'stoneage-new-player-starter-pet-grant-v1');

const base=freshPersistentState({playerId:'v347-starter-pet'});
const prepared=applyPlayerCreationInput(base,{seed,hometown:0,stats:{vital:5,str:5,tgh:5,dex:5},elements:{earth:10,water:0,fire:0,wind:0}});
assert.equal(prepared.ok,true);

const created=createSourceStarterPet(seed,0,{randInclusive:()=>0,idFactory:()=> 'starter-pet-0'});
assert.equal(created.ok,true);
assert.equal(created.rngCalls,16);
assert.equal(created.enemyId,1);
assert.equal(created.tempNo,2);
assert.equal(created.level,1);
assert.equal(created.variableAi,0);
assert.equal(created.petMailEffect,0);
assert.equal(created.stats.vital,600);
assert.equal(created.stats.str,420);
assert.equal(created.stats.tgh,180);
assert.equal(created.stats.dex,420);
assert.equal(created.hp,34);
assert.equal(created.maxHp,34);

const granted=grantSourceStarterPet(prepared.state,seed,0,{randInclusive:()=>0,idFactory:()=> 'starter-pet-0',now:()=> '2026-09-30T17:30:00.000Z'});
assert.equal(granted.ok,true);
assert.equal(granted.state.creation.starterPetGranted,true);
assert.equal(granted.state.pets.petBox.length,1);
assert.equal(granted.state.pets.petBox[0].id,'starter-pet-0');
assert.equal(granted.state.pets.petBox[0].enemyId,1);
assert.equal(granted.state.pets.petBox[0].tempNo,2);
assert.equal(granted.teamChanged,false);
assert.equal(granted.activePetChanged,false);
assert.deepEqual(validatePersistentState(granted.state),[]);

const duplicate=grantSourceStarterPet(granted.state,seed,0,{randInclusive:()=>0,idFactory:()=> 'starter-pet-1'});
assert.equal(duplicate.ok,false);
assert.equal(duplicate.reason,'starter-pet-already-granted');

const reloaded=normalizePersistentState(granted.state).state;
assert.deepEqual(reloaded.creation,granted.state.creation);
assert.deepEqual(reloaded.pets,granted.state.pets);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-new-player-starter-pet-grant-regression-v1',
  sourceRngCalls:16,
  starterPet:{hometown:0,enemyId:1,tempNo:2,level:1,maxHp:34,variableAi:0,petMailEffect:0},
  teamAutoSelection:false,
  activePetAutoSelection:false,
  persistentRoundTrip:true
}));
