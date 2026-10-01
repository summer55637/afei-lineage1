import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { planBattleItems } from '../src/stoneage_browser_battle_item_runtime.mjs';

const state=freshPersistentState({now:()=> '2026-10-01T11:20:00+08:00',playerId:'p1'});
state.inventory.playerItemSlots[9]=100;
state.inventory.itemRuntime.slots['100']={use:true,itemId:900,owner:'player',pile:1};
state.inventory.itemRuntime.slots['201']={use:true,itemId:201,owner:'enemy:unit-1',pile:1};
state.inventory.itemRuntime.slots['202']={use:true,itemId:202,owner:'enemy:unit-2',pile:2};
state.inventory.itemRuntime.slots['203']={use:true,itemId:203,owner:'enemy:unit-3',pile:1};

const battleContext={
  context:{sides:[
    {side:0,type:0,entries:[{bid:0,sourceType:'player',characterId:'p1',isDie:false,getitem:[201,202,203]}]},
    {side:1,type:1,entries:Array(10).fill(null)}
  ]}
};

const plan=planBattleItems(battleContext,state);
assert.equal(plan.ok,true);
assert.equal(plan.stage,'battle-item-plan-ready');
assert.equal(plan.accepted.length,2);
assert.equal(plan.accepted[0].existingIndex,201);
assert.equal(plan.accepted[0].playerSlot,10);
assert.equal(plan.accepted[1].existingIndex,202);
assert.equal(plan.accepted[1].playerSlot,11);
assert.equal(plan.accepted[1].count,2);
assert.equal(plan.discarded.length,1);
assert.equal(plan.discarded[0].existingIndex,203);
assert.equal(plan.discarded[0].reason,'inventory-full');
assert.equal(plan.rerollAtCommit,false);
assert.equal(plan.persistentStateMutation,false);

const deadContext={
  context:{sides:[
    {side:0,type:0,entries:[{bid:0,sourceType:'player',characterId:'p1',isDie:true,getitem:[201]}]},
    {side:1,type:1,entries:Array(10).fill(null)}
  ]}
};
const dead=planBattleItems(deadContext,state);
assert.equal(dead.ok,false);
assert.equal(dead.reason,'player-dead-no-battle-items');

console.log('V4.17 Browser Battle item plan regression: PASS');
