import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { planBattleItems } from '../src/stoneage_browser_battle_item_runtime.mjs';
import { commitBattleItems } from '../src/stoneage_browser_battle_item_commit_runtime.mjs';

const state=freshPersistentState({now:()=> '2026-10-01T11:30:00+08:00',playerId:'p1'});
for(let i=9;i<24;i++) state.inventory.playerItemSlots[i]=900+i;
state.inventory.itemRuntime.slots['909']={use:true,itemId:909,owner:'player',pile:1};
state.inventory.itemRuntime.slots['201']={use:true,itemId:201,owner:'enemy:u1',pile:1};

state.inventory.playerItemSlots[10]=201;
delete state.inventory.itemRuntime.slots['201'];
// Rebuild a single empty backpack slot at 10 and two carried entries.
state.inventory.playerItemSlots[10]=null;
state.inventory.itemRuntime.slots['201']={use:true,itemId:201,owner:'enemy:u1',pile:1};
state.inventory.itemRuntime.slots['202']={use:true,itemId:202,owner:'enemy:u2',pile:1};

const battleContext={
  context:{sides:[{side:0,type:0,entries:[{bid:0,sourceType:'player',characterId:'p1',isDie:false,getitem:[201,202,-1]}]},{side:1,type:1,entries:Array(10).fill(null)}]}
};
const plan=planBattleItems(battleContext,state);
assert.equal(plan.accepted.length,1);
assert.equal(plan.accepted[0].existingIndex,201);
assert.equal(plan.discarded.length,1);
assert.equal(plan.discarded[0].existingIndex,202);

state.revision=3;
const committed=commitBattleItems(state,plan,{transactionId:'battle-v418-1',expectedRevision:3,now:()=> '2026-10-01T11:31:00+08:00'});
assert.equal(committed.ok,true);
assert.equal(committed.applied,true);
assert.equal(committed.state.inventory.playerItemSlots[10],201);
assert.equal(committed.state.inventory.itemRuntime.slots['201'].owner,'player');
assert.equal(committed.state.inventory.itemRuntime.slots['202'],undefined);
assert.equal(committed.state.revision,4);

const retry=commitBattleItems(committed.state,plan,{transactionId:'battle-v418-1',expectedRevision:3});
assert.equal(retry.ok,true);
assert.equal(retry.idempotent,true);
assert.equal(retry.applied,false);
assert.equal(retry.state.revision,4);

console.log('V4.18 Browser Battle item commit regression: PASS');
