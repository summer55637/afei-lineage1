import { damagePlan } from './stoneage_browser_battle_damage_plan_runtime.mjs';

const BROWSER_BATTLE_CRITICAL_DAMAGE_RUNTIME_FORMAT='stoneage-v403-browser-battle-critical-damage-v1';
const ACTION_BATTLE_CRITICAL_DAMAGE_PLAN='BATTLE_CRITICAL_DAMAGE_PLAN';
const BATTLE_COM_GUARD=2;
const BATTLE_COM_S_MIGHTY=1006;
const GUARD_RATES=[
  [25,0.00],
  [50,0.10],
  [70,0.20],
  [85,0.30],
  [95,0.40],
  [100,0.50]
];

const clone=value=>JSON.parse(JSON.stringify(value));
const int=value=>{if(value==null||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)?Math.trunc(n):null;};
const num=(value,fallback=null)=>{if(value==null||String(value).trim()==='')return fallback;const n=Number(value);return Number.isFinite(n)?n:fallback;};

function findEntry(context,bid){
  const b=int(bid);
  if(b==null||b<0||b>19)return null;
  const side=b>=10?1:0;
  const slot=b>=10?b-10:b;
  const s=context?.context?.sides?.find(x=>Number(x?.side)===side);
  return Array.isArray(s?.entries)?s.entries[slot]??null:null;
}

function guardAdjust(damage,{guardRoll=null}={}){
  const r=int(guardRoll);
  if(r==null||r<1||r>100){
    return {ok:false,handled:false,stage:'battle-critical-damage-guard',reason:'guard-rng-required-or-out-of-range'};
  }
  const rate=GUARD_RATES.find(([max])=>r<=max)?.[1]??0.50;
  return {
    ok:true,
    damage:Math.trunc(damage*rate),
    guardRoll:r,
    rate,
    rngConsumed:1,
    source:'BATTLE_GuardAdjust'
  };
}

function runCriticalDamagePlan(context,{
  attackerBid=null,
  targetBid=null,
  damageRollNear=null,
  damageRollWide=null,
  fieldAtt=4,
  fieldAttrPower=0,
  includeAttr=true,
  critical=false,
  attackSeqPrelude=null,
  weaponType='none',
  guardRoll=null,
  lowDamageRoll=null,
  battleDamageModify=null
}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-critical-damage',reason:'battle-context-required'};
  const attacker=findEntry(context,attackerBid);
  const defender=findEntry(context,targetBid);
  if(!attacker||!defender)return {ok:false,handled:false,stage:'battle-critical-damage',reason:'attacker-or-defender-missing'};

  const base=damagePlan(context,{
    attackerBid,
    targetBid,
    damageRollNear,
    damageRollWide,
    fieldAtt,
    fieldAttrPower,
    includeAttr
  });
  if(!base.ok)return base;

  const preludeCritical=attackSeqPrelude?.critical?.critical===true;
  const isCritical=critical===true||preludeCritical;
  const normalizedWeaponType=String(weaponType??'none').trim().toLowerCase();

  let damage=base.damage;
  let criticalBonus=0;
  let criticalApplied=false;

  if(isCritical&&normalizedWeaponType!=='bow'){
    const attackerLevel=int(attacker.level);
    const defenderLevel=int(defender.level);
    const defenderPower=num(defender.defencePower);
    if(attackerLevel==null||defenderLevel==null||attackerLevel<=0||defenderLevel<=0||defenderPower==null){
      return {ok:false,handled:false,stage:'battle-critical-damage',reason:'critical-level-and-defence-power-required'};
    }
    criticalBonus=defenderPower*(attackerLevel/defenderLevel)*0.5;
    damage=Math.trunc(damage+criticalBonus);
    criticalApplied=true;
  }

  const firstDamage=damage;
  const defenderCommand=int(defender?.battleCommands?.[0]);
  const defenderConfusion=num(defender?.confusion??defender?.battleStatus?.confusion,0)??0;
  let guard=null;

  if(defenderCommand===BATTLE_COM_GUARD&&defenderConfusion<=0){
    guard=guardAdjust(damage,{guardRoll});
    if(!guard.ok)return guard;
    damage=guard.damage;
  }

  let lowDamageRollUsed=null;
  let lowDamageFallback=false;
  if(damage<1){
    const r=int(lowDamageRoll);
    if(r==null||r<0||r>1){
      return {ok:false,handled:false,stage:'battle-critical-damage',reason:'low-damage-rng-required-or-out-of-range'};
    }
    lowDamageRollUsed=r;
    lowDamageFallback=true;
    damage=r;
  }

  let modifier;
  if(int(attacker.battleCommands?.[0])===BATTLE_COM_S_MIGHTY){
    const packed=int(attacker.battleCommands?.[2]);
    if(packed==null)return {ok:false,handled:false,stage:'battle-critical-damage',reason:'mighty-command3-required'};
    modifier=(packed&0xffff)*0.01;
  }else{
    modifier=battleDamageModify==null?1:num(battleDamageModify);
    if(modifier==null)return {ok:false,handled:false,stage:'battle-critical-damage',reason:'battle-damage-modifier-invalid'};
  }
  const beforeModifier=damage;
  damage=Math.trunc(damage*modifier);

  return {
    ok:true,
    handled:true,
    stage:'battle-critical-damage-plan-ready',
    format:BROWSER_BATTLE_CRITICAL_DAMAGE_RUNTIME_FORMAT,
    action:ACTION_BATTLE_CRITICAL_DAMAGE_PLAN,
    attackerBid:int(attackerBid),
    targetBid:int(targetBid),
    baseDamage:base.damage,
    criticalRequested:isCritical,
    criticalApplied,
    weaponType:normalizedWeaponType,
    criticalBonus,
    damageBeforeGuard:firstDamage,
    guardApplied:guard!==null,
    guard,
    damageBeforeModifier:beforeModifier,
    damageModifier:modifier,
    damage,
    lowDamageFallback,
    lowDamageRollUsed,
    rngConsumed:base.rngConsumed+(guard?.rngConsumed??0)+(lowDamageFallback?1:0),
    persistentMutation:false,
    hpMutation:false,
    damageExecuted:false,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      critical:'BATTLE_CriDamageCalc',
      sequence:'BATTLE_AttackSeq'
    }
  };
}

function createBrowserBattleCriticalDamageRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_CRITICAL_DAMAGE_RUNTIME_FORMAT,
    plan:(context,options={})=>runCriticalDamagePlan(context,options)
  };
}

export {
  BROWSER_BATTLE_CRITICAL_DAMAGE_RUNTIME_FORMAT,
  ACTION_BATTLE_CRITICAL_DAMAGE_PLAN,
  BATTLE_COM_GUARD,
  guardAdjust,
  runCriticalDamagePlan,
  createBrowserBattleCriticalDamageRuntime
};
