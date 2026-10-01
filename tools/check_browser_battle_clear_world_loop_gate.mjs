#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const controller=fs.readFileSync(
  new URL('../src/stoneage_browser_state_controller.mjs',import.meta.url),
  'utf8'
);

const requiredBranches=[
  'ACTION_WORLD_FIRST_ROUTE_PLAN',
  'ACTION_WORLD_FIRST_ROUTE_EXECUTE',
  'ACTION_WORLD_MOVE_STEP',
  'ACTION_WORLD_WARPPOINT_EXECUTE',
  'ACTION_WORLD_ENCOUNTER_PREPARE',
  'ACTION_WORLD_ENCOUNTER_ROLL',
  'ACTION_WORLD_ENCOUNTER_GROUP_SELECT',
  'ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE',
  'ACTION_WORLD_ENCOUNTER_ROLL_IDLE_COMMIT',
  'ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD',
  'ACTION_NPC_WARP_EXECUTE',
  'ACTION_NPC_EVENT_EXECUTE',
  'ACTION_NPC_RESOLVE_AT',
  'ITEMSHOP_UI_OPEN',
  'ITEMSHOP_UI_SELECT_OFFER',
  'ITEMSHOP_UI_SET_QUANTITY',
  'ITEMSHOP_UI_CLOSE',
  'ACTION_NPC_SAVEPOINT_SET',
  'ACTION_NPC_HEALER_USE',
  'ACTION_NPC_ITEMSHOP_BUY',
  'ACTION_NPC_TALK'
];

for(const marker of requiredBranches){
  const branchMarker=marker==='ACTION_NPC_TALK' ? 'if(type!==ACTION_NPC_TALK)' : `if(type===${marker}`;
  const at=controller.indexOf(branchMarker);
  assert.notEqual(at,-1,`missing branch marker: ${marker}`);
  const window=controller.slice(at,at+1200);
  assert.match(window,/requireBattleContextClearForWorldLoop\(battleContext,type,currentState\)/,`missing Clear gate near ${marker}`);
}

assert.match(
  controller,
  /if\(contextClear\.ok===true&&contextClear\.battleContextCleared===true\)battleContext=null/,
  'automatic Battle Context clear must remain gate-driven'
);

console.log('Browser world/NPC Battle Context Clear gate regression: PASS');
