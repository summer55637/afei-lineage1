const BROWSER_BATTLE_FINISH_COMMIT_RUNTIME_FORMAT='stoneage-v409-browser-battle-finish-commit-v1';
const ACTION_BATTLE_FINISH_COMMIT='BATTLE_FINISH_COMMIT';
const BATTLE_MODE_BATTLE=2;
const BATTLE_MODE_FINISH=3;

const int=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):null;
};
const clone=value=>JSON.parse(JSON.stringify(value));

function commitBattleFinish(context,{
  finishPlan=null,
  winnerSide=null,
  settlementStartRevision=null
}={}){
  if(!context?.context){
    return {ok:false,handled:false,stage:'battle-finish-commit',reason:'battle-context-required'};
  }
  if(!finishPlan||finishPlan.ok!==true){
    return {ok:false,handled:false,stage:'battle-finish-commit',reason:'battle-end-plan-required'};
  }
  if(finishPlan.finished!==true){
    return {ok:false,handled:false,stage:'battle-finish-commit',reason:'battle-end-plan-not-finished',winnerSide:int(winnerSide??finishPlan.winnerSide)};
  }

  const winner=int(winnerSide??finishPlan.winnerSide);
  if(winner!==0&&winner!==1){
    return {ok:false,handled:false,stage:'battle-finish-commit',reason:'winner-side-required'};
  }

  const currentMode=int(context.context.sourceMode)??null;
  if(currentMode!=null&&currentMode!==BATTLE_MODE_BATTLE&&currentMode!==BATTLE_MODE_FINISH){
    return {ok:false,handled:false,stage:'battle-finish-commit',reason:'battle-mode-not-finishable',sourceMode:currentMode};
  }

  if(currentMode===BATTLE_MODE_FINISH||String(context.context.mode??'').trim().toLowerCase()==='finish'){
    return {ok:false,handled:false,stage:'battle-finish-commit',reason:'battle-already-finished',winnerSide:winner};
  }

  const next=clone(context);
  next.context.mode='finish';
  next.context.sourceMode=BATTLE_MODE_FINISH;
  next.context.winnerSide=winner;
  const startRevision=int(settlementStartRevision);
  if(startRevision==null||startRevision<0){
    return {ok:false,handled:false,stage:'battle-finish-commit',reason:'settlement-start-revision-required'};
  }
  next.context.settlementStartRevision=startRevision;
  next.context.finishReason=String(finishPlan.finishReason??'battle-end').trim()||'battle-end';

  return {
    ok:true,
    handled:true,
    stage:'battle-finish-committed',
    format:BROWSER_BATTLE_FINISH_COMMIT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_FINISH_COMMIT,
    previousMode:String(context.context.mode??'')||null,
    previousSourceMode:currentMode,
    mode:'finish',
    sourceMode:BATTLE_MODE_FINISH,
    winnerSide:winner,
    finishReason:next.context.finishReason,
    battleContextMutation:true,
    hpMutation:false,
    persistentMutation:false,
    rewardMutation:false,
    battleExitMutation:false,
    rewardSettlementRequired:true,
    settlementStartRevision:startRevision,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      function:'BATTLE_FinishSet'
    },
    battleContext:next
  };
}

function createBrowserBattleFinishCommitRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_FINISH_COMMIT_RUNTIME_FORMAT,
    commit:(context,options={})=>commitBattleFinish(context,options)
  };
}

export {
  BROWSER_BATTLE_FINISH_COMMIT_RUNTIME_FORMAT,
  ACTION_BATTLE_FINISH_COMMIT,
  BATTLE_MODE_BATTLE,
  BATTLE_MODE_FINISH,
  commitBattleFinish,
  createBrowserBattleFinishCommitRuntime
};
