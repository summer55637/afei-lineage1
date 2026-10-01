const BROWSER_BATTLE_PLAYER_EXIT_RUNTIME_FORMAT='stoneage-v422-browser-battle-player-exit-plan-v1';
const ACTION_BATTLE_PLAYER_EXIT_PLAN='BATTLE_PLAYER_EXIT_PLAN';

const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));
const intOr=(v,fallback=null)=>{
  if(v==null||String(v).trim()==='')return fallback;
  const n=Number(v);
  return Number.isFinite(n)?Math.trunc(n):fallback;
};

function unwrapBattleContext(input){
  if(!isObject(input))return null;
  if(isObject(input.context))return input.context;
  return input;
}

function findPlayerEntry(context){
  const entries=context?.sides?.[0]?.entries;
  if(!Array.isArray(entries))return null;
  return entries.find(entry=>isObject(entry)&&intOr(entry.bid,null)===0&&String(entry.sourceType??'')==='player')??null;
}

function planBattlePlayerExit(contextInput,state,{settlementComplete=false}={}){
  const context=unwrapBattleContext(contextInput);
  if(!context)return {ok:false,handled:false,stage:'battle-player-exit-plan',reason:'battle-context-required'};
  const mode=String(context.mode??'').trim().toLowerCase();
  const sourceMode=intOr(context.sourceMode,null);
  if(mode!=='finish'&&sourceMode!==3)return {ok:false,handled:false,stage:'battle-player-exit-plan',reason:'battle-not-finished'};
  if(settlementComplete!==true)return {ok:false,handled:false,stage:'battle-player-exit-plan',reason:'settlement-complete-flag-required'};
  if(!isObject(state)||!isObject(state.player))return {ok:false,handled:false,stage:'battle-player-exit-plan',reason:'persistent-player-required'};

  const entry=findPlayerEntry(context);
  if(!entry)return {ok:false,handled:false,stage:'battle-player-exit-plan',reason:'battle-player-entry-required'};

  const hp=intOr(entry.hp,null);
  const mp=intOr(entry.mp,null);
  if(hp==null)return {ok:false,handled:false,stage:'battle-player-exit-plan',reason:'battle-player-hp-required'};
  if(mp==null)return {ok:false,handled:false,stage:'battle-player-exit-plan',reason:'battle-player-mp-required'};

  const battlePlayerId=String(entry.characterId??'').trim();
  const statePlayerId=String(state.player.id??'').trim();
  if(battlePlayerId&&statePlayerId&&battlePlayerId!==statePlayerId)return {ok:false,handled:false,stage:'battle-player-exit-plan',reason:'battle-player-identity-mismatch'};

  const persistentHp=intOr(state.player.hp,null);
  const persistentMp=intOr(state.player.mp,null);
  if(persistentHp==null)return {ok:false,handled:false,stage:'battle-player-exit-plan',reason:'persistent-player-hp-required'};
  if(persistentMp==null)return {ok:false,handled:false,stage:'battle-player-exit-plan',reason:'persistent-player-mp-required'};

  if(hp<0)return {ok:false,handled:false,stage:'battle-player-exit-plan',reason:'battle-player-hp-invalid'};
  const dead=entry.isDie===true;
  const hpAfter=dead?1:hp;
  const mpAfter=Math.max(0,mp);

  return {
    ok:true,
    handled:true,
    stage:'battle-player-exit-plan-ready',
    format:BROWSER_BATTLE_PLAYER_EXIT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_PLAYER_EXIT_PLAN,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      function:'BATTLE_Exit',
      playerRule:'on final exit, dead/HP<=0 Player is cleared from death state and HP is set to 1'
    },
    battleMode:mode||null,
    sourceMode,
    settlementComplete:true,
    player:{
      playerId:String(entry.characterId??state.player.id??'player').trim()||'player',
      persistentHpBefore:persistentHp,
      persistentMpBefore:persistentMp,
      battleHp:intOr(hp),
      battleMp:intOr(mp),
      battleIsDie:entry.isDie===true,
      hpAfter,
      mpAfter
    },
    persistentStateMutation:false,
    battleContextMutation:false,
    rngPreserved:true,
    nextBoundary:'BATTLE_PLAYER_EXIT_COMMIT'
  };
}

function createBrowserBattlePlayerExitRuntime(){
  return {ok:true,format:BROWSER_BATTLE_PLAYER_EXIT_RUNTIME_FORMAT,plan:planBattlePlayerExit};
}

export {
  BROWSER_BATTLE_PLAYER_EXIT_RUNTIME_FORMAT,
  ACTION_BATTLE_PLAYER_EXIT_PLAN,
  planBattlePlayerExit,
  createBrowserBattlePlayerExitRuntime
};
