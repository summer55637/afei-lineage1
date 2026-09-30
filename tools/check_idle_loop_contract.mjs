#!/usr/bin/env node
import assert from 'node:assert/strict';
import { IDLE_STATES, IDLE_EVENTS, idleInitialState, transitionIdle, idleContractLayer } from '../src/stoneage_idle_loop.mjs';

let s = idleInitialState();
assert.equal(s.state, IDLE_STATES.DISABLED);
s = transitionIdle(s, IDLE_EVENTS.ENABLE, { routeId: 'route-100' });
assert.equal(s.state, IDLE_STATES.MOVING);
assert.equal(s.routeId, 'route-100');
s = transitionIdle(s, IDLE_EVENTS.MOVE_TICK, { encounterTriggered: true, encounter: { floorId: 100, encounterId: 65 } });
assert.equal(s.state, IDLE_STATES.ENCOUNTER_PENDING);
s = transitionIdle(s, IDLE_EVENTS.ENCOUNTER_ROLLED, { active: true });
assert.equal(s.state, IDLE_STATES.IN_BATTLE);
s = transitionIdle(s, IDLE_EVENTS.BATTLE_FINISHED, { battle: { resultId: 'b1' } });
assert.equal(s.state, IDLE_STATES.SETTLEMENT);
s = transitionIdle(s, IDLE_EVENTS.REWARD_APPLIED, { reward: { exp: 12 }, supplyRequired: true });
assert.equal(s.state, IDLE_STATES.SUPPLY_CHECK);
s = transitionIdle(s, IDLE_EVENTS.SUPPLY_DONE);
assert.equal(s.state, IDLE_STATES.MOVING);
s = transitionIdle(s, IDLE_EVENTS.PLAYER_DEAD);
assert.equal(s.state, IDLE_STATES.DEAD);
s = transitionIdle(s, IDLE_EVENTS.ENABLE, { routeId: 'route-100' });
assert.equal(s.state, IDLE_STATES.MOVING);
assert.equal(idleContractLayer(IDLE_STATES.IN_BATTLE), 'battle-runtime-boundary');
assert.equal(idleContractLayer(IDLE_STATES.MOVING), 'product-layer');

const denied = transitionIdle(idleInitialState(), IDLE_EVENTS.ENABLE);
assert.equal(denied.accepted, false);
assert.equal(denied.reason, 'route_required');

const bad = transitionIdle(idleInitialState(), IDLE_EVENTS.BATTLE_FINISHED);
assert.equal(bad.accepted, false);

console.log(JSON.stringify({ pass: true, format: 'stoneage-idle-loop-contract-v1', states: Object.values(IDLE_STATES), sourceBoundary: 'battle result is consumed, not recomputed' }));
