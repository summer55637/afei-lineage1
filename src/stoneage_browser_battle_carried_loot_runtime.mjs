const BROWSER_BATTLE_CARRIED_LOOT_RUNTIME_FORMAT='stoneage-v455-browser-battle-carried-loot-v1';
const ACTION_BATTLE_CARRIED_LOOT_QUEUE='BATTLE_CARRIED_LOOT_QUEUE';
const MAX_GETITEM=3;
const SIDE_OFFSET=10;

const clone=value=>JSON.parse(JSON.stringify(value));
const int=value=>{if(value==null||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)&&Number.isInteger(n)?n:null;};

function findEntry(context,bid){
  const b=int(bid);if(b==null||b<0||b>19)return null;
  const side=b>=SIDE_OFFSET?1:0,slot=b>=SIDE_OFFSET?b-SIDE_OFFSET:b;
  const s=context?.context?.sides?.find(x=>Number(x?.side)===side);
  return Array.isArray(s?.entries)?s.entries[slot]??null:null;
}

function resolveLootOwnerBid(context,bid){
  const b=int(bid);
  if(b==null||b<0||b>=SIDE_OFFSET)return null;
  if(b<5)return b;
  return b-5;
}

function normalizeItemInputs(items){
  const out=[];const seen=new Set();
  for(const raw of Array.isArray(items)?items:[]){
    const idx=int(typeof raw==='object'?raw?.existingIndex:raw);
    if(idx==null||idx<0)continue;
    if(seen.has(idx))continue;
    seen.add(idx);
    out.push({existingIndex:idx,itemId:int(typeof raw==='object'?raw?.itemId:null),count:Math.max(1,int(typeof raw==='object'?raw?.count:1)??1)});
  }
  return out;
}

function requireRoll(value,min,max,reason,meta={}){
  const roll=int(value);
  if(roll==null||roll<min||roll>max)return {ok:false,stage:'battle-carried-loot',action:ACTION_BATTLE_CARRIED_LOOT_QUEUE,reason,minimum:min,maximum:max,roll,...meta};
  return {ok:true,roll};
}

function queueEnemyCarriedLoot(context,{enemyBid=null,ownerBids=[],items=[],ownerRolls=[],replaceRolls=[],replaceSlotRolls=[],transactionPrefix='carried-loot',now=null}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-carried-loot',action:ACTION_BATTLE_CARRIED_LOOT_QUEUE,reason:'battle-context-required'};
  const eBid=int(enemyBid);
  const enemy=findEntry(context,eBid);
  if(enemy==null||eBid<10)return {ok:false,handled:false,stage:'battle-carried-loot',action:ACTION_BATTLE_CARRIED_LOOT_QUEUE,reason:'enemy-bid-required'};
  if(enemy.sourceCarriedLootProcessed===true)return {ok:true,handled:true,stage:'battle-carried-loot-idempotent',format:BROWSER_BATTLE_CARRIED_LOOT_RUNTIME_FORMAT,action:ACTION_BATTLE_CARRIED_LOOT_QUEUE,enemyBid:eBid,idempotent:true,newTransfers:[],discarded:[],rngConsumed:0,context:clone(context.context),persistentMutation:false};

  const owners=(Array.isArray(ownerBids)?ownerBids:[]).map(int).filter(x=>x!=null&&x>=0&&x<10);
  if(owners.length===0)return {ok:true,handled:true,stage:'battle-carried-loot-no-player-credit',format:BROWSER_BATTLE_CARRIED_LOOT_RUNTIME_FORMAT,action:ACTION_BATTLE_CARRIED_LOOT_QUEUE,enemyBid:eBid,idempotent:false,newTransfers:[],discarded:[],rngConsumed:0,context:clone(context.context),persistentMutation:false};
  const normalized=normalizeItemInputs(items);
  const next=clone(context);
  const enemyNext=findEntry(next,eBid);
  const events=Array.isArray(next.context.sourceCarriedLootEvents)?next.context.sourceCarriedLootEvents.slice():[];
  const ownerSlots=owners.map((bid,index)=>({bid,slot:resolveLootOwnerBid(next,bid),index})).filter(x=>x.slot!=null);
  if(ownerSlots.length===0)return {ok:false,handled:false,stage:'battle-carried-loot',action:ACTION_BATTLE_CARRIED_LOOT_QUEUE,reason:'loot-owner-entry-missing',enemyBid:eBid};
  const playerOwner=ownerSlots[0].slot;
  const ownerEntry=findEntry(next,playerOwner);
  if(!ownerEntry)return {ok:false,handled:false,stage:'battle-carried-loot',action:ACTION_BATTLE_CARRIED_LOOT_QUEUE,reason:'loot-owner-entry-missing',enemyBid:eBid,ownerBid:ownerSlots[0].bid};
  const current=Array.isArray(ownerEntry.getitem)?ownerEntry.getitem.slice(0,MAX_GETITEM):[];
  while(current.length<MAX_GETITEM)current.push(-1);
  const accepted=[],discarded=[],ownerSelections=[];
  let rngConsumed=0,ownerCursor=0,replaceCursor=0,slotCursor=0;
  const allnum=owners.length;

  for(const item of normalized){
    const ownerRoll=requireRoll(ownerRolls[ownerCursor++],0,allnum-1,'carried-loot-owner-rng-required-or-out-of-range',{enemyBid:eBid,existingIndex:item.existingIndex});
    if(!ownerRoll.ok)return ownerRoll;
    rngConsumed+=1;
    const chosenOwner=owners[ownerRoll.roll];
    const chosenSlot=resolveLootOwnerBid(next,chosenOwner);
    const chosenEntry=chosenSlot==null?null:findEntry(next,chosenSlot);
    if(!chosenEntry)return {ok:false,handled:false,stage:'battle-carried-loot',action:ACTION_BATTLE_CARRIED_LOOT_QUEUE,reason:'selected-loot-owner-entry-missing',enemyBid:eBid,ownerBid:chosenOwner};
    if(!Array.isArray(chosenEntry.getitem)){chosenEntry.getitem=[-1,-1,-1];}
    const pool=chosenEntry.getitem;
    let empty=pool.findIndex(x=>int(x)===-1||x==null);
    if(empty>=0){
      pool[empty]=item.existingIndex;
      accepted.push({existingIndex:item.existingIndex,itemId:item.itemId,count:item.count,ownerBid:chosenOwner,ownerEntryBid:chosenSlot,getitemSlot:empty,reason:'empty-slot'});
      ownerSelections.push({existingIndex:item.existingIndex,ownerBid:chosenOwner,ownerEntryBid:chosenSlot,ownerRoll:ownerRoll.roll,getitemSlot:empty});
      continue;
    }
    const replaceRoll=requireRoll(replaceRolls[replaceCursor++],0,1,'carried-loot-full-pool-replace-rng-required-or-out-of-range',{enemyBid:eBid,existingIndex:item.existingIndex});
    if(!replaceRoll.ok)return replaceRoll;
    rngConsumed+=1;
    if(replaceRoll.roll!==1){
      discarded.push({existingIndex:item.existingIndex,itemId:item.itemId,count:item.count,reason:'full-pool-rejected',ownerBid:chosenOwner,ownerEntryBid:chosenSlot});
      continue;
    }
    const slotRoll=requireRoll(replaceSlotRolls[slotCursor++],0,2,'carried-loot-replacement-slot-rng-required-or-out-of-range',{enemyBid:eBid,existingIndex:item.existingIndex});
    if(!slotRoll.ok)return slotRoll;
    rngConsumed+=1;
    const olditem=int(pool[slotRoll.roll]);
    pool[slotRoll.roll]=item.existingIndex;
    accepted.push({existingIndex:item.existingIndex,itemId:item.itemId,count:item.count,ownerBid:chosenOwner,ownerEntryBid:chosenSlot,getitemSlot:slotRoll.roll,reason:'full-pool-replaced',replacedExistingIndex:olditem});
    if(olditem!=null&&olditem>=0)discarded.push({existingIndex:olditem,reason:'replaced-existing-item',ownerBid:chosenOwner,ownerEntryBid:chosenSlot,getitemSlot:slotRoll.roll});
  }

  enemyNext.sourceCarriedLootProcessed=true;
  enemyNext.sourceCarriedLootQueuedItems=normalized.map(x=>x.existingIndex);
  enemyNext.sourceCarriedLootOwnerBids=owners.slice();
  for(const x of accepted)events.push({enemyBid:eBid,existingIndex:x.existingIndex,ownerBid:x.ownerBid,ownerEntryBid:x.ownerEntryBid,getitemSlot:x.getitemSlot,reason:x.reason,replacedExistingIndex:x.replacedExistingIndex??null});
  next.context.sourceCarriedLootEvents=events;
  return {
    ok:true,handled:true,stage:'battle-carried-loot-queued',format:BROWSER_BATTLE_CARRIED_LOOT_RUNTIME_FORMAT,action:ACTION_BATTLE_CARRIED_LOOT_QUEUE,
    enemyBid:eBid,ownerBids:owners.slice(),items:normalized.map(x=>clone(x)),accepted,discarded,newTransfers:accepted,
    rngConsumed,ownerRollsConsumed:ownerCursor,replaceRollsConsumed:replaceCursor,replaceSlotRollsConsumed:slotCursor,
    allnum,maximumGetitem:MAX_GETITEM,
    source:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',function:'BATTLE_AddExpItem',boundary:'CHAR_setItemIndex -> RAND owner -> getitem[3] -> optional replacement'},
    rewardNumbersDeferred:true,dropTableRollDeferred:true,persistentMutation:false,context:next.context,transactionPrefix:String(transactionPrefix??'carried-loot'),now:now??null
  };
}

function createBrowserBattleCarriedLootRuntime(){return {ok:true,format:BROWSER_BATTLE_CARRIED_LOOT_RUNTIME_FORMAT,queue:(context,options={})=>queueEnemyCarriedLoot(context,options)};}

export {BROWSER_BATTLE_CARRIED_LOOT_RUNTIME_FORMAT,ACTION_BATTLE_CARRIED_LOOT_QUEUE,queueEnemyCarriedLoot,createBrowserBattleCarriedLootRuntime};