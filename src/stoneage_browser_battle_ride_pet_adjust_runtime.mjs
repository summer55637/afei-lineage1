const BROWSER_BATTLE_RIDE_PET_ADJUST_RUNTIME_FORMAT='stoneage-v458-browser-battle-ride-pet-adjust-v1';

const clone=value=>JSON.parse(JSON.stringify(value));
const num=value=>{if(value==null||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)?n: null;};

function adjustRidePetStats({
  character={},
  pet={},
  work='attack',
  action='attack',
  throwWeapon=false
}={}){
  const c=num(character?.value??character?.attackPower??character?.defencePower??character?.quick);
  const p=num(pet?.value??pet?.attackPower??pet?.defencePower??pet?.quick);
  if(c==null||p==null)return {ok:false,reason:'ride-pet-stat-values-required',work,action};
  const normalizedWork=String(work).trim().toLowerCase();
  const normalizedAction=String(action).trim().toLowerCase();
  let value=c;
  let formula=null;
  if(normalizedWork==='attack'){
    if(throwWeapon===true){
      value=c+p*0.4;
      formula='character*1.0 + ridePet*0.4';
    }else{
      value=c*0.8+p*0.8;
      formula='character*0.8 + ridePet*0.8';
    }
  }else if(normalizedWork==='defence'){
    value=c*0.7+p*0.7;
    formula='character*0.7 + ridePet*0.7';
  }else if(normalizedWork==='quick'){
    if(normalizedAction==='attack'){
      if(throwWeapon===true){
        value=c*0.8+p*0.2;
        formula='character*0.8 + ridePet*0.2';
      }else{
        value=c*0.2+p*0.8;
        formula='character*0.2 + ridePet*0.8';
      }
    }else if(normalizedAction==='defence'){
      value=c*0.1+p*0.9;
      formula='character*0.1 + ridePet*0.9';
    }else{
      value=c;
      formula='character';
    }
  }else{
    return {ok:false,reason:'unsupported-ride-pet-work',work};
  }
  return {
    ok:true,
    handled:true,
    format:BROWSER_BATTLE_RIDE_PET_ADJUST_RUNTIME_FORMAT,
    work:normalizedWork,
    action:normalizedAction,
    throwWeapon:throwWeapon===true,
    characterValue:c,
    ridePetValue:p,
    value,
    formula,
    rngConsumed:0,
    persistentMutation:false,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      function:'BATTLE_adjustRidePet3A',
      featureFlag:'_BATTLE_NEWPOWER'
    }
  };
}

function createBrowserBattleRidePetAdjustRuntime(){
  return {ok:true,format:BROWSER_BATTLE_RIDE_PET_ADJUST_RUNTIME_FORMAT,adjust:adjustRidePetStats};
}

export {BROWSER_BATTLE_RIDE_PET_ADJUST_RUNTIME_FORMAT,adjustRidePetStats,createBrowserBattleRidePetAdjustRuntime};
