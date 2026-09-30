#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState, normalizePersistentState, validatePersistentState } from '../src/stoneage_persistent_state.mjs';
import { PLAYER_CREATION_RUNTIME_FORMAT, validatePlayerCreationStats, validatePlayerCreationElements, derivePlayerCombatStats, applyPlayerCreationInput } from '../src/stoneage_player_creation_runtime.mjs';

const seed=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_seed_runtime.json','utf8'));
const schema=JSON.parse(fs.readFileSync('data/generated/stoneage_persistent_state_schema.json','utf8'));

assert.equal(PLAYER_CREATION_RUNTIME_FORMAT,'stoneage-player-creation-runtime-v1');
assert.ok(schema.sections.includes('creation'));
assert.deepEqual(validatePlayerCreationStats({vital:5,str:5,tgh:5,dex:5}).allocation,{vital:5,str:5,tgh:5,dex:5});
assert.equal(validatePlayerCreationStats({vital:20,str:0,tgh:0,dex:0}).ok,true);
assert.equal(validatePlayerCreationStats({vital:20,str:1,tgh:0,dex:0}).ok,false);
assert.equal(validatePlayerCreationStats({vital:-1,str:0,tgh:0,dex:0}).ok,false);
assert.equal(validatePlayerCreationStats({vital:1.5,str:0,tgh:0,dex:0}).ok,false);
for(const elements of [{earth:10,water:0,fire:0,wind:0},{earth:0,water:10,fire:0,wind:0},{earth:0,water:0,fire:10,wind:0},{earth:0,water:0,fire:0,wind:10},{earth:5,water:5,fire:0,wind:0}])assert.equal(validatePlayerCreationElements(elements).ok,true);
assert.equal(validatePlayerCreationElements({earth:5,water:0,fire:5,wind:0}).ok,false);
assert.equal(validatePlayerCreationElements({earth:0,water:5,fire:0,wind:5}).ok,false);
assert.equal(validatePlayerCreationElements({earth:4,water:3,fire:3,wind:0}).ok,false);
assert.equal(validatePlayerCreationElements({earth:5,water:4,fire:0,wind:0}).ok,false);

const derived=derivePlayerCombatStats({vital:5,str:5,tgh:5,dex:5});
assert.equal(derived.ok,true);
assert.deepEqual(derived.sourceStoredStats,{vital:500,str:500,tgh:500,dex:500});
assert.equal(derived.sourceWork.fixStr,6);
assert.equal(derived.sourceWork.fixTough,6);
assert.equal(derived.sourceWork.fixDex,5);
assert.equal(derived.combat.maxHp,35);
assert.equal(derived.combat.hp,35);

const fresh=freshPersistentState({playerId:'v346-create'});
assert.deepEqual(validatePersistentState(fresh),[]);
assert.equal(fresh.creation.hometownConfigured,false);
const applied=applyPlayerCreationInput(fresh,{seed,hometown:0,stats:{vital:5,str:5,tgh:5,dex:5},elements:{earth:5,water:5,fire:0,wind:0},now:()=> '2026-09-30T17:00:00.000Z'});
assert.equal(applied.ok,true);
assert.equal(applied.state.creation.hometown,0);
assert.deepEqual(applied.state.creation.playerCreationStats,{vital:5,str:5,tgh:5,dex:5});
assert.deepEqual(applied.state.creation.elements,{earth:5,water:5,fire:0,wind:0});
assert.equal(applied.state.player.level,1);
assert.equal(applied.state.player.transmigration,1);
assert.equal(applied.state.player.gold,30000);
assert.equal(applied.state.player.charm,60);
assert.equal(applied.state.player.maxMp,100);
assert.equal(applied.state.player.hp,35);
assert.equal(applied.state.player.maxHp,35);
assert.deepEqual(applied.creation.position,{floorId:1006,x:15,y:22});
assert.equal(applied.creation.starterItemPending,24114);
assert.equal(applied.creation.starterPetPending,1);
assert.equal(applied.state.creation.starterPetGranted,false);
assert.equal(applied.state.creation.starterItemGranted,false);
assert.deepEqual(validatePersistentState(applied.state),[]);
const second=applyPlayerCreationInput(applied.state,{seed,hometown:1,stats:{vital:0,str:0,tgh:0,dex:0},elements:{earth:10,water:0,fire:0,wind:0}});
assert.equal(second.ok,false);
assert.equal(second.reason,'creation-input-already-locked');
const reloaded=normalizePersistentState(applied.state).state;
assert.deepEqual(reloaded.creation,applied.state.creation);
assert.deepEqual(reloaded.player,applied.state.player);

console.log(JSON.stringify({pass:true,format:'stoneage-player-creation-contract-v1',sourceSeed:{transmigration:1,level:1,petLevel:1,gold:30000,item1:24114},hometown:{hometown:0,floorId:1006,x:15,y:22},statValidation:'fixed-C 0..20 each, total <=20',elementValidation:'fixed-C total 10, max 2 positive, no Earth+Fire, no Water+Wind',derived:{attack:6,defence:6,quick:5,maxHp:35},starterGrants:'pending; item 24114 still requires source item allocator',noPlayableHtml:true}));
