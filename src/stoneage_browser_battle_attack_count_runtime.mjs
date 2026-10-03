const BROWSER_BATTLE_ATTACK_COUNT_RUNTIME_FORMAT='stoneage-v453-browser-battle-attack-count-v1';
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
  roll=null,
  actorType=null,
  level=null,
  luck=0,
  fallbackRoll=null,
  fallbackAttackRoll=null
}={}){
  if(itemPresent!==true){
    const type=String(actorType??'').trim().toLowerCase();
    const lv=int(level);
    if(type==='player'&&lv!=null&&lv>=10){
      let luckWork=(int(luck)??0)*5;
      if(luckWork>25)luckWork=25;
      const first=int(fallbackRoll);
      if(first==null||first<1||first>1000){
        return {ok:false,handled:false,stage:'battle-attack-count',action:ACTION_BATTLE_ATTACK_COUNT_RESOLVE,
          reason:'unarmed-player-attack-count-rng-required-or-out-of-range',minimum:1,maximum:1000,roll:first,luckWork};
      }
      if(first<=10+luckWork){
        const second=int(fallbackAttackRoll);
        if(second==null||second<5||second>10){
          return {ok:false,handled:false,stage:'battle-attack-count',action:ACTION_BATTLE_ATTACK_COUNT_RESOLVE,
            reason:'unarmed-player-attack-count-extra-rng-required-or-out-of-range',minimum:5,maximum:10,roll:second,firstRoll:first,luckWork};
        }
        return {ok:true,handled:true,stage:'battle-attack-count-unarmed-player-resolved',
          format:BROWSER_BATTLE_ATTACK_COUNT_RUNTIME_FORMAT,action:ACTION_BATTLE_ATTACK_COUNT_RESOLVE,
          attackCount:second,rngConsumed:2,sourceItemPresent:false,sourceAttackCount:0,
          source:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66ca1',function:'BATTLE_GetAttackCount',
            fallback:'PLAYER level>=10 no CHAR_ARM: RAND(1,1000), then RAND(5,10) when threshold passes'},
          unarmedPlayer:{level:lv,luck:int(luck)??0,luckWork,firstRoll:first,secondRoll:second,damageDivisor:1}};
      }
      const attackCount=first<=30+luckWork?3:first<=70+luckWork?2:1;
      return {ok:true,handled:true,stage:'battle-attack-count-unarmed-player-resolved',
        format:BROWSER_BATTLE_ATTACK_COUNT_RUNTIME_FORMAT,action:ACTION_BATTLE_ATTACK_COUNT_RESOLVE,
        attackCount,rngConsumed:1,sourceItemPresent:false,sourceAttackCount:0,
        source:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66ca1',function:'BATTLE_GetAttackCount',
          fallback:'PLAYER level>=10 no CHAR_ARM: threshold table from RAND(1,1000)'},
        unarmedPlayer:{level:lv,luck:int(luck)??0,luckWork,firstRoll:first,secondRoll:null,damageDivisor:1}};
    }
    if(type){
      return {ok:true,handled:true,stage:'battle-attack-count-no-item-fallback',
        format:BROWSER_BATTLE_ATTACK_COUNT_RUNTIME_FORMAT,action:ACTION_BATTLE_ATTACK_COUNT_RESOLVE,
        attackCount:1,rngConsumed:0,sourceItemPresent:false,sourceAttackCount:0,
        source:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66ca1',
          function:'BATTLE_GetAttackCount',fallback:'non-player or PLAYER level<10 -> attack_max=1'}};
    }
    return {ok:true,handled:true,stage:'battle-attack-count-no-item',
      format:BROWSER_BATTLE_ATTACK_COUNT_RUNTIME_FORMAT,action:ACTION_BATTLE_ATTACK_COUNT_RESOLVE,
      attackCount:0,rngConsumed:0,sourceItemPresent:false};
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
