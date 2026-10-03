const BROWSER_BATTLE_DEX_RUNTIME_FORMAT='stoneage-v459-browser-battle-dex-v1';
const ACTION_BATTLE_DEX_RESOLVE='BATTLE_DEX_RESOLVE';

const clone=value=>JSON.parse(JSON.stringify(value));
const int=value=>{if(value==null||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)?Math.trunc(n):null;};
const num=value=>{if(value==null||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)?n:null;};

function resolveBattleDex({
  quick=null,
  command='attack',
  throwWeapon=false,
  ridePetQuickAdjustment=null,
  roll=null
}={}){
  const baseQuick=num(quick);
  if(baseQuick==null)return {ok:false,handled:false,stage:'battle-dex',action:ACTION_BATTLE_DEX_RESOLVE,reason:'battle-quick-required'};
  const adjustedQuick=ridePetQuickAdjustment?.value!=null
    ? num(ridePetQuickAdjustment.value)
    : baseQuick;
  if(adjustedQuick==null)return {ok:false,handled:false,stage:'battle-dex',action:ACTION_BATTLE_DEX_RESOLVE,reason:'battle-adjusted-quick-invalid'};
  const work=adjustedQuick+20;
  const upper=Math.max(0,Math.floor(work*0.3));
  const r=int(roll);
  if(r==null||r<0||r>upper){
    return {ok:false,handled:false,stage:'battle-dex',action:ACTION_BATTLE_DEX_RESOLVE,reason:'battle-dex-rng-required-or-out-of-range',minimum:0,maximum:upper,roll:r};
  }
  const dex=Math.max(1,Math.trunc(work-r));
  return {
    ok:true,handled:true,stage:'battle-dex-resolved',
    format:BROWSER_BATTLE_DEX_RUNTIME_FORMAT,
    action:ACTION_BATTLE_DEX_RESOLVE,
    command:String(command??'').trim().toLowerCase(),
    throwWeapon:throwWeapon===true,
    quick:baseQuick,
    adjustedQuick,
    work,
    randomUpper:upper,
    roll:r,
    dex,
    ridePetQuickAdjustment:ridePetQuickAdjustment?clone(ridePetQuickAdjustment):null,
    rngConsumed:1,
    persistentMutation:false,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      function:'BATTLE_DexCalc',
      random:'RAND(0, work * 0.3)',
      ridePetFunction:'BATTLE_adjustRidePet3A'
    }
  };
}

function createBrowserBattleDexRuntime(){
  return {ok:true,format:BROWSER_BATTLE_DEX_RUNTIME_FORMAT,resolve:resolveBattleDex};
}

export {BROWSER_BATTLE_DEX_RUNTIME_FORMAT,ACTION_BATTLE_DEX_RESOLVE,resolveBattleDex,createBrowserBattleDexRuntime};
