const BROWSER_BATTLE_PET_EXIT_COMMIT_RUNTIME_FORMAT='stoneage-v468-browser-battle-pet-exit-commit-v1';
const ACTION_BATTLE_PET_EXIT_COMMIT='BATTLE_PET_EXIT_COMMIT';
const TRANSACTION_BUCKET='battlePetExitStateTransactions';
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));
const intOr=(v,f=null)=>{if(v==null||String(v).trim()==='')return f;const n=Number(v);return Number.isFinite(n)?Math.trunc(n):f;};

function findPet(state,id){
  const needle=String(id??'').trim();
  return Array.isArray(state?.pets?.petBox)?state.pets.petBox.find(p=>String(p?.id??'').trim()===needle)??null:null;
}
function commitBattlePetExit(state,battleContext,plan,{transactionId=null,expectedRevision=null,now=()=>new Date().toISOString()}={}){
  if(!isObject(state)||!isObject(state.pets)||!Array.isArray(state.pets.petBox))return {ok:false,handled:false,stage:'battle-pet-exit-commit',reason:'persistent-pet-box-required',state:clone(state)};
  if(!isObject(plan)||plan.ok!==true||plan.stage!=='battle-pet-exit-plan-ready'||plan.format!=='stoneage-v468-browser-battle-pet-exit-plan-v1')return {ok:false,handled:false,stage:'battle-pet-exit-commit',reason:'plan-invalid',state:clone(state)};
  const tx=String(transactionId??'').trim();
  if(!tx)return {ok:false,handled:false,stage:'battle-pet-exit-commit',reason:'transaction-id-required',state:clone(state)};
  const currentRevision=intOr(state.revision,0);
  const bucket=isObject(state.runtimeMeta?.[TRANSACTION_BUCKET])?state.runtimeMeta[TRANSACTION_BUCKET]:{};
  if(bucket[tx])return {ok:true,handled:true,stage:'battle-pet-exit-commit-idempotent',format:BROWSER_BATTLE_PET_EXIT_COMMIT_RUNTIME_FORMAT,action:ACTION_BATTLE_PET_EXIT_COMMIT,transactionId:tx,idempotent:true,applied:false,revision:currentRevision,state:clone(state)};
  if(expectedRevision!=null&&currentRevision!==intOr(expectedRevision,null))return {ok:false,handled:false,stage:'battle-pet-exit-commit',reason:'revision-conflict',currentRevision,expectedRevision:intOr(expectedRevision,null),state:clone(state)};
  const next=clone(state);
  const committed=[];
  for(const row of Array.isArray(plan.pets)?plan.pets:[]){
    const pet=findPet(next,row?.petId);
    if(!pet)return {ok:false,handled:false,stage:'battle-pet-exit-commit',reason:'persistent-pet-missing',petId:String(row?.petId??'').trim(),state:clone(state)};
    const hp=intOr(pet.hp,null);
    if(hp==null||hp!==intOr(row.persistentHpBefore,null))return {ok:false,handled:false,stage:'battle-pet-exit-commit',reason:'pet-hp-stale-plan',petId:String(row?.petId??'').trim(),state:clone(state)};
    const battleHp=intOr(row.battleHp,null);
    const battleMaxHp=intOr(row.battleMaxHp,null);
    const hpAfter=intOr(row.hpAfter,null);
    const mailMode=intOr(row.mailMode,null);
    if(battleHp==null||battleHp<0||battleMaxHp==null||battleMaxHp<0||hpAfter==null||hpAfter<0||hpAfter>Math.max(1,battleMaxHp)){
      return {ok:false,handled:false,stage:'battle-pet-exit-commit',reason:'pet-plan-result-invalid',petId:String(row?.petId??'').trim(),state:clone(state)};
    }
    if(row.sourceDeathCleanup===true){
      if(mailMode!==0||hpAfter!==1)return {ok:false,handled:false,stage:'battle-pet-exit-commit',reason:'pet-death-cleanup-contract-invalid',petId:String(row?.petId??'').trim(),state:clone(state)};
    }else if(hpAfter!==Math.min(battleHp,battleMaxHp)){
      return {ok:false,handled:false,stage:'battle-pet-exit-commit',reason:'pet-hp-snapshot-mismatch',petId:String(row?.petId??'').trim(),state:clone(state)};
    }
    pet.hp=hpAfter;
    if(row.sourceDeathCleanup===true)pet.isDie=false;
    committed.push({petId:String(row?.petId??'').trim(),hpBefore:hp,hpAfter,deathCleanup:row.sourceDeathCleanup===true});
  }
  const timestamp=String(typeof now==='function'?now():now);
  next.runtimeMeta=isObject(next.runtimeMeta)?next.runtimeMeta:{};
  next.runtimeMeta[TRANSACTION_BUCKET]=isObject(next.runtimeMeta[TRANSACTION_BUCKET])?next.runtimeMeta[TRANSACTION_BUCKET]:{};
  next.runtimeMeta[TRANSACTION_BUCKET][tx]={
    committedAt:timestamp,
    settlementReceiptId:String(plan.settlementReceiptId??'').trim(),
    settlementStartRevision:intOr(plan.settlementStartRevision,null),
    settlementReceiptRevision:intOr(plan.settlementReceiptRevision,null),
    playerExitTransactionId:String(plan.playerExitTransactionId??'').trim(),
    playerExitRevision:intOr(plan.playerExitRevision,null),
    revisionBefore:currentRevision,revisionAfter:currentRevision+1,
    pets:clone(committed)
  };
  next.runtimeMeta.updatedAt=timestamp;
  next.revision=currentRevision+1;
  return {ok:true,handled:true,stage:'battle-pet-exit-commit-applied',format:BROWSER_BATTLE_PET_EXIT_COMMIT_RUNTIME_FORMAT,action:ACTION_BATTLE_PET_EXIT_COMMIT,transactionId:tx,idempotent:false,applied:true,revisionBefore:currentRevision,revisionAfter:next.revision,pets:committed,persistentMutation:true,battleContextMutation:false,rngPreserved:true,state:next};
}
function createBrowserBattlePetExitCommitRuntime(){return {ok:true,format:BROWSER_BATTLE_PET_EXIT_COMMIT_RUNTIME_FORMAT,commit:commitBattlePetExit};}
export {BROWSER_BATTLE_PET_EXIT_COMMIT_RUNTIME_FORMAT,ACTION_BATTLE_PET_EXIT_COMMIT,TRANSACTION_BUCKET,commitBattlePetExit,createBrowserBattlePetExitCommitRuntime};
