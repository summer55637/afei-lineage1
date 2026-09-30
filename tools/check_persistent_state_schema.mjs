#!/usr/bin/env node
import assert from 'node:assert/strict';
import { CURRENT_STATE_SCHEMA_VERSION, SOURCE_LEGACY_SAVE_SCHEMA_VERSION, PROFESSION_SKILL_SLOT_COUNT, PLAYER_ITEM_SLOT_COUNT, freshPersistentState, normalizePersistentState, validatePersistentState } from '../src/stoneage_persistent_state.mjs';
import { commitSave, parseAndValidateSaveEnvelope } from '../src/stoneage_save_transaction.mjs';

const state = freshPersistentState({ now: () => '2026-09-30T00:00:00.000Z', playerId: 'p1', playerName: 'tester' });
assert.equal(CURRENT_STATE_SCHEMA_VERSION, 1);
assert.equal(SOURCE_LEGACY_SAVE_SCHEMA_VERSION, 30);
assert.equal(PROFESSION_SKILL_SLOT_COUNT, 26);
assert.equal(PLAYER_ITEM_SLOT_COUNT, 24);
assert.equal(state.player.profession.skills.length, 26);
assert.equal(state.inventory.playerItemSlots.length, 24);
assert.deepEqual(validatePersistentState(state), []);
state.equipment.sourceSlotRefs={head:'item-ref-1'};
state.quests.missions.main={status:'unknown'};
state.quests.daily={d1:{claimed:false}};
state.events={flagA:{value:true}};
state.titles={titleA:{unlocked:false}};
state.battleSettings.strategy={mode:'opaque'};
state.battleSettings.sourceParity={source:'fixed-c'};
const saved=await commitSave(state,state,{expectedRevision:0,savedAt:()=> '2026-09-30T00:00:30.000Z',source:'v373-schema'});
assert.equal(saved.ok,true);
assert.equal(saved.state.revision,1);
const roundTrip=await parseAndValidateSaveEnvelope(saved.envelope,{now:()=> '2026-09-30T00:00:31.000Z'});
assert.equal(roundTrip.ok,true);
assert.deepEqual(roundTrip.state.equipment,state.equipment);
assert.deepEqual(roundTrip.state.quests,state.quests);
assert.deepEqual(roundTrip.state.events,state.events);
assert.deepEqual(roundTrip.state.titles,state.titles);
assert.deepEqual(roundTrip.state.battleSettings,state.battleSettings);

const normalized = normalizePersistentState(state, { now: () => '2026-09-30T00:01:00.000Z' });
assert.equal(normalized.migration.status, 'normalized');
assert.deepEqual(validatePersistentState(normalized.state), []);

const legacy = {
  schemaVersion: 30,
  level: 10,
  transmigration: 0,
  playerStats: { str: 5, dex: 6, tgh: 7, vital: 8 },
  professionClass: 1,
  professionLevel: 2,
  professionSkillPoint: 3,
  gold: 30000,
  professionSkills: [{ id: 1, lv: 1000 }, null],
  playerItemSlots: Array(24).fill(null),
  inventory: { 101: 2 },
  petBox: [{ id: 'pet-1', petId: 101, level: 5 }],
  team: ['pet-1'],
  activePetId: 'pet-1',
  unknownFutureField: { kept: true }
};
const migrated = normalizePersistentState(legacy, { now: () => '2026-09-30T00:02:00.000Z' });
assert.equal(migrated.migration.status, 'legacy-schema-30-known-fields-copied');
assert.equal(migrated.state.player.profession.skills[0].id, 1);
assert.equal(migrated.state.inventory.playerItemSlots.length, 24);
assert.equal(migrated.state.pets.petBox.length, 1);
assert.equal(migrated.state.pets.activePetId, 'pet-1');
assert.deepEqual(migrated.migration.preservedUnknownKeys, ['unknownFutureField']);
assert.deepEqual(validatePersistentState(migrated.state), []);

const broken = JSON.parse(JSON.stringify(state));
broken.inventory.playerItemSlots.pop();
assert.ok(validatePersistentState(broken).includes('inventory.playerItemSlots must contain exactly 24 slots'));

const brokenTeam = JSON.parse(JSON.stringify(state));
brokenTeam.pets.team = ['missing'];
assert.ok(validatePersistentState(brokenTeam).includes('team references missing pet: missing'));

const overGold = JSON.parse(JSON.stringify(state));
overGold.player.gold = 1000001;
assert.ok(validatePersistentState(overGold).includes('player.gold exceeds source max-gold cap'));

const badEquipment = JSON.parse(JSON.stringify(state));
badEquipment.equipment = [];
assert.ok(validatePersistentState(badEquipment).includes('equipment.sourceSlotRefs must be an object'));

const badQuests = JSON.parse(JSON.stringify(state));
badQuests.quests.missions = [];
assert.ok(validatePersistentState(badQuests).includes('quests.missions must be an object'));

const badEvents = JSON.parse(JSON.stringify(state));
badEvents.events = [];
assert.ok(validatePersistentState(badEvents).includes('events must be an object'));

const badTitles = JSON.parse(JSON.stringify(state));
badTitles.titles = [];
assert.ok(validatePersistentState(badTitles).includes('titles must be an object'));

const badWorld = JSON.parse(JSON.stringify(state));
badWorld.world.position.x = 1.5;
assert.ok(validatePersistentState(badWorld).includes('world.position.x invalid'));

const badIdle = JSON.parse(JSON.stringify(state));
badIdle.idle.offline.accruedSeconds = 9;
badIdle.idle.offline.accrualCapSeconds = 8;
assert.ok(validatePersistentState(badIdle).includes('idle.offline.accruedSeconds exceeds accrualCapSeconds'));

const badBattle = JSON.parse(JSON.stringify(state));
badBattle.battleSettings.strategy = [];
assert.ok(validatePersistentState(badBattle).includes('battleSettings.strategy must be an object'));

const danglingItem = JSON.parse(JSON.stringify(state));
danglingItem.inventory.playerItemSlots[9] = 123;
assert.ok(validatePersistentState(danglingItem).includes('inventory player slot 9 references missing existing item'));

console.log(JSON.stringify({ pass: true, format: 'stoneage-persistent-state-schema-v1', schemaVersion: CURRENT_STATE_SCHEMA_VERSION, legacySaveSchema: SOURCE_LEGACY_SAVE_SCHEMA_VERSION, professionSkillSlots: PROFESSION_SKILL_SLOT_COUNT, playerItemSlots: PLAYER_ITEM_SLOT_COUNT, opaqueSectionsRoundTrip: true, structuralContainerValidation: true, migration: 'known-field-copy with preserved unknown keys' }));
