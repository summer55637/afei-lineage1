const BROWSER_BATTLE_CHARGE_RUNTIME_FORMAT='stoneage-v439-browser-battle-charge-runtime-v1';
const ACTION_BATTLE_CHARGE_STEP='BATTLE_CHARGE_STEP';
const BATTLE_MODE_BATTLE=2;
const BATTLE_COM_S_CHARGE=1005;
const BATTLE_COM_S_CHARGE_OK=1015;
const CHARGE_ROUNDS_MASK=0xffff;

const clone=value=>JSON.parse(JSON.stringify(value));
const int=value=>{
  if(value==null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)&&Number.isInteger(n)?n:null;
};
function findEntryByBid(context,bid){
  const b=int(bid);
  if(b==null||b<0||b>19)return null;
  const side=b>=10?1:0,slot=b>=10?b-10:b;
  const row=context?.context?.sides?.find(x=>int(x?.side)===side);
  return Array.isArray(row?.entries)?row.entries[slot]??null:null;
}
function unpackCharge(command3){
  const packed=int(command3);
  if(packed==null||packed<0)return {ok:false,reason:'battle-charge-command3-invalid'};
  const rounds=packed&CHARGE_ROUNDS_MASK;
  const attackPercent=Math.floor(packed/65536);
  if(attackPercent<0||attackPercent>65535)return {ok:false,reason:'battle-charge-attack-percent-invalid'};
  return {ok:true,rounds,attackPercent,packed};
}
function advanceChargeCommand(context,{actorBid=null}={}){
  if(!context||typeof context!=='object'||!context.context||typeof context.context!=='object')
    return {ok:false,handled:false,stage:'battle-charge',reason:'battle-context-required'};
  if(String(context.context.mode??'').trim().toLowerCase()!=='battle'||int(context.context.sourceMode)!==BATTLE_MODE_BATTLE)
    return {ok:false,handled:false,stage:'battle-charge',reason:'battle-active-phase-required'};
  const actor=findEntryByBid(context,actorBid);
  if(!actor)return {ok:false,handled:false,stage:'battle-charge',reason:'battle-charge-actor-missing',actorBid:int(actorBid)};
  if(int(actor.battleCommands?.[0])!==BATTLE_COM_S_CHARGE)
    return {ok:false,handled:false,stage:'battle-charge',reason:'battle-charge-command-required',actorBid:int(actorBid),command:int(actor.battleCommands?.[0])};
  if(actor.isDie===true||actor.dead===true||(int(actor.hp)!=null&&int(actor.hp)<=0))
    return {ok:false,handled:false,stage:'battle-charge',reason:'battle-charge-actor-dead',actorBid:int(actorBid)};
  const packed=unpackCharge(actor.battleCommands?.[2]);
  if(!packed.ok)return {...packed,handled:false,stage:'battle-charge',actorBid:int(actorBid)};
  const next=clone(context);
  const nextActor=findEntryByBid(next,actorBid);
  const commands=Array.isArray(nextActor.battleCommands)?nextActor.battleCommands.slice():[-1,-1,-1];
  if(packed.rounds>0){
    const remaining=packed.rounds-1;
    commands[2]=packed.attackPercent*65536+remaining;
    nextActor.battleCommands=commands;
    nextActor.sourceChargeRounds=remaining;
    return {ok:true,handled:true,stage:'battle-charge-holding',format:BROWSER_BATTLE_CHARGE_RUNTIME_FORMAT,action:ACTION_BATTLE_CHARGE_STEP,actorBid:int(actorBid),remainingRounds:remaining,attackPercent:packed.attackPercent,command:BATTLE_COM_S_CHARGE,attackReady:false,context:next.context,rngConsumed:0,persistentMutation:false,damageExecuted:false,sourceOrder:'BATTLE_Charge: decrement LOW(COM3), then BATTLE_NoAction'};
  }
  const fixStr=int(nextActor.fixStr);
  if(fixStr==null)return {ok:false,handled:false,stage:'battle-charge',reason:'battle-charge-fix-str-required',actorBid:int(actorBid)};
  const modAttack=int(nextActor.modAttack)??0;
  const chargedBase=Math.trunc(fixStr+fixStr*packed.attackPercent*0.01);
  const attackPower=chargedBase+modAttack;
  commands[0]=BATTLE_COM_S_CHARGE_OK;
  commands[2]=packed.packed;
  nextActor.battleCommands=commands;
  nextActor.attackPower=attackPower;
  nextActor.sourceChargeRounds=0;
  nextActor.sourceChargeAttackPercent=packed.attackPercent;
  return {ok:true,handled:true,stage:'battle-charge-ready',format:BROWSER_BATTLE_CHARGE_RUNTIME_FORMAT,action:ACTION_BATTLE_CHARGE_STEP,actorBid:int(actorBid),remainingRounds:0,attackPercent:packed.attackPercent,attackPower,command:BATTLE_COM_S_CHARGE_OK,attackReady:true,context:next.context,rngConsumed:0,persistentMutation:false,damageExecuted:false,sourceOrder:'BATTLE_Charge: FIXSTR + FIXSTR * N * 0.01 + MODATTACK'};
}
function createBrowserBattleChargeRuntime(){
  return {ok:true,format:BROWSER_BATTLE_CHARGE_RUNTIME_FORMAT,advance:advanceChargeCommand};
}
export {BROWSER_BATTLE_CHARGE_RUNTIME_FORMAT,ACTION_BATTLE_CHARGE_STEP,BATTLE_COM_S_CHARGE,BATTLE_COM_S_CHARGE_OK,unpackCharge,advanceChargeCommand,createBrowserBattleChargeRuntime};
