const BROWSER_BATTLE_SURPRISE_RUNTIME_FORMAT='stoneage-browser-battle-surprise-runtime-v1';
const ACTION_BATTLE_SURPRISE_CHECK='BATTLE_SURPRISE_CHECK';
const BATTLE_TYPE_P_VS_E=1;
const BSIDE_FLG_SURPRISE=1;
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const clampLuck=value=>Math.trunc(Math.max(0,Math.min(5,Number(value))));
const toInt=value=>{const s=String(value??'').trim();if(s==='')return null;const m=s.match(/^[+-]?\d+/);return m?Number(m[0]):null;};

function surpriseThresholds(fixedLuck){
  const luck=clampLuck(fixedLuck);
  switch(luck){
    case 5:return {fixedLuck:luck,a:20,b:0};
    case 4:return {fixedLuck:luck,a:15,b:2};
    case 3:return {fixedLuck:luck,a:10,b:3};
    case 2:return {fixedLuck:luck,a:5,b:5};
    default:return {fixedLuck:luck,a:0,b:7};
  }
}

function surpriseCheck({battleType=BATTLE_TYPE_P_VS_E,fixedLuck=null,surpriseRoll=null,winFuncPresent=false,playerPresent=true}={}){
  if(battleType!==BATTLE_TYPE_P_VS_E)return {ok:true,handled:true,stage:'surprise-not-applicable',format:BROWSER_BATTLE_SURPRISE_RUNTIME_FORMAT,action:ACTION_BATTLE_SURPRISE_CHECK,result:0,rngConsumed:false,side0FlagDelta:0,side1FlagDelta:0};
  if(playerPresent!==true)return {ok:true,handled:true,stage:'surprise-player-missing-fallback',format:BROWSER_BATTLE_SURPRISE_RUNTIME_FORMAT,action:ACTION_BATTLE_SURPRISE_CHECK,result:0,rngConsumed:false,side0FlagDelta:0,side1FlagDelta:0};
  if(winFuncPresent===true)return {ok:true,handled:true,stage:'surprise-winfunc-blocked',format:BROWSER_BATTLE_SURPRISE_RUNTIME_FORMAT,action:ACTION_BATTLE_SURPRISE_CHECK,result:0,rngConsumed:false,side0FlagDelta:0,side1FlagDelta:0};
  if(fixedLuck==null||!Number.isFinite(Number(fixedLuck)))return {ok:false,handled:false,stage:'surprise-check',reason:'fixed-luck-required'};
  const roll=toInt(surpriseRoll);
  if(roll==null||roll<1||roll>100)return {ok:false,handled:false,stage:'surprise-check',reason:'surprise-rng-required-or-out-of-range',surpriseRoll:roll};
  const t=surpriseThresholds(fixedLuck);
  let result=0;
  if(roll<=t.a)result=1;
  else if(roll<t.a+t.b)result=2;
  const side0FlagDelta=result===2?BSIDE_FLG_SURPRISE:0;
  const side1FlagDelta=result===1?BSIDE_FLG_SURPRISE:0;
  return {
    ok:true,handled:true,stage:'surprise-checked',
    format:BROWSER_BATTLE_SURPRISE_RUNTIME_FORMAT,
    action:ACTION_BATTLE_SURPRISE_CHECK,
    result,
    fixedLuck:t.fixedLuck,
    a:t.a,b:t.b,
    surpriseRoll:roll,
    rngConsumed:true,
    sideFlags:{
      side0:{surprised:result===2,flagDelta:side0FlagDelta},
      side1:{surprised:result===1,flagDelta:side1FlagDelta}
    },
    persistentMutation:false,
    battleStarted:false,
    source:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF}
  };
}

function applySurpriseToBattleContext(context,result){
  if(!result?.ok)return {ok:false,reason:'surprise-result-required'};
  if(!context?.context)return {ok:false,reason:'battle-context-required'};
  const next=JSON.parse(JSON.stringify(context));
  next.context.surprise={
    result:result.result,
    fixedLuck:result.fixedLuck??null,
    surpriseRoll:result.surpriseRoll??null,
    sideFlags:{
      side0:Number(next.context.sides?.[0]?.flg??0)|(result.sideFlags?.side0?.flagDelta??0),
      side1:Number(next.context.sides?.[1]?.flg??0)|(result.sideFlags?.side1?.flagDelta??0)
    }
  };
  if(next.context.sides?.[0])next.context.sides[0].flg=next.context.surprise.sideFlags.side0;
  if(next.context.sides?.[1])next.context.sides[1].flg=next.context.surprise.sideFlags.side1;
  return {ok:true,context:next.context};
}

function createBrowserBattleSurpriseRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_SURPRISE_RUNTIME_FORMAT,
    check:(options={})=>surpriseCheck(options),
    apply:(context,result)=>applySurpriseToBattleContext(context,result)
  };
}

export {
  BROWSER_BATTLE_SURPRISE_RUNTIME_FORMAT,
  ACTION_BATTLE_SURPRISE_CHECK,
  BATTLE_TYPE_P_VS_E,
  BSIDE_FLG_SURPRISE,
  surpriseThresholds,
  surpriseCheck,
  applySurpriseToBattleContext,
  createBrowserBattleSurpriseRuntime
};
