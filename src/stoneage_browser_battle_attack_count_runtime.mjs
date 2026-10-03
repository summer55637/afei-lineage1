const BROWSER_BATTLE_ATTACK_COUNT_RUNTIME_FORMAT='stoneage-v449-browser-battle-attack-count-v1';
const ACTION_BATTLE_ATTACK_COUNT_RESOLVE='BATTLE_ATTACK_COUNT_RESOLVE';

const int=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)&&Number.isInteger(n)?n:null;
};

function resolveAttackCount({
  itemPresent=false,
  attackNumMin=null,
  attackNumMax=null,
  roll=null
}={}){
  if(itemPresent!==true){
    return {
      ok:true,handled:true,stage:'battle-attack-count-no-item',
      format:BROWSER_BATTLE_ATTACK_COUNT_RUNTIME_FORMAT,
      action:ACTION_BATTLE_ATTACK_COUNT_RESOLVE,
      attackCount:0,
      rngConsumed:0,
      sourceItemPresent:false
    };
  }

  const min=int(attackNumMin),max=int(attackNumMax);
  if(min==null||max==null||min>max){
    return {ok:false,handled:false,stage:'battle-attack-count',action:ACTION_BATTLE_ATTACK_COUNT_RESOLVE,reason:'attack-num-range-required'};
  }

  const r=int(roll);
  if(r==null||r<min||r>max){
    return {
      ok:false,handled:false,stage:'battle-attack-count',
      action:ACTION_BATTLE_ATTACK_COUNT_RESOLVE,
      reason:'attack-num-rng-required-or-out-of-range',
      minimum:min,maximum:max,roll:r
    };
  }

  const count=r<=0?1:r;
  return {
    ok:true,
    handled:true,
    stage:'battle-attack-count-resolved',
    format:BROWSER_BATTLE_ATTACK_COUNT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_ATTACK_COUNT_RESOLVE,
    attackNumMin:min,
    attackNumMax:max,
    roll:r,
    attackCount:count,
    rngConsumed:1,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      function:'BATTLE_GetAttackCount',
      rule:'RAND(ITEM_ATTACKNUM_MIN, ITEM_ATTACKNUM_MAX); non-positive result becomes 1'
    }
  };
}

function createBrowserBattleAttackCountRuntime(){
  return {ok:true,format:BROWSER_BATTLE_ATTACK_COUNT_RUNTIME_FORMAT,resolve:(options={})=>resolveAttackCount(options)};
}

export {
  BROWSER_BATTLE_ATTACK_COUNT_RUNTIME_FORMAT,
  ACTION_BATTLE_ATTACK_COUNT_RESOLVE,
  resolveAttackCount,
  createBrowserBattleAttackCountRuntime
};
