const BROWSER_BATTLE_PLAYER_EXIT_COMMIT_RUNTIME_FORMAT='stoneage-v422-browser-battle-player-exit-commit-v1';
const ACTION_BATTLE_PLAYER_EXIT_COMMIT='BATTLE_PLAYER_EXIT_COMMIT';
const TRANSACTION_BUCKET='battlePlayerExitTransactions';

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));
const intOr=(v,fallback=null)=>{
  if(v==null||String(v).trim()==='')return fallback;
  const n=Number(v);
  return Number.isFinite(n)?Math.trunc(n):fallback;
};

function commitBattlePlayerExit(state,plan,{transactionId=null,expectedRevision=null,now=()=>new Date().toISOString()}={}){
  if(!isObject(state)||!isObject(state.player))return {ok:false,handled:false,stage:'battle-player-exit-commit',reason:'persistent-player-required',state:clone(state)};
  if(!isObject(plan)||plan.ok!==true||plan.stage!=='battle-player-exit-plan-ready'||plan.format!=='stoneage-v422-browser-battle-player-exit-plan-v1')return {ok:false,handled:false,stage:'battle-player-exit-commit',reason:'plan-invalid',state:clone(state)};
  if(plan.settlementComplete!==true)return {ok:false,handled:false,stage:'battle-player-exit-commit',reason:'settlement-complete-flag-required',state:clone(state)};

  const tx=String(transactionId??'').trim();
  if(!tx)return {ok:false,handled:false,stage:'battle-player-exit-commit',reason:'transaction-id-required',state:clone(state)};

  const currentRevision=intOr(state.revision,0);
  const bucket=isObject(state.runtimeMeta?.[TRANSACTION_BUCKET])?state.runtimeMeta[TRANSACTION_BUCKET]:{};
  if(bucket[tx]){
    return {
      ok:true,
      handled:true,
      stage:'battle-player-exit-commit-idempotent',
      format:BROWSER_BATTLE_PLAYER_EXIT_COMMIT_RUNTIME_FORMAT,
      action:ACTION_BATTLE_PLAYER_EXIT_COMMIT,
      transactionId:tx,
      idempotent:true,
      applied:false,
      revision:currentRevision,
      state:clone(state)
    };
  }

  if(expectedRevision!=null&&currentRevision!==intOr(expectedRevision,null)){
    return {
      ok:false,
      handled:false,
      stage:'battle-player-exit-commit',
      reason:'revision-conflict',
      currentRevision,
      expectedRevision:intOr(expectedRevision,null),
      state:clone(state)
    };
  }

  const player=plan.player;
  if(!isObject(player))return {ok:false,handled:false,stage:'battle-player-exit-commit',reason:'player-plan-required',state:clone(state)};
  const planPlayerId=String(player?.playerId??'').trim();
  const statePlayerId=String(state.player.id??'').trim();
  if(planPlayerId&&statePlayerId&&planPlayerId!==statePlayerId)return {ok:false,handled:false,stage:'battle-player-exit-commit',reason:'player-identity-mismatch',state:clone(state)};

  const persistentHp=intOr(state.player.hp,null);
  const persistentMp=intOr(state.player.mp,null);
  if(persistentHp==null||persistentMp==null)return {ok:false,handled:false,stage:'battle-player-exit-commit',reason:'persistent-player-hp-mp-required',state:clone(state)};
  if(persistentHp!==intOr(player.persistentHpBefore,null))return {ok:false,handled:false,stage:'battle-player-exit-commit',reason:'player-hp-stale-plan',state:clone(state)};
  if(persistentMp!==intOr(player.persistentMpBefore,null))return {ok:false,handled:false,stage:'battle-player-exit-commit',reason:'player-mp-stale-plan',state:clone(state)};

  const hpAfter=intOr(player.hpAfter,null);
  const mpAfter=intOr(player.mpAfter,null);
  if(hpAfter==null||hpAfter<0||mpAfter==null||mpAfter<0)return {ok:false,handled:false,stage:'battle-player-exit-commit',reason:'player-plan-result-invalid',state:clone(state)};

  const next=clone(state);
  next.player.hp=hpAfter;
  next.player.mp=mpAfter;

  const timestamp=String(typeof now==='function'?now():now);
  next.runtimeMeta=isObject(next.runtimeMeta)?next.runtimeMeta:{};
  next.runtimeMeta[TRANSACTION_BUCKET]=isObject(next.runtimeMeta[TRANSACTION_BUCKET])?next.runtimeMeta[TRANSACTION_BUCKET]:{};
  next.runtimeMeta[TRANSACTION_BUCKET][tx]={
    committedAt:timestamp,
    player:{
      playerId:String(player.playerId??next.player.id??'player').trim()||'player',
      hpBefore:persistentHp,
      hpAfter,
      mpBefore:persistentMp,
      mpAfter
    }
  };
  next.runtimeMeta.updatedAt=timestamp;
  next.revision=currentRevision+1;

  return {
    ok:true,
    handled:true,
    stage:'battle-player-exit-commit-applied',
    format:BROWSER_BATTLE_PLAYER_EXIT_COMMIT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_PLAYER_EXIT_COMMIT,
    transactionId:tx,
    idempotent:false,
    applied:true,
    revisionBefore:currentRevision,
    revisionAfter:next.revision,
    player:{
      playerId:String(player.playerId??next.player.id??'player').trim()||'player',
      hpBefore:persistentHp,
      hpAfter,
      mpBefore:persistentMp,
      mpAfter
    },
    persistentMutation:true,
    battleContextMutation:false,
    rewardMutation:false,
    rngPreserved:true,
    sourceSideEffects:['BATTLE_Exit player final-exit death cleanup: CHAR_ISDIE=true -> isDie=false and HP=1; HP<=0 alone does not promote the rule'],
    state:next
  };
}

function createBrowserBattlePlayerExitCommitRuntime(){
  return {ok:true,format:BROWSER_BATTLE_PLAYER_EXIT_COMMIT_RUNTIME_FORMAT,commit:commitBattlePlayerExit};
}

export {
  BROWSER_BATTLE_PLAYER_EXIT_COMMIT_RUNTIME_FORMAT,
  ACTION_BATTLE_PLAYER_EXIT_COMMIT,
  TRANSACTION_BUCKET,
  commitBattlePlayerExit,
  createBrowserBattlePlayerExitCommitRuntime
};
