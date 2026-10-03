const BROWSER_BATTLE_RELIFE_COMMIT_RUNTIME_FORMAT='stoneage-v464-browser-battle-relife-commit-v1';
const ACTION_BATTLE_RELIFE_COMMIT='BATTLE_RELIFE_COMMIT';
const TRANSACTION_BUCKET='battleReLifeTransactions';
const PLAYER_ITEM_SLOT_COUNT=24;

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));
const intOr=(v,fallback=null)=>{
  if(v==null||String(v).trim()==='')return fallback;
  const n=Number(v);
  return Number.isFinite(n)?Math.trunc(n):fallback;
};

function commitBattleRelife(state,battleContext,{
  transactionId=null,
  expectedRevision=null,
  now=()=>new Date().toISOString()
}={}){
  if(!isObject(state)||!isObject(state.player)||!isObject(state.inventory)||!Array.isArray(state.inventory.playerItemSlots)||state.inventory.playerItemSlots.length!==PLAYER_ITEM_SLOT_COUNT||!isObject(state.inventory.itemRuntime)||!isObject(state.inventory.itemRuntime.slots)){
    return {ok:false,handled:false,stage:'battle-relife-commit',action:ACTION_BATTLE_RELIFE_COMMIT,reason:'canonical-player-state-required',state:clone(state)};
  }
  const context=battleContext?.context;
  if(!isObject(context))return {ok:false,handled:false,stage:'battle-relife-commit',action:ACTION_BATTLE_RELIFE_COMMIT,reason:'battle-context-required',state:clone(state)};
  const events=Array.isArray(context.sourceRelifeEvents)?context.sourceRelifeEvents.filter(isObject):[];
  if(events.length===0)return {ok:false,handled:false,stage:'battle-relife-commit',action:ACTION_BATTLE_RELIFE_COMMIT,reason:'relife-events-required',state:clone(state)};
  const tx=String(transactionId??'').trim();
  if(!tx)return {ok:false,handled:false,stage:'battle-relife-commit',action:ACTION_BATTLE_RELIFE_COMMIT,reason:'transaction-id-required',state:clone(state)};
  const currentRevision=intOr(state.revision,0);
  const bucket=isObject(state.runtimeMeta?.[TRANSACTION_BUCKET])?state.runtimeMeta[TRANSACTION_BUCKET]:{};
  if(bucket[tx])return {ok:true,handled:true,stage:'battle-relife-commit-idempotent',format:BROWSER_BATTLE_RELIFE_COMMIT_RUNTIME_FORMAT,action:ACTION_BATTLE_RELIFE_COMMIT,transactionId:tx,idempotent:true,applied:false,revision:currentRevision,state:clone(state)};
  if(expectedRevision!=null&&currentRevision!==intOr(expectedRevision,null))return {ok:false,handled:false,stage:'battle-relife-commit',action:ACTION_BATTLE_RELIFE_COMMIT,reason:'revision-conflict',currentRevision,expectedRevision:intOr(expectedRevision,null),state:clone(state)};

  const originalPlayerHp=intOr(state.player.hp,null);
  if(originalPlayerHp==null)return {ok:false,handled:false,stage:'battle-relife-commit',action:ACTION_BATTLE_RELIFE_COMMIT,reason:'persistent-player-hp-required',state:clone(state)};
  const next=clone(state);
  const committed=[];
  const usedSlots=new Set();
  for(const event of events){
    const slot=intOr(event.playerSlot,-1);
    const existingIndex=intOr(event.existingIndex,-1);
    const itemId=intOr(event.itemId,-1);
    if(slot<0||slot>4||existingIndex<0||itemId<0)return {ok:false,handled:false,stage:'battle-relife-commit',action:ACTION_BATTLE_RELIFE_COMMIT,reason:'relife-event-invalid',event,state:clone(state)};
    if(usedSlots.has(slot))return {ok:false,handled:false,stage:'battle-relife-commit',action:ACTION_BATTLE_RELIFE_COMMIT,reason:'duplicate-relife-slot-in-transaction',slot,state:clone(state)};
    usedSlots.add(slot);
    if(intOr(state.inventory.playerItemSlots[slot],-1)!==existingIndex)return {ok:false,handled:false,stage:'battle-relife-commit',action:ACTION_BATTLE_RELIFE_COMMIT,reason:'relife-slot-stale-plan',slot,existingIndex,state:clone(state)};
    const item=state.inventory.itemRuntime.slots[String(existingIndex)];
    if(!isObject(item)||String(item.owner??'')!=='player'||intOr(item.itemId,-1)!==itemId)return {ok:false,handled:false,stage:'battle-relife-commit',action:ACTION_BATTLE_RELIFE_COMMIT,reason:'relife-existing-item-stale-plan',slot,existingIndex,itemId,state:clone(state)};
    const pile=Math.max(1,intOr(item.pile,1));
    if(pile!==1)return {ok:false,handled:false,stage:'battle-relife-commit',action:ACTION_BATTLE_RELIFE_COMMIT,reason:'relife-item-pile-invalid',slot,existingIndex,pile,state:clone(state)};
    const hpBefore=intOr(event.hpBefore,null);
    const hpAfter=intOr(event.hpAfter,null);
    if(hpBefore==null||hpAfter==null||hpAfter<1)return {ok:false,handled:false,stage:'battle-relife-commit',action:ACTION_BATTLE_RELIFE_COMMIT,reason:'relife-hp-event-invalid',event,state:clone(state)};
    delete next.inventory.itemRuntime.slots[String(existingIndex)];
    next.inventory.playerItemSlots[slot]=null;
    next.inventory.piles=isObject(next.inventory.piles)?next.inventory.piles:{};
    const currentPile=Math.max(0,intOr(next.inventory.piles[String(itemId)],0));
    const afterPile=Math.max(0,currentPile-1);
    if(afterPile===0)delete next.inventory.piles[String(itemId)];
    else next.inventory.piles[String(itemId)]=afterPile;
    next.player.hp=Math.min(hpAfter,intOr(next.player.maxHp,hpAfter));
    committed.push({kind:event.kind,playerSlot:slot,existingIndex,itemId,hpBefore,hpAfter:next.player.hp});
  }

  const timestamp=String(typeof now==='function'?now():now);
  next.runtimeMeta=isObject(next.runtimeMeta)?next.runtimeMeta:{};
  next.runtimeMeta[TRANSACTION_BUCKET]=isObject(next.runtimeMeta[TRANSACTION_BUCKET])?next.runtimeMeta[TRANSACTION_BUCKET]:{};
  next.runtimeMeta[TRANSACTION_BUCKET][tx]={
    committedAt:timestamp,transactionId:tx,
    events:clone(committed),sourceEventCount:events.length,
    revisionBefore:currentRevision,revisionAfter:currentRevision+1
  };
  next.runtimeMeta.updatedAt=timestamp;
  next.revision=currentRevision+1;
  return {
    ok:true,handled:true,stage:'battle-relife-commit-applied',
    format:BROWSER_BATTLE_RELIFE_COMMIT_RUNTIME_FORMAT,action:ACTION_BATTLE_RELIFE_COMMIT,
    transactionId:tx,idempotent:false,applied:true,
    revisionBefore:currentRevision,revisionAfter:next.revision,events:committed,
    persistentMutation:true,battleContextMutation:false,rngPreserved:true,state:next
  };
}

function createBrowserBattleRelifeCommitRuntime(){return {ok:true,format:BROWSER_BATTLE_RELIFE_COMMIT_RUNTIME_FORMAT,commit:commitBattleRelife};}
export {BROWSER_BATTLE_RELIFE_COMMIT_RUNTIME_FORMAT,ACTION_BATTLE_RELIFE_COMMIT,TRANSACTION_BUCKET,commitBattleRelife,createBrowserBattleRelifeCommitRuntime};
