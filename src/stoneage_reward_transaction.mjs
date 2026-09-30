const REWARD_TRANSACTION_FORMAT = 'stoneage-reward-transaction-v1';
const MAX_CARRIED_ITEMS = 3;

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const intOr = (value, fallback = 0) => Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : fallback;
const nonNegativeInt = value => Math.max(0, intOr(value, 0));

function normalizeRewardPacket(packet) {
  if (!isObject(packet)) return null;
  const source = String(packet.source ?? '');
  if (!source) return null;
  const transactionId = String(packet.transactionId ?? '');
  if (!transactionId) return null;
  const playerExp = nonNegativeInt(packet.playerExp);
  const expByActor = isObject(packet.expByActor) ? Object.fromEntries(Object.entries(packet.expByActor).map(([actor, value]) => [String(actor), nonNegativeInt(value)])) : {};
  const gold = nonNegativeInt(packet.gold);
  const items = Array.isArray(packet.items) ? packet.items.map(item => {
    if (!isObject(item)) return null;
    const existingIndex = intOr(item.existingIndex, -1);
    const count = nonNegativeInt(item.count || 1);
    if (existingIndex < 0 || count <= 0) return null;
    return { existingIndex, count };
  }).filter(Boolean) : [];
  const petCredits = Array.isArray(packet.petCredits) ? packet.petCredits.map(row => {
    if (!isObject(row) || row.petId == null) return null;
    return { petId: String(row.petId), exp: nonNegativeInt(row.exp) };
  }).filter(Boolean) : [];
  return {
    format: REWARD_TRANSACTION_FORMAT,
    transactionId,
    source,
    playerExp,
    expByActor,
    gold,
    items,
    petCredits,
    metadata: isObject(packet.metadata) ? JSON.parse(JSON.stringify(packet.metadata)) : {}
  };
}

function rewardTransactionValidation(packet, { inventorySlots = [], knownExistingItemIds = null, knownPetIds = null } = {}) {
  const normalized = normalizeRewardPacket(packet);
  const errors = [];
  if (!normalized) return { ok: false, errors: ['invalid reward packet'] };
  if (normalized.items.length > MAX_CARRIED_ITEMS) errors.push('carried item count exceeds source pool max 3');
  const seen = new Set();
  for (const item of normalized.items) {
    if (seen.has(item.existingIndex)) errors.push('duplicate existing item index: ' + item.existingIndex);
    seen.add(item.existingIndex);
    if (knownExistingItemIds instanceof Set && !knownExistingItemIds.has(item.existingIndex)) errors.push('unknown existing item index: ' + item.existingIndex);
  }
  if (!Array.isArray(inventorySlots) || inventorySlots.length !== 24) errors.push('reward application requires 24 player item slots');
  if (knownPetIds instanceof Set) for (const pet of normalized.petCredits) if (!knownPetIds.has(String(pet.petId))) errors.push('unknown pet credit: ' + pet.petId);
  return { ok: errors.length === 0, errors, packet: normalized };
}

function applyRewardTransaction(state, packet, { knownExistingItemIds = null, now = () => new Date().toISOString() } = {}) {
  const knownPetIds = new Set((state?.pets?.petBox ?? []).map(p => String(p?.id ?? p?.petId ?? '')).filter(Boolean));
  const validation = rewardTransactionValidation(packet, { inventorySlots: state?.inventory?.playerItemSlots, knownExistingItemIds, knownPetIds });
  if (!validation.ok) return { applied: false, errors: validation.errors, state };
  const next = JSON.parse(JSON.stringify(state));
  next.runtimeMeta ??= {};
  next.runtimeMeta.rewardTransactions ??= {};
  if (next.runtimeMeta.rewardTransactions[validation.packet.transactionId]) {
    return { applied: false, idempotent: true, transactionId: validation.packet.transactionId, state: next };
  }
  next.player.gold = nonNegativeInt(next.player.gold) + validation.packet.gold;
  next.player.exp = nonNegativeInt(next.player.exp) + validation.packet.playerExp;
  for (const petCredit of validation.packet.petCredits) {
    const pet = (next.pets?.petBox ?? []).find(p => String(p?.id ?? p?.petId ?? '') === petCredit.petId || String(p?.petId ?? '') === petCredit.petId);
    if (pet) pet.exp = nonNegativeInt(pet.exp) + petCredit.exp;
  }
  const emptySlots = () => next.inventory.playerItemSlots.map((value, index) => value == null ? index : -1).filter(index => index >= 0);
  for (const item of validation.packet.items) {
    const slots = emptySlots();
    if (!slots.length) return { applied: false, reason: 'inventory-full-before-transaction-commit', transactionId: validation.packet.transactionId, state };
    const slot = slots[0];
    next.inventory.playerItemSlots[slot] = item.existingIndex;
    const key = String(item.existingIndex);
    next.inventory.itemRuntime.slots[key] ??= { existingIndex: item.existingIndex, owner: 'player' };
    next.inventory.itemRuntime.slots[key].owner = 'player';
    next.inventory.piles[key] = nonNegativeInt(next.inventory.piles[key]) + item.count;
  }
  next.runtimeMeta.rewardTransactions[validation.packet.transactionId] = {
    source: validation.packet.source,
    gold: validation.packet.gold,
    itemCount: validation.packet.items.reduce((sum, item) => sum + item.count, 0),
    committedAt: String(now())
  };
  next.runtimeMeta.updatedAt = String(now());
  next.revision = nonNegativeInt(next.revision) + 1;
  return { applied: true, idempotent: false, transactionId: validation.packet.transactionId, state: next };
}

export { REWARD_TRANSACTION_FORMAT, MAX_CARRIED_ITEMS, normalizeRewardPacket, rewardTransactionValidation, applyRewardTransaction };
