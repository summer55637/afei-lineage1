#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  freshPersistentState
} from '../src/stoneage_persistent_state.mjs';
import {
  buildBattleContext
} from '../src/stoneage_browser_battle_context_runtime.mjs';
import {
  collectPlayerRelifeCandidates,
  applyBattleRelife
} from '../src/stoneage_browser_battle_relife_runtime.mjs';
import {
  commitBattleRelife
} from '../src/stoneage_browser_battle_relife_commit_runtime.mjs';

const catalog=JSON.parse(fs.readFileSync('data/generated/stoneage_item_relife_runtime.json','utf8'));
const now=()=> '2026-10-03T20:30:00+08:00';

const state=freshPersistentState({now,playerId:'p1',playerName:'Relife Tester'});
state.player.level=20;
state.player.hp=100;
state.player.maxHp=300;
state.inventory.playerItemSlots[3]=300;
state.inventory.playerItemSlots[4]=301;
state.inventory.playerItemSlots[5]=302;
state.inventory.itemRuntime.slots['300']={use:true,itemId:20131,owner:'player',pile:1};
state.inventory.itemRuntime.slots['301']={use:true,itemId:20132,owner:'player',pile:1};
state.inventory.itemRuntime.slots['302']={use:true,itemId:20133,owner:'player',pile:1};
state.inventory.piles['20131']=1;
state.inventory.piles['20132']=1;
state.inventory.piles['20133']=1;

const candidates=collectPlayerRelifeCandidates(state,catalog);
assert.equal(candidates.ok,true,JSON.stringify(candidates));
assert.deepEqual(candidates.candidates.map(x=>x.playerSlot),[3,4]);
assert.deepEqual(candidates.candidates.map(x=>x.itemId),[20131,20132]);

const built=buildBattleContext({
  playerId:state.player.id,
  player:state.player,
  activePet:null,
  team:[{enemyId:100,exp:10}],
  encounter:{encounterId:1,floorId:100,x:10,y:10},
  groupId:1,
  battleFieldNo:0,
  materializeEnemyStats:false,
  playerItemSlots:state.inventory.playerItemSlots,
  playerItemRuntimeSlots:state.inventory.itemRuntime.slots,
  playerRelifeCatalog:catalog
});
assert.equal(built.ok,true,JSON.stringify(built));
assert.deepEqual(built.context.sourcePlayerRelifeCandidates.map(x=>x.itemId),[20131,20132]);

const firstContext={format:'stoneage-browser-battle-context-runtime-v1',context:{
  ...built.context,
  mode:'battle',sourceMode:2,
  sides:built.context.sides.map(side=>side.side===0
    ? {...side,entries:side.entries.map(entry=>entry?.bid===0
      ? {...entry,hp:0,isDie:true,maxHp:300,ultimate:0,sourceDeathExtraProcessed:true,sourceAddProfitDeathPending:false}
      : entry)}
    : side)
}};
const first=applyBattleRelife(firstContext,{trigger:'outer-add-profit'});
assert.equal(first.ok,true,JSON.stringify(first));
assert.equal(first.applied,true);
assert.equal(first.event.itemId,20131);
assert.equal(first.event.playerSlot,3);
assert.equal(first.event.restoredHp??first.event.hpAfter,200);
assert.equal(first.context.sides[0].entries[0].hp,200);
assert.equal(first.context.sides[0].entries[0].isDie,false);
assert.equal(first.context.sourceRelifeConsumedExistingIndexes.includes(300),true);

const secondContext={format:'stoneage-browser-battle-context-runtime-v1',context:{
  ...first.context,
  sides:first.context.sides.map(side=>side.side===0
    ? {...side,entries:side.entries.map(entry=>entry?.bid===0
      ? {...entry,hp:0,isDie:true,ultimate:0,sourceDeathExtraProcessed:true,sourceAddProfitDeathPending:false}
      : entry)}
    : side)
}};
const second=applyBattleRelife(secondContext,{trigger:'outer-add-profit'});
assert.equal(second.ok,true,JSON.stringify(second));
assert.equal(second.applied,true);
assert.equal(second.event.itemId,20132);
assert.equal(second.context.sides[0].entries[0].hp,300);

const ultimateContext={format:'stoneage-browser-battle-context-runtime-v1',context:{
  ...second.context,
  sides:second.context.sides.map(side=>side.side===0
    ? {...side,entries:side.entries.map(entry=>entry?.bid===0
      ? {...entry,hp:0,isDie:true,ultimate:1,sourceDeathExtraProcessed:true,sourceAddProfitDeathPending:false}
      : entry)}
    : side)
}};
const ultimate=applyBattleRelife(ultimateContext,{trigger:'outer-add-profit'});
assert.equal(ultimate.ok,true);
assert.equal(ultimate.applied,undefined);
assert.equal(ultimate.stage,'battle-relife-skipped-ultimate');
assert.equal(ultimate.reason,'ultimate-death-excluded-by-BATTLE_getBattleDieIndex');

state.player.hp=0;
const committed=commitBattleRelife(state,{
  format:'stoneage-browser-battle-context-runtime-v1',
  context:second.context
},{transactionId:'relife-1',expectedRevision:0,now});
assert.equal(committed.ok,true,JSON.stringify(committed));
assert.equal(committed.state.revision,1);
assert.equal(committed.state.inventory.playerItemSlots[3],null);
assert.equal(committed.state.inventory.playerItemSlots[4],null);
assert.equal(committed.state.inventory.itemRuntime.slots['300'],undefined);
assert.equal(committed.state.inventory.itemRuntime.slots['301'],undefined);
assert.equal(committed.state.inventory.playerItemSlots[5],302,'slot 5 is outside source CHECK_ITEM_RELIFE scan and remains untouched');
assert.equal(committed.state.player.hp,300);
assert.equal(committed.state.inventory.piles['20131'],undefined);
assert.equal(committed.state.inventory.piles['20132'],undefined);

const retry=commitBattleRelife(committed.state,{
  format:'stoneage-browser-battle-context-runtime-v1',
  context:second.context
},{transactionId:'relife-1',expectedRevision:0,now});
assert.equal(retry.ok,true);
assert.equal(retry.idempotent,true);
assert.equal(retry.state.revision,1);

const missingCatalog=buildBattleContext({
  playerId:state.player.id,
  player:state.player,
  activePet:null,
  team:[{enemyId:100,exp:10}],
  encounter:{encounterId:2,floorId:100,x:10,y:10},
  groupId:1,
  battleFieldNo:0,
  playerItemSlots:state.inventory.playerItemSlots,
  playerItemRuntimeSlots:state.inventory.itemRuntime.slots
});
assert.equal(missingCatalog.ok,false);
assert.equal(missingCatalog.reason,'player-relife-catalog-required');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v464-browser-battle-relife-v1',
  scanSlots:[0,1,2,3,4],
  firstItem:20131,
  secondItem:20132,
  firstHp:200,
  secondHp:300,
  ultimateExcluded:true,
  consumedExistingIndexes:[300,301],
  transactionIdempotent:true
},null,2));
