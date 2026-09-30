const ITEM_ECONOMY_RUNTIME_FORMAT='stoneage-item-economy-runtime-v1';
const ITEMSHOP_MAX_BASE_PRICE=9999;
const PLAYER_BACKPACK_START=9;
const PLAYER_ITEM_SLOT_COUNT=24;
const FIXED_MAX_GOLD_BASE=1000000;
const FIXED_MAX_GOLD_PER_TRANSMIGRATION=1800000;

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const intOr=(value,fallback=0)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;
const nonNegativeInt=value=>Math.max(0,intOr(value,0));
const finiteNumber=value=>Number.isFinite(Number(value))?Number(value):null;

function sourcePlayerMaxGold(value){
  const transmigration=isObject(value)?nonNegativeInt(value?.player?.transmigration):nonNegativeInt(value);
  return FIXED_MAX_GOLD_BASE+transmigration*FIXED_MAX_GOLD_PER_TRANSMIGRATION;
}

function backpackSlots(state){
  const slots=state?.inventory?.playerItemSlots;
  if(!Array.isArray(slots)||slots.length!==PLAYER_ITEM_SLOT_COUNT)return null;
  return slots;
}

function emptyBackpackSlots(state){
  const slots=backpackSlots(state);
  if(!slots)return [];
  return slots.map((value,index)=>index>=PLAYER_BACKPACK_START&&value==null?index:-1).filter(index=>index>=0);
}

function normalizeRate(value,fallback=null){
  const rate=finiteNumber(value);
  return rate==null||rate<0?fallback:rate;
}

function pricePerUnit(baseCost,rate){
  const cost=intOr(baseCost,-1);
  const normalizedRate=normalizeRate(rate);
  if(cost<0||normalizedRate==null)return -1;
  return Math.max(0,Math.trunc(cost*normalizedRate));
}

function clone(value){
  return JSON.parse(JSON.stringify(value));
}

function validateEconomyState(state){
  const errors=[];
  const slots=backpackSlots(state);
  if(!isObject(state))errors.push('state must be an object');
  if(!slots)errors.push('inventory.playerItemSlots must contain exactly 24 slots');
  if(!isObject(state?.inventory?.itemRuntime)||!isObject(state.inventory.itemRuntime.slots)){
    errors.push('inventory.itemRuntime.slots must be an object');
  }
  const maxGold=sourcePlayerMaxGold(state);
  const gold=intOr(state?.player?.gold,-1);
  if(gold<0||gold>maxGold)errors.push('player.gold outside source max-gold range');
  if(slots){
    for(let i=PLAYER_BACKPACK_START;i<PLAYER_ITEM_SLOT_COUNT;i++){
      const ref=slots[i];
      if(ref==null)continue;
      const existing=state.inventory.itemRuntime.slots[String(intOr(ref,-1))];
      if(!existing)errors.push('backpack slot '+i+' references missing existing item');
    }
  }
  return {ok:errors.length===0,errors,maxGold};
}

function normalizeBuyRequest(request){
  if(!isObject(request))return null;
  const itemId=intOr(request.itemId,-1);
  const quantity=nonNegativeInt(request.quantity);
  const baseCost=intOr(request.baseCost,-1);
  const buyRate=normalizeRate(request.buyRate,1);
  if(itemId<0||quantity<=0||baseCost<0||buyRate==null)return null;
  return {itemId,quantity,baseCost,buyRate};
}

function buyShopItem(state,request,{allocateItem}={}){
  const validation=validateEconomyState(state);
  if(!validation.ok)return {applied:false,reason:'invalid-economy-state',errors:validation.errors,state};
  if(typeof allocateItem!=='function')return {applied:false,reason:'source-item-allocator-required',state};
  const normalized=normalizeBuyRequest(request);
  if(!normalized)return {applied:false,reason:'invalid-buy-request',state};
  const available=emptyBackpackSlots(state);
  const quantity=Math.min(normalized.quantity,available.length);
  if(quantity<=0)return {applied:false,reason:'inventory-full',state};
  const unitPrice=pricePerUnit(normalized.baseCost,normalized.buyRate);
  const total=unitPrice*quantity;
  if(total>state.player.gold)return {applied:false,reason:'insufficient-gold',unitPrice,total,quantity,state};
  const next=clone(state);
  next.runtimeMeta??={};
  next.runtimeMeta.economyTransactions??={};
  const created=[];
  try{
    for(let i=0;i<quantity;i++){
      const allocation=allocateItem({state:next,itemId:normalized.itemId,index:i});
      if(!isObject(allocation)||intOr(allocation.existingIndex,-1)<0||!isObject(allocation.item)){
        return {applied:false,reason:'source-item-allocation-failed',index:i,state};
      }
      const existingIndex=intOr(allocation.existingIndex,-1);
      const item=allocation.item;
      item.owner='player';
      next.inventory.itemRuntime.slots[String(existingIndex)]=item;
      const slot=available[i];
      next.inventory.playerItemSlots[slot]=existingIndex;
      created.push({existingIndex,slot});
    }
  }catch(error){
    return {applied:false,reason:'source-item-allocation-error',message:String(error?.message??error),state};
  }
  next.player.gold-=total;
  next.runtimeMeta.economyTransactions??={};
  const transactionId=String(request.transactionId??'').trim();
  if(transactionId)next.runtimeMeta.economyTransactions[transactionId]={
    type:'buy',itemId:normalized.itemId,quantity,unitPrice,total
  };
  next.runtimeMeta.updatedAt=new Date().toISOString();
  next.revision=nonNegativeInt(next.revision)+1;
  return {applied:true,type:'buy',itemId:normalized.itemId,requestedQuantity:normalized.quantity,quantity,unitPrice,total,created,state:next};
}

function normalizeSellRequest(request){
  if(!isObject(request))return null;
  const slot=intOr(request.slot,-1);
  const quantity=nonNegativeInt(request.quantity||1);
  const baseCost=intOr(request.baseCost,-1);
  const sellRate=normalizeRate(request.sellRate,0);
  if(slot<PLAYER_BACKPACK_START||slot>=PLAYER_ITEM_SLOT_COUNT||quantity<=0||baseCost<=0||baseCost>ITEMSHOP_MAX_BASE_PRICE||sellRate==null)return null;
  return {slot,quantity,baseCost,sellRate};
}

function sellShopItem(state,request){
  const validation=validateEconomyState(state);
  if(!validation.ok)return {applied:false,reason:'invalid-economy-state',errors:validation.errors,state};
  const normalized=normalizeSellRequest(request);
  if(!normalized)return {applied:false,reason:'invalid-sell-request',state};
  const slots=backpackSlots(state);
  const existingIndex=intOr(slots[normalized.slot],-1);
  const existing=state.inventory.itemRuntime.slots[String(existingIndex)];
  if(existingIndex<0||!isObject(existing))return {applied:false,reason:'existing-item-missing',state};
  if(existing.owner!=='player')return {applied:false,reason:'existing-item-not-player-owned',state};
  const pile=Math.max(1,nonNegativeInt(existing.pile||1));
  if(normalized.quantity>pile)return {applied:false,reason:'sell-quantity-exceeds-pile',state};
  const unitPrice=pricePerUnit(normalized.baseCost,normalized.sellRate);
  if(unitPrice<0)return {applied:false,reason:'invalid-sell-price',state};
  const total=unitPrice*normalized.quantity;
  const currentGold=nonNegativeInt(state.player.gold);
  if(currentGold+total>=validation.maxGold)return {applied:false,reason:'sell-would-reach-or-exceed-gold-cap',currentGold,total,maxGold:validation.maxGold,state};
  const next=clone(state);
  const item=next.inventory.itemRuntime.slots[String(existingIndex)];
  const remaining=pile-normalized.quantity;
  if(remaining>0){
    item.pile=remaining;
    const itemId=item.itemId!=null?String(item.itemId):null;
    if(itemId){
      next.inventory.piles??={};
      next.inventory.piles[itemId]=Math.max(0,nonNegativeInt(next.inventory.piles[itemId])-normalized.quantity);
      if(next.inventory.piles[itemId]===0)delete next.inventory.piles[itemId];
    }
  }else{
    next.inventory.playerItemSlots[normalized.slot]=null;
    delete next.inventory.itemRuntime.slots[String(existingIndex)];
    const itemId=item.itemId!=null?String(item.itemId):null;
    if(itemId){
      next.inventory.piles??={};
      next.inventory.piles[itemId]=Math.max(0,nonNegativeInt(next.inventory.piles[itemId])-normalized.quantity);
      if(next.inventory.piles[itemId]===0)delete next.inventory.piles[itemId];
    }
  }
  next.player.gold=currentGold+total;
  next.runtimeMeta??={};
  next.runtimeMeta.economyTransactions??={};
  const transactionId=String(request.transactionId??'').trim();
  if(transactionId)next.runtimeMeta.economyTransactions[transactionId]={
    type:'sell',existingIndex,slot:normalized.slot,quantity:normalized.quantity,unitPrice,total
  };
  next.runtimeMeta.updatedAt=new Date().toISOString();
  next.revision=nonNegativeInt(next.revision)+1;
  return {applied:true,type:'sell',existingIndex,slot:normalized.slot,quantity:normalized.quantity,unitPrice,total,state:next};
}

export {
  ITEM_ECONOMY_RUNTIME_FORMAT,
  ITEMSHOP_MAX_BASE_PRICE,
  PLAYER_BACKPACK_START,
  PLAYER_ITEM_SLOT_COUNT,
  FIXED_MAX_GOLD_BASE,
  FIXED_MAX_GOLD_PER_TRANSMIGRATION,
  sourcePlayerMaxGold,
  backpackSlots,
  emptyBackpackSlots,
  pricePerUnit,
  validateEconomyState,
  normalizeBuyRequest,
  buyShopItem,
  normalizeSellRequest,
  sellShopItem
};
