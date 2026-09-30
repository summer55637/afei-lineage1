import { transitionIdle, IDLE_EVENTS, IDLE_STATES, idleInitialState } from './stoneage_idle_loop.mjs';
import { applyRewardTransaction } from './stoneage_reward_transaction.mjs';
import { supplyRequired, deathRecoveryDecision, offlineResumeWindow, sourceHealerRecovery } from './stoneage_idle_policy.mjs';
import { commitSave } from './stoneage_save_transaction.mjs';
import { adaptSourceBattleResult, assertBattleResultForIdle, BATTLE_RESULT_FORMAT } from './stoneage_battle_result_adapter.mjs';
import { prepareOfflineResume, commitOfflineResume } from './stoneage_offline_resume.mjs';

const SIMULATION_FORMAT='stoneage-idle-simulation-v1';
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const intOr=(value,fallback=0)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;

function routeVariantKey(route,variant){return `hometown-${route?.hometown}/floor-${route?.entryFloor}-to-${route?.encounterFloor}/${variant?.portalId??'unknown'}`;}

function advanceClock(iso,seconds){const t=Date.parse(String(iso));if(!Number.isFinite(t))throw new Error('invalid simulation clock');return new Date(t+Math.max(0,intOr(seconds,0))*1000).toISOString();}

function normalizeSimulationBattleResult(battleResult,sourceBattleResult){
  if(sourceBattleResult!=null){
    const adapted=adaptSourceBattleResult(sourceBattleResult);
    if(!adapted.ok)return {ok:false,reason:adapted.reason};
    return {ok:true,battleResult:adapted.result};
  }
  const checked=assertBattleResultForIdle(battleResult);
  if(!checked.ok)return {ok:false,reason:checked.reason};
  return {ok:true,battleResult};
}

function applyBattleExitSnapshot(state,battleResult){
  const next=JSON.parse(JSON.stringify(state));
  const player=battleResult?.player ?? {};
  if(player.hp!=null) next.player.hp=Math.max(0,intOr(player.hp));
  if(player.mp!=null) next.player.mp=Math.max(0,intOr(player.mp));
  if(player.maxHp!=null) next.player.maxHp=Math.max(0,intOr(player.maxHp));
  if(player.maxMp!=null) next.player.maxMp=Math.max(0,intOr(player.maxMp));
  return next;
}

async function simulateFirstEncounter(state,route,variant,{encounter,battleResult=null,sourceBattleResult=null,policy={},knownExistingItemIds=null,now=()=>new Date().toISOString(),save=true}={}){
  if(!isObject(state)||!route||!variant)return {ok:false,reason:'missing-simulation-input'};
  if(!Number.isFinite(Number(variant.originPathMin))||!Number.isFinite(Number(variant.landingPathMin)))return {ok:false,reason:'route-path-time-missing'};
  const normalizedBattle=normalizeSimulationBattleResult(battleResult,sourceBattleResult);
  if(!normalizedBattle.ok)return {ok:false,reason:normalizedBattle.reason};
  battleResult=normalizedBattle.battleResult;
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
  }
  const dead=intOr(nextState.player?.hp,0)<=0;
  if(dead){
    idle=transitionIdle(idle,IDLE_EVENTS.PLAYER_DEAD);
    const death=deathRecoveryDecision(nextState,policy,{savePointAvailable:nextState.world?.savePoint!=null,healerAvailable:false});
    nextState.idle.enabled=false; nextState.idle.mode='dead'; nextState.idle.routeId=routeId; nextState.idle.lastSimulatedAt=clock;
    if(save){const saved=await commitSave(state,nextState,{expectedRevision:intOr(state.revision),savedAt:()=>clock,source:'idle-simulation'});if(saved.ok)nextState=saved.state;return {ok:true,simulation:SIMULATION_FORMAT,routeId,clock,idleState:idle,dead:true,death,reward:rewardApplied,state:nextState,save:saved};}
    return {ok:true,simulation:SIMULATION_FORMAT,routeId,clock,idleState:idle,dead:true,death,reward:rewardApplied,state:nextState,save:null};
  }
  const supply=supplyRequired(nextState,policy);
  if(!supply.ok)return {ok:false,reason:'invalid-supply-policy',errors:supply.errors,state};
  idle=transitionIdle(idle,IDLE_EVENTS.REWARD_APPLIED,{reward:battleResult.reward??null,supplyRequired:supply.required});
  nextState.idle.enabled=supply.required?false:true;
  nextState.idle.mode=supply.required?'supply_check':'moving';
  nextState.idle.routeId=routeId;
  nextState.idle.lastSimulatedAt=clock;
  if(save){const saved=await commitSave(state,nextState,{expectedRevision:intOr(state.revision),savedAt:()=>clock,source:'idle-simulation'});if(!saved.ok)return {ok:false,reason:saved.reason??'save-failed',errors:saved.errors??[],state};nextState=saved.state;return {ok:true,simulation:SIMULATION_FORMAT,routeId,clock,idleState:idle,dead:false,supply,reward:rewardApplied,state:nextState,save:saved};}
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

async function commitOfflineSimulationResume(state,closedAt,resumedAt,{maxSeconds=null,expectedRevision=null,savedAt=()=>new Date().toISOString(),save=true}={}) {
  const prepared=prepareOfflineResume(state,closedAt,resumedAt,{maxSeconds});
  if(!prepared.ok)return prepared;
  if(!save)return prepared;
  return commitOfflineResume(state,prepared,{expectedRevision:expectedRevision==null?intOr(state.revision):expectedRevision,savedAt});
}

function recoverAtHealer(state){return sourceHealerRecovery(state);}

export { SIMULATION_FORMAT, BATTLE_RESULT_FORMAT, routeVariantKey, normalizeSimulationBattleResult, simulateFirstEncounter, simulateOfflineResume, commitOfflineSimulationResume, recoverAtHealer };
