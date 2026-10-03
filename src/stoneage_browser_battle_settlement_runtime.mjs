const BROWSER_BATTLE_SETTLEMENT_RUNTIME_FORMAT='stoneage-v424-browser-battle-settlement-receipt-v1';
const ACTION_BATTLE_SETTLEMENT_RECEIPT_COMMIT='BATTLE_SETTLEMENT_RECEIPT_COMMIT';
const TRANSACTION_BUCKET='battleSettlementReceipts';
const TX_BUCKETS={
  duelPoint:'battleDuelPointTransactions',
  levelUp:'battleLevelUpTransactions',
  item:'battleItemTransactions',
  deathExtra:'battleDeathExtraTransactions'
};
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));
const intOr=(v,fallback=null)=>{if(v==null||String(v).trim()==='')return fallback;const n=Number(v);return Number.isFinite(n)?Math.trunc(n):fallback;};

function requiredSettlementBranches(battleContext){
  const context=battleContext?.context;
  if(!isObject(context))return {ok:false,reason:'battle-context-required'};
  const sourceMode=intOr(context.sourceMode,null);
  if(String(context.mode??'').trim().toLowerCase()!=='finish'&&sourceMode!==3)return {ok:false,reason:'battle-not-finished'};
  const startRevision=intOr(context.settlementStartRevision,null);
  if(startRevision==null||startRevision<0)return {ok:false,reason:'settlement-start-revision-required'};
  const player=context.sides?.[0]?.entries?.find(e=>isObject(e)&&intOr(e.bid,null)===0&&String(e.sourceType??'')==='player');
  if(!player)return {ok:false,reason:'battle-player-entry-required'};
  const dead=player.isDie===true;
  const dpbattle=intOr(context.dpbattle,0);
  if(dpbattle!==0&&dpbattle!==1)return {ok:false,reason:'dpbattle-invalid'};
  const required=[];
  if(dpbattle===1)required.push('duelPoint');
  else if(!dead)required.push('levelUp');
  if(Array.isArray(context.sourceDeathExtraEvents)&&context.sourceDeathExtraEvents.length>0)required.push('deathExtra');
  if(!dead && Array.isArray(player.getitem) && player.getitem.some(v=>intOr(v,-1)>=0))required.push('item');
  return {ok:true,startRevision,playerId:String(player.characterId??'').trim()||null,encounterId:intOr(context.sourceEncounter?.encounterId,null),requiredBranches:required,dpbattle,playerDead:dead};
}

function normalizeTransactions(input){
  if(!Array.isArray(input))return [];
  const out=[]; const seen=new Set();
  for(const row of input){
    const kind=String(row?.kind??'').trim();
    const transactionId=String(row?.transactionId??'').trim();
    if(!kind||!transactionId||seen.has(kind))continue;
    seen.add(kind); out.push({kind,transactionId});
  }
  return out;
}

function findTransaction(state,kind,transactionId){
  const bucketName=TX_BUCKETS[kind];
  if(!bucketName)return null;
  const bucket=state?.runtimeMeta?.[bucketName];
  if(!isObject(bucket))return null;
  const record=bucket[transactionId];
  return isObject(record)?record:null;
}

function validateSettlementReceiptForBattle(state,battleContext,receiptId){
  const id=String(receiptId??'').trim();
  const expected=requiredSettlementBranches(battleContext);
  if(!expected.ok)return {ok:false,reason:expected.reason};
  const receipt=state?.runtimeMeta?.[TRANSACTION_BUCKET]?.[id];
  if(!isObject(receipt))return {ok:false,reason:'settlement-receipt-not-found',receiptId:id};
  if(intOr(receipt.startRevision,null)!==expected.startRevision)return {ok:false,reason:'settlement-receipt-start-revision-mismatch'};
  if(expected.playerId && receipt.playerId && String(receipt.playerId)!==expected.playerId)return {ok:false,reason:'settlement-receipt-player-mismatch'};
  if(expected.encounterId!=null && receipt.encounterId!=null && intOr(receipt.encounterId,null)!==expected.encounterId)return {ok:false,reason:'settlement-receipt-encounter-mismatch'};
  if(String(receipt.finishMode??'').trim().toLowerCase()!=='finish')return {ok:false,reason:'settlement-receipt-finish-mode-mismatch'};
  const receiptRevision=intOr(receipt.receiptRevision,null);
  const currentRevision=intOr(state?.revision,0);
  if(receiptRevision==null||receiptRevision<=expected.startRevision||receiptRevision>currentRevision){
    return {ok:false,reason:'settlement-receipt-revision-invalid',startRevision:expected.startRevision,receiptRevision,currentRevision};
  }
  for(const kind of expected.requiredBranches){
    const ref=Array.isArray(receipt.transactions)?receipt.transactions.find(x=>x?.kind===kind):null;
    if(!ref)return {ok:false,reason:'settlement-receipt-branch-missing',kind};
    const tx=findTransaction(state,kind,String(ref.transactionId));
    if(!tx)return {ok:false,reason:'settlement-receipt-transaction-missing',kind};
    const txAfter=intOr(tx.revisionAfter,null);
    if(txAfter==null||txAfter<=expected.startRevision||txAfter>receiptRevision){
      return {ok:false,reason:'settlement-receipt-transaction-revision-invalid',kind,transactionId:String(ref.transactionId),txRevisionAfter:txAfter,startRevision:expected.startRevision,receiptRevision};
    }
  }
  return {ok:true,receiptId:id,receiptRevision,receipt:clone(receipt)};
}

function resolveSettlementReceiptForBattle(state,battleContext,receiptId=null){
  if(!isObject(state))return {ok:false,reason:'persistent-state-required'};
  const explicit=String(receiptId??'').trim();
  if(explicit)return validateSettlementReceiptForBattle(state,battleContext,explicit);
  const bucket=state?.runtimeMeta?.[TRANSACTION_BUCKET];
  if(!isObject(bucket))return {ok:false,reason:'settlement-receipt-required'};
  const valid=[];
  for(const id of Object.keys(bucket)){
    const check=validateSettlementReceiptForBattle(state,battleContext,id);
    if(check.ok)valid.push(check);
  }
  if(valid.length===1)return valid[0];
  if(valid.length>1)return {ok:false,reason:'settlement-receipt-ambiguous',receiptIds:valid.map(x=>x.receiptId)};
  return {ok:false,reason:'settlement-receipt-required'};
}

function validateSettlementReceiptBinding(state,plan){
  if(!isObject(plan))return {ok:false,reason:'settlement-receipt-binding-plan-required'};
  const id=String(plan.settlementReceiptId??'').trim();
  if(!id||plan.settlementReceiptBound!==true)return {ok:false,reason:'settlement-receipt-binding-required'};
  const receipt=state?.runtimeMeta?.[TRANSACTION_BUCKET]?.[id];
  if(!isObject(receipt))return {ok:false,reason:'settlement-receipt-not-found',receiptId:id};
  const expectedStart=intOr(plan.settlementStartRevision,null);
  const expectedReceipt=intOr(plan.settlementReceiptRevision,null);
  if(expectedStart==null||intOr(receipt.startRevision,null)!==expectedStart)return {ok:false,reason:'settlement-receipt-start-revision-mismatch',receiptId:id};
  if(expectedReceipt==null||intOr(receipt.receiptRevision,null)!==expectedReceipt)return {ok:false,reason:'settlement-receipt-revision-mismatch',receiptId:id};
  if(String(receipt.settlementId??'').trim()!==id)return {ok:false,reason:'settlement-receipt-id-mismatch',receiptId:id};
  if(String(receipt.finishMode??'').trim().toLowerCase()!=='finish')return {ok:false,reason:'settlement-receipt-finish-mode-mismatch',receiptId:id};
  return {ok:true,settlementReceiptId:id,settlementStartRevision:expectedStart,settlementReceiptRevision:expectedReceipt,receipt:clone(receipt)};
}

function commitBattleSettlementReceipt(state,battleContext,{
  settlementId=null,
  transactions=[],
  expectedRevision=null,
  now=()=>new Date().toISOString()
}={}){
  if(!isObject(state)||!isObject(state.runtimeMeta))return {ok:false,handled:false,stage:'battle-settlement-receipt',reason:'persistent-runtime-meta-required',state:clone(state)};
  const expected=requiredSettlementBranches(battleContext);
  if(!expected.ok)return {ok:false,handled:false,stage:'battle-settlement-receipt',reason:expected.reason,state:clone(state)};
  const id=String(settlementId??'').trim();
  if(!id)return {ok:false,handled:false,stage:'battle-settlement-receipt',reason:'settlement-id-required',state:clone(state)};
  const currentRevision=intOr(state.revision,0);
  const bucket=isObject(state.runtimeMeta[TRANSACTION_BUCKET])?state.runtimeMeta[TRANSACTION_BUCKET]:{};
  if(bucket[id])return {ok:true,handled:true,stage:'battle-settlement-receipt-idempotent',format:BROWSER_BATTLE_SETTLEMENT_RUNTIME_FORMAT,action:ACTION_BATTLE_SETTLEMENT_RECEIPT_COMMIT,settlementId:id,idempotent:true,applied:false,revision:currentRevision,state:clone(state)};
  if(expectedRevision!=null&&currentRevision!==intOr(expectedRevision,null))return {ok:false,handled:false,stage:'battle-settlement-receipt',reason:'revision-conflict',currentRevision,expectedRevision:intOr(expectedRevision,null),state:clone(state)};
  const refs=normalizeTransactions(transactions);
  const allowed=new Set(Object.keys(TX_BUCKETS));
  for(const kind of refs.map(x=>x.kind))if(!allowed.has(kind))return {ok:false,handled:false,stage:'battle-settlement-receipt',reason:'unknown-settlement-transaction-kind',kind,state:clone(state)};
  for(const kind of expected.requiredBranches){
    const ref=refs.find(x=>x.kind===kind);
    if(!ref)return {ok:false,handled:false,stage:'battle-settlement-receipt',reason:'settlement-transaction-required',kind,state:clone(state)};
    const record=findTransaction(state,kind,ref.transactionId);
    if(!record)return {ok:false,handled:false,stage:'battle-settlement-receipt',reason:'settlement-transaction-missing',kind,transactionId:ref.transactionId,state:clone(state)};
    const txAfter=intOr(record.revisionAfter,null);
    if(txAfter==null||txAfter<=expected.startRevision||txAfter>currentRevision)return {ok:false,handled:false,stage:'battle-settlement-receipt',reason:'settlement-transaction-outside-battle-window',kind,transactionId:ref.transactionId,txRevisionAfter:txAfter,startRevision:expected.startRevision,currentRevision,state:clone(state)};
  }
  const timestamp=String(typeof now==='function'?now():now);
  const next=clone(state);
  next.runtimeMeta=isObject(next.runtimeMeta)?next.runtimeMeta:{};
  next.runtimeMeta[TRANSACTION_BUCKET]=isObject(next.runtimeMeta[TRANSACTION_BUCKET])?next.runtimeMeta[TRANSACTION_BUCKET]:{};
  next.runtimeMeta[TRANSACTION_BUCKET][id]={
    committedAt:timestamp,
    settlementId:id,
    startRevision:expected.startRevision,
    finishMode:'finish',
    playerId:expected.playerId,
    encounterId:expected.encounterId,
    dpbattle:expected.dpbattle,
    playerDead:expected.playerDead,
    requiredBranches:expected.requiredBranches,
    transactions:clone(refs),
    receiptRevision:currentRevision+1
  };
  next.runtimeMeta.updatedAt=timestamp;
  next.revision=currentRevision+1;
  return {ok:true,handled:true,stage:'battle-settlement-receipt-committed',format:BROWSER_BATTLE_SETTLEMENT_RUNTIME_FORMAT,action:ACTION_BATTLE_SETTLEMENT_RECEIPT_COMMIT,settlementId:id,idempotent:false,applied:true,revisionBefore:currentRevision,revisionAfter:next.revision,requiredBranches:expected.requiredBranches,transactions:refs,persistentMutation:true,battleContextMutation:false,rngPreserved:true,state:next};
}

function createBrowserBattleSettlementRuntime(){
  return {ok:true,format:BROWSER_BATTLE_SETTLEMENT_RUNTIME_FORMAT,commit:(state,battleContext,options={})=>commitBattleSettlementReceipt(state,battleContext,options)};
}
export {BROWSER_BATTLE_SETTLEMENT_RUNTIME_FORMAT,ACTION_BATTLE_SETTLEMENT_RECEIPT_COMMIT,TRANSACTION_BUCKET,TX_BUCKETS,requiredSettlementBranches,validateSettlementReceiptForBattle,resolveSettlementReceiptForBattle,validateSettlementReceiptBinding,commitBattleSettlementReceipt,createBrowserBattleSettlementRuntime};
