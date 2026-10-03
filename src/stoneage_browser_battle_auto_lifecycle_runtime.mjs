import { IDLE_EVENTS } from './stoneage_idle_loop.mjs';
import { ACTION_IDLE_EVENT } from './stoneage_browser_idle_runtime.mjs';
import { requiredSettlementBranches } from './stoneage_browser_battle_settlement_runtime.mjs';

const BROWSER_BATTLE_AUTO_LIFECYCLE_RUNTIME_FORMAT='stoneage-v470-browser-battle-auto-lifecycle-v1';
const ACTION_BATTLE_AUTO_RUN='BATTLE_AUTO_RUN';

const clone=value=>JSON.parse(JSON.stringify(value));
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

function txId(prefix,suffix){
  const p=String(prefix??'battle-auto').trim()||'battle-auto';
  return p+':'+suffix;
}

function fail(stage,reason,state,context,extra={}){
  return {
    ok:false,
    handled:false,
    stage,
    action:ACTION_BATTLE_AUTO_RUN,
    reason,
    state:clone(state),
    context:isObject(context)?clone(context):null,
    ...extra
  };
}

async function runBattleAutoLifecycle(context,state,{
  idleRuntime,
  battleFinishCommitRuntime,
  battleExpPlanRuntime,
  battleLevelUpPlanRuntime,
  battlePetGrowthPlanRuntime,
  battleLevelUpCommitRuntime,
  battleItemPlanRuntime,
  battleItemCommitRuntime,
  battleDuelPointRuntime,
  battleDuelPointCommitRuntime,
  battleDeathExtraCommitRuntime,
  battleRelifeCommitRuntime,
  battleSettlementRuntime,
  battlePlayerExitRuntime,
  battlePlayerExitCommitRuntime,
  battlePetExitRuntime,
  battlePetExitCommitRuntime,
  battleExitPlanRuntime,
  battleExitCommitRuntime,
  battleContextClearRuntime,
  settlementId=null,
  transactionPrefix='battle-auto',
  supplyRequired=false,
  itemExpModifierPercent=0,
  battleExpMultiplier=100,
  playerNormalLevelCap=140,
  chartrans=5,
  pettrans=-1,
  rngEvidenceByPetId={},
  petMailModeById=null,
  finishPlan=null,
  now=()=>new Date().toISOString()
}={}){
  if(!isObject(context)||!isObject(context.context))return fail('battle-auto-lifecycle','battle-context-required',state,context);
  if(!isObject(state)||!isObject(state.runtimeMeta))return fail('battle-auto-lifecycle','persistent-runtime-meta-required',state,context);
  const required={
    idleRuntime,battleFinishCommitRuntime,battleSettlementRuntime,
    battlePlayerExitRuntime,battlePlayerExitCommitRuntime,
    battleExitPlanRuntime,battleExitCommitRuntime,battleContextClearRuntime
  };
  for(const [name,runtime] of Object.entries(required)){
    if(!runtime||runtime.ok!==true)return fail('battle-auto-lifecycle','battle-auto-lifecycle-dependency-invalid',state,context,{dependency:name});
  }

  let currentContext=clone(context);
  let currentState=clone(state);
  const transactions=[];
  const addTx=(kind,id)=>transactions.push({kind,transactionId:id});
  const settlementTx=String(settlementId??txId(transactionPrefix,'settlement')).trim();

  const resolvedFinishPlan=finishPlan??currentContext.context.finishPlan??null;
  if(!resolvedFinishPlan?.finished)return fail('battle-auto-finish','finish-plan-required',currentState,currentContext);
  const finish=battleFinishCommitRuntime.commit(
    currentContext,
    {finishPlan:resolvedFinishPlan,winnerSide:resolvedFinishPlan.winnerSide,settlementStartRevision:Number(currentState.revision??0)}
  );
  if(!finish.ok)return fail('battle-auto-finish',finish.reason??'battle-finish-commit-failed',currentState,currentContext,{finish});
  currentContext=clone(finish.battleContext??currentContext);

  const finishedIdle=await idleRuntime.dispatch(
    currentState,
    {type:ACTION_IDLE_EVENT,event:IDLE_EVENTS.BATTLE_FINISHED,payload:{battle:{resultId:settlementTx}}},
    {now}
  );
  if(!finishedIdle.ok)return fail('battle-auto-idle-finished',finishedIdle.reason??'idle-battle-finished-failed',currentState,currentContext,{finish});
  currentState=clone(finishedIdle.state);

  const deathEvents=Array.isArray(currentContext.context.sourceDeathExtraEvents)
    ? currentContext.context.sourceDeathExtraEvents.filter(isObject) : [];
  if(deathEvents.length){
    const id=txId(transactionPrefix,'death-extra');
    const result=battleDeathExtraCommitRuntime?.commit?.(
      currentState,
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(currentContext.context)},
      {transactionId:id,expectedRevision:Number(currentState.revision??0),now}
    );
    if(!result?.ok)return fail('battle-auto-death-extra',result?.reason??'death-extra-commit-failed',currentState,currentContext,{result});
    currentState=clone(result.state); addTx('deathExtra',id);
  }

  const relifeEvents=Array.isArray(currentContext.context.sourceRelifeEvents)
    ? currentContext.context.sourceRelifeEvents.filter(isObject) : [];
  if(relifeEvents.length){
    const id=txId(transactionPrefix,'relife');
    const result=battleRelifeCommitRuntime?.commit?.(
      currentState,
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(currentContext.context)},
      {transactionId:id,expectedRevision:Number(currentState.revision??0),now}
    );
    if(!result?.ok)return fail('battle-auto-relife',result?.reason??'relife-commit-failed',currentState,currentContext,{result});
    currentState=clone(result.state); addTx('relife',id);
  }

  const branches=requiredSettlementBranches(currentContext);
  if(!branches.ok)return fail('battle-auto-settlement-branches',branches.reason??'settlement-branches-invalid',currentState,currentContext);

  if(branches.requiredBranches.includes('duelPoint')){
    if(!battleDuelPointRuntime?.ok||!battleDuelPointCommitRuntime?.ok)return fail('battle-auto-duelpoint','duelpoint-runtime-invalid',currentState,currentContext);
    const player=currentContext.context.sides?.[0]?.entries?.find(e=>Number(e?.bid)===0);
    const plan=battleDuelPointRuntime.plan(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(currentContext.context)},
      {side:0,num:0,duelPoint:currentState.player?.duelPoint,workGetExp:player?.workGetExp}
    );
    if(!plan.ok)return fail('battle-auto-duelpoint',plan.reason??'duelpoint-plan-failed',currentState,currentContext,{plan});
    const id=txId(transactionPrefix,'duelpoint');
    const result=battleDuelPointCommitRuntime.commit(
      currentState,
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(currentContext.context)},
      plan,
      {transactionId:id,expectedRevision:Number(currentState.revision??0),now}
    );
    if(!result.ok)return fail('battle-auto-duelpoint',result.reason??'duelpoint-commit-failed',currentState,currentContext,{result});
    currentState=clone(result.state); addTx('duelPoint',id);
  }

  if(branches.requiredBranches.includes('levelUp')){
    const runtimeOk=battleExpPlanRuntime?.ok&&battleLevelUpPlanRuntime?.ok&&battlePetGrowthPlanRuntime?.ok&&battleLevelUpCommitRuntime?.ok;
    if(!runtimeOk)return fail('battle-auto-levelup','levelup-runtime-invalid',currentState,currentContext);
    const expPlan=battleExpPlanRuntime.plan(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(currentContext.context)},
      clone(currentState),
      {itemExpModifierPercent,battleExpMultiplier}
    );
    if(!expPlan.ok)return fail('battle-auto-levelup',expPlan.reason??'battle-exp-plan-failed',currentState,currentContext,{expPlan});
    const levelPlan=battleLevelUpPlanRuntime.plan(
      expPlan,clone(currentState),{playerNormalLevelCap,chartrans,pettrans}
    );
    if(!levelPlan.ok)return fail('battle-auto-levelup',levelPlan.reason??'battle-levelup-plan-failed',currentState,currentContext,{levelPlan});
    const growthPlan=battlePetGrowthPlanRuntime.plan(
      levelPlan,clone(currentState),{rngEvidenceByPetId:rngEvidenceByPetId??{}}
    );
    if(!growthPlan.ok)return fail('battle-auto-levelup',growthPlan.reason??'battle-pet-growth-plan-failed',currentState,currentContext,{growthPlan});
    const id=txId(transactionPrefix,'levelup');
    const result=battleLevelUpCommitRuntime.commit(
      currentState,levelPlan,growthPlan,{transactionId:id,expectedRevision:Number(currentState.revision??0),now}
    );
    if(!result.ok)return fail('battle-auto-levelup',result.reason??'levelup-commit-failed',currentState,currentContext,{result});
    currentState=clone(result.state); addTx('levelUp',id);
  }

  if(branches.requiredBranches.includes('item')){
    if(!battleItemPlanRuntime?.ok||!battleItemCommitRuntime?.ok)return fail('battle-auto-item','item-runtime-invalid',currentState,currentContext);
    const player=currentContext.context.sides?.[0]?.entries?.find(e=>Number(e?.bid)===0);
    const plan=battleItemPlanRuntime.plan(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(currentContext.context)},
      clone(currentState),
      {getitem:Array.isArray(player?.getitem)?player.getitem:null}
    );
    if(!plan.ok)return fail('battle-auto-item',plan.reason??'item-plan-failed',currentState,currentContext,{plan});
    const id=txId(transactionPrefix,'item');
    const result=battleItemCommitRuntime.commit(
      currentState,plan,{transactionId:id,expectedRevision:Number(currentState.revision??0),now}
    );
    if(!result.ok)return fail('battle-auto-item',result.reason??'item-commit-failed',currentState,currentContext,{result});
    currentState=clone(result.state); addTx('item',id);
  }

  const settlement=battleSettlementRuntime.commit(
    currentState,
    currentContext,
    {settlementId:settlementTx,transactions,expectedRevision:Number(currentState.revision??0),now}
  );
  if(!settlement.ok)return fail('battle-auto-settlement',settlement.reason??'settlement-receipt-commit-failed',currentState,currentContext,{settlement,requiredBranches:branches.requiredBranches,transactions});
  currentState=clone(settlement.state);

  const playerExitPlan=battlePlayerExitRuntime.plan(
    {format:'stoneage-browser-battle-context-runtime-v1',context:clone(currentContext.context)},
    clone(currentState),
    {settlementComplete:true,settlementReceiptId:settlementTx}
  );
  if(!playerExitPlan.ok)return fail('battle-auto-player-exit-plan',playerExitPlan.reason??'player-exit-plan-failed',currentState,currentContext,{playerExitPlan});
  const playerExitId=txId(transactionPrefix,'player-exit');
  const playerExit=battlePlayerExitCommitRuntime.commit(
    currentState,playerExitPlan,{transactionId:playerExitId,expectedRevision:Number(currentState.revision??0),now}
  );
  if(!playerExit.ok)return fail('battle-auto-player-exit-commit',playerExit.reason??'player-exit-commit-failed',currentState,currentContext,{playerExit});
  currentState=clone(playerExit.state);

  const battlePets=Array.isArray(currentContext.context.sides?.[0]?.entries)
    ? currentContext.context.sides[0].entries.filter(e=>isObject(e)&&String(e.sourceType??'').trim().toLowerCase()==='pet') : [];
  let petExitStateTransactionId=null;
  if(battlePets.length){
    if(!battlePetExitRuntime?.ok||!battlePetExitCommitRuntime?.ok)return fail('battle-auto-pet-exit','pet-exit-runtime-invalid',currentState,currentContext);
    const petPlan=battlePetExitRuntime.plan(
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(currentContext.context)},
      clone(currentState),
      {settlementComplete:true,settlementReceiptId:settlementTx,playerExitTransactionId:playerExitId}
    );
    if(!petPlan.ok)return fail('battle-auto-pet-exit-plan',petPlan.reason??'pet-exit-plan-failed',currentState,currentContext,{petPlan});
    petExitStateTransactionId=txId(transactionPrefix,'pet-exit-state');
    const petExit=battlePetExitCommitRuntime.commit(
      currentState,
      {format:'stoneage-browser-battle-context-runtime-v1',context:clone(currentContext.context)},
      petPlan,
      {transactionId:petExitStateTransactionId,expectedRevision:Number(currentState.revision??0),now}
    );
    if(!petExit.ok)return fail('battle-auto-pet-exit-commit',petExit.reason??'pet-exit-commit-failed',currentState,currentContext,{petExit});
    currentState=clone(petExit.state);
  }

  const battleExitPlan=battleExitPlanRuntime.plan(
    {format:'stoneage-browser-battle-context-runtime-v1',context:clone(currentContext.context)},
    clone(currentState),
    {
      settlementComplete:true,
      settlementReceiptId:settlementTx,
      petMailModeById:petMailModeById??null,
      petExitStateTransactionId
    }
  );
  if(!battleExitPlan.ok)return fail('battle-auto-battle-exit-plan',battleExitPlan.reason??'battle-exit-plan-failed',currentState,currentContext,{battleExitPlan});
  const battleExitId=txId(transactionPrefix,'battle-exit');
  const battleExit=battleExitCommitRuntime.commit(
    currentState,battleExitPlan,{transactionId:battleExitId,expectedRevision:Number(currentState.revision??0),now}
  );
  if(!battleExit.ok)return fail('battle-auto-battle-exit-commit',battleExit.reason??'battle-exit-commit-failed',currentState,currentContext,{battleExit});
  currentState=clone(battleExit.state);

  const cleared=battleContextClearRuntime.clear(
    clone(currentState),
    {format:'stoneage-browser-battle-context-runtime-v1',context:clone(currentContext.context)},
    {petExitTransactionId:battleExitId}
  );
  if(!cleared.ok)return fail('battle-auto-context-clear',cleared.reason??'context-clear-failed',currentState,currentContext,{cleared});
  
  const reward=await idleRuntime.dispatch(
    currentState,
    {
      type:ACTION_IDLE_EVENT,
      event:IDLE_EVENTS.REWARD_APPLIED,
      payload:{
        reward:{sourceResultId:settlementTx},
        settlementReceiptId:settlementTx,
        supplyRequired:Boolean(supplyRequired)
      }
    },
    {now}
  );
  if(!reward.ok)return fail('battle-auto-reward-applied',reward.reason??'idle-reward-applied-failed',currentState,currentContext,{cleared});
  currentState=clone(reward.state);

  return {
    ok:true,
    handled:true,
    stage:'battle-auto-lifecycle-complete',
    action:ACTION_BATTLE_AUTO_RUN,
    format:BROWSER_BATTLE_AUTO_LIFECYCLE_RUNTIME_FORMAT,
    settlementId:settlementTx,
    requiredSettlementBranches:branches.requiredBranches,
    transactions:clone(transactions),
    playerExitTransactionId:playerExitId,
    petExitStateTransactionId,
    battleExitTransactionId:battleExitId,
    contextCleared:true,
    battleContext:null,
    state:currentState,
    supplyRequired:Boolean(supplyRequired),
    worldLoopResumed:currentState?.idle?.mode==='moving'||currentState?.idle?.mode==='supply_check',
    persistentMutation:true,
    rngGeneratedInternally:false
  };
}

function createBrowserBattleAutoLifecycleRuntime(deps={}){
  const required=['idleRuntime','battleFinishCommitRuntime','battleSettlementRuntime','battlePlayerExitRuntime','battlePlayerExitCommitRuntime','battleExitPlanRuntime','battleExitCommitRuntime','battleContextClearRuntime'];
  const ok=required.every(name=>deps[name]?.ok===true);
  return {
    ok,
    format:BROWSER_BATTLE_AUTO_LIFECYCLE_RUNTIME_FORMAT,
    run:(context,state,options={})=>runBattleAutoLifecycle(context,state,{...deps,...options})
  };
}

export {
  BROWSER_BATTLE_AUTO_LIFECYCLE_RUNTIME_FORMAT,
  ACTION_BATTLE_AUTO_RUN,
  runBattleAutoLifecycle,
  createBrowserBattleAutoLifecycleRuntime
};
