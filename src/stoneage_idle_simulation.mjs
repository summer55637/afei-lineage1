import { transitionIdle, IDLE_EVENTS, IDLE_STATES, idleInitialState } from './stoneage_idle_loop.mjs';
import { applyRewardTransaction } from './stoneage_reward_transaction.mjs';
import { supplyRequired, deathRecoveryDecision, offlineResumeWindow, sourceHealerRecovery } from './stoneage_idle_policy.mjs';
import { commitSave } from './stoneage_save_transaction.mjs';

const SIMULATION_FORMAT='stoneage-idle-simulation-v1';
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const intOr=(value,fallback=0)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;

function routeVariantKey(route,variant){return `hometown-${route?.hometown}/floor-${route?.entryFloor}-to-${route?.encounterFloor}/${variant?.portalId??'unknown'}`;}

function advanceClock(iso,seconds){const t=Date.parse(String(iso));if(!Number.isFinite(t))throw new Error('invalid simulation clock');return new Date(t+Math.max(0,intOr(seconds,0))*1000).toISOString();}

function applyBattleExitSnapshot(state,battleResult){
  const next=JSON.parse(JSON.stringify(state));
  const player=battleResult?.player ?? {};
  if(player.hp!=null) next.player.hp=Math.max(0,intOr(player.hp));
  if(player.mp!=null) next.player.mp=Math.max(0,intOr(player.mp));
  if(player.maxHp!=null) next.player.maxHp=Math.max(0,intOr(player.maxHp));
  if(player.maxMp!=null) next.player.maxMp=Math.max(0,intOr(player.maxMp));
  return next;
}

function simulateFirstEncounter(state,route,variant,{encounter,battleResult,policy={},knownExistingItemIds=null,now=()=>new Date().toISOString(),save=true}={}){
  if(!isObject(state)||!route||!variant)return {ok:false,reason:'missing-simulation-input'};
  if(!Number.isFinite(Number(variant.originPathMin))||!Number.isFinite(Number(variant.landingPathMin)))return {ok:false,reason:'route-path-time-missing'};
  if(battleResult==null)return {ok:false,reason:'battle-result-required'};
  const startAt=String(now());
  let clock=startAt;
  let idle=idleInitialState();
  const routeId=routeVariantKey(route,variant);
  idle=transitionIdle(idle,IDLE_EVENTS.ENABLE,{routeId});
  if(idle.state!==IDLE_STATES.MOVING)return {ok:false,reason:'idle-enable-rejected'};
  const travelSeconds=Math.max(0,intOr(variant.totalWalkBeforeEncounterMin,intOr(variant.originPathMin)+intOr(variant.landingPathMin)))*60;
  clock=advanceClock(clock,travelSeconds);
  idle=transitionIdle(idle,IDLE_EVENTS.MOVE_TICK,{encounterTriggered:true,encounter:encounter??{floorId:route.encounterFloor,encounterId:variant.encounterId??null}});
  idle=transitionIdle(idle,IDLE_EVENTS.ENCOUNTER_ROLLED,{active:true});
  idle=transitionIdle(idle,IDLE_EVENTS.BATTLE_FINISHED,{battle:battleResult});
  let nextState=applyBattleExitSnapshot(state,battleResult);
  let rewardApplied=null;
  if(battleResult.reward){
    const reward=applyRewardTransaction(nextState,battleResult.reward,{knownExistingItemIds,now:()=>clock});
    if(!reward.applied&&!reward.idempotent)return {ok:false,reason:reward.reason??'reward-transaction-failed',errors:reward.errors??[],state};
    nextState=reward.state;
    rewardApplied=reward;
    idle=transitionIdle(idle,IDLE_EVENTS.REWARD_APPLIED,{reward:battleResult.reward,supplyRequired:false});
  }
  const dead=intOr(nextState.player?.hp,0)<=0;
  if(dead){
    idle=transitionIdle(idle,IDLE_EVENTS.PLAYER_DEAD);
    const death=deathRecoveryDecision(nextState,policy,{savePointAvailable:nextState.world?.savePoint!=null,healerAvailable:false});
    nextState.idle.enabled=false; nextState.idle.mode='dead'; nextState.idle.routeId=routeId; nextState.idle.lastSimulatedAt=clock;
    if(save){const saved=commitSave(state,nextState,{expectedRevision:intOr(state.revision),savedAt:()=>clock,source:'idle-simulation'});if(saved.ok)nextState=saved.state;return {ok:true,simulation:SIMULATION_FORMAT,routeId,clock,idleState:idle,deadd:true,death,reward:rewardApplied,state:nextState,save:saved};}
    return {ok:true,simulation:SIMULATION_FORMAT,routeId,clock,idleState:idle,dead:true,death,reward:rewardApplied,state:nextState,save:null};
  }
  const supply=supplyRequired(nextState,policy);
  if(!supply.ok)return {ok:false,reason:'invalid-supply-policy',errors:supply.errors,state};
  idle=transitionIdle(idle,IDLE_EVENTS.REWARD_APPLIED,{reward:battleResult.reward??null,supplyRequired:supply.required});
  nextState.idle.enabled=supply.required?false:true;
  nextState.idle.mode=supply.required?'supply_check':'moving';
  nextState.idle.routeId=routeId;
  nextState.idle.lastSimulatedAt=clock;
  if(save){const saved=commitSave(state,nextState,{expectedRevision:intOr(state.revision),savedAt:()=>clock,source:'idle-simulation'});if(!saved.ok)return {ok:false,reason:saved.reason,state};nextState=saved.state;return {ok:true,simulation:SIMULATION_FORMAT,routeId,clock,idleState:idle,dead:false,supply,reward:rewardApplied,state:nextState,save:saved};}
  return {ok:true,simulation:SIMULATION_FORMAT,routeId,clock,idleState:idle,dead:false,supply,reward:rewardApplied,state:nextState,save:null};
}

function simulateOfflineResume(state,closedAt,resumedAt,{maxSeconds=null}={}){
  const window=offlineResumeWindow(closedAt,resumedAt,{maxSeconds});
  if(!window.ok)return {ok:false,reason:window.reason,state};
  const next=JSON.parse(JSON.stringify(state));
  next.idle.offline={...(isObject(next.idle?.offline)?next.idle.offline:{}),eligible:true,lastClosedAt:String(closedAt),accruedSeconds:window.accruedSeconds};
  next.idle.lastSimulatedAt=String(resumedAt);
  return {ok:true,simulation:SIMULATION_FORMAT,offline:window,rewardsSimulated:false,state:next};
}

function recoverAtHealer(state){return sourceHealerRecovery(state);}

export { SIMULATION_FORMAT, routeVariantKey, simulateFirstEncounter, simulateOfflineResume, recoverAtHealer };
