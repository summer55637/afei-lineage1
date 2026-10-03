const BROWSER_BATTLE_PET_EXIT_RUNTIME_FORMAT='stoneage-v468-browser-battle-pet-exit-v1';
const ACTION_BATTLE_PET_EXIT_PLAN='BATTLE_PET_EXIT_PLAN';
const TRANSACTION_BUCKET='battlePetExitStateTransactions';
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));
const intOr=(v,f=null)=>{if(v==null||String(v).trim()==='')return f;const n=Number(v);return Number.isFinite(n)?Math.trunc(n):f;};

function resolveReceipt(state,battleContext,receiptId){
  if(!isObject(state)||!isObject(state.runtimeMeta))return {ok:false,reason:'persistent-runtime-meta-required'};
  const id=String(receiptId??'').trim();
  if(!id)return {ok:false,reason:'settlement-receipt-required'};
  const receipt=state.runtimeMeta.battleSettlementReceipts?.[id];
  if(!isObject(receipt))return {ok:false,reason:'settlement-receipt-not-found',receiptId:id};
  if(String(receipt.finishMode??'').trim().toLowerCase()!=='finish')return {ok:false,reason:'settlement-receipt-finish-mode-mismatch'};
  if(battleContext?.context?.settlementStartRevision!=null &&
     intOr(receipt.startRevision,null)!==intOr(battleContext.context.settlementStartRevision,null)){
    return {ok:false,reason:'settlement-receipt-start-revision-mismatch'};
  }
  return {ok:true,receiptId:id,receipt};
}

function findActiveBattlePets(context){
  const side=context?.context?.sides?.find(x=>intOr(x?.side,null)===0);
  if(!side||!Array.isArray(side.entries))return [];
  return side.entries.filter(entry=>isObject(entry)&&String(entry.sourceType??'').trim().toLowerCase()==='pet');
}

function planBattlePetExit(contextInput,state,{settlementComplete=false,settlementReceiptId=null,playerExitTransactionId=null}={}){
  const context=contextInput?.context??contextInput;
  if(!isObject(context))return {ok:false,handled:false,stage:'battle-pet-exit-plan',reason:'battle-context-required'};
  const mode=String(context.mode??'').trim().toLowerCase();
  const sourceMode=intOr(context.sourceMode,null);
  if(mode!=='finish'&&sourceMode!==3)return {ok:false,handled:false,stage:'battle-pet-exit-plan',reason:'battle-not-finished'};
  if(settlementComplete!==true)return {ok:false,handled:false,stage:'battle-pet-exit-plan',reason:'settlement-complete-flag-required'};
  if(!isObject(state)||!isObject(state.pets)||!Array.isArray(state.pets.petBox))return {ok:false,handled:false,stage:'battle-pet-exit-plan',reason:'persistent-pet-box-required'};
  const receipt=resolveReceipt(state,{context},settlementReceiptId);
  if(!receipt.ok)return {ok:false,handled:false,stage:'battle-pet-exit-plan',reason:receipt.reason,receiptId:receipt.receiptId??settlementReceiptId??null};
  const requestedPlayerExit=String(playerExitTransactionId??'').trim();
  if(!requestedPlayerExit)return {ok:false,handled:false,stage:'battle-pet-exit-plan',reason:'player-exit-transaction-required'};
  const playerExitBucket=state.runtimeMeta?.battlePlayerExitTransactions;
  const playerExit=playerExitBucket?.[requestedPlayerExit];
  if(!isObject(playerExit))return {ok:false,handled:false,stage:'battle-pet-exit-plan',reason:'player-exit-transaction-not-found',playerExitTransactionId:requestedPlayerExit};

  const battlePets=findActiveBattlePets({context});
  const pets=[];
  for(const entry of battlePets){
    const petId=String(entry.characterId??entry.stateId??'').trim();
    if(!petId)return {ok:false,handled:false,stage:'battle-pet-exit-plan',reason:'battle-pet-identity-required'};
    const persistent=state.pets.petBox.find(p=>String(p?.id??'').trim()===petId);
    if(!persistent)return {ok:false,handled:false,stage:'battle-pet-exit-plan',reason:'persistent-pet-missing',petId};
    const hpBefore=intOr(persistent.hp,null);
    const battleHp=intOr(entry.hp,null);
    const maxHp=intOr(entry.maxHp??persistent.maxHp,null);
    if(hpBefore==null||battleHp==null)return {ok:false,handled:false,stage:'battle-pet-exit-plan',reason:'pet-hp-required',petId};
    if(maxHp==null||maxHp<0)return {ok:false,handled:false,stage:'battle-pet-exit-plan',reason:'pet-maxhp-required',petId};
    if(battleHp<0)return {ok:false,handled:false,stage:'battle-pet-exit-plan',reason:'pet-battle-hp-invalid',petId};
    const mailMode=intOr(persistent.mailMode,null);
    const dead=entry.isDie===true||battleHp<=0;
    if(dead&&mailMode==null)return {ok:false,handled:false,stage:'battle-pet-exit-plan',reason:'pet-mail-mode-required',petId};
    const sourceDeathCleanup=dead&&mailMode===0;
    const hpAfter=sourceDeathCleanup?1:Math.min(battleHp,maxHp);
    pets.push({
      petId,
      persistentHpBefore:hpBefore,
      battleHp,
      hpAfter,
      battleIsDie:entry.isDie===true,
      battleMaxHp:maxHp,
      mailMode,
      sourceDeathCleanup,
      stateWrite:true
    });
  }

  return {
    ok:true,handled:true,stage:'battle-pet-exit-plan-ready',
    format:BROWSER_BATTLE_PET_EXIT_RUNTIME_FORMAT,action:ACTION_BATTLE_PET_EXIT_PLAN,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      function:'BATTLE_Exit',
      semantics:[
        'player final BATTLE_Exit clears the battle Pet entry',
        'owned Pet with CHAR_MAILMODE == CHAR_PETMAIL_NONE is restored to HP 1 when dead',
        'Browser persists the final active Battle Pet HP snapshot before BATTLE_EXIT_COMMIT'
      ]
    },
    battleMode:mode,sourceMode,settlementComplete:true,settlementReceiptBound:true,
    settlementReceiptId:receipt.receiptId,
    settlementStartRevision:intOr(receipt.receipt.startRevision,null),
    settlementReceiptRevision:intOr(receipt.receipt.receiptRevision,null),
    playerExitTransactionId:requestedPlayerExit,
    playerExitRevision:intOr(playerExit.revisionAfter,null),
    pets,
    petCount: pets.length,
    persistentStateMutation:false,battleContextMutation:false,rngPreserved:true,
    nextBoundary:'BATTLE_PET_EXIT_COMMIT'
  };
}
function createBrowserBattlePetExitRuntime(){return {ok:true,format:BROWSER_BATTLE_PET_EXIT_RUNTIME_FORMAT,plan:planBattlePetExit};}
export {BROWSER_BATTLE_PET_EXIT_RUNTIME_FORMAT,ACTION_BATTLE_PET_EXIT_PLAN,TRANSACTION_BUCKET,planBattlePetExit,createBrowserBattlePetExitRuntime};
