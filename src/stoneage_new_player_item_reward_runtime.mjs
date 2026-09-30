import { createSourceItemAllocator } from './stoneage_item_source_runtime.mjs';

const NEW_PLAYER_ITEM_REWARD_RUNTIME_FORMAT='stoneage-new-player-item-reward-runtime-v1';
const PLAYER_ITEM_SLOT_COUNT=24;
const PLAYER_BACKPACK_START=9;
const PLAYER_BACKPACK_END=23;

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const intOr=(v,f=0)=>Number.isFinite(Number(v))?Math.trunc(Number(v)):f;

function validateNewPlayerItemRewardCatalog(catalog){
  const errors=[];
  if(!isObject(catalog))return {ok:false,errors:['catalog must be an object']};
  if(catalog.format!==NEW_PLAYER_ITEM_REWARD_RUNTIME_FORMAT)errors.push('catalog format drift');
  if(!Array.isArray(catalog.itemIds))errors.push('catalog itemIds must be an array');
  if(!isObject(catalog.byItemId))errors.push('catalog byItemId must be an object');
  if(catalog.playerBackpackStart!==PLAYER_BACKPACK_START)errors.push('catalog playerBackpackStart must be 9');
  if(catalog.playerBackpackEnd!==PLAYER_BACKPACK_END)errors.push('catalog playerBackpackEnd must be 23');
  return {ok:errors.length===0,errors};
}

function isRewardItem(catalog,itemId){
  const id=intOr(itemId,-1);
  if(id<0||!Array.isArray(catalog?.itemIds))return false;
  return catalog.itemIds.includes(id)&&isObject(catalog.byItemId?.[String(id)]);
}

function findEmptyRewardSlot(state){
  const slots=Array.isArray(state?.inventory?.playerItemSlots)?state.inventory.playerItemSlots:[];
  for(let slot=PLAYER_BACKPACK_START;slot<=PLAYER_BACKPACK_END;slot++){
    const value=slots[slot];
    if(value===null||value===undefined||value==='')return slot;
  }
  return -1;
}

function createNewPlayerItemRewardHandler({
  rewardCatalog,
  itemMakeCatalog,
  allocator=null,
  itemCapacity=28000,
  cursor=1,
  randInclusive
}={}){
  const validation=validateNewPlayerItemRewardCatalog(rewardCatalog);
  if(!validation.ok){
    return ()=>({ok:false,reason:'invalid-new-player-item-reward-catalog',errors:validation.errors});
  }
  const runtimeAllocator=allocator??createSourceItemAllocator({
    catalog:itemMakeCatalog,
    itemCapacity,
    cursor,
    ...(typeof randInclusive==='function'?{randInclusive}:{}),
  });

  return (state,payload)=>{
    const itemId=intOr(payload?.itemId,-1);
    if(!isRewardItem(rewardCatalog,itemId))return {ok:false,reason:'new-player-item-reward-not-allowed',itemId};
    if(!state?.inventory?.playerItemSlots||!isObject(state?.inventory?.itemRuntime?.slots)){
      return {ok:false,reason:'canonical-item-state-required',itemId};
    }
    const slot=findEmptyRewardSlot(state);
    if(slot<0)return {ok:false,reason:'player-backpack-full',itemId};
    const allocation=runtimeAllocator.allocate({state,itemId,index:payload?.actionIndex??0});
    if(!allocation.ok)return {ok:false,reason:'source-item-allocation-failed',itemId,detail:allocation};
    const existingIndex=intOr(allocation.existingIndex,-1);
    if(existingIndex<0||isObject(state.inventory.itemRuntime.slots[String(existingIndex)])){
      return {ok:false,reason:'existing-item-index-collision',itemId,existingIndex};
    }
    const item=allocation.item;
    item.owner='player';
    state.inventory.itemRuntime.slots[String(existingIndex)]=item;
    state.inventory.playerItemSlots[slot]=existingIndex;
    return {
      ok:true,
      itemId,
      slot,
      existingIndex,
      rngCalls:allocation.rngCalls,
      item,
      source:rewardCatalog.byItemId[String(itemId)].source
    };
  };
}

function applyNewPlayerItemRewardList(state,itemIds,options={}){
  const handler=createNewPlayerItemRewardHandler(options);
  const created=[];
  const list=Array.isArray(itemIds)?itemIds:[];
  for(let i=0;i<list.length;i++){
    const result=handler(state,{itemId:list[i],actionIndex:i});
    if(!result.ok)return {ok:false,reason:'new-player-item-reward-list-failed',failedIndex:i,failedItemId:list[i],created,state};
    created.push(result);
  }
  return {ok:true,created,state};
}

export {
  NEW_PLAYER_ITEM_REWARD_RUNTIME_FORMAT,
  PLAYER_ITEM_SLOT_COUNT,
  PLAYER_BACKPACK_START,
  PLAYER_BACKPACK_END,
  validateNewPlayerItemRewardCatalog,
  isRewardItem,
  findEmptyRewardSlot,
  createNewPlayerItemRewardHandler,
  applyNewPlayerItemRewardList
};
