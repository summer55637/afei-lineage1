import { createBrowserBattleSurpriseRuntime } from './stoneage_browser_battle_surprise_runtime.mjs';
import { createBrowserBattleTurnRuntime } from './stoneage_browser_battle_turn_runtime.mjs';

const BROWSER_BATTLE_INITIALIZE_RUNTIME_FORMAT='stoneage-browser-battle-initialize-runtime-v1';
const ACTION_BATTLE_INITIALIZE='BATTLE_INITIALIZE';
const clone=value=>JSON.parse(JSON.stringify(value));

function initializeBattle(context,{fixedLuck=null,surpriseRoll=null,winFuncPresent=false,playerPresent=true,chargeEntries=[]}={}){
  const surpriseRuntime=createBrowserBattleSurpriseRuntime();
  const turnRuntime=createBrowserBattleTurnRuntime();
  const surprise=surpriseRuntime.check({
    battleType:Number(context?.context?.type??1),
    fixedLuck,
    surpriseRoll,
    winFuncPresent,
    playerPresent
  });
  if(!surprise.ok)return {...surprise,handled:false,stage:'battle-initialize-surprise',context:clone(context)};
  const applied=surpriseRuntime.apply(context,surprise);
  if(!applied.ok)return {ok:false,handled:false,stage:'battle-initialize-surprise',reason:applied.reason,context:clone(context)};
  const afterSurprise={...context,context:applied.context};
  const turn=turnRuntime.initialize(afterSurprise,{chargeEntries});
  if(!turn.ok)return {...turn,handled:false,stage:'battle-initialize-turn',context:clone(afterSurprise)};
  return {
    ...turn,
    ok:true,
    handled:true,
    stage:'battle-initialized',
    format:BROWSER_BATTLE_INITIALIZE_RUNTIME_FORMAT,
    action:ACTION_BATTLE_INITIALIZE,
    surprise:{
      result:surprise.result,
      fixedLuck:surprise.fixedLuck??null,
      surpriseRoll:surprise.surpriseRoll??null,
      side0Flag:turn.context.sides?.[0]?.flg??0,
      side1Flag:turn.context.sides?.[1]?.flg??0
    },
    context:turn.context,
    persistentMutation:false,
    damageExecuted:false
  };
}

function createBrowserBattleInitializeRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_INITIALIZE_RUNTIME_FORMAT,
    initialize:(context,options={})=>initializeBattle(context,options)
  };
}

export {
  BROWSER_BATTLE_INITIALIZE_RUNTIME_FORMAT,
  ACTION_BATTLE_INITIALIZE,
  initializeBattle,
  createBrowserBattleInitializeRuntime
};
