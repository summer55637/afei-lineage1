const BROWSER_BATTLE_TARGET_RUNTIME_FORMAT='stoneage-browser-battle-target-runtime-v1';
const ACTION_BATTLE_TARGET_RESOLVE='BATTLE_TARGET_RESOLVE';
const BATTLE_ENTRY_MAX=10;
const SIDE_OFFSET=10;
const BATTLE_CHARMODE_RESCUE=5;
const TARGET_MIN=0;
const TARGET_MAX=19;

const clone=value=>JSON.parse(JSON.stringify(value));
const toInt=value=>{
  const s=String(value??'').trim();
  if(s==='')return null;
  const m=s.match(/^-?\d+/);
  return m?Number(m[0]):null;
};

function findEntryByBid(context,bid){
  const n=toInt(bid);
  if(n==null||n<TARGET_MIN||n>TARGET_MAX)return null;
  const side=n>=SIDE_OFFSET?context?.context?.sides?.find(x=>Number(x?.side)===1):context?.context?.sides?.find(x=>Number(x?.side)===0);
  const entries=Array.isArray(side?.entries)?side.entries:[];
  const slot=n>=SIDE_OFFSET?n-SIDE_OFFSET:n;
  return entries[slot]??null;
}

function battleTargetCheck(entry){
  if(!entry)return {ok:false,reason:'target-entry-missing'};
  if(toInt(entry.sourceBattleCharMode)===0)return {ok:false,reason:'target-battle-mode-none'};
  if(toInt(entry.sourceBattleCharMode)===BATTLE_CHARMODE_RESCUE)return {ok:false,reason:'target-in-rescue-mode'};
  if(entry.isAttacked===false||toInt(entry.isAttacked)===0)return {ok:false,reason:'target-not-attacked-eligible'};
  if(entry.isDead===true||entry.dead===true)return {ok:false,reason:'target-dead-flag'};
  if(toInt(entry.hp)!=null&&toInt(entry.hp)<=0)return {ok:false,reason:'target-hp-not-positive'};
  return {ok:true};
}

function resolveBattleTarget(context,{attackerBid=null,targetBid=null}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-target',reason:'battle-context-required'};
  const attacker= findEntryByBid(context,attackerBid);
  if(!attacker)return {ok:false,handled:false,stage:'battle-target',reason:'attacker-entry-missing-or-bid-invalid',attackerBid:toInt(attackerBid)};
  const target=toInt(targetBid);
  if(target==null||target<TARGET_MIN||target>TARGET_MAX)return {ok:false,handled:false,stage:'battle-target',reason:'target-bid-invalid',targetBid:target};
  const checked=battleTargetCheck(findEntryByBid(context,target));
  if(!checked.ok){
    return {
      ok:true,handled:true,stage:'battle-target-unresolved',
      format:BROWSER_BATTLE_TARGET_RUNTIME_FORMAT,
      action:ACTION_BATTLE_TARGET_RESOLVE,
      attackerBid:toInt(attackerBid),
      targetBid:target,
      targetResolved:false,
      targetCheck:checked,
      defaultAttackerRequired:true,
      defaultAttackerResolver:'BATTLE_DefaultAttacker',
      fallbackExecuted:false,
      persistentMutation:false,
      rngConsumed:false
    };
  }
  return {
    ok:true,handled:true,stage:'battle-target-resolved',
    format:BROWSER_BATTLE_TARGET_RUNTIME_FORMAT,
    action:ACTION_BATTLE_TARGET_RESOLVE,
    attackerBid:toInt(attackerBid),
    targetBid:target,
    targetResolved:true,
    targetCheck:{ok:true},
    targetList:[target,-1],
    executionTargetBid:target,
    defaultAttackerRequired:false,
    fallbackExecuted:false,
    persistentMutation:false,
    rngConsumed:false,
    damageExecuted:false
  };
}

function createBrowserBattleTargetRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_TARGET_RUNTIME_FORMAT,
    resolve:(context,options={})=>resolveBattleTarget(context,options)
  };
}

export {
  BROWSER_BATTLE_TARGET_RUNTIME_FORMAT,
  ACTION_BATTLE_TARGET_RESOLVE,
  BATTLE_ENTRY_MAX,
  SIDE_OFFSET,
  BATTLE_CHARMODE_RESCUE,
  TARGET_MIN,
  TARGET_MAX,
  battleTargetCheck,
  resolveBattleTarget,
  createBrowserBattleTargetRuntime
};
