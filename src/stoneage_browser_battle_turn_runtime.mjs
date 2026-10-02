const BROWSER_BATTLE_TURN_RUNTIME_FORMAT='stoneage-browser-battle-turn-runtime-v1';
const ACTION_BATTLE_TURN_INITIALIZE='BATTLE_TURN_INITIALIZE';
const BATTLE_MODE_BATTLE=2;
const BATTLE_CHARMODE_C_WAIT=2;
const BATTLE_COM_NONE=0;
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const clone=value=>JSON.parse(JSON.stringify(value));
const n=value=>Number.isFinite(Number(value))?Number(value):0;
const trunc=value=>Math.trunc(Number(value));

function turnParam(entry,modKey,fixKey,lastKey){
  const mod=trunc(n(entry?.[modKey])*0.8);
  const next={...entry,[modKey]:mod};
  if(lastKey)next[lastKey]=trunc(n(entry?.[lastKey])+mod*0.01);
  return next;
}

function initializeBattleTurn(context,{chargeEntries=[]}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-turn',reason:'battle-context-required'};
  const c=clone(context);
  if(!Array.isArray(c.context.sides)||c.context.sides.length!==2)return {ok:false,handled:false,stage:'battle-turn',reason:'battle-context-sides-invalid'};
  c.context.mode='battle';
  c.context.sourceMode=BATTLE_MODE_BATTLE;
  c.context.turn=0;
  c.context.preCommandSequence='fixed-c-pre-command';
  let entriesProcessed=0;
  for(const side of c.context.sides){
    if(!Array.isArray(side.entries))continue;
    side.entries=side.entries.map((entry)=>{
      if(!entry)return null;
      entriesProcessed++;
      const slotKey=`${side.side}:${entry.battleSlot??0}`;
      const charged=Array.isArray(chargeEntries)&&chargeEntries.includes(slotKey);
      let next={...entry};
      next.guardian=-1;
      next.battleMode='c_wait';
      next.sourceBattleCharMode=BATTLE_CHARMODE_C_WAIT;
      if(!charged){
        const commands=Array.isArray(next.battleCommands)?next.battleCommands.slice():[-1,-1,-1];
        const previousCommand=trunc(n(commands[0]));
        commands[0]=BATTLE_COM_NONE;
        if(previousCommand===1014)commands[2]=0;
        next.battleCommands=commands;
      }
      next.noguardDuckBonus=0;
      next.noguardCounterBonus=0;
      next.noguardCriticalBonus=0;
      next.noguardSourceSkillId=null;
      next=turnParam(next,'modAttack','fixStr','attackPower');
      next=turnParam(next,'modDefence','fixTgh','defencePower');
      next=turnParam(next,'modQuick','fixDex','quick');
      if(next.battleSide===0&&Object.prototype.hasOwnProperty.call(next,'modCharm')){
        next=turnParam(next,'modCharm',null,'fixCharm');
        next=turnParam(next,'modCharm',null,null);
      }else if(Object.prototype.hasOwnProperty.call(next,'modCharm')){
        next=turnParam(next,'modCharm',null,null);
      }
      return next;
    });
  }
  return {
    ok:true,
    handled:true,
    stage:'battle-turn-initialized',
    format:BROWSER_BATTLE_TURN_RUNTIME_FORMAT,
    action:ACTION_BATTLE_TURN_INITIALIZE,
    context:c.context,
    entriesProcessed,
    rngConsumedCount:0,
    persistentMutation:false,
    battleStarted:true,
    surpriseResolved:false,
    sourceBoundary:'BATTLE_Init -> BATTLE_PreCommandSeq after SurpriseCheck; surprise RNG is intentionally handled separately'
  };
}

function createBrowserBattleTurnRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_TURN_RUNTIME_FORMAT,
    initialize:(context,options={})=>initializeBattleTurn(context,options)
  };
}

export {
  BROWSER_BATTLE_TURN_RUNTIME_FORMAT,
  ACTION_BATTLE_TURN_INITIALIZE,
  BATTLE_MODE_BATTLE,
  BATTLE_CHARMODE_C_WAIT,
  BATTLE_COM_NONE,
  turnParam,
  initializeBattleTurn,
  createBrowserBattleTurnRuntime
};
