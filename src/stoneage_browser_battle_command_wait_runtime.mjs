const BROWSER_BATTLE_COMMAND_WAIT_RUNTIME_FORMAT='stoneage-browser-battle-command-wait-runtime-v1';
const ACTION_BATTLE_COMMAND_WAIT_STATUS='BATTLE_COMMAND_WAIT_STATUS';
const BATTLE_S_TYPE_PLAYER=0;
const BATTLE_S_TYPE_ENEMY=1;
const BATTLE_CHARMODE_INIT=1;
const BATTLE_CHARMODE_C_WAIT=2;
const BATTLE_CHARMODE_C_OK=3;
const BATTLE_CHARMODE_RESCUE=5;
const BATTLE_CHARMODE_WATCHINIT=6;
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const clone=value=>JSON.parse(JSON.stringify(value));
const mode=value=>Number.isFinite(Number(value))?Math.trunc(Number(value)):null;

function commandWaitStatus(context,{timeoutExpired=false}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-command-wait',reason:'battle-context-required'};
  const sides=Array.isArray(context.context.sides)?context.context.sides:[];
  if(sides.length!==2)return {ok:false,handled:false,stage:'battle-command-wait',reason:'battle-context-sides-invalid'};
  const reports=[];
  let allReady=true;
  for(const side of sides){
    const type=mode(side?.type);
    const entries=Array.isArray(side?.entries)?side.entries:[];
    const playerSide=type===BATTLE_S_TYPE_PLAYER;
    const report={
      side:Number(side?.side??reports.length),
      type,
      autoReady:type===BATTLE_S_TYPE_ENEMY,
      ready:true,
      blockingEntries:[],
      cOkCount:0
    };
    if(!playerSide){
      reports.push(report);
      continue;
    }
    for(let i=0;i<entries.length;i++){
      const entry=entries[i];
      if(!entry)continue;
      const hp=mode(entry.hp);
      if(hp!=null&&hp<=0)continue;
      const charMode=mode(entry.sourceBattleCharMode);
      if(charMode===BATTLE_CHARMODE_C_OK){
        report.cOkCount++;
      }else if(charMode===BATTLE_CHARMODE_C_WAIT){
        report.ready=false;
        report.blockingEntries.push({
          battleSlot:mode(entry.battleSlot),
          bid:mode(entry.bid),
          characterId:String(entry.characterId??'').trim()||null
        });
      }else if([BATTLE_CHARMODE_INIT,BATTLE_CHARMODE_RESCUE,BATTLE_CHARMODE_WATCHINIT].includes(charMode)){
        // Fixed-C BATTLE_CommandWait() does not mark these modes as blocking.
      }
    }
    if(timeoutExpired===true)report.ready=true;
    if(!report.ready)allReady=false;
    reports.push(report);
  }
  if(timeoutExpired===true)allReady=true;
  return {
    ok:true,
    handled:true,
    stage:'battle-command-wait-status',
    format:BROWSER_BATTLE_COMMAND_WAIT_RUNTIME_FORMAT,
    action:ACTION_BATTLE_COMMAND_WAIT_STATUS,
    ready:allReady,
    timeoutExpired:timeoutExpired===true,
    sides:reports,
    sourceBoundary:'BATTLE_Command() -> BATTLE_CommandWait(side0) + BATTLE_CommandWait(side1)',
    mutation:false,
    rngConsumed:false,
    damageExecuted:false,
    source:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF}
  };
}

function createBrowserBattleCommandWaitRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_COMMAND_WAIT_RUNTIME_FORMAT,
    status:(context,options={})=>commandWaitStatus(context,options)
  };
}

export {
  BROWSER_BATTLE_COMMAND_WAIT_RUNTIME_FORMAT,
  ACTION_BATTLE_COMMAND_WAIT_STATUS,
  BATTLE_S_TYPE_PLAYER,
  BATTLE_S_TYPE_ENEMY,
  BATTLE_CHARMODE_INIT,
  BATTLE_CHARMODE_C_WAIT,
  BATTLE_CHARMODE_C_OK,
  BATTLE_CHARMODE_RESCUE,
  BATTLE_CHARMODE_WATCHINIT,
  commandWaitStatus,
  createBrowserBattleCommandWaitRuntime
};
