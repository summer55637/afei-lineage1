#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { buildBattleContext, SOURCE_ENTRY_INIT, SOURCE_BATTLE_INIT } from '../src/stoneage_browser_battle_context_runtime.mjs';

const state=freshPersistentState({playerId:'v387'});
state.player.name='阿飛';
state.player.hp=100;
state.player.maxHp=100;
state.player.mp=50;
state.player.maxMp=50;

const team=[
  {enemyId:120,size:0,createMaxNum:10,enemy:{tempNo:113}},
  {enemyId:123,size:0,createMaxNum:10,enemy:{tempNo:114}}
];

assert.deepEqual(SOURCE_ENTRY_INIT,{escape:0,getitem:[-1,-1,-1]});
assert.deepEqual(SOURCE_BATTLE_INIT,{use:true,mode:1,turn:0,dpbattle:0,norisk:0,flg:0,fieldAtt:0,attCount:0});

const result=buildBattleContext({
  player:state.player,
  team,
  encounter:{floorId:100,x:610,y:538,encounterId:65},
  groupId:94,
  battleFieldNo:0
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.deepEqual(result.context.sourceEntryInit,{escape:0,getitem:[-1,-1,-1]});
assert.deepEqual(result.context.sourceBattleInit,{use:true,mode:1,turn:0,dpbattle:0,norisk:0,flg:0,fieldAtt:0,attCount:0});
assert.equal(result.context.use,true);
assert.equal(result.context.mode,'init');
assert.equal(result.context.turn,0);
assert.equal(result.context.dpbattle,0);
assert.equal(result.context.norisk,0);
assert.equal(result.context.flg,0);
assert.equal(result.context.fieldAtt,0);
assert.equal(result.context.attCount,0);

const populated=[
  result.context.sides[0].entries[0],
  result.context.sides[1].entries[5],
  result.context.sides[1].entries[6]
];
for(const entry of populated){
  assert.equal(entry.escape,0);
  assert.deepEqual(entry.getitem,[-1,-1,-1]);
}

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v387-browser-battle-entry-init-v1',
  entryInit:{escape:0,getitem:[-1,-1,-1]},
  battleCreateInit:{use:true,mode:'init',turn:0,dpbattle:0,norisk:0,flg:0,fieldAtt:0,attCount:0}
},null,2));
