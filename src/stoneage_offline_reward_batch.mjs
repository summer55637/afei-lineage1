import { applyRewardTransaction, normalizeRewardPacket, REWARD_TRANSACTION_FORMAT } from './stoneage_reward_transaction.mjs';
import { transitionIdle, IDLE_EVENTS, IDLE_STATES } from './stoneage_idle_loop.mjs';
import { markOfflineRewardsApplied } from './stoneage_offline_resume.mjs';
import { commitSave, parseAndValidateSaveEnvelope } from './stoneage_save_transaction.mjs';

const OFFLINE_REWARD_BATCH_FORMAT='stoneage-offline-reward-batch-v1';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const intOr=(value,fallback=0)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;

function normalizeOfflineRewardBatch(batch){
  if(!isObject(batch))return null;
  const batchId=String(batch.batchId??'').trim();
  const source=String(batch.source??'').trim();
  const accruedSeconds=Math.max(0,intOr(batch.accruedSeconds,0));
  if(!batchId||!source)return null;
  if(!Array.isArray(batch.rewardPackets))return null;
  const rewardPackets=batch.rewardPackets.map(normalizeRewardPacket);
  if(rewardPackets.some(packet=>!packet))return null;
  return {format:OFFLINE_REWARD_BATCH_FORMAT,batchId,source,accruedSeconds,rewardPackets,metadata:isObject(batch.metadata)?clone(batch.metadata):{}};
}

function validateOfflineRewardBatch(state,batch){
  const normalized=normalizeOfflineRewardBatch(batch);
  const errors=[];
  if(!normalized)return {ok:false,errors:['invalid offline reward batch']};
  if(!isObject(state)||!isObject(state.idle)||!isObject(state.idle.offline))errors.push('offline-state-missing');
  if(errors.length)return {ok:false,errors,batch:normalized};
  if(state.idle.mode!==IDLE_STATES.OFFLINE_RESUME)errors.push('offline-resume-not-pending');
  if(state.idle.offline.resumePending!==true)errors.push('offline-resume-not-pending');
  if(state.idle.offline.rewardsApplied===true)errors.push('offline-rewards-already-applied');
  const elapsed=Math.max(0,intOr(state.idle.offline.elapsedSeconds,0));
  const persistedCap=Number(state.idle.offline.accrualCapSeconds);
  const settlementCap=Number.isFinite(persistedCap)?Math.min(elapsed,Math.max(0,intOr(persistedCap,0))):elapsed;
  if(normalized.accruedSeconds>settlementCap)errors.push('accrued-seconds-exceed-checkpoint-cap');
  if(state.idle.routeId==null||String(state.idle.routeId).trim()==='')errors.push('idle-route-required-for-offline-reward-completion');
  const seen=new Set();
  for(const packet of normalized.rewardPackets){
    if(packet.format!==REWARD_TRANSACTION_FORMAT)errors.push('reward-packet-format-mismatch');
    if(seen.has(packet.transactionId))errors.push('duplicate-reward-transaction-id:'+packet.transactionId);
    seen.add(packet.transactionId);
  }
  if(isObject(state.runtimeMeta?.offlineRewardBatches)&&state.runtimeMeta.offlineRewardBatches[normalized.batchId])errors.push('offline-reward-batch-already-applied');
  return {ok:errors.length===0,errors,batch:normalized};
}

function applyOfflineRewardBatch(state,batch,{knownExistingItemIds=null,now=()=>new Date().toISOString()}={}){
  const checked=validateOfflineRewardBatch(state,batch);
  if(!checked.ok)return {ok:false,format:OFFLINE_REWARD_BATCH_FORMAT,stage:'validation',reason:checked.errors[0]??'invalid-offline-reward-batch',errors:checked.errors,state:clone(state)};
  let staged=clone(state);
  const packetResults=[];
  for(const packet of checked.batch.rewardPackets){
    const applied=applyRewardTransaction(staged,packet,{knownExistingItemIds,now});
    if(!applied.applied&&!applied.idempotent)return {ok:false,format:OFFLINE_REWARD_BATCH_FORMAT,stage:'reward-transaction',reason:applied.reason??'offline-reward-transaction-failed',errors:applied.errors??[],transactionId:packet.transactionId,state:clone(state)};
    staged=applied.state;
    packetResults.push({transactionId:packet.transactionId,applied:applied.applied===true,idempotent:applied.idempotent===true});
  }
  const projected={state:staged.idle.mode,routeId:staged.idle.routeId};
  const restored=transitionIdle(projected,IDLE_EVENTS.SAVE_COMMITTED,{routeId:staged.idle.routeId});
  if(restored.accepted!==true||restored.state!==IDLE_STATES.MOVING)return {ok:false,format:OFFLINE_REWARD_BATCH_FORMAT,stage:'idle-restore',reason:'offline-route-restore-rejected',state:clone(state)};
  const completed=markOfflineRewardsApplied(staged,{accruedSeconds:checked.batch.accruedSeconds});
  if(!completed.ok)return {ok:false,format:OFFLINE_REWARD_BATCH_FORMAT,stage:'completion',reason:completed.reason??'offline-reward-completion-failed',state:clone(state)};
  staged=completed.state;
  const timestamp=String(now());
  staged.idle.enabled=true;
  staged.idle.mode=IDLE_STATES.MOVING;
  staged.idle.routeId=restored.routeId;
  staged.idle.lastSimulatedAt=timestamp;
  staged.runtimeMeta??={};
  staged.runtimeMeta.offlineRewardBatches??={};
  staged.runtimeMeta.offlineRewardBatches[checked.batch.batchId]={source:checked.batch.source,accruedSeconds:checked.batch.accruedSeconds,rewardPacketCount:checked.batch.rewardPackets.length,committedAt:timestamp};
  return {ok:true,format:OFFLINE_REWARD_BATCH_FORMAT,batchId:checked.batch.batchId,source:checked.batch.source,accruedSeconds:checked.batch.accruedSeconds,rewardPacketCount:checked.batch.rewardPackets.length,packetResults,rewardsApplied:true,rewardCompletionPending:false,routeRestored:true,state:staged};
}

async function commitOfflineRewardBatch(state,batch,{knownExistingItemIds=null,expectedRevision=null,savedAt=()=>new Date().toISOString(),save=true}={}){
  const applied=applyOfflineRewardBatch(state,batch,{knownExistingItemIds,now:savedAt});
  if(!applied.ok)return applied;
  if(!save)return applied;
  const committed=await commitSave(state,applied.state,{expectedRevision:expectedRevision==null?intOr(state.revision):expectedRevision,savedAt,source:'offline-reward-completion'});
  if(!committed.ok)return {ok:false,format:OFFLINE_REWARD_BATCH_FORMAT,stage:'save',reason:committed.reason??'save-failed',errors:committed.errors??[],currentRevision:committed.currentRevision,expectedRevision,state:clone(state)};
  const verified=await parseAndValidateSaveEnvelope(committed.envelope,{now:savedAt});
  if(!verified.ok)return {ok:false,format:OFFLINE_REWARD_BATCH_FORMAT,stage:'save-verify',reason:verified.reason??'save-verify-failed',errors:verified.errors??[],state:clone(state)};
  return {...applied,ok:true,state:verified.state,envelope:committed.envelope,verification:verified,revision:verified.state.revision};
}

export { OFFLINE_REWARD_BATCH_FORMAT, SOURCE_REPOSITORY, SOURCE_REF, normalizeOfflineRewardBatch, validateOfflineRewardBatch, applyOfflineRewardBatch, commitOfflineRewardBatch };
