const BROWSER_BATTLE_PROFIT_ROUTE_RUNTIME_FORMAT='stoneage-v410-browser-battle-profit-route-v1';
const ACTION_BATTLE_PROFIT_ROUTE_PLAN='BATTLE_PROFIT_ROUTE_PLAN';

const int=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):null;
};

function planBattleProfitRoute(context,{dpbattle=null}={}){
  if(!context?.context){
    return {ok:false,handled:false,stage:'battle-profit-route',reason:'battle-context-required'};
  }
  const value=int(dpbattle??context.context.dpbattle);
  if(value==null){
    return {ok:false,handled:false,stage:'battle-profit-route',reason:'dpbattle-required'};
  }
  if(value!==0&&value!==1){
    return {ok:false,handled:false,stage:'battle-profit-route',reason:'dpbattle-invalid',dpbattle:value};
  }

  const route=value===1?'duel-point':'exp-gold';
  return {
    ok:true,
    handled:true,
    stage:'battle-profit-route-planned',
    format:BROWSER_BATTLE_PROFIT_ROUTE_RUNTIME_FORMAT,
    action:ACTION_BATTLE_PROFIT_ROUTE_PLAN,
    dpbattle:value,
    route,
    fixedCFunction:value===1?'BATTLE_GetDuelPoint':'BATTLE_GetExpGold',
    mutation:false,
    persistentMutation:false,
    hpMutation:false,
    rewardMutation:false,
    nextAction:value===1?'BATTLE_DUEL_POINT_PLAN':'BATTLE_EXP_GOLD_PLAN',
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      function:'BATTLE_GetProfit',
      routing:'dpbattle == 1 ? BATTLE_GetDuelPoint : BATTLE_GetExpGold'
    }
  };
}

function createBrowserBattleProfitRouteRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_PROFIT_ROUTE_RUNTIME_FORMAT,
    plan:(context,options={})=>planBattleProfitRoute(context,options)
  };
}

export {
  BROWSER_BATTLE_PROFIT_ROUTE_RUNTIME_FORMAT,
  ACTION_BATTLE_PROFIT_ROUTE_PLAN,
  planBattleProfitRoute,
  createBrowserBattleProfitRouteRuntime
};
