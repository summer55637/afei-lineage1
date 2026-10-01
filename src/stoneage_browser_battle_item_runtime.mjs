import { MAX_CARRIED_ITEMS, PLAYER_BACKPACK_START, PLAYER_ITEM_SLOT_COUNT } from './stoneage_reward_transaction.mjs';

const BROWSER_BATTLE_ITEM_PLAN_RUNTIME_FORMAT='stoneage-v417-browser-battle-item-plan-v1';
const ACTION_BATTLE_ITEM_PLAN='BATTLE_ITEM_PLAN';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const intOr=(value,fallback=null)=>{
  if(value==null||String(value).trim()==='')return fallback;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):fallback;
};
const clone=value=>JSON.parse(JSON.stringify(value));

function getPlayerEntry(battleContext){
  const side=battleContext?.context?.sides?.find(row=>Number(row?.side)===0);
  if(!side||Number(side?.type)!==0||!Array.isArray(side.entries))return null;
  const entry=side.entries.find(row=>Number(row?.bid)===0)??side.entries[0]??null;
  if(!entry||String(entry?.sourceType??'').trim().toLowerCase()!=='player')return null;
  return entry;
}

function emptyBackpackSlots(state){
  const slots=state?.inventory?.playerItemSlots;
  if(!Array.isArray(slots)||slots.length!==PLAYER_ITEM_SLOT_COUNT)return null;
  return slots.map((value,index)=>index>=PLAYER_BACKPACK_START&&value==null?index:-1).filter(index=>index>=0);
}

function planBattleItems(battleContext,state,{getitem=null}={}){
  if(!isObject(battleContext))return {ok:false,handled:false,stage:'battle-item-plan',reason:'battle-context-required'};
  if(!isObject(state)||!isObject(state.inventory)||!isObject(state.inventory.itemRuntime)||!isObject(state.inventory.itemRuntime.slots)){
    return {ok:false,handled:false,stage:'battle-item-plan',reason:'canonical-item-state-required'};
  }
  const player=getPlayerEntry(battleContext);
  if(!player)return {ok:false,handled:false,stage:'battle-item-plan',reason:'player-battle-entry-required'};
  if(player.isDie===true)return {ok:false,handled:false,stage:'battle-item-plan',reason:'player-dead-no-battle-items'};
  const playerId=String(state.player?.id??'').trim();
  const battlePlayerId=String(player.characterId??'').trim();
  if(playerId&&battlePlayerId&&playerId!==battlePlayerId){
    return {ok:false,handled:false,stage:'battle-item-plan',reason:'battle-player-identity-mismatch',persistentPlayerId:playerId,battleCharacterId:battlePlayerId};
  }

  const sourceList=Array.isArray(getitem)?getitem:Array.isArray(player.getitem)?player.getitem:[];
  const slots=emptyBackpackSlots(state);
  if(!slots)return {ok:false,handled:false,stage:'battle-item-plan',reason:'player-item-slots-invalid'};
  if(sourceList.length>MAX_CARRIED_ITEMS)return {ok:false,handled:false,stage:'battle-item-plan',reason:'getitem-exceeds-source-max-3'};

  const seen=new Set();
  const accepted=[];
  const discarded=[];
  const ignored=[];
  let slotCursor=0;

  for(let i=0;i<MAX_CARRIED_ITEMS;i++){
    const raw=sourceList[i]??-1;
    const existingIndex=intOr(raw,-1);
    if(existingIndex<0){
      ignored.push({getitemSlot:i,existingIndex});
      continue;
    }
    if(seen.has(existingIndex)){
      return {ok:false,handled:false,stage:'battle-item-plan',reason:'duplicate-getitem-existing-index',existingIndex};
    }
    seen.add(existingIndex);
    const item=state.inventory.itemRuntime.slots[String(existingIndex)];
    if(!isObject(item)){
      return {ok:false,handled:false,stage:'battle-item-plan',reason:'existing-item-runtime-missing',getitemSlot:i,existingIndex};
    }
    const owner=String(item.owner??'');
    if(!owner.startsWith('enemy:')){
      return {ok:false,handled:false,stage:'battle-item-plan',reason:'existing-item-not-transferable',getitemSlot:i,existingIndex,owner};
    }
    if(slotCursor>=slots.length){
      discarded.push({getitemSlot:i,existingIndex,reason:'inventory-full'});
      continue;
    }
    accepted.push({
      getitemSlot:i,
      existingIndex,
      playerSlot:slots[slotCursor],
      itemId:intOr(item.itemId,null),
      count:Math.max(1,intOr(item.pile,1))
    });
    slotCursor++;
  }

  return {
    ok:true,
    handled:true,
    stage:'battle-item-plan-ready',
    format:BROWSER_BATTLE_ITEM_PLAN_RUNTIME_FORMAT,
    action:ACTION_BATTLE_ITEM_PLAN,
    source:{
      fixedCRef:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      function:'BATTLE_GetExpGold',
      maxCarriedItems:MAX_CARRIED_ITEMS,
      backpackStart:PLAYER_BACKPACK_START,
      backpackEnd:PLAYER_ITEM_SLOT_COUNT-1
    },
    accepted,
    discarded,
    ignored,
    rerollAtCommit:false,
    ownershipTransfer:'enemy:* -> player',
    persistentStateMutation:false,
    battleContextMutation:false,
    uiMutation:false,
    dbMutation:false,
    nextBoundary:'BATTLE_ITEM_COMMIT'
  };
}

function createBrowserBattleItemPlanRuntime(){
  return {ok:true,format:BROWSER_BATTLE_ITEM_PLAN_RUNTIME_FORMAT,plan:planBattleItems};
}

export {
  BROWSER_BATTLE_ITEM_PLAN_RUNTIME_FORMAT,
  ACTION_BATTLE_ITEM_PLAN,
  planBattleItems,
  createBrowserBattleItemPlanRuntime
};
