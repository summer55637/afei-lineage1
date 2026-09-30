#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState, normalizePersistentState, validatePersistentState } from '../src/stoneage_persistent_state.mjs';
import { buildSaveEnvelope, parseAndValidateSaveEnvelope, commitSave } from '../src/stoneage_save_transaction.mjs';
import { sourcePlayerMaxGold } from '../src/stoneage_item_economy_runtime.mjs';

const schema=JSON.parse(fs.readFileSync('data/generated/stoneage_persistent_state_schema.json','utf8'));
const economy=JSON.parse(fs.readFileSync('data/generated/stoneage_item_economy_runtime_schema.json','utf8'));

assert.equal(schema.currentSchemaVersion,1);
assert.equal(schema.legacySaveSchemaVersion,30);
assert.equal(schema.fixedSlotContracts.professionSkillSlots,26);
assert.equal(schema.fixedSlotContracts.playerItemSlots,24);
assert.equal(economy.structure.playerItemSlots,24);
assert.equal(economy.gold.maxFormula,'1000000 + transmigration * 1800000');

const state=freshPersistentState({now:()=> '2026-09-30T12:00:00.000Z',playerId:'v344-state-save',playerName:'contract'});
state.player.level=12;
state.player.transmigration=2;
state.player.gold=sourcePlayerMaxGold(state)-1;
state.player.profession.skills[0]={id:7,lv:30};
state.inventory.playerItemSlots[9]=5001;
state.inventory.itemRuntime.slots['5001']={id:5001,itemId:20145,owner:'player'};
state.pets.petBox=[{id:'pet-1',petId:341,tempNo:274,level:1,sourceAttackMagicLv:[1,2,3,4],sourceAttackMagicExp:[10,20,30,40]}];
state.pets.team=['pet-1'];
state.pets.activePetId='pet-1';
state.quests={missions:{'m1':{state:'opaque'}},daily:{'d1':{done:true}}};
state.events={endWords:{11:16384}};
state.titles={titleA:{enabled:true}};
state.world.position={floorId:1000,x:98,y:44};
state.world.savePoint={floorId:1006,x:15,y:22};
state.idle={enabled:true,mode:'route',routeId:'h0-1000-e65',lastSimulatedAt:'2026-09-30T11:00:00.000Z',offline:{eligible:true,lastClosedAt:'2026-09-30T11:30:00.000Z',lastResumedAt:null,elapsedSeconds:1800,accruedSeconds:0,resumePending:true,rewardsApplied:false}};
state.battleSettings={strategy:{auto:true},sourceParity:{damage:'fixed-C'}};
assert.deepEqual(validatePersistentState(state),[]);

const built=await buildSaveEnvelope(state,{savedAt:()=> '2026-09-30T12:01:00.000Z',source:'v344-regression'});
assert.equal(built.ok,true);
const loaded=await parseAndValidateSaveEnvelope(built.envelope,{now:()=> '2026-09-30T12:02:00.000Z'});
assert.equal(loaded.ok,true);
assert.equal(loaded.state.player.gold,state.player.gold);
assert.deepEqual(loaded.state.player.profession.skills,state.player.profession.skills);
assert.equal(loaded.state.inventory.playerItemSlots[9],5001);
assert.equal(loaded.state.inventory.itemRuntime.slots['5001'].itemId,20145);
assert.equal(loaded.state.pets.team[0],'pet-1');
assert.equal(loaded.state.pets.activePetId,'pet-1');
assert.deepEqual(loaded.state.quests,state.quests);
assert.deepEqual(loaded.state.events,state.events);
assert.deepEqual(loaded.state.titles,state.titles);
assert.deepEqual(loaded.state.world,state.world);
assert.deepEqual(loaded.state.idle,state.idle);
assert.deepEqual(loaded.state.battleSettings,state.battleSettings);

const legacy={schemaVersion:30,level:12,gold:1234,playerStats:{str:1,dex:2,tgh:3,vital:4},playerItemSlots:Array(24).fill(null),unknownFutureField:{kept:true}};
const migrated=normalizePersistentState(legacy,{now:()=> '2026-09-30T12:03:00.000Z'});
assert.equal(migrated.migration.status,'legacy-schema-30-known-fields-copied');
assert.deepEqual(migrated.migration.preservedUnknownKeys,['unknownFutureField']);
assert.deepEqual(validatePersistentState(migrated.state),[]);

const saved=await commitSave(state,{...loaded.state,player:{...loaded.state.player,gold:4321}},{expectedRevision:0,savedAt:()=> '2026-09-30T12:04:00.000Z',source:'v344-regression'});
assert.equal(saved.ok,true);
assert.equal(saved.state.revision,1);
assert.equal(saved.envelope.revision,1);
assert.equal(saved.state.runtimeMeta.lastSavedAt,'2026-09-30T12:04:00.000Z');

console.log(JSON.stringify({pass:true,format:'stoneage-persistent-state-save-join-v1',schemaVersion:schema.currentSchemaVersion,legacySchema:schema.legacySaveSchemaVersion,professionSkillSlots:schema.fixedSlotContracts.professionSkillSlots,playerItemSlots:schema.fixedSlotContracts.playerItemSlots,allCanonicalSectionsRoundTrip:true,legacyUnknownKeyPreserved:true,revisionGuardVerified:true}));
