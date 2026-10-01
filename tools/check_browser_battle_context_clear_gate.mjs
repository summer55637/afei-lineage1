#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const controller=fs.readFileSync(
  new URL('../src/stoneage_browser_state_controller.mjs',import.meta.url),
  'utf8'
);

assert.equal(
  controller.includes("action.event===IDLE_EVENTS.DISABLE)battleContext=null"),
  false,
  'IDLE_EVENTS.DISABLE must not bypass BATTLE_CONTEXT_CLEAR'
);

const allowedClearAssignments=(controller.match(/battleContext=null/g)||[]).length;
assert.equal(
  allowedClearAssignments,
  3,
  'Only initialization plus the two validated Clear-gate paths may assign battleContext=null'
);

console.log('Browser Battle Context Clear bypass regression: PASS');
