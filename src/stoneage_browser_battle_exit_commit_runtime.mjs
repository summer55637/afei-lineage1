const BROWSER_BATTLE_EXIT_COMMIT_RUNTIME_FORMAT='stoneage-v421-browser-battle-exit-commit-v1';
const ACTION_BATTLE_EXIT_COMMIT='BATTLE_EXIT_COMMIT';
const TRANSACTION_BUCKET='battleExitTransactions';
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));
const intOr=(v,fallback=null)=>{if(v==null||String(v).trim()==='')return fallback;const n=Number(v);return Number.isFinite(n)?Math.trunc(n):fallback;};
import { validateSettlementReceiptBinding } from './stoneage_browser_battle_settlement_runtime.mjs';
import { resolveBattlePlayerExitForSettlement } from './stoneage_browser_battle_player_exit_commit_runtime.mjs';

function commitBattleExit(state,plan,{transactionId=null,expectedRevision=null,now=()=>new Date().toISOString()}={}){
  if(!isObject(state)||!isObject(state.pets)||!Array.isArray(state.pets.petBox))return {ok:false,handled:false,stage:'battle-exit-commit',reason:'persistent-pet-box-required',state:clone(state)};
  if(!isObject(plan)||plan.ok!==true||plan.stage!=='battle-exit-plan-ready'||plan.format!=='stoneage-v421-browser-battle-exit-plan-v1')return {ok:false,handled:false,stage:'battle-exit-commit',reason:'plan-invalid',state:clone(state)};
  if(plan.settlementComplete!==true)return {ok:false,handled:false,stage:'battle-exit-commit',reason:'settlement-complete-flag-required',state:clone(state)};
  const receiptBinding=validateSettlementReceiptBinding(state,plan);
  if(!receiptBinding.ok)return {ok:false,handled:false,stage:'battle-exit-commit',reason:receiptBinding.reason,receiptId:plan.settlementReceiptId??null,state:clone(state)};
  const tx=String(transactionId??'').trim();
  if(!tx)return {ok:false,handled:false,stage:'battle-exit-commit',reason:'transaction-id-required',state:clone(state)};
  const currentRevision=intOr(state.revision,0);
  const bucket=isObject(state.runtimeMeta?.[TRANSACTION_BUCKET])?state.runtimeMeta[TRANSACTION_BUCKET]:{};
  if(bucket[tx])return {ok:true,handled:true,stage:'battle-exit-commit-idempotent',format:BROWSER_BATTLE_EXIT_COMMIT_RUNTIME_FORMAT,action:ACTION_BATTLE_EXIT_COMMIT,transactionId:tx,idempotent:true,applied:false,revision:currentRevision,state:clone(state)};
  if(expectedRevision!=null&&currentRevision!==intOr(expectedRevision,null))return {ok:false,handled:false,stage:'battle-exit-commit',reason:'revision-conflict',currentRevision,expectedRevision:intOr(expectedRevision,null),state:clone(state)};
  const playerExit=resolveBattlePlayerExitForSettlement(state,{
    settlementReceiptId:plan.settlementReceiptId,
    settlementStartRevision:plan.settlementStartRevision,
    settlementReceiptRevision:plan.settlementReceiptRevision
  });
  if(!playerExit.ok)return {ok:false,handled:false,stage:'battle-exit-commit',reason:playerExit.reason,receiptId:plan.settlementReceiptId??null,state:clone(state)};
  if(String(plan.playerExitTransactionId??'').trim()!==playerExit.transactionId)return {ok:false,handled:false,stage:'battle-exit-commit',reason:'player-exit-transaction-mismatch',receiptId:plan.settlementReceiptId??null,state:clone(state)};
  if(intOr(plan.playerExitRevision,null)!==intOr(playerExit.record.revisionAfter,null))return {ok:false,handled:false,stage:'battle-exit-commit',reason:'player-exit-revision-mismatch',receiptId:plan.settlementReceiptId??null,state:clone(state)};
  if(currentRevision!==intOr(playerExit.record.revisionAfter,null))return {ok:false,handled:false,stage:'battle-exit-commit',reason:'player-exit-revision-current-mismatch',receiptId:plan.settlementReceiptId??null,state:clone(state)};
  const petSyncTx=String(plan.petExitStateTransactionId??'').trim();
  if(plan.petExitStateRequired===true){
    if(!petSyncTx)return {ok:false,handled:false,stage:'battle-exit-commit',reason:'pet-exit-state-transaction-required',state:clone(state)};
    const petSyncRecord=state.runtimeMeta?.battlePetExitStateTransactions?.[petSyncTx];
    if(!isObject(petSyncRecord))return {ok:false,handled:false,stage:'battle-exit-commit',reason:'pet-exit-state-transaction-not-found',petExitStateTransactionId:petSyncTx,state:clone(state)};
    if(String(petSyncRecord.settlementReceiptId??'').trim()!==String(plan.settlementReceiptId??'').trim())return {ok:false,handled:false,stage:'battle-exit-commit',reason:'pet-exit-settlement-mismatch',petExitStateTransactionId:petSyncTx,state:clone(state)};
    if(String(petSyncRecord.playerExitTransactionId??'').trim()!==playerExit.transactionId)return {ok:false,handled:false,stage:'battle-exit-commit',reason:'pet-exit-player-order-mismatch',petExitStateTransactionId:petSyncTx,state:clone(state)};
    if(intOr(petSyncRecord.revisionBefore,null)!==currentRevision)return {ok:false,handled:false,stage:'battle-exit-commit',reason:'pet-exit-revision-current-mismatch',petExitStateTransactionId:petSyncTx,state:clone(state)};
  }

  const next=clone(state);
  const committed=[];
  for(const row of Array.isArray(plan.pets)?plan.pets:[]){
    if(intOr(row?.mailMode,null)!==0)return {ok:false,handled:false,stage:'battle-exit-commit',reason:'pet-mail-mode-required',petId:String(row?.petId??'').trim(),state:clone(state)};
    const id=String(row?.petId??'').trim();
    const pet=next.pets.petBox.find(p=>String(p?.id??'').trim()===id);
    if(!pet)return {ok:false,handled:false,stage:'battle-exit-commit',reason:'persistent-pet-missing',petId:id,state:clone(state)};
    const currentHp=intOr(pet.hp,null);
    if(currentHp==null||currentHp!==intOr(row.hpBefore,null))return {ok:false,handled:false,stage:'battle-exit-commit',reason:'pet-hp-stale-plan',petId:id,state:clone(state)};
    if(currentHp<=0)pet.hp=1;
    else return {ok:false,handled:false,stage:'battle-exit-commit',reason:'pet-not-dead-at-commit',petId:id,state:clone(state)};
    committed.push({petId:id,hpBefore:currentHp,hpAfter:1});
  }
  const timestamp=String(typeof now==='function'?now():now);
  next.runtimeMeta=isObject(next.runtimeMeta)?next.runtimeMeta:{};
  next.runtimeMeta[TRANSACTION_BUCKET]=isObject(next.runtimeMeta[TRANSACTION_BUCKET])?next.runtimeMeta[TRANSACTION_BUCKET]:{};
  next.runtimeMeta[TRANSACTION_BUCKET][tx]={committedAt:timestamp,settlementReceiptId:String(plan.settlementReceiptId??'').trim(),settlementStartRevision:intOr(plan.settlementStartRevision,null),settlementReceiptRevision:intOr(plan.settlementReceiptRevision,null),playerExitTransactionId:playerExit.transactionId,playerExitRevision:intOr(playerExit.record.revisionAfter,null),revisionBefore:currentRevision,revisionAfter:currentRevision+1,pets:committed};
  next.runtimeMeta.updatedAt=timestamp;
  next.revision=currentRevision+1;
  return {
    ok:true,handled:true,stage:'battle-exit-commit-applied',
    format:BROWSER_BATTLE_EXIT_COMMIT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_EXIT_COMMIT,
    transactionId:tx,idempotent:false,applied:true,
    revisionBefore:currentRevision,revisionAfter:next.revision,
    pets:committed,
    activePetIdPreserved:true,
    alivePetHpPreserved:true,
    playerHpMutation:false,
    playerMpMutation:false,
    persistentMutation:true,
    battleContextMutation:false,
    rngPreserved:true,
    sourceSideEffects:['BATTLE_Exit owned-Pet death cleanup: dead/HP<=0 -> HP 1'],
    state:next
  };
}
function createBrowserBattleExitCommitRuntime(){return {ok:true,format:BROWSER_BATTLE_EXIT_COMMIT_RUNTIME_FORMAT,commit:commitBattleExit};}
export {BROWSER_BATTLE_EXIT_COMMIT_RUNTIME_FORMAT,ACTION_BATTLE_EXIT_COMMIT,TRANSACTION_BUCKET,commitBattleExit,createBrowserBattleExitCommitRuntime};
