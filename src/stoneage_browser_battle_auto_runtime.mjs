const BROWSER_BATTLE_AUTO_RUNTIME_FORMAT='stoneage-v467-browser-battle-auto-orchestrator-v1';
const ACTION_BATTLE_AUTO_RUN='BATTLE_AUTO_RUN';
const DEFAULT_MAX_ROUNDS=100;
const clone=value=>JSON.parse(JSON.stringify(value));
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const int=value=>{if(value==null||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)&&Number.isInteger(n)?n:null;};
function waitingPlayers(context){
  const side=context?.context?.sides?.find(row=>int(row?.side)===0);
  return (Array.isArray(side?.entries)?side.entries:[]).filter(entry=>entry&&String(entry.sourceType??'').trim().toLowerCase()==='player'&&int(entry.sourceBattleCharMode)===2);
}
async function runBattleAuto(context,{playerStrategyRuntime=null,enemyAiRuntime=null,roundRuntime=null,strategy=null,playerId=null,rounds=[],maxRounds=DEFAULT_MAX_ROUNDS,counterPolicy='execute',transactionPrefix='battle-auto'}={}){
  if(!isObject(context)||!isObject(context.context))return {ok:false,handled:false,stage:'battle-auto',action:ACTION_BATTLE_AUTO_RUN,reason:'battle-context-required'};
  if(String(context.context.mode??'').trim().toLowerCase()!=='battle')return {ok:false,handled:false,stage:'battle-auto',action:ACTION_BATTLE_AUTO_RUN,reason:'battle-active-phase-required'};
  const deps={playerStrategyRuntime,enemyAiRuntime,roundRuntime};
  for(const [name,runtime] of Object.entries(deps))if(!runtime||runtime.ok!==true)return {ok:false,handled:false,stage:'battle-auto',action:ACTION_BATTLE_AUTO_RUN,reason:'battle-auto-runtime-dependency-invalid',dependency:name};
  const limit=Math.max(1,int(maxRounds)??DEFAULT_MAX_ROUNDS);
  if(!Array.isArray(rounds))return {ok:false,handled:false,stage:'battle-auto',action:ACTION_BATTLE_AUTO_RUN,reason:'battle-auto-round-inputs-required'};
  if(rounds.length<limit)return {ok:false,handled:false,stage:'battle-auto',action:ACTION_BATTLE_AUTO_RUN,reason:'battle-auto-round-inputs-insufficient',expected:limit,actual:rounds.length};
  let next=clone(context),history=[],finished=false,winnerSide=null,finishReason=null;
  for(let roundIndex=0;roundIndex<limit;roundIndex++){
    const input=isObject(rounds[roundIndex])?rounds[roundIndex]:{};
    const players=waitingPlayers(next);
    if(players.length>1)return {ok:false,handled:false,stage:'battle-auto-player-control',action:ACTION_BATTLE_AUTO_RUN,reason:'multiple-player-actors-unsupported',roundIndex,playerBids:players.map(x=>int(x.bid)),partialContext:clone(next.context),history};
    let strategyResult=null;
    if(players.length===1){
      const bid=int(players[0].bid)??0;
      const defaultTargetRoll=input.defaultTargetRollByBid?.[String(bid)]??input.defaultTargetRollByBid?.[bid]??input.defaultTargetRoll??null;
      strategyResult=playerStrategyRuntime.apply({format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},{strategy:strategy??undefined,playerId:playerId??players[0].characterId??null,defaultTargetRoll,weaponKind:input.weaponKind??null});
      if(!strategyResult.ok)return {...strategyResult,stage:'battle-auto-player-strategy',action:ACTION_BATTLE_AUTO_RUN,roundIndex,partialContext:clone(next.context),history};
      next.context=clone(strategyResult.battleContext??strategyResult.context??next.context);
    }
    const enemyAiResult=enemyAiRuntime.apply({format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},{actionRolls:Array.isArray(input.enemyActionRolls)?input.enemyActionRolls:[],targetRolls:Array.isArray(input.enemyTargetRolls)?input.enemyTargetRolls:[]});
    if(!enemyAiResult.ok)return {...enemyAiResult,stage:'battle-auto-enemy-ai',action:ACTION_BATTLE_AUTO_RUN,roundIndex,partialContext:clone(next.context),history};
    next.context=clone(enemyAiResult.battleContext??enemyAiResult.context??next.context);
    const roundResult=await roundRuntime.resolve({format:'stoneage-browser-battle-context-runtime-v1',context:clone(next.context)},{...clone(input.roundOptions??{}),roundId:String(input.roundId??(transactionPrefix+':'+roundIndex)),counterPolicy,now:input.now??null});
    if(!roundResult.ok)return {...roundResult,stage:'battle-auto-round',action:ACTION_BATTLE_AUTO_RUN,roundIndex,partialContext:clone(next.context),history};
    next.context=clone(roundResult.context);
    history.push({roundIndex,turn:roundResult.turn,strategy:strategyResult?clone(strategyResult):null,enemyAi:clone(enemyAiResult),round:clone(roundResult)});
    if(roundResult.finished===true){finished=true;winnerSide=int(roundResult.winnerSide);finishReason=String(roundResult.finishReason??'').trim()||null;break;}
  }
  return {ok:true,handled:true,stage:finished?'battle-auto-finished':'battle-auto-round-limit',format:BROWSER_BATTLE_AUTO_RUNTIME_FORMAT,action:ACTION_BATTLE_AUTO_RUN,finished,winnerSide,finishReason,roundsExecuted:history.length,maxRounds:limit,history,context:next.context,persistentMutation:false,battleContextMutation:true,rngGeneratedInternally:false,source:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',functions:['BATTLE_Command','BATTLE_ai_all','BATTLE_Battling','BATTLE_PreCommandSeq','BATTLE_OnlyRescue']},contract:{playerPolicy:'Persistent State battleSettings.strategy -> existing idle battle strategy runtime',enemyPolicy:'Fixed-C source AI runtime',roundPolicy:'existing browser battle round runtime',persistentCommit:'deferred to existing Finish/Settlement transaction boundary'}};
}
function createBrowserBattleAutoRuntime(deps={}){return {ok:Object.values(deps).every(runtime=>runtime?.ok===true),format:BROWSER_BATTLE_AUTO_RUNTIME_FORMAT,run:(context,options={})=>runBattleAuto(context,{...deps,...options})};}
export {BROWSER_BATTLE_AUTO_RUNTIME_FORMAT,ACTION_BATTLE_AUTO_RUN,DEFAULT_MAX_ROUNDS,runBattleAuto,createBrowserBattleAutoRuntime};
