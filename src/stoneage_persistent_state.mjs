import { sourcePlayerMaxGold } from './stoneage_item_economy_runtime.mjs';
const CURRENT_STATE_SCHEMA_VERSION = 1;
const SOURCE_LEGACY_SAVE_SCHEMA_VERSION = 30;
const PROFESSION_SKILL_SLOT_COUNT = 26;
const PLAYER_ITEM_SLOT_COUNT = 24;

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const intOr = (value, fallback = 0) => Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : fallback;
const nonNegativeInt = (value, fallback = 0) => Math.max(0, intOr(value, fallback));
const clone = value => JSON.parse(JSON.stringify(value));

function freshProfessionSkills() {
  return Array(PROFESSION_SKILL_SLOT_COUNT).fill(null);
}

function freshPersistentState({ now = () => new Date().toISOString(), playerId = null, playerName = '' } = {}) {
  const timestamp = String(now());
  return {
    schemaVersion: CURRENT_STATE_SCHEMA_VERSION,
    revision: 0,
    sourceProfile: {
      fixedCRef: '1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      legacySaveSchema: SOURCE_LEGACY_SAVE_SCHEMA_VERSION
    },
    creation: {
      hometown: null,
      hometownConfigured: false,
      hometownLegacyUnknown: false,
      playerCreationStats: null,
      playerCreationStatsConfigured: false,
      playerCreationStatsLegacyUnknown: false,
      elements: null,
      elementsConfigured: false,
      elementsLegacyUnknown: false,
      starterPetGranted: false,
      starterItemGranted: false,
      completed: false,
      source: null
    },
    player: {
      id: playerId,
      name: String(playerName),
      level: 1,
      exp: 0,
      transmigration: 0,
      hp: 1,
      maxHp: 1,
      mp: 0,
      maxMp: 0,
      luck: 0,
      charm: -1,
      duelPoint: 0,
      gold: 0,
      stats: { str: 0, dex: 0, tgh: 0, vital: 0 },
      profession: { classId: 0, level: 0, skillPoint: 0, skills: freshProfessionSkills() }
    },
    inventory: {
      playerItemSlots: Array(PLAYER_ITEM_SLOT_COUNT).fill(null),
      piles: {},
      itemRuntime: { slots: {} }
    },
    equipment: { sourceSlotRefs: {} },
    pets: { petBox: [], team: [], activePetId: null },
    quests: { missions: {}, daily: {} },
    events: {},
    titles: {},
    world: { position: { floorId: null, x: null, y: null }, savePoint: null },
    idle: {
      enabled: false,
      mode: 'disabled',
      routeId: null,
      lastSimulatedAt: null,
      offline: { eligible: false, lastClosedAt: null, lastResumedAt: null, elapsedSeconds: 0, accruedSeconds: 0, resumePending: false, rewardsApplied: false }
    },
    battleSettings: { strategy: {}, sourceParity: {} },
    runtimeMeta: { createdAt: timestamp, updatedAt: timestamp, lastSavedAt: null }
  };
}

function normalizeProfessionSkills(value) {
  const source = Array.isArray(value) ? value : [];
  return Array.from({ length: PROFESSION_SKILL_SLOT_COUNT }, (_, index) => {
    const row = source[index];
    if (!isObject(row)) return null;
    const id = intOr(row.id, -1);
    const lv = intOr(row.lv ?? row.level, 0);
    if (id < 0 || lv < 0) return null;
    return { id, lv };
  });
}

function normalizePlayerItemSlots(value) {
  const source = Array.isArray(value) ? value : [];
  return Array.from({ length: PLAYER_ITEM_SLOT_COUNT }, (_, index) => {
    const slot = source[index];
    if (slot === null || slot === undefined || slot === '') return null;
    return intOr(slot, null);
  });
}

function normalizePet(pet) {
  if (!isObject(pet)) return null;
  const id = String(pet.id ?? '').trim();
  if (!id) return null;
  const normalized = clone(pet);
  normalized.id = id;
  if (pet.petId != null) normalized.petId = nonNegativeInt(pet.petId);
  if (pet.tempNo != null) normalized.tempNo = nonNegativeInt(pet.tempNo);
  for (const key of ['level','exp','hp','maxHp','mp','maxMp','loyalty']) {
    if (pet[key] != null) normalized[key] = nonNegativeInt(pet[key]);
  }
  if (Array.isArray(pet.sourceAttackMagicLv)) normalized.sourceAttackMagicLv = [0,1,2,3].map(k => nonNegativeInt(pet.sourceAttackMagicLv[k]));
  if (Array.isArray(pet.sourceAttackMagicExp)) normalized.sourceAttackMagicExp = [0,1,2,3].map(k => nonNegativeInt(pet.sourceAttackMagicExp[k]));
  return normalized;
}

function normalizePetBox(value) {
  const source = Array.isArray(value) ? value : [];
  const seen = new Set();
  const result = [];
  for (const pet of source) {
    const normalized = normalizePet(pet);
    if (!normalized || seen.has(normalized.id)) continue;
    seen.add(normalized.id);
    result.push(normalized);
  }
  return result;
}

function copyKnownLegacyPlayer(raw) {
  const root = isObject(raw?.player) ? raw.player : raw;
  const p = freshPersistentState().player;
  for (const key of ['id','name','level','exp','transmigration','hp','maxHp','mp','maxMp','luck','charm','duelPoint','gold']) {
    if (root?.[key] != null) p[key] = key === 'name' ? String(root[key]) : root[key];
  }
  const stats = root?.playerStats ?? root?.stats;
  if (isObject(stats)) for (const key of ['str','dex','tgh','vital']) if (stats[key] != null) p.stats[key] = nonNegativeInt(stats[key]);
  p.profession.classId = nonNegativeInt(root?.professionClass ?? root?.profession?.classId, 0);
  p.profession.level = nonNegativeInt(root?.professionLevel ?? root?.profession?.level, 0);
  p.profession.skillPoint = nonNegativeInt(root?.professionSkillPoint ?? root?.profession?.skillPoint, 0);
  p.profession.skills = normalizeProfessionSkills(root?.professionSkills ?? root?.profession?.skills);
  return p;
}

function normalizePersistentState(raw, { now = () => new Date().toISOString() } = {}) {
  if (!isObject(raw)) {
    return { state: freshPersistentState({ now }), migration: { status: 'fresh', fromSchema: null, preservedUnknownKeys: [] } };
  }
  const current = freshPersistentState({ now });
  const sourceSchema = intOr(raw.schemaVersion, 0);
  if (isObject(raw.creation)) {
    current.creation = {
      ...current.creation,
      hometown: raw.creation.hometown == null ? null : nonNegativeInt(raw.creation.hometown, null),
      hometownConfigured: raw.creation.hometownConfigured === true,
      hometownLegacyUnknown: raw.creation.hometownLegacyUnknown === true,
      playerCreationStats: isObject(raw.creation.playerCreationStats) ? {
        vital: nonNegativeInt(raw.creation.playerCreationStats.vital),
        str: nonNegativeInt(raw.creation.playerCreationStats.str),
        tgh: nonNegativeInt(raw.creation.playerCreationStats.tgh),
        dex: nonNegativeInt(raw.creation.playerCreationStats.dex)
      } : null,
      playerCreationStatsConfigured: raw.creation.playerCreationStatsConfigured === true,
      playerCreationStatsLegacyUnknown: raw.creation.playerCreationStatsLegacyUnknown === true,
      elements: isObject(raw.creation.elements) ? {
        earth: nonNegativeInt(raw.creation.elements.earth),
        water: nonNegativeInt(raw.creation.elements.water),
        fire: nonNegativeInt(raw.creation.elements.fire),
        wind: nonNegativeInt(raw.creation.elements.wind)
      } : null,
      elementsConfigured: raw.creation.elementsConfigured === true,
      elementsLegacyUnknown: raw.creation.elementsLegacyUnknown === true,
      starterPetGranted: raw.creation.starterPetGranted === true,
      starterItemGranted: raw.creation.starterItemGranted === true,
      completed: raw.creation.completed === true,
      source: isObject(raw.creation.source) ? clone(raw.creation.source) : null
    };
  }

  current.player = copyKnownLegacyPlayer(raw);

  const inventoryRaw = isObject(raw.inventory) ? raw.inventory : {};
  const itemRuntimeRaw = isObject(inventoryRaw.itemRuntime ?? raw.itemRuntime) ? (inventoryRaw.itemRuntime ?? raw.itemRuntime) : {};
  current.inventory.playerItemSlots = normalizePlayerItemSlots(raw.playerItemSlots ?? inventoryRaw.playerItemSlots);
  current.inventory.piles = isObject(inventoryRaw.piles) ? clone(inventoryRaw.piles) : (isObject(raw.inventory) ? clone(raw.inventory) : {});
  current.inventory.itemRuntime.slots = isObject(itemRuntimeRaw.slots) ? clone(itemRuntimeRaw.slots) : {};

  const petsRaw = isObject(raw.pets) ? raw.pets : raw;
  current.pets.petBox = normalizePetBox(petsRaw.petBox);
  current.pets.team = Array.isArray(petsRaw.team) ? petsRaw.team.map(String).filter(Boolean) : [];
  current.pets.activePetId = petsRaw.activePetId == null ? null : String(petsRaw.activePetId);

  if (isObject(raw.quests)) current.quests = clone(raw.quests);
  if (isObject(raw.events)) current.events = clone(raw.events);
  if (isObject(raw.titles)) current.titles = clone(raw.titles);

  const position = isObject(raw.world?.position) ? raw.world.position : (isObject(raw.position) ? raw.position : null);
  if (position) {
    current.world.position.floorId = position.floorId == null ? null : intOr(position.floorId, null);
    current.world.position.x = position.x == null ? null : intOr(position.x, null);
    current.world.position.y = position.y == null ? null : intOr(position.y, null);
  }
  if (raw.world?.savePoint != null || raw.savePoint != null) current.world.savePoint = clone(raw.world?.savePoint ?? raw.savePoint);

  if (isObject(raw.idle)) {
    current.idle.enabled = raw.idle.enabled === true;
    current.idle.mode = typeof raw.idle.mode === 'string' ? raw.idle.mode : 'disabled';
    current.idle.routeId = raw.idle.routeId == null ? null : String(raw.idle.routeId);
    current.idle.lastSimulatedAt = raw.idle.lastSimulatedAt ?? null;
    if (isObject(raw.idle.offline)) current.idle.offline = clone(raw.idle.offline);
  }
  if (isObject(raw.battleSettings)) current.battleSettings = clone(raw.battleSettings);
  if (isObject(raw.equipment)) current.equipment = clone(raw.equipment);

  current.schemaVersion = CURRENT_STATE_SCHEMA_VERSION;
  current.revision = nonNegativeInt(raw.revision, 0);
  current.runtimeMeta = { ...current.runtimeMeta, ...(isObject(raw.runtimeMeta) ? clone(raw.runtimeMeta) : {}), updatedAt: String(now()) };

  const knownTopLevel = new Set([
    'schemaVersion','revision','sourceProfile','creation','player','id','name','level','exp','transmigration','hp','maxHp','mp','maxMp','luck','charm','duelPoint',
    'playerStats','stats','gold','professionClass','professionLevel','professionSkillPoint','professionSkills','playerItemSlots','inventory','itemRuntime',
    'petBox','team','activePetId','pets','quests','events','titles','world','position','savePoint','idle','battleSettings','equipment','runtimeMeta'
  ]);
  const preservedUnknownKeys = Object.keys(raw).filter(key => !knownTopLevel.has(key));
  current.sourceProfile.legacySaveSchema = SOURCE_LEGACY_SAVE_SCHEMA_VERSION;
  return {
    state: current,
    migration: { status: sourceSchema === SOURCE_LEGACY_SAVE_SCHEMA_VERSION ? 'legacy-schema-30-known-fields-copied' : 'normalized', fromSchema: sourceSchema, preservedUnknownKeys }
  };
}

function validatePersistentState(state) {
  const errors = [];
  if (!isObject(state)) return ['state must be an object'];
  if (state.schemaVersion !== CURRENT_STATE_SCHEMA_VERSION) errors.push('schemaVersion mismatch');
  const player = state.player;
  if (!isObject(player)) errors.push('player must be an object');
  if (isObject(player)) {
    if (nonNegativeInt(player.level, -1) < 1) errors.push('player.level must be >= 1');
    if (nonNegativeInt(player.gold, -1) > sourcePlayerMaxGold(state)) errors.push('player.gold exceeds source max-gold cap');
    if (!isObject(player.profession)) errors.push('player.profession must be an object');
    if (isObject(player.profession) && (!Array.isArray(player.profession.skills) || player.profession.skills.length !== PROFESSION_SKILL_SLOT_COUNT)) errors.push('profession.skills must contain exactly 26 slots');
  }
  if (!isObject(state.inventory) || !Array.isArray(state.inventory.playerItemSlots) || state.inventory.playerItemSlots.length !== PLAYER_ITEM_SLOT_COUNT) errors.push('inventory.playerItemSlots must contain exactly 24 slots');
  if (!isObject(state.creation)) errors.push('creation must be an object');
  if (isObject(state.creation)) {
    if (state.creation.hometown != null && (!Number.isInteger(state.creation.hometown) || state.creation.hometown < 0 || state.creation.hometown > 3)) errors.push('creation.hometown invalid');
    if (state.creation.playerCreationStatsConfigured && !isObject(state.creation.playerCreationStats)) errors.push('creation.playerCreationStats required when configured');
    if (state.creation.elementsConfigured && !isObject(state.creation.elements)) errors.push('creation.elements required when configured');
  }
  if (isObject(state.inventory) && Array.isArray(state.inventory.playerItemSlots) && isObject(state.inventory.itemRuntime) && isObject(state.inventory.itemRuntime.slots)) {
    for (let index = 9; index < PLAYER_ITEM_SLOT_COUNT; index++) {
      const ref = state.inventory.playerItemSlots[index];
      if (ref == null) continue;
      if (!state.inventory.itemRuntime.slots[String(intOr(ref, -1))]) errors.push('inventory player slot '+index+' references missing existing item');
    }
  }
  if (!isObject(state.pets) || !Array.isArray(state.pets.petBox) || !Array.isArray(state.pets.team)) errors.push('pets container invalid');
  if (isObject(state.pets)) {
    const ids = new Set((state.pets.petBox ?? []).map(p => p?.id).filter(Boolean));
    for (const teamId of state.pets.team ?? []) if (!ids.has(String(teamId))) errors.push('team references missing pet: ' + teamId);
    if (state.pets.activePetId != null && !ids.has(String(state.pets.activePetId))) errors.push('activePetId references missing pet');
  }
  const pos = state.world?.position;
  if (pos && pos.floorId != null && (!Number.isInteger(pos.floorId) || pos.floorId < 0)) errors.push('world.position.floorId invalid');
  if (!isObject(state.idle)) errors.push('idle must be an object');
  return errors;
}

export { CURRENT_STATE_SCHEMA_VERSION, SOURCE_LEGACY_SAVE_SCHEMA_VERSION, PROFESSION_SKILL_SLOT_COUNT, PLAYER_ITEM_SLOT_COUNT, freshProfessionSkills, freshPersistentState, normalizeProfessionSkills, normalizePlayerItemSlots, normalizePet, normalizePetBox, normalizePersistentState, validatePersistentState };
