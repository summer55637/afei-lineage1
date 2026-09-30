const BROWSER_BATTLE_PLAYER_COMMAND_RUNTIME_FORMAT='stoneage-browser-battle-player-command-runtime-v1';
const ACTION_BATTLE_PLAYER_COMMAND_SET='BATTLE_PLAYER_COMMAND_SET';
const BATTLE_CHARMODE_C_WAIT=2;
const BATTLE_CHARMODE_C_OK=3;
const BATTLE_COM_NONE=0;
const BATTLE_COM_ATTACK=1;
const BATTLE_COM_GUARD=2;
const BATTLE_COM_CAPTURE=3;
const BATTLE_COM_ESCAPE=4;
const BATTLE_COM_PETIN=5;
const BATTLE_COM_PETOUT=6;
const BATTLE_COM_WAIT=11;
const BATTLE_COM_BOOMERANG=8;
const BATTLE_S_TYPE_PLAYER=0;
const TARGET_MIN=0;
const TARGET_MAX=19;

const clone=value=>JSON.parse(JSON.stringify(value));
const toInt=value=>{const s=String(value??'').trim();if(s==='')return null;const m=s.match(/^-?\d+/);return m?Number(m[0]):null;};

const COMMANDS=Object.freeze({
  attack:{type:'attack',command:BATTLE_COM_ATTACK,requiresTarget:true},
  guard:{type:'guard',command:BATTLE_COM_GUARD,requiresTarget:false},
  wait:{type:'wait',command:BATTLE_COM_WAIT,requiresTarget:false},
  escape:{type:'escape',command:BATTLE_COM_ESCAPE,requiresTarget:false},
  capture:{type:'capture',command:BATTLE_COM_CAPTURE,requiresTarget:true},
  pet_in:{type:'pet_in',command:BATTLE_COM_PETIN,requiresTarget:false},
  pet_out:{type:'pet_out',command:BATTLE_COM_PETOUT,requiresTarget:true}
});

function normalizeCommand(command,targetBid){
  const key=String(command??'').trim().toLowerCase();
  const spec=COMMANDS[key];
  if(!spec)return {ok:false,reason:'unsupported-player-battle-command',command:key};
  const target=targetBid==null?null:toInt(targetBid);
  if(spec.requiresTarget&&(target==null||target<TARGET_MIN||target>TARGET_MAX))return {ok:false,reason:'battle-command-target-required-or-out-of-range',command:key,targetBid:target};
  if(!spec.requiresTarget&&target!=null&&target!==-1)return {ok:false,reason:'battle-command-target-not-allowed',command:key,targetBid:target};
  return {ok:true,command:spec.type,commandCode:spec.command,targetBid:target};
}

function setBattlePlayerCommand(context,{
  battleSlot=0,command=null,targetBid=null,weaponKind=null,actorId=null
}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'battle-player-command',reason:'battle-context-required'};
  const sides=Array.isArray(context.context.sides)?context.context.sides:[];
  const side0=sides.find(x=>Number(x?.side)===0);
  const entries=Array.isArray(side0?.entries)?side0.entries:[];
  const slot=toInt(battleSlot);
  if(slot==null||slot<0||slot>=entries.length)return {ok:false,handled:false,stage:'battle-player-command',reason:'player-battle-slot-invalid'};
  const entry=entries[slot];
  if(!entry)return {ok:false,handled:false,stage:'battle-player-command',reason:'player-battle-entry-missing',battleSlot:slot};
  if(Number(entry.battleSide)!==BATTLE_S_TYPE_PLAYER)return {ok:false,handled:false,stage:'battle-player-command',reason:'battle-entry-not-player-side'};
  if(toInt(entry.hp)!=null&&toInt(entry.hp)<=0)return {ok:false,handled:false,stage:'battle-player-command',reason:'dead-player-entry-cannot-command'};
  if(Number(entry.sourceBattleCharMode)!==BATTLE_CHARMODE_C_WAIT)return {ok:false,handled:false,stage:'battle-player-command',reason:'player-entry-not-waiting-for-command',battleSlot:slot,mode:toInt(entry.sourceBattleCharMode)};
  const normalized=normalizeCommand(command,targetBid);
  if(!normalized.ok)return {ok:false,handled:false,stage:'battle-player-command',...normalized};
  const next=clone(context);
  const target=next.context.sides.find(x=>Number(x?.side)===0).entries[slot];
  target.battleCommands=Array.isArray(target.battleCommands)?target.battleCommands.slice():[-1,-1,-1];
  target.battleCommands[0]=normalized.commandCode;
  target.battleCommands[1]=normalized.targetBid??-1;
  if(normalized.command==='attack'&&String(weaponKind??'').toLowerCase()==='boomerang'){
    target.battleCommands[0]=BATTLE_COM_BOOMERANG;
  }
  if(normalized.command==='attack')target.battleCommands[2]=1;
  target.sourceBattleCharMode=BATTLE_CHARMODE_C_OK;
  target.battleMode='c_ok';
  return {
    ok:true,
    handled:true,
    stage:'battle-player-command-set',
    format:BROWSER_BATTLE_PLAYER_COMMAND_RUNTIME_FORMAT,
    action:ACTION_BATTLE_PLAYER_COMMAND_SET,
    battleContext:next.context,
    actor:{
      battleSlot:slot,
      bid:toInt(target.bid),
      characterId:String(target.characterId??actorId??'').trim()||null
    },
    command:{
      type:normalized.command,
      code:target.battleCommands[0],
      targetBid:target.battleCommands[1],
      command3:target.battleCommands[2]
    },
    persistentMutation:false,
    rngConsumed:false,
    damageExecuted:false
  };
}

function createBrowserBattlePlayerCommandRuntime(){
  return {
    ok:true,
    format:BROWSER_BATTLE_PLAYER_COMMAND_RUNTIME_FORMAT,
    set:(context,options={})=>setBattlePlayerCommand(context,options)
  };
}

export {
  BROWSER_BATTLE_PLAYER_COMMAND_RUNTIME_FORMAT,
  ACTION_BATTLE_PLAYER_COMMAND_SET,
  BATTLE_CHARMODE_C_WAIT,
  BATTLE_CHARMODE_C_OK,
  BATTLE_COM_NONE,
  BATTLE_COM_ATTACK,
  BATTLE_COM_GUARD,
  BATTLE_COM_CAPTURE,
  BATTLE_COM_ESCAPE,
  BATTLE_COM_PETIN,
  BATTLE_COM_PETOUT,
  BATTLE_COM_WAIT,
  BATTLE_COM_BOOMERANG,
  normalizeCommand,
  setBattlePlayerCommand,
  createBrowserBattlePlayerCommandRuntime
};
