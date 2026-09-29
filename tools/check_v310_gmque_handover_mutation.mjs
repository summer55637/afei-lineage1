#!/usr/bin/env node
'use strict';

import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');

function extractFunction(name){
  const marker=`function ${name}(`;
  const start=game.indexOf(marker);
  assert.ok(start>=0,`missing ${name}`);
  const next=game.indexOf('\nfunction ',start+marker.length);
  return game.slice(start,next<0?game.length:next);
}

const itemIds=new Map();
let randModuloCalls=0;
const ctx={
  Math,Number,String,Object,Array,Date,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceGmQueRewardType:nums=>{
    const value=Math.trunc(Number(nums));
    if(value>97)return 'pet';
    if(value>40)return 'item';
    return 'gold';
  },
  _randModulo:()=>0,
  sourceCreateGmQueRewardPet:petId=>({
    ok:true,type:'pet',petId,
    pet:{id:'reward-'+petId,tempNo:petId,petId,name:'reward-pet-'+petId,level:1}
  }),
  sourcePlayerFindEmptyBackpackSlot:()=>9,
  sourceItemRuntimeAlloc:(itemId)=>{ const idx=30000+Number(itemId); itemIds.set(idx,Number(itemId)); return idx; },
  sourcePlayerAddSpecificExistingItem:(itemIndex,{target})=>{
    target.playerItemSlots=Array.isArray(target.playerItemSlots)?target.playerItemSlots:Array(24).fill(null);
    target.playerItemSlots[9]=itemIndex;
    target.inventory=target.inventory||{};
    const itemId=itemIds.get(Number(itemIndex));
    target.inventory[String(itemId)]=(target.inventory[String(itemId)]||0)+1;
    return 9;
  },
  sourceItemRuntimeFree:()=>true,
  PLAYER_BACKPACK_START:9,
  PLAYER_ITEM_SLOT_COUNT:24
};
vm.createContext(ctx);
for(const name of [
  'sourceGmQueActionValue',
  'sourceGmQueRewardType',
  'sourceGmQueTaskEntries',
  'sourceGmQuePetIdentity',
  'sourceGmQueMatchPetToTask',
  'sourceGmQueHandoverCheck',
  'sourceGmQuePrepareTaskState',
  'sourceGmQueClearTaskState',
  'sourceGmQueHandoverPets',
  'sourceGmQueApplyTrophy'
]) vm.runInContext(extractFunction(name),ctx);

const state={
  transmigration:1,
  gold:100000,
  bankGold:0,
  petBox:[
    {id:'p1',petId:1642,tempNo:809,name:'瑞里西尔',level:10},
    {id:'p2',petId:1636,tempNo:803,name:'可可恩',level:11},
    {id:'p3',petId:475,tempNo:5,name:'黑乌力',level:12},
    {id:'p4',petId:1642,tempNo:809,name:'瑞里西尔2',level:13}
  ],
  team:['p1','p2','p3','p4',null],
  activePetId:'p1',
  playerItemSlots:Array(24).fill(null),
  inventory:{},
  quest:{}
};

const parsed={ok:true,count:4,taskString:'1642-10&1636-11&475-12&1642-13'};
const prepared=ctx.sourceGmQuePrepareTaskState(parsed,{target:state,sourceNpc:'TEST-NPC'});
assert.equal(prepared.ok,true);
assert.equal(state.quest.gmque.active,true);
assert.equal(state.quest.gmque.taskString,parsed.taskString);
assert.equal(state.quest.gmque.nums,0);
assert.equal(state.quest.gmque.handedOver,false);

const checkTask=parsed.taskString;
randModuloCalls=0;
ctx._randModulo=()=>{randModuloCalls++;return 0};
const missingPetCheck=ctx.sourceGmQueHandoverCheck(
  checkTask,
  [state.petBox[0],state.petBox[1],state.petBox[2]],
  {gmqueNums:0,randModulo:ctx._randModulo,bagHasSpace:true,gold:800000}
);
assert.equal(missingPetCheck.ok,false);
assert.equal(missingPetCheck.reason,'missing-pet');
assert.equal(missingPetCheck.generatedNums,false);
assert.equal(missingPetCheck.nums,0);
assert.equal(randModuloCalls,0,'GMQUENUMS RNG must not run before all four pets match');

randModuloCalls=0;
ctx._randModulo=()=>{randModuloCalls++;return 98};
const matchedCheck=ctx.sourceGmQueHandoverCheck(
  checkTask,
  state.petBox,
  {gmqueNums:0,randModulo:ctx._randModulo,bagHasSpace:true,gold:0}
);
assert.equal(matchedCheck.ok,true);
assert.equal(matchedCheck.generatedNums,true);
assert.equal(matchedCheck.nums,98);
assert.equal(matchedCheck.type,'pet');
assert.equal(randModuloCalls,1,'GMQUENUMS RNG runs exactly once after pet validation');

const check={
  ok:true,nums:15,matches:[
    {slot:0,candidates:[{pet:state.petBox[0]}]},
    {slot:1,candidates:[{pet:state.petBox[1]}]},
    {slot:2,candidates:[{pet:state.petBox[2]}]},
    {slot:3,candidates:[{pet:state.petBox[3]}]}
  ]
};
const handover=ctx.sourceGmQueHandoverPets(check,{target:state});
assert.equal(handover.ok,true);
assert.equal(handover.removedCount,4);
assert.equal(state.petBox.length,0);
assert.deepEqual(state.team,[null,null,null,null,null]);
assert.equal(state.activePetId,null);
assert.equal(state.quest.gmque.nums,15);
assert.equal(state.quest.gmque.handedOver,true);

const noRewardYet=JSON.stringify(state.quest.gmque);
assert.equal(JSON.parse(noRewardYet).active,true);

const addPet=ctx.sourceGmQueApplyTrophy({ok:true,type:'pet',petId:1642},{target:state});
assert.equal(addPet.ok,true);
assert.equal(state.petBox.length,1);
assert.equal(state.petBox[0].tempNo,809);
assert.equal(state.quest.gmque.active,false);
assert.equal(state.quest.gmque.taskString,'NULL');
assert.equal(state.quest.gmque.nums,0);

const fullPetState={
  petBox:[1,2,3,4,5],
  team:Array(5).fill(null),
  activePetId:null,
  quest:{gmque:{active:true,taskString:'x',nums:98,handedOver:true,sourceNpc:'N'}}
};
const full=ctx.sourceGmQueApplyTrophy({ok:true,type:'pet',petId:1642},{target:fullPetState});
assert.equal(full.ok,false);
assert.equal(full.reason,'pet-full');
assert.equal(fullPetState.quest.gmque.active,true);

const goldState={
  transmigration:1,gold:2790000,bankGold:0,petBox:[],
  team:Array(5).fill(null),activePetId:null,
  quest:{gmque:{active:true,taskString:'1-1&2-2&3-3&4-4',nums:15,handedOver:true,sourceNpc:'N'}}
};
const gold=ctx.sourceGmQueApplyTrophy({ok:true,type:'gold',gold:20000},{target:goldState});
assert.equal(gold.ok,true);
assert.equal(gold.maxGold,2800000);
assert.equal(gold.gold,10000);
assert.equal(gold.bankGold,10000);
assert.equal(goldState.gold,2800000);
assert.equal(goldState.bankGold,10000);
assert.equal(goldState.quest.gmque.active,false);
assert.equal(goldState.quest.gmque.taskString,'NULL');

const itemState={
  gold:0,bankGold:0,transmigration:1,petBox:[],team:Array(5).fill(null),activePetId:null,
  playerItemSlots:Array(24).fill(null),inventory:{},
  quest:{gmque:{active:true,taskString:'1-1&2-2&3-3&4-4',nums:41,handedOver:true,sourceNpc:'N'}}
};
const item=ctx.sourceGmQueApplyTrophy({ok:true,type:'item',itemId:20131},{target:itemState});
assert.equal(item.ok,true);
assert.equal(item.type,'item');
assert.equal(itemState.inventory['20131'],1);
assert.equal(itemState.playerItemSlots[9],item.itemIndex);
assert.equal(itemState.quest.gmque.active,false);

console.log(JSON.stringify({
  pass:true,
  focus:'GMQUE persistent task / handover / reward mutation',
  sourceSequence:'Check -> DelGmquePet -> GetGmPrize -> CleanGmque',
  petHandover:true,
  activePetUnlinked:true,
  petRewardCapacityGuard:true,
  goldCapAndBankOverflow:true,
  itemRewardUsesExistingItemPath:true,
  taskCleanupOnlyAfterSuccessfulReward:true
}));
