const BROWSER_BATTLE_RELIFE_RUNTIME_FORMAT='stoneage-v464-browser-battle-relife-v1';
const ACTION_BATTLE_RELIFE_APPLY='BATTLE_RELIFE_APPLY';
const BATTLE_MODE_BATTLE=2;
const BATTLE_MODE_FINISH=3;
const PLAYER_ITEM_SLOT_COUNT=24;
const RELIFE_SCAN_SLOTS=Object.freeze([0,1,2,3,4]);

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));
const intOr=(v,fallback=null)=>{
  if(v==null||String(v).trim()==='')return fallback;
  const n=Number(v);
  return Number.isFinite(n)?Math.trunc(n):fallback;
};
const cAtoi=value=>{
  const match=String(value??'').match(/^\s*([+-]?\d+)/);
  return match?Math.trunc(Number(match[1])):0;
};

function validateRelifeCatalog(catalog){
  if(!isObject(catalog))return {ok:false,reason:'player-relife-catalog-required'};
  if(catalog.format!=='stoneage-item-relife-runtime-v1')return {ok:false,reason:'player-relife-catalog-format-mismatch'};
  if(catalog?.source?.repository!=='gavinlinasd/StoneAge')return {ok:false,reason:'player-relife-catalog-source-mismatch'};
  if(catalog?.source?.ref!=='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56')return {ok:false,reason:'player-relife-catalog-fixed-c-ref-mismatch'};
  if(catalog?.fixedBuild?.itemReLifeAct!==true||catalog?.fixedBuild?.dummyDie!==false)return {ok:false,reason:'player-relife-fixed-build-flags-mismatch'};
  if(!isObject(catalog.byItemId))return {ok:false,reason:'player-relife-catalog-items-required'};
  return {ok:true};
}

function collectPlayerRelifeCandidates(state,catalog){
  const check=validateRelifeCatalog(catalog);
  if(!check.ok)return check;
  const slots=state?.inventory?.playerItemSlots;
  const runtimes=state?.inventory?.itemRuntime?.slots;
  if(!Array.isArray(slots)||slots.length!==PLAYER_ITEM_SLOT_COUNT||!isObject(runtimes)){
    return {ok:false,reason:'canonical-player-item-state-required'};
  }
  const candidates=[];
  for(const slot of RELIFE_SCAN_SLOTS){
    const existingIndex=intOr(slots[slot],-1);
    if(existingIndex==null||existingIndex<0)continue;
    const item=runtimes[String(existingIndex)];
    if(!isObject(item))continue;
    if(String(item.owner??'')!=='player')continue;
    const itemId=intOr(item.itemId,-1);
    if(itemId<0)continue;
    const template=catalog.byItemId[String(itemId)];
    if(!isObject(template))continue;
    if(String(template.relifeFunc??'').trim()!=='ITEM_DIErelife')continue;
    if(intOr(template.equipPlace,-1)===-1)continue;
    const pile=Math.max(1,intOr(item.pile,1));
    if(pile!==1)continue;
    candidates.push({
      playerSlot:slot,
      existingIndex,
      itemId,
      itemName:String(template.name??item.name??('Item '+itemId)).trim(),
      relifeFunc:'ITEM_DIErelife',
      equipPlace:intOr(template.equipPlace,-1),
      hpArgument:template.relifeHpArgument??null,
      sourceTemplate:{
        itemId,
        relifeFunc:String(template.relifeFunc??''),
        relifeHpArgument:template.relifeHpArgument??null,
        equipPlace:intOr(template.equipPlace,-1),
        fixedCRef:catalog.source.ref
      }
    });
  }
  return {
    ok:true,
    candidates,
    scanSlots:RELIFE_SCAN_SLOTS.slice(),
    sourceFormat:catalog.format,
    fixedCRef:catalog.source.ref
  };
}

function resolveRelifeHpPower(candidate,maxHp){
  const raw=candidate?.hpArgument;
  if(raw==null)return {ok:true,requestedHp:1,argumentMode:'missing-default-1'};
  if(String(raw)==='FULL')return {ok:true,requestedHp:maxHp,argumentMode:'FULL'};
  return {ok:true,requestedHp:cAtoi(raw),argumentMode:'atoi'};
}

function getPlayerEntry(context){
  const side=context?.context?.sides?.find(x=>intOr(x?.side)===0);
  const entries=Array.isArray(side?.entries)?side.entries:[];
  return entries.find(x=>intOr(x?.bid,-1)===0&&String(x?.sourceType??'').trim().toLowerCase()==='player')??null;
}

function applyBattleRelife(context,{
  trigger='outer-add-profit'
}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-relife',action:ACTION_BATTLE_RELIFE_APPLY,reason:'battle-context-required'};
  const mode=String(context.context.mode??'').trim().toLowerCase();
  const sourceMode=intOr(context.context.sourceMode,null);
  if(mode!=='battle'||sourceMode!==BATTLE_MODE_BATTLE)return {ok:false,handled:false,stage:'battle-relife',action:ACTION_BATTLE_RELIFE_APPLY,reason:'battle-active-phase-required'};
  const hook=context.context.finishHookProfile;
  if(!hook||hook.profile!=='ordinary-world-encounter')return {ok:false,handled:false,stage:'battle-relife',action:ACTION_BATTLE_RELIFE_APPLY,reason:'ordinary-world-encounter-required'};
  const player=getPlayerEntry(context);
  if(!player)return {ok:false,handled:false,stage:'battle-relife',action:ACTION_BATTLE_RELIFE_APPLY,reason:'player-battle-entry-required'};
  const hp=intOr(player.hp,null),maxHp=intOr(player.maxHp,null);
  if(hp==null||maxHp==null||maxHp<=0)return {ok:false,handled:false,stage:'battle-relife',action:ACTION_BATTLE_RELIFE_APPLY,reason:'player-hp-runtime-required'};
  if(hp>0||player.isDie!==true)return {ok:true,handled:true,stage:'battle-relife-skipped-alive',format:BROWSER_BATTLE_RELIFE_RUNTIME_FORMAT,action:ACTION_BATTLE_RELIFE_APPLY,trigger,rngConsumed:0,persistentMutation:false,context:clone(context.context)};
  if((intOr(player.ultimate,0)??0)>0)return {ok:true,handled:true,stage:'battle-relife-skipped-ultimate',format:BROWSER_BATTLE_RELIFE_RUNTIME_FORMAT,action:ACTION_BATTLE_RELIFE_APPLY,trigger,rngConsumed:0,persistentMutation:false,context:clone(context.context),reason:'ultimate-death-excluded-by-BATTLE_getBattleDieIndex'};
  if(player.sourceDeathExtraProcessed!==true)return {ok:false,handled:false,stage:'battle-relife',action:ACTION_BATTLE_RELIFE_APPLY,reason:'death-extra-must-run-before-relife'};
  const candidates=Array.isArray(context.context.sourcePlayerRelifeCandidates)?context.context.sourcePlayerRelifeCandidates:[];
  const consumed=new Set((Array.isArray(context.context.sourceRelifeConsumedExistingIndexes)?context.context.sourceRelifeConsumedExistingIndexes:[]).map(v=>intOr(v,-1)));
  const candidate=candidates.find(row=>!consumed.has(intOr(row?.existingIndex,-1)))??null;
  if(!candidate)return {ok:true,handled:true,stage:'battle-relife-skipped-no-source-item',format:BROWSER_BATTLE_RELIFE_RUNTIME_FORMAT,action:ACTION_BATTLE_RELIFE_APPLY,trigger,rngConsumed:0,persistentMutation:false,context:clone(context.context),reason:'no-valid-source-backed-player-relife-item'};
  if(intOr(playerItemRef(context,candidate.playerSlot),-1)!==intOr(candidate.existingIndex,-1)){
    return {ok:false,handled:false,stage:'battle-relife',action:ACTION_BATTLE_RELIFE_APPLY,reason:'relife-existing-item-slot-mismatch',playerSlot:candidate.playerSlot,existingIndex:candidate.existingIndex};
  }
  const hpPlan=resolveRelifeHpPower(candidate,maxHp);
  if(!hpPlan.ok)return {...hpPlan,handled:false,stage:'battle-relife',action:ACTION_BATTLE_RELIFE_APPLY};
  const restoredHp=Math.min(Math.max(1,intOr(hpPlan.requestedHp,1)),maxHp);
  const next=clone(context);
  const nextPlayer=getPlayerEntry(next);
  nextPlayer.hp=restoredHp;
  nextPlayer.isDie=false;
  nextPlayer.sourceDeathExtraProcessed=false;
  nextPlayer.sourceAddProfitDeathPending=false;
  nextPlayer.sourceRelifeActive=true;
  nextPlayer.sourceRelifeDeathResultCleared=true;

  const consumedNext=Array.isArray(next.context.sourceRelifeConsumedExistingIndexes)?next.context.sourceRelifeConsumedExistingIndexes.slice():[];
  consumedNext.push(candidate.existingIndex);
  next.context.sourceRelifeConsumedExistingIndexes=consumedNext;
  const events=Array.isArray(next.context.sourceRelifeEvents)?next.context.sourceRelifeEvents.slice():[];
  const event={
    kind:'player-equipment-relife',
    trigger:String(trigger??'outer-add-profit').trim()||'outer-add-profit',
    playerBid:0,
    playerId:String(player.characterId??'').trim()||null,
    playerSlot:candidate.playerSlot,
    existingIndex:candidate.existingIndex,
    itemId:candidate.itemId,
    itemName:candidate.itemName,
    hpBefore:hp,
    hpAfter:restoredHp,
    maxHp,
    requestedHp:intOr(hpPlan.requestedHp,1),
    argumentMode:hpPlan.argumentMode,
    relifeFunc:'ITEM_DIErelife',
    consumedNow:true,
    rngConsumed:0
  };
  events.push(event);
  next.context.sourceRelifeEvents=events;
  next.context.sourceRelifeLastEvent=event;
  return {
    ok:true,handled:true,stage:'battle-relife-applied',
    format:BROWSER_BATTLE_RELIFE_RUNTIME_FORMAT,action:ACTION_BATTLE_RELIFE_APPLY,
    trigger,rngConsumed:0,applied:true,event,context:next.context,
    persistentMutation:false,battleContextMutation:true,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      functions:['CHECK_ITEM_RELIFE','ITEM_DIErelife','BATTLE_MultiReLife'],
      scanSlots:RELIFE_SCAN_SLOTS.slice(),
      firstValidRelifeItemOnly:true
    },
    sourceOrder:['completed actor command','CHECK_ITEM_RELIFE','ITEM_DIErelife','outer BATTLE_AddProfit'],
    nextBoundary:'BATTLE_RELIFE_COMMIT'
  };
}

function playerItemRef(context,slot){
  const player=getPlayerEntry(context);
  const inventoryRefs=context?.context?.sourcePlayerItemSlotsSnapshot;
  if(Array.isArray(inventoryRefs)&&intOr(slot,-1)>=0)return inventoryRefs[intOr(slot,-1)];
  const candidate=context?.context?.sourcePlayerRelifeCandidates?.find(x=>intOr(x?.playerSlot,-1)===intOr(slot,-1));
  return candidate?.existingIndex??null;
}

function createBrowserBattleRelifeRuntime(){
  return {ok:true,format:BROWSER_BATTLE_RELIFE_RUNTIME_FORMAT,collect:(state,catalog)=>collectPlayerRelifeCandidates(state,catalog),apply:(context,options={})=>applyBattleRelife(context,options)};
}

export {
  BROWSER_BATTLE_RELIFE_RUNTIME_FORMAT,
  ACTION_BATTLE_RELIFE_APPLY,
  BATTLE_MODE_BATTLE,
  BATTLE_MODE_FINISH,
  PLAYER_ITEM_SLOT_COUNT,
  RELIFE_SCAN_SLOTS,
  validateRelifeCatalog,
  collectPlayerRelifeCandidates,
  resolveRelifeHpPower,
  applyBattleRelife,
  createBrowserBattleRelifeRuntime
};
