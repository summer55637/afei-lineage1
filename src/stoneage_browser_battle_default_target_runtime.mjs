const BROWSER_BATTLE_DEFAULT_TARGET_RUNTIME_FORMAT='stoneage-browser-battle-default-target-runtime-v1';
const ACTION_BATTLE_DEFAULT_TARGET_RESOLVE='BATTLE_DEFAULT_TARGET_RESOLVE';
const BATTLE_ENTRY_MAX=10;
const SIDE_OFFSET=10;
const BATTLE_CHARMODE_RESCUE=5;
const TARGET_MIN=0;
const TARGET_MAX=19;

const toInt=value=>{
  const s=String(value??'').trim();
  if(s==='')return null;
  const m=s.match(/^-?\d+/);
  return m?Number(m[0]):null;
};

function findEntry(context,side,slot){
  const entries=Array.isArray(context?.context?.sides?.find(x=>Number(x?.side)===side)?.entries)
    ?context.context.sides.find(x=>Number(x?.side)===side).entries:[];
  return entries[slot]??null;
}

function targetCheck(entry){
  if(!entry)return {ok:false,reason:'target-entry-missing'};
  if(toInt(entry.sourceBattleCharMode)===0)return {ok:false,reason:'target-battle-mode-none'};
  if(toInt(entry.sourceBattleCharMode)===BATTLE_CHARMODE_RESCUE)return {ok:false,reason:'target-in-rescue-mode'};
  if(entry.isAttacked===false||toInt(entry.isAttacked)===0)return {ok:false,reason:'target-not-attacked-eligible'};
  if(entry.isDead===true||entry.dead===true)return {ok:false,reason:'target-dead-flag'};
  if(toInt(entry.hp)!=null&&toInt(entry.hp)<=0)return {ok:false,reason:'target-hp-not-positive'};
  return {ok:true};
}

function resolveDefaultTarget(context,{side=null,defaultTargetRoll=null}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-default-target',reason:'battle-context-required'};
  const targetSide=toInt(side);
  if(targetSide==null||targetSide<0||targetSide>1)return {ok:false,handled:false,stage:'battle-default-target',reason:'battle-side-invalid',side:targetSide};
  const candidates=[];
  for(let slot=0;slot<BATTLE_ENTRY_MAX;slot++){
    const bid=slot+targetSide*SIDE_OFFSET;
    const entry=findEntry(context,targetSide,slot);
    if(!entry)continue;
    const checked=targetCheck(entry);
    if(checked.ok)candidates.push({bid,slot,characterId:String(entry.characterId??'').trim()||null});
  }
  if(candidates.length===0)return {
    ok:true,handled:true,stage:'battle-default-target-none',
    format:BROWSER_BATTLE_DEFAULT_TARGET_RUNTIME_FORMAT,
    action:ACTION_BATTLE_DEFAULT_TARGET_RESOLVE,
    side:targetSide,
    candidates:[],
    selectedBid:-1,
    defaultTargetResolved:false,
    rngConsumed:false,
    persistentMutation:false
  };
  const roll=toInt(defaultTargetRoll);
  if(roll==null||roll<0||roll>=candidates.length)return {
    ok:false,handled:false,stage:'battle-default-target',
    reason:'default-target-rng-required-or-out-of-range',
    side:targetSide,candidateCount:candidates.length,defaultTargetRoll:roll,min:0,max:candidates.length-1
  };
  const selected=candidates[roll];
  return {
    ok:true,handled:true,stage:'battle-default-target-resolved',
    format:BROWSER_BATTLE_DEFAULT_TARGET_RUNTIME_FORMAT,
    action:ACTION_BATTLE_DEFAULT_TARGET_RESOLVE,
    side:targetSide,
    candidates,
    selection:roll,
    selectedBid:selected.bid,
    selectedCharacterId:selected.characterId,
    defaultTargetResolved:true,
    rngConsumed:true,
    persistentMutation:false,
    damageExecuted:false
  };
}

function createBrowserBattleDefaultTargetRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_DEFAULT_TARGET_RUNTIME_FORMAT,
    resolve:(context,options={})=>resolveDefaultTarget(context,options)
  };
}

export {
  BROWSER_BATTLE_DEFAULT_TARGET_RUNTIME_FORMAT,
  ACTION_BATTLE_DEFAULT_TARGET_RESOLVE,
  BATTLE_ENTRY_MAX,
  SIDE_OFFSET,
  BATTLE_CHARMODE_RESCUE,
  resolveDefaultTarget,
  createBrowserBattleDefaultTargetRuntime
};
