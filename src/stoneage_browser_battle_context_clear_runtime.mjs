const BROWSER_BATTLE_CONTEXT_CLEAR_RUNTIME_FORMAT='stoneage-v425-browser-battle-context-clear-v1';
const ACTION_BATTLE_CONTEXT_CLEAR='BATTLE_CONTEXT_CLEAR';

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));
const intOr=(v,fallback=null)=>{
  if(v==null||String(v).trim()==='')return fallback;
  const n=Number(v);
  return Number.isFinite(n)?Math.trunc(n):fallback;
};

function validateBattleContextClear(state,battleContext,{petExitTransactionId=null}={}){
  if(!isObject(state)||!isObject(state.runtimeMeta))return {ok:false,reason:'persistent-runtime-meta-required'};
  if(!isObject(battleContext)||!isObject(battleContext.context))return {ok:false,reason:'battle-context-required'};
  const mode=String(battleContext.context.mode??'').trim().toLowerCase();
  const sourceMode=intOr(battleContext.context.sourceMode,null);
  if(mode!=='finish'&&sourceMode!==3)return {ok:false,reason:'battle-not-finished'};

  const requestedTx=String(petExitTransactionId??'').trim();
  if(!requestedTx)return {ok:false,reason:'pet-exit-transaction-required'};

  const petBucket=state.runtimeMeta.battleExitTransactions;
  const petRecord=petBucket?.[requestedTx];
  if(!isObject(petRecord))return {ok:false,reason:'pet-exit-commit-required',petExitTransactionId:requestedTx};

  const settlementReceiptId=String(petRecord.settlementReceiptId??'').trim();
  const playerExitTransactionId=String(petRecord.playerExitTransactionId??'').trim();
  const settlementStartRevision=intOr(petRecord.settlementStartRevision,null);
  const settlementReceiptRevision=intOr(petRecord.settlementReceiptRevision,null);
  const playerExitRevision=intOr(petRecord.playerExitRevision,null);
  const revisionBefore=intOr(petRecord.revisionBefore,null);
  const revisionAfter=intOr(petRecord.revisionAfter,null);
  const currentRevision=intOr(state.revision,0);

  if(!settlementReceiptId)return {ok:false,reason:'settlement-receipt-binding-required',petExitTransactionId:requestedTx};
  if(!playerExitTransactionId)return {ok:false,reason:'player-exit-transaction-required',petExitTransactionId:requestedTx};
  if(settlementStartRevision==null||settlementReceiptRevision==null)return {ok:false,reason:'settlement-revision-binding-required',petExitTransactionId:requestedTx};
  if(playerExitRevision==null||revisionBefore==null||revisionAfter==null)return {ok:false,reason:'pet-exit-revision-binding-required',petExitTransactionId:requestedTx};

  const receipt=state.runtimeMeta.battleSettlementReceipts?.[settlementReceiptId];
  if(!isObject(receipt))return {ok:false,reason:'settlement-receipt-not-found',settlementReceiptId};
  if(intOr(receipt.startRevision,null)!==settlementStartRevision)return {ok:false,reason:'settlement-receipt-start-revision-mismatch',settlementReceiptId};
  if(intOr(receipt.receiptRevision,null)!==settlementReceiptRevision)return {ok:false,reason:'settlement-receipt-revision-mismatch',settlementReceiptId};
  if(String(receipt.finishMode??'').trim().toLowerCase()!=='finish')return {ok:false,reason:'settlement-receipt-finish-mode-mismatch',settlementReceiptId};

  const playerBucket=state.runtimeMeta.battlePlayerExitTransactions;
  const playerRecord=playerBucket?.[playerExitTransactionId];
  if(!isObject(playerRecord))return {ok:false,reason:'player-exit-commit-not-found',playerExitTransactionId};
  if(String(playerRecord.settlementReceiptId??'').trim()!==settlementReceiptId)return {ok:false,reason:'player-exit-settlement-mismatch',playerExitTransactionId};
  if(intOr(playerRecord.settlementStartRevision,null)!==settlementStartRevision)return {ok:false,reason:'player-exit-start-revision-mismatch',playerExitTransactionId};
  if(intOr(playerRecord.settlementReceiptRevision,null)!==settlementReceiptRevision)return {ok:false,reason:'player-exit-receipt-revision-mismatch',playerExitTransactionId};
  if(intOr(playerRecord.revisionAfter,null)!==playerExitRevision)return {ok:false,reason:'player-exit-revision-mismatch',playerExitTransactionId};
  if(playerExitRevision!==revisionBefore)return {ok:false,reason:'pet-exit-player-order-mismatch',playerExitTransactionId,playerExitRevision,petExitRevisionBefore:revisionBefore};
  if(revisionAfter!==currentRevision)return {ok:false,reason:'pet-exit-revision-current-mismatch',petExitTransactionId:requestedTx,currentRevision,revisionAfter};

  return {
    ok:true,
    petExitTransactionId:requestedTx,
    settlementReceiptId,
    settlementStartRevision,
    settlementReceiptRevision,
    playerExitTransactionId,
    playerExitRevision,
    petExitRevisionBefore:revisionBefore,
    petExitRevisionAfter:revisionAfter
  };
}

function clearBattleContext(state,battleContext,{petExitTransactionId=null}={}){
  const check=validateBattleContextClear(state,battleContext,{petExitTransactionId});
  if(!check.ok){
    return {
      ok:false,
      handled:false,
      stage:'battle-context-clear',
      reason:check.reason,
      ...check,
      state:clone(state),
      battleContext:battleContext?clone(battleContext):null
    };
  }
  return {
    ok:true,
    handled:true,
    stage:'battle-context-clear-applied',
    format:BROWSER_BATTLE_CONTEXT_CLEAR_RUNTIME_FORMAT,
    action:ACTION_BATTLE_CONTEXT_CLEAR,
    transientMutation:true,
    persistentMutation:false,
    rewardMutation:false,
    rngPreserved:true,
    settlementReceiptId:check.settlementReceiptId,
    playerExitTransactionId:check.playerExitTransactionId,
    petExitTransactionId:check.petExitTransactionId,
    revisionBefore:check.petExitRevisionBefore,
    revisionAfter:check.petExitRevisionAfter,
    battleContextCleared:true,
    state:clone(state),
    battleContext:null
  };
}

function createBrowserBattleContextClearRuntime(){
  return {ok:true,format:BROWSER_BATTLE_CONTEXT_CLEAR_RUNTIME_FORMAT,clear:clearBattleContext};
}

export {
  BROWSER_BATTLE_CONTEXT_CLEAR_RUNTIME_FORMAT,
  ACTION_BATTLE_CONTEXT_CLEAR,
  validateBattleContextClear,
  clearBattleContext,
  createBrowserBattleContextClearRuntime
};
