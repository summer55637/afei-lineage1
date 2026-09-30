import { offlineResumeWindow } from './stoneage_idle_policy.mjs';
import { commitSave } from './stoneage_save_transaction.mjs';

const OFFLINE_RESUME_FORMAT='stoneage-offline-resume-v1';
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

function prepareOfflineResume(state,closedAt,resumedAt,{maxSeconds=null}={}){
  if(!isObject(state)||!isObject(state.idle)||!isObject(state.idle.offline))return {ok:false,reason:'offline-state-missing',state};
  if(state.idle.offline.eligible!==true)return {ok:false,reason:'offline-not-eligible',state};
  const window=offlineResumeWindow(closedAt,resumedAt,{maxSeconds});
  if(!window.ok)return {ok:false,reason:window.reason,state};
  const next=JSON.parse(JSON.stringify(state));
  next.idle.enabled=false;
  next.idle.mode='offline_resume';
  next.idle.lastSimulatedAt=String(resumedAt);
  next.idle.offline={
    ...next.idle.offline,
    lastClosedAt:String(closedAt),
    lastResumedAt:String(resumedAt),
    elapsedSeconds:window.elapsedSeconds,
    accruedSeconds:0,
    resumePending:true,
    rewardsApplied:false
  };
  return {ok:true,format:OFFLINE_RESUME_FORMAT,window,state:next};
}

async function commitOfflineResume(state,prepared,{expectedRevision=null,savedAt=()=>new Date().toISOString()}={}){
  if(!prepared?.ok||prepared.format!==OFFLINE_RESUME_FORMAT)return {ok:false,reason:'prepared-offline-resume-required',state};
  const saved=await commitSave(state,prepared.state,{expectedRevision,savedAt,source:'offline-resume'});
  if(!saved.ok)return {ok:false,reason:saved.reason??'save-failed',errors:saved.errors??[],state};
  return {...prepared,ok:true,state:saved.state,save:saved};
}

function markOfflineRewardsApplied(state,{accruedSeconds=0}={}){
  const next=JSON.parse(JSON.stringify(state));
  if(!isObject(next?.idle?.offline))return {ok:false,reason:'offline-state-missing',state};
  next.idle.offline.accruedSeconds=Math.max(0,Math.trunc(Number(accruedSeconds)||0));
  next.idle.offline.resumePending=false;
  next.idle.offline.rewardsApplied=true;
  return {ok:true,state:next};
}

export { OFFLINE_RESUME_FORMAT, prepareOfflineResume, commitOfflineResume, markOfflineRewardsApplied };
