const BROWSER_BATTLE_ITEM_COMMIT_RUNTIME_FORMAT='stoneage-v418-browser-battle-item-commit-v1';
const ACTION_BATTLE_ITEM_COMMIT='BATTLE_ITEM_COMMIT';
const TRANSACTION_BUCKET='battleItemTransactions';
const PLAYER_BACKPACK_START=9;
const PLAYER_ITEM_SLOT_COUNT=24;

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const intOr=(value,fallback=null)=>{
  if(value==null||String(value).trim()==='')return fallback;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):fallback;
};
const clone=value=>JSON.parse(JSON.stringify(value));

function commitBattleItems(state,plan,{transactionId=null,expectedRevision=null,now=()=>new Date().toISOString()}={}){
  if(!isObject(state)||!isObject(state.inventory)||!isObject(state.inventory.itemRuntime)||!isObject(state.inventory.itemRuntime.slots)||
     !Array.isArray(state.inventory.playerItemSlots)||state.inventory.playerItemSlots.length!==PLAYER_ITEM_SLOT_COUNT){
    return {ok:false,handled:false,stage:'battle-item-commit',reason:'canonical-item-state-required',state:clone(state)};
  }
  if(!isObject(plan)||plan.ok!==true||plan.stage!=='battle-item-plan-ready'||plan.format!=='stoneage-v417-browser-battle-item-plan-v1'){
    return {ok:false,handled:false,stage:'battle-item-commit',reason:'battle-item-plan-invalid',state:clone(state)};
  }
  const tx=String(transactionId??plan.transactionId??'').trim();
  if(!tx)return {ok:false,handled:false,stage:'battle-item-commit',reason:'transaction-id-required',state:clone(state)};
  const currentRevision=intOr(state.revision,0);
  const meta=isObject(state.runtimeMeta)?state.runtimeMeta:{};
  const bucket=isObject(meta[TRANSACTION_BUCKET])?meta[TRANSACTION_BUCKET]:{};
  if(bucket[tx])return {ok:true,handled:true,stage:'battle-item-commit-idempotent',format:BROWSER_BATTLE_ITEM_COMMIT_RUNTIME_FORMAT,action:ACTION_BATTLE_ITEM_COMMIT,transactionId:tx,idempotent:true,applied:false,state:clone(state)};
  if(expectedRevision!=null&&currentRevision!==intOr(expectedRevision,null)){
    return {ok:false,handled:false,stage:'battle-item-commit',reason:'revision-conflict',currentRevision,expectedRevision:intOr(expectedRevision,null),state:clone(state)};
  }

  const next=clone(state);
  const used=new Set(next.inventory.playerItemSlots.slice(PLAYER_BACKPACK_START).filter(v=>v!=null).map(v=>intOr(v,-1)));
  const occupiedSlots=new Set();
  const transferred=[];
  const discarded=[];

  for(const row of Array.isArray(plan.accepted)?plan.accepted:[]){
    const existingIndex=intOr(row?.existingIndex,-1);
    const playerSlot=intOr(row?.playerSlot,-1);
    const existing=next.inventory.itemRuntime.slots[String(existingIndex)];
    if(existingIndex<0||playerSlot<PLAYER_BACKPACK_START||playerSlot>=PLAYER_ITEM_SLOT_COUNT||
       used.has(existingIndex)||occupiedSlots.has(playerSlot)){
      return {ok:false,handled:false,stage:'battle-item-commit',reason:'accepted-item-snapshot-invalid',existingIndex,playerSlot,state:clone(state)};
    }
    if(!isObject(existing))return {ok:false,handled:false,stage:'battle-item-commit',reason:'existing-item-runtime-missing',existingIndex,state:clone(state)};
    if(!String(existing.owner??'').startsWith('enemy:'))return {ok:false,handled:false,stage:'battle-item-commit',reason:'existing-item-not-transferable',existingIndex,state:clone(state)};
    if(next.inventory.playerItemSlots[playerSlot]!=null)return {ok:false,handled:false,stage:'battle-item-commit',reason:'planned-player-slot-occupied',playerSlot,state:clone(state)};
    next.inventory.playerItemSlots[playerSlot]=existingIndex;
    existing.owner='player';
    const itemId=existing.itemId!=null?String(existing.itemId):null;
    if(itemId){
      next.inventory.piles=isObject(next.inventory.piles)?next.inventory.piles:{};
      next.inventory.piles[itemId]=Math.max(0,intOr(next.inventory.piles[itemId],0))+1;
    }
    used.add(existingIndex); occupiedSlots.add(playerSlot);
    transferred.push({getitemSlot:intOr(row?.getitemSlot,-1),existingIndex,playerSlot,itemId, count:Math.max(1,intOr(existing.pile,1))});
  }

  for(const row of Array.isArray(plan.discarded)?plan.discarded:[]){
    const existingIndex=intOr(row?.existingIndex,-1);
    const existing=next.inventory.itemRuntime.slots[String(existingIndex)];
    if(existingIndex<0||!isObject(existing))return {ok:false,handled:false,stage:'battle-item-commit',reason:'discard-item-runtime-missing',existingIndex,state:clone(state)};
    if(!String(existing.owner??'').startsWith('enemy:'))return {ok:false,handled:false,stage:'battle-item-commit',reason:'discard-item-not-transferable',existingIndex,state:clone(state)};
    delete next.inventory.itemRuntime.slots[String(existingIndex)];
    discarded.push({getitemSlot:intOr(row?.getitemSlot,-1),existingIndex,reason:String(row?.reason??'inventory-full')});
  }

  const timestamp=String(typeof now==='function'?now():now);
  next.runtimeMeta=isObject(next.runtimeMeta)?next.runtimeMeta:{};
  next.runtimeMeta[TRANSACTION_BUCKET]=isObject(next.runtimeMeta[TRANSACTION_BUCKET])?next.runtimeMeta[TRANSACTION_BUCKET]:{};
  next.runtimeMeta[TRANSACTION_BUCKET][tx]={
    committedAt:timestamp,
    transferred:clone(transferred),
    discarded:clone(discarded)
  };
  next.runtimeMeta.updatedAt=timestamp;
  next.revision=currentRevision+1;

  return {
    ok:true,handled:true,stage:'battle-item-commit-applied',
    format:BROWSER_BATTLE_ITEM_COMMIT_RUNTIME_FORMAT,action:ACTION_BATTLE_ITEM_COMMIT,
    transactionId:tx,idempotent:false,applied:true,
    revisionBefore:currentRevision,revisionAfter:next.revision,
    transferred,discarded,
    battleGetItemSlotsCleared:true,
    persistentMutation:true,
    battleContextMutation:false,uiMutation:false,dbMutation:false,
    rerollAtCommit:false,
    sourceSideEffects:[
      'CHAR_addItemSpecificItemIndex equivalent ownership transfer',
      'ITEM_endExistItemsOne equivalent release for discarded items',
      'battle entry getitem[i] = -1'
    ],
    state:next
  };
}

function createBrowserBattleItemCommitRuntime(){
  return {ok:true,format:BROWSER_BATTLE_ITEM_COMMIT_RUNTIME_FORMAT,commit:commitBattleItems};
}

export {
  BROWSER_BATTLE_ITEM_COMMIT_RUNTIME_FORMAT,
  ACTION_BATTLE_ITEM_COMMIT,
  TRANSACTION_BUCKET,
  commitBattleItems,
  createBrowserBattleItemCommitRuntime
};
