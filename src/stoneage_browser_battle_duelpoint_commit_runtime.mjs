const BROWSER_BATTLE_DUELPOINT_COMMIT_RUNTIME_FORMAT='stoneage-v412-browser-battle-duelpoint-commit-v1';
const ACTION_BATTLE_DUELPOINT_COMMIT='BATTLE_DUELPOINT_COMMIT';
const MAX_DUELPOINT=100000000;
const TRANSACTION_BUCKET='battleDuelPointTransactions';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const intOr=(value,fallback=null)=>{
  if(value==null||String(value).trim()==='')return fallback;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):fallback;
};
const clone=value=>JSON.parse(JSON.stringify(value));

function resolvePlayerEntry(battleContext,{side=0,num=0}={}){
  const s=intOr(side), n=intOr(num);
  if(s!==0||n==null||n<0||n>=10)return null;
  const row=battleContext?.context?.sides?.find(x=>Number(x?.side)===s);
  if(!row||Number(row?.type)!==0||!Array.isArray(row.entries))return null;
  const entry=row.entries[n];
  if(!entry)return null;
  if(String(entry.sourceType??'').trim().toLowerCase()!=='player')return null;
  return entry;
}

function validateDuelPointPlan(plan){
  if(!isObject(plan))return ['duelpoint-plan-required'];
  if(plan.ok!==true)return ['duelpoint-plan-not-ready'];
  if(plan.stage!=='battle-duelpoint-plan-ready')return ['duelpoint-plan-stage-invalid'];
  if(plan.action!=='BATTLE_DUELPOINT_PLAN')return ['duelpoint-plan-action-invalid'];
  if(intOr(plan.currentDuelPoint,-1)<0)return ['duelpoint-plan-current-invalid'];
  if(intOr(plan.nextDuelPoint,-1)<0||intOr(plan.nextDuelPoint,-1)>MAX_DUELPOINT)return ['duelpoint-plan-next-invalid'];
  if(intOr(plan.dpadd,null)==null)return ['duelpoint-plan-delta-invalid'];
  if(intOr(plan.side,null)!==0)return ['duelpoint-plan-side-invalid'];
  const num=intOr(plan.num,null);
  if(num==null||num<0||num>=10)return ['duelpoint-plan-entry-invalid'];
  return [];
}

function commitDuelPoint(state,battleContext,plan,{
  transactionId=null,
  expectedRevision=null,
  now=()=>new Date().toISOString()
}={}){
  if(!isObject(state))return {ok:false,handled:false,stage:'battle-duelpoint-commit',reason:'persistent-state-required',state};
  const errors=validateDuelPointPlan(plan);
  if(errors.length)return {ok:false,handled:false,stage:'battle-duelpoint-commit',reason:'plan-invalid',errors,state:clone(state)};
  const tx=String(transactionId??plan.transactionId??'').trim();
  if(!tx)return {ok:false,handled:false,stage:'battle-duelpoint-commit',reason:'transaction-id-required',state:clone(state)};

  const currentRevision=intOr(state.revision,0);

  const existingState=isObject(state.runtimeMeta)?state.runtimeMeta:null;
  const existingBucket=isObject(existingState?.[TRANSACTION_BUCKET])?existingState[TRANSACTION_BUCKET]:null;
  if(existingBucket?.[tx]){
    return {
      ok:true,
      handled:true,
      stage:'battle-duelpoint-commit-idempotent',
      format:BROWSER_BATTLE_DUELPOINT_COMMIT_RUNTIME_FORMAT,
      action:ACTION_BATTLE_DUELPOINT_COMMIT,
      transactionId:tx,
      idempotent:true,
      applied:false,
      nextDuelPoint:intOr(existingBucket[tx].nextDuelPoint,0),
      state:clone(state)
    };
  }

  if(expectedRevision!=null&&currentRevision!==intOr(expectedRevision,null)){
    return {ok:false,handled:false,stage:'battle-duelpoint-commit',reason:'revision-conflict',currentRevision,expectedRevision:intOr(expectedRevision,null),state:clone(state)};
  }

  const entry=resolvePlayerEntry(battleContext,{side:plan.side,num:plan.num});
  if(!entry)return {ok:false,handled:false,stage:'battle-duelpoint-commit',reason:'player-battle-entry-required',state:clone(state)};

  const currentDuelPoint=intOr(state.player?.duelPoint,null);
  if(currentDuelPoint==null||currentDuelPoint<0||currentDuelPoint>MAX_DUELPOINT){
    return {ok:false,handled:false,stage:'battle-duelpoint-commit',reason:'persistent-duelpoint-invalid',currentDuelPoint,state:clone(state)};
  }
  if(currentDuelPoint!==intOr(plan.currentDuelPoint,null)){
    return {
      ok:false,handled:false,stage:'battle-duelpoint-commit',reason:'duelpoint-stale-plan',
      currentDuelPoint,planDuelPoint:intOr(plan.currentDuelPoint,null),state:clone(state)
    };
  }
  const nextDuelPoint=intOr(plan.nextDuelPoint,null);
  if(nextDuelPoint==null||nextDuelPoint<0||nextDuelPoint>MAX_DUELPOINT){
    return {ok:false,handled:false,stage:'battle-duelpoint-commit',reason:'next-duelpoint-invalid',state:clone(state)};
  }

  const next=clone(state);
  next.player=next.player&&typeof next.player==='object'?next.player:{};
  next.player.duelPoint=nextDuelPoint;
  next.runtimeMeta=isObject(next.runtimeMeta)?next.runtimeMeta:{};
  next.runtimeMeta[TRANSACTION_BUCKET]=isObject(next.runtimeMeta[TRANSACTION_BUCKET])?next.runtimeMeta[TRANSACTION_BUCKET]:{};
  const committedAt=String(typeof now==='function'?now():now);
  next.runtimeMeta[TRANSACTION_BUCKET][tx]={
    side:0,
    num:intOr(plan.num,0),
    currentDuelPoint,
    dpadd:intOr(plan.dpadd,0),
    nextDuelPoint,
    committedAt
  };
  next.runtimeMeta.updatedAt=committedAt;
  next.revision=currentRevision+1;

  return {
    ok:true,
    handled:true,
    stage:'battle-duelpoint-commit-applied',
    format:BROWSER_BATTLE_DUELPOINT_COMMIT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_DUELPOINT_COMMIT,
    transactionId:tx,
    idempotent:false,
    applied:true,
    currentDuelPoint,
    dpadd:intOr(plan.dpadd,0),
    nextDuelPoint,
    revisionBefore:currentRevision,
    revisionAfter:next.revision,
    workGetExp:intOr(plan.workGetExp,0),
    workGetExpPreserved:true,
    persistentMutation:true,
    battleContextMutation:false,
    uiMutation:false,
    dbMutation:false,
    sourceSideEffects:[
      'lssproto_RD_send',
      'CHAR_send_DpDBUpdate',
      'CHAR_send_DpDBUpdate_AddressBook (unless _NET_REDUCESEND)'
    ],
    sideEffectAdapterRequired:true,
    state:next
  };
}

function createBrowserBattleDuelPointCommitRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_DUELPOINT_COMMIT_RUNTIME_FORMAT,
    commit:(state,battleContext,plan,options={})=>commitDuelPoint(state,battleContext,plan,options)
  };
}

export {
  BROWSER_BATTLE_DUELPOINT_COMMIT_RUNTIME_FORMAT,
  ACTION_BATTLE_DUELPOINT_COMMIT,
  MAX_DUELPOINT,
  TRANSACTION_BUCKET,
  resolvePlayerEntry,
  validateDuelPointPlan,
  commitDuelPoint,
  createBrowserBattleDuelPointCommitRuntime
};
