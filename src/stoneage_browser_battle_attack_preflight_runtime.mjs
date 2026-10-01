const BROWSER_BATTLE_ATTACK_PREFLIGHT_RUNTIME_FORMAT='stoneage-browser-battle-attack-preflight-runtime-v1';
const ACTION_BATTLE_ATTACK_PREFLIGHT='BATTLE_ATTACK_PREFLIGHT';
const BATTLE_COM_ATTACK=1;
const BATTLE_COM_BOOMERANG=8;
const SIDE_OFFSET=10;
import { resolveDefaultTarget } from './stoneage_browser_battle_default_target_runtime.mjs';

const clone=value=>JSON.parse(JSON.stringify(value));
const toInt=value=>{
  const s=String(value??'').trim();
  if(s==='')return null;
  const m=s.match(/^-?\d+/);
  return m?Number(m[0]):null;
};

function findEntryByBid(context,bid){
  const n=toInt(bid);
  if(n==null||n<0||n>19)return null;
  const side=n>=SIDE_OFFSET
    ? context?.context?.sides?.find(x=>Number(x?.side)===1)
    : context?.context?.sides?.find(x=>Number(x?.side)===0);
  const slot=n>=SIDE_OFFSET?n-SIDE_OFFSET:n;
  return Array.isArray(side?.entries)?side.entries[slot]??null:null;
}

function resolveAttackExecutionTarget(context,{attackerBid=null,targetBid=null,defaultTargetRoll=null}={}){
  const attackerN=toInt(attackerBid),targetN=toInt(targetBid);
  const attacker=findEntryByBid(context,attackerN);
  if(!attacker)return {ok:false,handled:false,stage:'battle-attack-preflight',reason:'attacker-entry-missing-or-bid-invalid',attackerBid:attackerN};
  if(toInt(attacker.hp)!=null&&toInt(attacker.hp)<=0)return {ok:false,handled:false,stage:'battle-attack-preflight',reason:'attacker-hp-not-positive',attackerBid:attackerN};

  const target=findEntryByBid(context,targetN);
  if(!target){
    return {ok:false,handled:false,stage:'battle-attack-preflight',reason:'target-entry-missing-or-bid-invalid',attackerBid:attackerN,targetBid:targetN};
  }

  let finalTargetBid=targetN;
  let targetSource='explicit-target';
  const targetEligible=(
    toInt(target.sourceBattleCharMode)!==0 &&
    toInt(target.sourceBattleCharMode)!==5 &&
    target.isAttacked!==false &&
    toInt(target.isAttacked)!==0 &&
    target.isDead!==true &&
    target.dead!==true &&
    !(toInt(target.hp)!=null&&toInt(target.hp)<=0)
  );
  if(!targetEligible){
    const attackerSide=attackerN>=SIDE_OFFSET?1:0;
    const fallbackSide=1-attackerSide;
    const fallback=resolveDefaultTarget(context,{side:fallbackSide,defaultTargetRoll});
    if(!fallback.ok){
      return {
        ok:false,handled:false,stage:'battle-attack-preflight',
        reason:fallback.reason??'default-target-resolution-failed',
        attackerBid:attackerN,
        requestedTargetBid:targetN,
        defaultAttackerRequired:true,
        defaultTarget:fallback,
        persistentMutation:false,
        rngConsumed:false
      };
    }
    if(fallback.defaultTargetResolved!==true){
      return {
        ok:true,handled:true,stage:'battle-attack-preflight-no-target',
        format:BROWSER_BATTLE_ATTACK_PREFLIGHT_RUNTIME_FORMAT,
        action:ACTION_BATTLE_ATTACK_PREFLIGHT,
        attackerBid:attackerN,
        requestedTargetBid:targetN,
        finalTargetBid:-1,
        targetResolved:false,
        defaultAttackerRequired:true,
        defaultTarget:fallback,
        sourceTargetAdjust:true,
        persistentMutation:false,
        rngConsumed:fallback.rngConsumed===true,
        damageExecuted:false
      };
    }
    finalTargetBid=fallback.selectedBid;
    targetSource='default-attacker';
    const fallbackTarget=findEntryByBid(context,finalTargetBid);
    if(!fallbackTarget||toInt(fallbackTarget.hp)==null||toInt(fallbackTarget.hp)<=0){
      return {
        ok:false,handled:false,stage:'battle-attack-preflight',
        reason:'default-target-selected-but-not-attackable',
        attackerBid:attackerN,
        selectedTargetBid:finalTargetBid,
        defaultTarget:fallback,
        persistentMutation:false,
        rngConsumed:true
      };
    }
    const damageReactAttacker=Math.max(0,toInt(attacker.damageReact)??0);
    const damageReactTarget=Math.max(0,toInt(fallbackTarget.damageReact)??0);
    return {
      ok:true,handled:true,stage:'battle-attack-preflight-ready',
      format:BROWSER_BATTLE_ATTACK_PREFLIGHT_RUNTIME_FORMAT,
      action:ACTION_BATTLE_ATTACK_PREFLIGHT,
      attackerBid:attackerN,
      requestedTargetBid:targetN,
      finalTargetBid,
      targetResolved:true,
      targetSource,
      sourceTargetAdjust:true,
      attackerHp:toInt(attacker.hp),
      targetHp:toInt(fallbackTarget.hp),
      damageReactSuppressed:damageReactAttacker>0||damageReactTarget>0,
      damageReact:{attacker:damageReactAttacker,target:damageReactTarget},
      fixedC:{
        attackerHpGate:true,
        targetHpGate:true,
        damageReactSetsIRetFalseButAttackSeqStillRuns:damageReactAttacker>0||damageReactTarget>0
      },
      defaultTarget:fallback,
      rngConsumed:true,
      persistentMutation:false,
      damageExecuted:false
    };
  }

  const damageReactAttacker=Math.max(0,toInt(attacker.damageReact)??0);
  const damageReactTarget=Math.max(0,toInt(target.damageReact)??0);

  return {
    ok:true,handled:true,stage:'battle-attack-preflight-ready',
    format:BROWSER_BATTLE_ATTACK_PREFLIGHT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_ATTACK_PREFLIGHT,
    attackerBid:attackerN,
    requestedTargetBid:targetN,
    finalTargetBid,
    targetResolved:true,
    targetSource,
    sourceTargetAdjust:true,
    attackerHp:toInt(attacker.hp),
    targetHp:toInt(target.hp),
    damageReactSuppressed:damageReactAttacker>0||damageReactTarget>0,
    damageReact:{
      attacker:damageReactAttacker,
      target:damageReactTarget
    },
    fixedC:{
      attackerHpGate:true,
      targetHpGate:true,
      damageReactSetsIRetFalseButAttackSeqStillRuns:damageReactAttacker>0||damageReactTarget>0
    },
    rngConsumed:false,
    persistentMutation:false,
    damageExecuted:false
  };
}

function createBrowserBattleAttackPreflightRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_ATTACK_PREFLIGHT_RUNTIME_FORMAT,
    preflight:(context,options={})=>resolveAttackExecutionTarget(context,options)
  };
}

export {
  BROWSER_BATTLE_ATTACK_PREFLIGHT_RUNTIME_FORMAT,
  ACTION_BATTLE_ATTACK_PREFLIGHT,
  BATTLE_COM_ATTACK,
  BATTLE_COM_BOOMERANG,
  resolveAttackExecutionTarget,
  createBrowserBattleAttackPreflightRuntime
};
