const IDLE_STATES = Object.freeze({
  DISABLED: 'disabled',
  MOVING: 'moving',
  ENCOUNTER_PENDING: 'encounter_pending',
  IN_BATTLE: 'in_battle',
  SETTLEMENT: 'settlement',
  SUPPLY_CHECK: 'supply_check',
  DEAD: 'dead',
  OFFLINE_RESUME: 'offline_resume'
});

const IDLE_EVENTS = Object.freeze({
  ENABLE: 'enable',
  DISABLE: 'disable',
  MOVE_TICK: 'move_tick',
  ENCOUNTER_ROLLED: 'encounter_rolled',
  BATTLE_STARTED: 'battle_started',
  BATTLE_FINISHED: 'battle_finished',
  REWARD_APPLIED: 'reward_applied',
  SUPPLY_REQUIRED: 'supply_required',
  SUPPLY_DONE: 'supply_done',
  PLAYER_DEAD: 'player_dead',
  REVIVE_READY: 'revive_ready',
  OFFLINE_RESUME: 'offline_resume',
  SAVE_COMMITTED: 'save_committed'
});

const PRODUCT_LAYER_STATES = new Set([IDLE_STATES.MOVING, IDLE_STATES.ENCOUNTER_PENDING, IDLE_STATES.SETTLEMENT, IDLE_STATES.SUPPLY_CHECK, IDLE_STATES.DEAD, IDLE_STATES.OFFLINE_RESUME]);

function idleInitialState() {
  return { state: IDLE_STATES.DISABLED, routeId: null, pendingEncounter: null, pendingBattle: null, pendingReward: null, lastReason: 'fresh' };
}

function transitionIdle(current, event, payload = {}) {
  const from = current?.state ?? IDLE_STATES.DISABLED;
  let to = from;
  let reason = 'no_transition';

  if (event === IDLE_EVENTS.ENABLE && (from === IDLE_STATES.DISABLED || from === IDLE_STATES.DEAD)) {
    if (payload.routeId == null) return { state: from, reason: 'route_required', accepted: false };
    to = IDLE_STATES.MOVING; reason = 'idle_enabled';
  } else if (event === IDLE_EVENTS.DISABLE) {
    to = IDLE_STATES.DISABLED; reason = 'idle_disabled';
  } else if (event === IDLE_EVENTS.OFFLINE_RESUME && from === IDLE_STATES.DISABLED) {
    to = IDLE_STATES.OFFLINE_RESUME; reason = 'offline_resume_started';
  } else if (event === IDLE_EVENTS.MOVE_TICK && from === IDLE_STATES.MOVING) {
    to = payload.encounterTriggered ? IDLE_STATES.ENCOUNTER_PENDING : IDLE_STATES.MOVING;
    reason = payload.encounterTriggered ? 'source_encounter_boundary_reached' : 'movement_tick';
  } else if (event === IDLE_EVENTS.ENCOUNTER_ROLLED && from === IDLE_STATES.ENCOUNTER_PENDING) {
    to = payload.active ? IDLE_STATES.IN_BATTLE : IDLE_STATES.MOVING;
    reason = payload.active ? 'active_encounter_requires_battle' : 'encounter_no_battle';
  } else if (event === IDLE_EVENTS.BATTLE_STARTED && from === IDLE_STATES.ENCOUNTER_PENDING) {
    to = IDLE_STATES.IN_BATTLE; reason = 'battle_started';
  } else if (event === IDLE_EVENTS.BATTLE_FINISHED && from === IDLE_STATES.IN_BATTLE) {
    to = IDLE_STATES.SETTLEMENT; reason = 'battle_result_ready';
  } else if (event === IDLE_EVENTS.REWARD_APPLIED && from === IDLE_STATES.SETTLEMENT) {
    to = payload.supplyRequired ? IDLE_STATES.SUPPLY_CHECK : IDLE_STATES.MOVING;
    reason = payload.supplyRequired ? 'reward_settled_supply_check' : 'reward_settled_continue_route';
  } else if (event === IDLE_EVENTS.SUPPLY_REQUIRED && from === IDLE_STATES.SETTLEMENT) {
    to = IDLE_STATES.SUPPLY_CHECK; reason = 'supply_check_required';
  } else if (event === IDLE_EVENTS.SUPPLY_DONE && from === IDLE_STATES.SUPPLY_CHECK) {
    to = IDLE_STATES.MOVING; reason = 'supply_complete';
  } else if (event === IDLE_EVENTS.PLAYER_DEAD && [IDLE_STATES.MOVING, IDLE_STATES.ENCOUNTER_PENDING, IDLE_STATES.IN_BATTLE, IDLE_STATES.SETTLEMENT, IDLE_STATES.SUPPLY_CHECK].includes(from)) {
    to = IDLE_STATES.DEAD; reason = 'player_dead';
  } else if (event === IDLE_EVENTS.REVIVE_READY && from === IDLE_STATES.DEAD) {
    to = IDLE_STATES.SUPPLY_CHECK; reason = 'revive_ready_requires_supply_or_route';
  } else if (event === IDLE_EVENTS.SAVE_COMMITTED && from === IDLE_STATES.OFFLINE_RESUME) {
    to = IDLE_STATES.MOVING; reason = 'offline_state_restored';
  }

  return {
    ...current,
    state: to,
    routeId: payload.routeId ?? current?.routeId ?? null,
    pendingEncounter: to === IDLE_STATES.ENCOUNTER_PENDING ? (payload.encounter ?? current?.pendingEncounter ?? null) : (to === IDLE_STATES.IN_BATTLE ? current?.pendingEncounter ?? null : null),
    pendingBattle: to === IDLE_STATES.IN_BATTLE ? (payload.battle ?? current?.pendingBattle ?? null) : null,
    pendingReward: to === IDLE_STATES.SETTLEMENT ? (payload.reward ?? current?.pendingReward ?? null) : null,
    lastReason: reason,
    accepted: reason !== 'no_transition'
  };
}

function idleContractLayer(state) {
  if (PRODUCT_LAYER_STATES.has(state)) return 'product-layer';
  if (state === IDLE_STATES.IN_BATTLE) return 'battle-runtime-boundary';
  if (state === IDLE_STATES.DISABLED) return 'product-layer';
  return 'boundary';
}

export { IDLE_STATES, IDLE_EVENTS, PRODUCT_LAYER_STATES, idleInitialState, transitionIdle, idleContractLayer };
