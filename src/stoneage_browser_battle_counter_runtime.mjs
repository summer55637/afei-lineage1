const BROWSER_BATTLE_COUNTER_RUNTIME_FORMAT='stoneage-v405-browser-battle-counter-v1';
const ACTION_BATTLE_COUNTER_PLAN='BATTLE_COUNTER_PLAN';

const BATTLE_COM_ATTACK=1;
const BATTLE_COM_S_NOGUARD=3;
const CHAR_BATTLEFLG_ABIO=64;
const COUNTER_PARA=0.08;
const COUNTER_ROLL_MAX=10000;

const WEAPON_CLASS={
  claw:0,
  axe:1,
  club:2,
  spear:3,
  bow:4,
  throw:5,
  other:6,
  none:0
};

const COUNTER_TABLE=[
  10,9,8,8,5,0,0,0,
  10,9,7,7,6,0,0,0,
  9,8,10,10,7,0,0,0,
  8,8,10,10,7,0,0,0,
  6,6,8,8,9,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0
];

const int=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?Math.trunc(n):null;
};
const num=(value,fallback=null)=>{
  if(value==null||String(value).trim()==='')return fallback;
  const n=Number(value);
  return Number.isFinite(n)?n:fallback;
};
const typeOf=e=>String(e?.sourceType??'').trim().toLowerCase();

function findEntry(context,bid){
  const b=int(bid);
  if(b==null||b<0||b>19)return null;
  const side=b>=10?1:0;
  const slot=b>=10?b-10:b;
  const s=context?.context?.sides?.find(x=>Number(x?.side)===side);
  return Array.isArray(s?.entries)?s.entries[slot]??null:null;
}

function weaponClassOf(value){
  if(value==null)return WEAPON_CLASS.claw;
  const key=String(value).trim().toLowerCase();
  return WEAPON_CLASS[key]??null;
}

function counterCalc(attacker,defender,{counterPara=COUNTER_PARA}={}){
  const atDex=num(attacker?.fixDex??attacker?.quick);
  const dfDexRaw=num(defender?.fixDex??defender?.quick);
  if(atDex==null||dfDexRaw==null)return {ok:false,reason:'fix-dex-required-for-counter'};
  let dfDex=dfDexRaw;
  let root=1;
  let divpara=num(counterPara,COUNTER_PARA);
  const atType=typeOf(attacker);
  const dfType=typeOf(defender);

  if(atType==='enemy'&&dfType==='pet'){
    divpara=10;
    root=0;
  }else if(atType==='pet'&&dfType==='enemy'){
    dfDex*=0.8;
  }else if(atType!=='player'&&dfType==='player'){
    divpara=10;
    root=0;
  }else if(atType==='player'&&dfType!=='player'){
    dfDex*=0.6;
  }

  let big,small,wari;
  if(atDex>=dfDex){
    big=atDex;small=dfDex;wari=1;
  }else{
    big=dfDex;small=atDex;wari=big<=0?0:small/big;
  }
  let work=(big-small)/divpara;
  if(work<=0)work=0;
  let per=(root===1?Math.sqrt(work):work)*wari;
  return {ok:true,per,atDex,dfDex,root,divpara,wari,work};
}

function counterCheck(context,{
  attackerBid=null,
  targetBid=null,
  attackerCommand=null,
  attackerBattleFlg=0,
  attackerWeaponClass='claw',
  defenderWeaponClass='claw',
  attackerLuck=0,
  attackerCounterBonus=0,
  noguardCounterAdjust=0,
  counterRoll=null,
  counterPara=COUNTER_PARA,
  attackerDamageReact=false,
  defenderDamageReact=false
}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-counter',reason:'battle-context-required'};
  const attacker=findEntry(context,attackerBid);
  const defender=findEntry(context,targetBid);
  if(!attacker||!defender)return {ok:false,handled:false,stage:'battle-counter',reason:'attacker-or-defender-missing'};

  const hpA=num(attacker.hp),hpD=num(defender.hp);
  if(hpA==null||hpD==null)return {ok:false,handled:false,stage:'battle-counter',reason:'attacker-defender-hp-required'};
  if(hpA<=0)return {ok:true,handled:true,stage:'battle-counter-rejected',reason:'attacker-dead',canCounter:false,rngConsumed:0};
  if(hpD<=0)return {ok:true,handled:true,stage:'battle-counter-rejected',reason:'defender-dead',canCounter:false,rngConsumed:0};

  const command=int(attackerCommand??attacker?.battleCommands?.[0]);
  if(command!==BATTLE_COM_ATTACK&&command!==BATTLE_COM_S_NOGUARD)
    return {ok:true,handled:true,stage:'battle-counter-rejected',reason:'attacker-command-not-attack',canCounter:false,rngConsumed:0};

  const flags=int(attackerBattleFlg??attacker?.battleFlg)??0;
  if((flags&CHAR_BATTLEFLG_ABIO)!==0)
    return {ok:true,handled:true,stage:'battle-counter-rejected',reason:'attacker-abio-flag',canCounter:false,rngConsumed:0};

  const atWeapon=weaponClassOf(attackerWeaponClass);
  const dfWeapon=weaponClassOf(defenderWeaponClass);
  if(atWeapon==null||dfWeapon==null)
    return {ok:false,handled:false,stage:'battle-counter',reason:'weapon-class-invalid'};

  if(atWeapon===WEAPON_CLASS.throw||dfWeapon===WEAPON_CLASS.throw)
    return {
      ok:true,handled:true,stage:'battle-counter-rejected',
      reason:'throw-weapon',
      canCounter:false,
      attackerWeaponClass:attackerWeaponClass,
      defenderWeaponClass:defenderWeaponClass,
      rngConsumed:0
    };

  const calc=counterCalc(attacker,defender,{counterPara});
  if(!calc.ok)return {...calc,handled:false,stage:'battle-counter'};

  const tableValue=COUNTER_TABLE[atWeapon*8+dfWeapon]??0;
  const luck=typeOf(attacker)==='player'?num(attackerLuck,0):0;
  let par=calc.per*tableValue*0.1+luck+num(attackerCounterBonus,0);
  if(command===BATTLE_COM_S_NOGUARD)par+=num(noguardCounterAdjust,0);
  if(par>100)par=100;
  if(par<=0)par=1;

  const finalRoll=int(counterRoll);
  if(finalRoll==null||finalRoll<1||finalRoll>COUNTER_ROLL_MAX){
    return {
      ok:false,handled:false,stage:'battle-counter',
      reason:'counter-rng-required-or-out-of-range',
      probabilityPercent:par
    };
  }

  const triggered=finalRoll<=par*100;
  const reactSuppressed=attackerDamageReact===true||defenderDamageReact===true;

  return {
    ok:true,
    handled:true,
    stage:'battle-counter-plan-ready',
    format:BROWSER_BATTLE_COUNTER_RUNTIME_FORMAT,
    action:ACTION_BATTLE_COUNTER_PLAN,
    attackerBid:int(attackerBid),
    targetBid:int(targetBid),
    attackerWeaponClass:Object.keys(WEAPON_CLASS).find(k=>WEAPON_CLASS[k]===atWeapon&&k!=='none')??'claw',
    defenderWeaponClass:Object.keys(WEAPON_CLASS).find(k=>WEAPON_CLASS[k]===dfWeapon&&k!=='none')??'claw',
    counterBase:calc.per,
    counterMatchValue:tableValue,
    attackerLuck:luck,
    attackerCounterBonus:num(attackerCounterBonus,0),
    noguardCounterAdjust:num(noguardCounterAdjust,0),
    probabilityPercent:par,
    probabilityBasis:par/100,
    roll:finalRoll,
    triggered,
    reactSuppressed,
    sourceReturnFlag:reactSuppressed?false:true,
    downstream:{
      attackSeqRequired:triggered,
      damageScale:0.75,
      minDamageAfterScale:1,
      damageReactMustRun:true
    },
    rngConsumed:1,
    hpMutation:false,
    persistentMutation:false,
    damageExecuted:false,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66cde77a5a8ccd98b66c56',
      functions:['BATTLE_CounterCheck','BATTLE_CounterCalc','BATTLE_Counter']
    }
  };
}

function createBrowserBattleCounterRuntime(){
  return {ok:true,format:BROWSER_BATTLE_COUNTER_RUNTIME_FORMAT,plan:(context,options={})=>counterCheck(context,options)};
}

export {
  BROWSER_BATTLE_COUNTER_RUNTIME_FORMAT,
  ACTION_BATTLE_COUNTER_PLAN,
  COUNTER_PARA,
  COUNTER_TABLE,
  WEAPON_CLASS,
  counterCalc,
  counterCheck,
  createBrowserBattleCounterRuntime
};
