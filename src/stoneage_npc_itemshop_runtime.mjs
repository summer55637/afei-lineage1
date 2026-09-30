import { resolveSourceItemTemplate } from './stoneage_item_source_runtime.mjs';
import { buyShopItem } from './stoneage_item_economy_runtime.mjs';

const NPC_ITEMSHOP_RUNTIME_FORMAT='stoneage-npc-itemshop-runtime-v1';
const TYPE_ALIASES={
  FIST:[[0,0]], AXE:[[1,1]], CLUB:[[2,2]], SPEAR:[[3,3]], BOW:[[4,4]],
  SHIELD:[[5,5]], HELM:[[6,6]], ARMOUR:[[7,7]], BRACELET:[[8,8]], ANCLET:[[9,9]],
  NECKLACE:[[10,10]], RING:[[11,11]], BELT:[[12,12]], EARRING:[[13,13]],
  NOSERING:[[14,14]], AMULET:[[15,15]], OTHER:[[16,16]], BOOMERANG:[[17,17]],
  BOUNDTHROW:[[18,18]], BREAKTHROW:[[19,19]],
  DISH:[[20,20]], METAL:[[21,21]], JEWEL:[[22,22]], WARES:[[23,23]],
  WBELT:[[24,24]], WSHIELD:[[25,25]], WSHOES:[[26,26]], WGLOVE:[[27,27]],
  ANGELTOKEN:[[28,28]], HEROTOKEN:[[29,29]],
  ACCESSORY:[[8,15]], OFFENCE:[[0,4],[17,19]], DEFENCE:[[5,7]]
};

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const intOr=(v,f=0)=>Number.isFinite(Number(v))?Math.trunc(Number(v)):f;
const finite=v=>(v===null||v===undefined||String(v).trim()==='')?null:(Number.isFinite(Number(v))?Number(v):null);

function validateNpcItemShopCatalog(catalog){
  const errors=[];
  if(!isObject(catalog))return {ok:false,errors:['catalog must be an object']};
  if(catalog.format!==NPC_ITEMSHOP_RUNTIME_FORMAT)errors.push('catalog format drift');
  if(!isObject(catalog.shops))errors.push('catalog shops must be an object');
  if(!isObject(catalog.itemIndex))errors.push('catalog itemIndex must be an object');
  return {ok:errors.length===0,errors};
}

function getShop(catalog,shopId){
  const v=validateNpcItemShopCatalog(catalog);
  if(!v.ok)return {ok:false,reason:'invalid-catalog',errors:v.errors};
  const shop=catalog.shops[String(shopId)];
  if(!isObject(shop))return {ok:false,reason:'shop-missing',shopId:String(shopId)};
  return {ok:true,shop};
}

function parseConstraintToken(raw){
  const token=String(raw??'').trim();
  if(!token)return null;
  if(!token.includes('-')){
    const id=intOr(token,-1);
    return id>=0?{raw:token,kind:'item',itemId:id}:null;
  }
  const p=token.split('-');
  if(p.length!==2)return null;
  const start=intOr(p[0],-1),end=intOr(p[1],-1);
  if(start<0||end<0)return null;
  return {raw:token,kind:'range',start,end,inclusive:true};
}

function expandConstraintToken(entry,{sourceBuyRangeBug=false}={}){
  if(!entry)return [];
  if(entry.kind==='item')return [entry.itemId];
  let start=entry.start,end=entry.end;
  if(sourceBuyRangeBug){
    end++;
    if(start>end){const t=start;start=end;end=t;}
    const out=[];for(let x=start;x<end;x++)out.push(x);return out;
  }
  if(start>end){const t=start;start=end;end=t;}
  const out=[];for(let x=start;x<=end;x++)out.push(x);return out;
}

function shopBuyItemIds(shop){
  if(shop?.sellOnly===true)return [];
  if(Array.isArray(shop.itemIds))return shop.itemIds.slice();
  if(Array.isArray(shop.itemEntries)){
    const out=[];
    for(const entry of shop.itemEntries)out.push(...expandConstraintToken(entry,{sourceBuyRangeBug:true}));
    return [...new Set(out)];
  }
  return [];
}

function itemTypeMatches(itemType,limitToken){
  const ranges=TYPE_ALIASES[String(limitToken??'').toUpperCase()];
  if(!ranges)return false;
  const t=intOr(itemType,-1);
  return ranges.some(([a,b])=>a<=t&&t<=b);
}

function constraintMatches(itemId,entries,{sourceBuyRangeBug=false}={}){
  const id=intOr(itemId,-1);
  if(id<0)return false;
  for(const entry of entries||[]){
    if(expandConstraintToken(entry,{sourceBuyRangeBug}).includes(id))return true;
  }
  return false;
}

function resolveNpcItemShop(catalog,shopId){
  return getShop(catalog,shopId);
}

function buildItemShopFloorIndex(catalog){
  const v=validateNpcItemShopCatalog(catalog);
  if(!v.ok)return {ok:false,reason:'invalid-catalog',errors:v.errors};
  if(isObject(catalog.floorIndex))return {ok:true,floorIndex:catalog.floorIndex};
  const floorIndex={};
  for(const shop of Object.values(catalog.shops)){
    if(shop.floorId==null)continue;
    (floorIndex[String(shop.floorId)]??=[]).push(shop.shopId);
  }
  for(const rows of Object.values(floorIndex))rows.sort();
  return {ok:true,floorIndex};
}

function resolveItemShopsAtFloor(catalog,floorId){
  const index=buildItemShopFloorIndex(catalog);
  if(!index.ok)return index;
  const key=String(intOr(floorId,-1));
  if(key==='-1')return {ok:false,reason:'invalid-floor-id'};
  const shopIds=index.floorIndex[key]??[];
  return {ok:true,floorId:intOr(floorId,-1),shopIds,shops:shopIds.map(id=>catalog.shops[id]).filter(Boolean)};
}

function resolveShopBuyOffer(catalog,{shopId,itemId}={}){
  const got=getShop(catalog,shopId);
  if(!got.ok)return got;
  const id=intOr(itemId,-1);
  if(id<0)return {ok:false,reason:'invalid-item-id',shopId:String(shopId)};
  const items=shopBuyItemIds(got.shop);
  const offerIndex=items.indexOf(id);
  if(offerIndex<0)return {ok:false,reason:'item-not-offered',shopId:String(shopId),itemId:id};
  const rate=finite(got.shop.buyRate);
  if(rate==null||rate<0)return {ok:false,reason:'invalid-buy-rate',shopId:String(shopId),itemId:id};
  return {
    ok:true,
    shopId:String(shopId),
    itemId:id,
    offerIndex,
    baseItemListPosition:offerIndex+1,
    buyRate:rate,
    source:got.shop.source
  };
}

function resolveShopSellPolicy(catalog,{shopId,itemId,itemType}={}){
  const got=getShop(catalog,shopId);
  if(!got.ok)return got;
  const id=intOr(itemId,-1);
  if(id<0)return {ok:false,reason:'invalid-item-id',shopId:String(shopId)};
  const typeRules=Array.isArray(got.shop.limitItemType)?got.shop.limitItemType.filter(Boolean):[];
  const numberRules=Array.isArray(got.shop.limitItemNo)?got.shop.limitItemNo.filter(Boolean):[];
  let allowed=false;
  let matchedBy=null;
  if(typeRules.length){
    if(itemType==null)return {ok:false,reason:'item-type-required',shopId:String(shopId),itemId:id};
    for(const token of typeRules){
      if(itemTypeMatches(itemType,token)){allowed=true;matchedBy={kind:'type',token};break;}
    }
  }
  if(!allowed&&numberRules.length){
    if(constraintMatches(id,numberRules)){allowed=true;matchedBy={kind:'number',token:numberRules.find(x=>expandConstraintToken(x).includes(id))?.raw??null};}
  }
  if(!allowed&&!typeRules.length&&!numberRules.length)allowed=true;
  if(!allowed)return {ok:false,reason:'item-not-sellable-to-shop',shopId:String(shopId),itemId:id};
  let sellRate=finite(got.shop.sellRate);
  let special=false,specialToken=null;
  if(Array.isArray(got.shop.specialItemEntries)&&got.shop.specialItemEntries.length&&constraintMatches(id,got.shop.specialItemEntries)){
    const sr=finite(got.shop.specialRate);
    sellRate=sr!=null?sr:1.2;
    special=true;
    specialToken=got.shop.specialItemEntries.find(x=>expandConstraintToken(x).includes(id))?.raw??null;
  }
  if(sellRate==null||sellRate<0)return {ok:false,reason:'invalid-sell-rate',shopId:String(shopId),itemId:id};
  return {ok:true,shopId:String(shopId),itemId:id,itemType:intOr(itemType,-1),sellRate,special,specialToken,matchedBy,source:got.shop.source};
}

function resolveItemBaseCost(itemMakeCatalog,itemId){
  const resolved=resolveSourceItemTemplate(itemMakeCatalog,itemId);
  if(!resolved.ok)return {ok:false,reason:resolved.reason,itemId,errors:resolved.errors,message:resolved.message};
  const cost=intOr(resolved.baseData?.[2],-1);
  if(cost<0)return {ok:false,reason:'item-cost-missing',itemId};
  return {ok:true,itemId,baseCost:cost,sourceTemplate:resolved};
}

function resolveNpcShopBuyRequest({catalog,itemMakeCatalog,shopId,itemId,quantity=1}={}){
  const offer=resolveShopBuyOffer(catalog,{shopId,itemId});
  if(!offer.ok)return offer;
  const cost=resolveItemBaseCost(itemMakeCatalog,offer.itemId);
  if(!cost.ok)return {...cost,shopId:offer.shopId};
  const unitPrice=Math.trunc(cost.baseCost*offer.buyRate);
  if(unitPrice<0)return {ok:false,reason:'negative-source-buy-price',shopId:offer.shopId,itemId:offer.itemId,baseCost:cost.baseCost,buyRate:offer.buyRate};
  return {ok:true,transaction:{itemId:offer.itemId,baseCost:cost.baseCost,buyRate:offer.buyRate,quantity:Math.max(1,intOr(quantity,1))},offer};
}

function buyNpcItemShopItem(state,{catalog,itemMakeCatalog,shopId,itemId,quantity=1,transactionId,options={}}={}){
  const resolved=resolveNpcShopBuyRequest({catalog,itemMakeCatalog,shopId,itemId,quantity});
  if(!resolved.ok)return {applied:false,reason:resolved.reason,source:resolved};
  const result=buyShopItem(state,{transactionId,...resolved.transaction},options);
  return {...result,sourceShop:resolved.offer};
}

function buildItemShopAcquisitionIndex(catalog){
  const v=validateNpcItemShopCatalog(catalog);
  if(!v.ok)return {ok:false,reason:'invalid-catalog',errors:v.errors};
  const index={};
  for(const shop of Object.values(catalog.shops)){
    const itemIds=shopBuyItemIds(shop);
    itemIds.forEach((itemId,offerIndex)=>{
      (index[String(itemId)]??=[]).push({shopId:shop.shopId,offerIndex,buyRate:shop.buyRate,source:shop.source});
    });
  }
  for(const entries of Object.values(index))entries.sort((a,b)=>String(a.shopId).localeCompare(String(b.shopId))||a.offerIndex-b.offerIndex);
  return {ok:true,itemIndex:index};
}

export {
  NPC_ITEMSHOP_RUNTIME_FORMAT,
  TYPE_ALIASES,
  validateNpcItemShopCatalog,
  resolveNpcItemShop,
  resolveShopBuyOffer,
  resolveShopSellPolicy,
  resolveItemBaseCost,
  resolveNpcShopBuyRequest,
  buyNpcItemShopItem,
  buildItemShopAcquisitionIndex,
  buildItemShopFloorIndex,
  resolveItemShopsAtFloor,
  parseConstraintToken,
  expandConstraintToken,
  itemTypeMatches,
  constraintMatches
};
