#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  buildBattleContext,
  SOURCE_BATTLE_ENTRY_RUNTIME_INIT
} from '../src/stoneage_browser_battle_context_runtime.mjs';

const state=freshPersistentState({playerId:'v389'});
state.player.name='阿飛';
state.player.hp=100;
state.player.maxHp=100;

const team=[{enemyId:120,size:0,createMaxNum:10,enemy:{tempNo:113}}];
const result=buildBattleContext({
  player:state.player,
  team,
  encounter:{floorId:100,x:610,y:538,encounterId:65},
  groupId:89,
  battleFieldNo:0
});
assert.equal(result.ok,true,JSON.stringify(result));

assert.deepEqual(SOURCE_BATTLE_ENTRY_RUNTIME_INIT,{
  battleCharMode:1,
  battleFlg:0,
  battleCommands:[-1,-1,-1],
  modAttack:0,
  modDefence:0,
  modQuick:0,
  damageAbsorb:0,
  damageReflect:0,
  damageVanish:0,
  modCapture:0,
  isAttacked:1,
  battleWatch:0
});

const player=result.context.sides[0].entries[0];
const enemy=result.context.sides[1].entries[5];
for(const entry of [player,enemy]){
  assert.equal(entry.sourceBattleCharMode,1);
  assert.equal(entry.battleFlg,0);
  assert.deepEqual(entry.battleCommands,[-1,-1,-1]);
  assert.equal(entry.modAttack,0);
  assert.equal(entry.modDefence,0);
  assert.equal(entry.modQuick,0);
  assert.equal(entry.damageAbsorb,0);
  assert.equal(entry.damageReflect,0);
  assert.equal(entry.damageVanish,0);
  assert.equal(entry.modCapture,0);
  assert.equal(entry.isAttacked,1);
  assert.equal(entry.battleWatch,0);
}

assert.deepEqual(result.context.conditionalResetsOmitted,[
  'PROFESSION_SKILL',
  'PETSKILL_ACUPUNCTURE',
  'PETSKILL_RETRACE',
  'PETSKILL_BECOMEFOX',
  'PROFESSION_ADDSKILL'
]);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v389-browser-battle-entry-reset-v1',
  sourceBattleCharMode:1,
  commands:[-1,-1,-1],
  modifiersZero:true,
  isAttacked:1,
  battleWatch:0,
  conditionalBranchesOmitted:true
},null,2));
