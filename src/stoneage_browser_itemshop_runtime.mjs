import { canInteractWithNpc } from './stoneage_npc_interaction_runtime.mjs';
import {
  resolveShopBuyOffer,
  resolveShopSellPolicy,
  resolveNpcShopBuyRequest,
  buyNpcItemShopItem,
  parseConstraintToken,
  expandConstraintToken
} from './stoneage_npc_itemshop_runtime.mjs';
import {
  createSourceItemAllocator,
  ITEM_MAKE_RUNTIME_FORMAT
} from './stoneage_item_source_runtime.mjs';
import { sellShopItem } from './stoneage_item_economy_runtime.mjs';

const BROWSER_ITEMSHOP_RUNTIME_FORMAT='stoneage-browser-itemshop-runtime-v1';
const ACTION_NPC_ITEMSHOP_OPEN='NPC_ITEMSHOP_OPEN';
const ACTION_NPC_ITEMSHOP_BUY='NPC_ITEMSHOP_BUY';
const ACTION_NPC_ITEMSHOP_SELL='NPC_ITEMSHOP_SELL';

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const intOr=(v,f=0)=>Number.isFinite(Number(v))?Math.trunc(Number(v)):f;
const clone=value=>JSON.parse(JSON.stringify(value));

function validateBrowserItemShopDependencies({catalog,itemMakeCatalog}={}){
  const errors=[];
  if(!isObject(catalog)||catalog.format!=='stoneage-npc-itemshop-runtime-v1')errors.push('npc itemshop catalog required');
  if(!isObject(itemMakeCatalog)||itemMakeCatalog.format!==ITEM_MAKE_RUNTIME_FORMAT)errors.push('source item make catalog required');
  return {ok:errors.length===0,errors};
}

function catalogShopItemIds(catalog,shop){
  if(Array.isArray(shop?.itemIds))return shop.itemIds.map(value=>intOr(value,-1)).filter(value=>value>=0);
  const out=[];
  for(const entry of shop?.itemEntries??[]){
    const parsed=typeof entry==='string'?parseConstraintToken(entry):entry;
    out.push(...expandConstraintToken(parsed,{sourceBuyRangeBug:true}));
  }
  return [...new Set(out.filter(value=>value>=0))];
}

function getItemRuntimeSnapshot(state,slot){
  const index=intOr(slot,-1);
  const slots=state?.inventory?.playerItemSlots;
  if(index<9||index>=24||!Array.isArray(slots))return {ok:false,reason:'invalid-backpack-slot'};
  const existingIndex=intOr(slots[index],-1);
  const item=state?.inventory?.itemRuntime?.slots?.[String(existingIndex)];
  if(existingIndex<0||!isObject(item))return {ok:false,reason:'existing-item-missing',slot:index};
  const data=Array.isArray(item.data)?item.data:[];
  const itemId=intOr(item.itemId??data[0],-1);
  const baseCost=intOr(data[2],-1);
  const itemType=intOr(data[3],-1);
  if(itemId<0||baseCost<0||itemType<0){
    return {ok:false,reason:'source-item-fields-required',slot:index,itemId,baseCost,itemType};
  }
  return {ok:true,slot:index,existingIndex,item,itemId,baseCost,itemType};
}

function resolveBrowserItemShopOffers(catalog,itemMakeCatalog,shopId){
  if(!isObject(catalog)||!isObject(catalog.shops))return {ok:false,reason:'invalid-catalog'};
  const shop=catalog.shops[String(shopId)];
  if(!isObject(shop))return {ok:false,reason:'shop-missing',shopId:String(shopId)};
  const itemIds=catalogShopItemIds(catalog,shop);
  const offers=itemIds.map((itemId,offerIndex)=>{
    const offer=resolveShopBuyOffer(catalog,{shopId,itemId});
    if(!offer.ok)return {itemId,offerIndex,resolved:false,reason:offer.reason};
    const request=resolveNpcShopBuyRequest({catalog,itemMakeCatalog,shopId,itemId,quantity:1});
    if(!request.ok)return {itemId,offerIndex,resolved:false,reason:request.reason,buyRate:offer.buyRate};
    return {
      itemId,
      offerIndex,
      resolved:true,
      baseCost:request.transaction.baseCost,
      buyRate:request.transaction.buyRate,
      unitPrice:Math.max(0,Math.trunc(request.transaction.baseCost*request.transaction.buyRate))
    };
  });
  return {
    ok:true,
    shopId:String(shopId),
    floorId:shop.floorId??null,
    name:shop.name??null,
    templateName:shop.templateName??'npcgen_shop',
    source:shop.source??null,
    offers
  };
}

function interactionGate(action,{interactionRule='NPC_Util_charIsInFrontOfChar distance=1',maxDistance=null}={}){
  const gate=canInteractWithNpc(action.npc,action.player,{interactionRule,maxDistance});
  if(!gate.ok)return {ok:false,stage:'interaction-gate',reason:gate.reason};
  if(!gate.interactable)return {ok:false,stage:'interaction-gate',reason:gate.reason,gate};
  return {ok:true,gate};
}

function createBrowserItemShopRuntime({
  catalog,
  itemMakeCatalog,
  itemCapacity=28000,
  cursor=1,
  randInclusive,
  initHandlers={}
}={}){
  const dependencyCheck=validateBrowserItemShopDependencies({catalog,itemMakeCatalog});
  if(!dependencyCheck.ok)return {ok:false,format:BROWSER_ITEMSHOP_RUNTIME_FORMAT,reason:'dependency-validation-failed',errors:dependencyCheck.errors};
  const allocator=createSourceItemAllocator({
    catalog:itemMakeCatalog,
    itemCapacity,
    cursor,
    ...(typeof randInclusive==='function'?{randInclusive}:{})
  });
  const dispatch=(state,action={},options={})=>{
    if(!isObject(action))return {ok:false,handled:false,stage:'action',reason:'invalid-browser-itemshop-action',state};
    const type=String(action.type??'').trim();
    if(![ACTION_NPC_ITEMSHOP_OPEN,ACTION_NPC_ITEMSHOP_BUY,ACTION_NPC_ITEMSHOP_SELL].includes(type)){
      return {ok:false,handled:false,stage:'action',reason:'unsupported-browser-itemshop-action',type,state};
    }
    const gate=interactionGate(action,options);
    if(!gate.ok)return {...gate,handled:false,state};
    const shopId=String(action.shopId??'').trim();
    if(!shopId)return {ok:false,handled:false,stage:'shop-resolution',reason:'shop-id-required',state};
    if(type===ACTION_NPC_ITEMSHOP_OPEN){
      const shop=resolveBrowserItemShopOffers(catalog,itemMakeCatalog,shopId);
      if(!shop.ok)return {ok:false,handled:false,stage:'shop-resolution',reason:shop.reason,state};
      return {ok:true,handled:true,stage:'shop-open',shop,state,gate:gate.gate};
    }
    if(type===ACTION_NPC_ITEMSHOP_BUY){
      const itemId=intOr(action.itemId,-1);
      const quantity=Math.max(1,intOr(action.quantity,1));
      if(itemId<0)return {ok:false,handled:false,stage:'buy',reason:'item-id-required',state};
      const result=buyNpcItemShopItem(state,{
        catalog,
        itemMakeCatalog,
        shopId,
        itemId,
        quantity,
        transactionId:action.transactionId,
        options:{allocateItem:allocator.allocate}
      });
      return {
        ok:result.applied===true,
        handled:result.applied===true,
        stage:'buy',
        reason:result.applied?null:result.reason,
        result,
        state:result.state??state,
        gate:gate.gate
      };
    }
    const snapshot=getItemRuntimeSnapshot(state,action.slot);
    if(!snapshot.ok)return {ok:false,handled:false,stage:'sell',reason:snapshot.reason,state};
    const policy=resolveShopSellPolicy(catalog,{
      shopId,
      itemId:snapshot.itemId,
      itemType:snapshot.itemType
    });
    if(!policy.ok)return {ok:false,handled:false,stage:'sell-policy',reason:policy.reason,policy,state};
    const result=sellShopItem(state,{
      slot:snapshot.slot,
      quantity:Math.max(1,intOr(action.quantity,1)),
      baseCost:snapshot.baseCost,
      sellRate:policy.sellRate,
      transactionId:action.transactionId
    });
    return {
      ok:result.applied===true,
      handled:result.applied===true,
      stage:'sell',
      reason:result.applied?null:result.reason,
      policy,
      result,
      state:result.state??state,
      gate:gate.gate
    };
  };
  return {
    ok:true,
    format:BROWSER_ITEMSHOP_RUNTIME_FORMAT,
    getCursor:()=>allocator.cursor,
    dispatch,
    resolveOffers:(shopId)=>resolveBrowserItemShopOffers(catalog,itemMakeCatalog,shopId)
  };
}

export {
  BROWSER_ITEMSHOP_RUNTIME_FORMAT,
  ACTION_NPC_ITEMSHOP_OPEN,
  ACTION_NPC_ITEMSHOP_BUY,
  ACTION_NPC_ITEMSHOP_SELL,
  validateBrowserItemShopDependencies,
  catalogShopItemIds,
  getItemRuntimeSnapshot,
  resolveBrowserItemShopOffers,
  createBrowserItemShopRuntime
};
