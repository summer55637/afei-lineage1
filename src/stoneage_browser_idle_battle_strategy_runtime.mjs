const BROWSER_IDLE_BATTLE_STRATEGY_RUNTIME_FORMAT='stoneage-browser-idle-battle-strategy-runtime-v1';
const ACTION_BATTLE_IDLE_STRATEGY_APPLY='BATTLE_IDLE_STRATEGY_APPLY';
const IDLE_BATTLE_STRATEGY_MODE='basic_attack_only';
const IDLE_BATTLE_TARGET_POLICY='source-default-random';
const BATTLE_S_TYPE_PLAYER=0;
const BATTLE_CHARMODE_C_WAIT=2;
const BATTLE_CHARMODE_C_OK=3;
const BATTLE_COM_ATTACK=1;

import { resolveDefaultTarget } from './stoneage_browser_battle_default_target_runtime.mjs';
import { preflightPlayerBattleCommand, setBattlePlayerCommand } from './stoneage_browser_battle_player_command_runtime.mjs';

const clone=value=>JSON.parse(JSON.stringify(value));
const toInt=value=>{
  const s=String(value??'').trim();
  if(s==='')return null;
  const m=s.match(/^-?\\d+/);
  return m?Number(m[0]):null;
};

const DEFAULT_IDLE_BATTLE_STRATEGY=Object.freeze({
  mode:IDLE_BATTLE_STRATEGY_MODE,
  targetPolicy:IDLE_BATTLE_TARGET_POLICY
});

function validateIdleBattleStrategy(strategy){
  const errors=[];
  if(!strategy||typeof strategy!=='object'||Array.isArray(strategy))return {ok:false,errors:['strategy must be an object']};
  if(strategy.mode!==IDLE_BATTLE_STRATEGY_MODE)errors.push('strategy.mode must be basic_attack_only');
  if(strategy.targetPolicy!==IDLE_BATTLE_TARGET_POLICY)errors.push('strategy.targetPolicy must be source-default-random');
  return {ok:errors.length===0,errors};
}

function isLiving(entry){
  if(!entry)return false;
  if(toInt(entry.hp)==null||toInt(entry.hp)<=0)return false;
  if(entry.isDead===true||entry.dead===true||entry.isDie===true)return false;
  return true;
}

function applyIdleBattleStrategy(context,{
  strategy=DEFAULT_IDLE_BATTLE_STRATEGY,
  playerId=null,
  defaultTargetRoll=null,
  weaponKind=null
}={}){
  if(!context?.context)return {ok:false,handled:false,stage:'idle-battle-strategy',reason:'battle-context-required'};
  if(String(context.context.mode??'').trim()!=='battle')return {
    ok:false,handled:false,stage:'idle-battle-strategy',reason:'battle-active-phase-required',
    mode:String(context.context.mode??'')
  };
  const strategyCheck=validateIdleBattleStrategy(strategy);
  if(!strategyCheck.ok)return {
    ok:false,handled:false,stage:'idle-battle-strategy',reason:'strategy-invalid',
    errors:strategyCheck.errors
  };
  const sides=Array.isArray(context.context.sides)?context.context.sides:[];
  const playerSide=sides.find(side=>Number(side?.side)===BATTLE_S_TYPE_PLAYER);
  const enemySide=sides.find(side=>Number(side?.side)===1);
  if(!Array.isArray(playerSide?.entries)||!Array.isArray(enemySide?.entries))return {
    ok:false,handled:false,stage:'idle-battle-strategy',reason:'battle-context-sides-invalid'
  };

  const allPlayers=playerSide.entries.filter(entry=>entry?.sourceType==='player'&&Number(entry.battleSide)===BATTLE_S_TYPE_PLAYER);
  const wantedId=String(playerId??'').trim();
  const matchingPlayers=wantedId?allPlayers.filter(entry=>String(entry.characterId??'').trim()===wantedId):allPlayers;
  if(matchingPlayers.length!==1)return {
    ok:false,handled:false,stage:'idle-battle-strategy',reason:matchingPlayers.length===0?'controlled-player-entry-not-found':'controlled-player-entry-ambiguous',
    playerId:wantedId||null,matchingPlayerCount:matchingPlayers.length
  };
  const actor=matchingPlayers[0];
  const battleSlot=toInt(actor.battleSlot);
  if(battleSlot==null||battleSlot<0||battleSlot>=playerSide.entries.length)return {
    ok:false,handled:false,stage:'idle-battle-strategy',reason:'controlled-player-battle-slot-invalid'
  };
  if(!isLiving(actor))return {
    ok:true,handled:true,stage:'idle-battle-strategy-player-not-living',
    actor:{battleSlot,bid:toInt(actor.bid),characterId:String(actor.characterId??'')},
    battleContext:clone(context.context),commands:[],persistentMutation:false,rngConsumed:false,damageExecuted:false
  };
  const actorMode=toInt(actor.sourceBattleCharMode);
  if(actorMode!==BATTLE_CHARMODE_C_WAIT&&actorMode!==BATTLE_CHARMODE_C_OK)return {
    ok:false,handled:false,stage:'idle-battle-strategy',reason:'controlled-player-not-command-ready',
    actorMode,battleSlot
  };

  let nextContext=clone(context.context);
  const petCommands=[];
  const pets=playerSide.entries.map((entry,index)=>({entry,index})).filter(x=>
    x.entry?.sourceType==='pet'&&Number(x.entry.battleSide)===BATTLE_S_TYPE_PLAYER&&
    toInt(x.entry.sourceBattleCharMode)===BATTLE_CHARMODE_C_WAIT&&isLiving(x.entry)
  );
  for(const {entry,index} of pets){
    const pet=nextContext.sides.find(side=>Number(side.side)===BATTLE_S_TYPE_PLAYER).entries[index];
    const commands=Array.isArray(pet.battleCommands)?pet.battleCommands.slice():[-1,-1,-1];
    commands[0]=BATTLE_COM_ATTACK;
    commands[1]=-1;
    pet.battleCommands=commands;
    pet.sourceBattleCharMode=BATTLE_CHARMODE_C_OK;
    pet.battleMode='c_ok';
    petCommands.push({battleSlot:toInt(pet.battleSlot),bid:toInt(pet.bid),command:'attack',targetBid:-1,source:'fixed-c-pet-default'});
  }

  if(actorMode===BATTLE_CHARMODE_C_OK)return {
    ok:true,handled:true,stage:'idle-battle-strategy-already-ready',
    format:BROWSER_IDLE_BATTLE_STRATEGY_RUNTIME_FORMAT,action:ACTION_BATTLE_IDLE_STRATEGY_APPLY,
    policy:clone(strategy),actor:{battleSlot,bid:toInt(actor.bid),characterId:String(actor.characterId??'')},
    command:null,petCommands,battleContext:nextContext,persistentMutation:false,rngConsumed:false,damageExecuted:false
  };

  const wrapped={format:context.format??'stoneage-browser-battle-context-runtime-v1',context:clone(nextContext)};
  const preflight=preflightPlayerBattleCommand(wrapped,{battleSlot,command:'attack'});
  if(!preflight.ok)return {...preflight,stage:'idle-battle-strategy-preflight',battleContext:nextContext,petCommands,persistentMutation:false,rngConsumed:false,damageExecuted:false};

  let command='attack';
  let targetBid=null;
  let targetSelection=null;
  if(preflight.blocked===true){
    command='wait';
  }else{
    targetSelection=resolveDefaultTarget(wrapped,{side:1,defaultTargetRoll});
    if(!targetSelection.ok)return {
      ok:false,handled:false,stage:'idle-battle-strategy-target',reason:targetSelection.reason??'default-target-resolution-failed',
      policy:clone(strategy),actor:{battleSlot,bid:toInt(actor.bid),characterId:String(actor.characterId??'')},
      targetSelection,battleContext:clone(nextContext),petCommands,persistentMutation:false,
      rngConsumed:false,damageExecuted:false
    };
    if(targetSelection.defaultTargetResolved===true)targetBid=targetSelection.selectedBid;
    else command='wait';
  }

  const playerCommand=setBattlePlayerCommand(wrapped,{
    battleSlot,command,targetBid,weaponKind,
    actorId:String(actor.characterId??'')
  });
  if(!playerCommand.ok)return {
    ...playerCommand,stage:'idle-battle-strategy-command',
    battleContext:clone(nextContext),petCommands,
    persistentMutation:false,rngConsumed:targetSelection?.rngConsumed===true,damageExecuted:false
  };
  nextContext=clone(playerCommand.battleContext);
  const strategyCommand=clone(playerCommand.command);
  return {
    ok:true,handled:true,
    stage:command==='wait'?(preflight.blocked?'idle-battle-strategy-status-wait':'idle-battle-strategy-no-target-wait'):'idle-battle-strategy-command-set',
    format:BROWSER_IDLE_BATTLE_STRATEGY_RUNTIME_FORMAT,
    action:ACTION_BATTLE_IDLE_STRATEGY_APPLY,
    policy:clone(strategy),
    actor:{battleSlot,bid:toInt(actor.bid),characterId:String(actor.characterId??'')},
    command:strategyCommand,
    targetSelection,
    petCommands,
    battleContext:nextContext,
    persistentMutation:false,
    rngConsumed:targetSelection?.rngConsumed===true,
    damageExecuted:false,
    sourceBoundary:'player auto policy -> BATTLE_PLAYER_COMMAND_SET; pet default mirrors BATTLE_PetDefaultCommand'
  };
}

function createBrowserIdleBattleStrategyRuntime(){
  return {
    ok:true,
    format:BROWSER_IDLE_BATTLE_STRATEGY_RUNTIME_FORMAT,
    apply:(context,options={})=>applyIdleBattleStrategy(context,options)
  };
}

export {
  BROWSER_IDLE_BATTLE_STRATEGY_RUNTIME_FORMAT,
  ACTION_BATTLE_IDLE_STRATEGY_APPLY,
  IDLE_BATTLE_STRATEGY_MODE,
  IDLE_BATTLE_TARGET_POLICY,
  DEFAULT_IDLE_BATTLE_STRATEGY,
  validateIdleBattleStrategy,
  applyIdleBattleStrategy,
  createBrowserIdleBattleStrategyRuntime
};
