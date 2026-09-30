import { NPC_EVENT_RUNTIME_FORMAT } from './stoneage_npc_event_runtime.mjs';

const NPC_EVENT_TRANSACTION_FORMAT='stoneage-npc-event-transaction-v1';
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));

function validatePlan(plan){
  if(!isObject(plan)||plan.format!==NPC_EVENT_RUNTIME_FORMAT)return {ok:false,reason:'invalid-event-action-plan'};
  if(!isObject(plan.actions))return {ok:false,reason:'event-action-plan-actions-required'};
  return {ok:true};
}

function handlerFor(handlers,role){
  return isObject(handlers)&&typeof handlers[role]==='function'?handlers[role]:null;
}

function normalizeHandlerResult(result,role){
  if(result===false)return {ok:false,reason:'event-action-handler-rejected',role};
  if(isObject(result)&&result.ok===false)return {ok:false,reason:result.reason??'event-action-handler-rejected',role,detail:result};
  return {ok:true,result};
}

function applyNpcEventActionPlan(state,plan,{handlers={},transactionId=null,now=()=>new Date().toISOString()}={}){
  const valid=validatePlan(plan);
  if(!valid.ok)return {applied:false,reason:valid.reason,state};
  const next=clone(state);
  next.runtimeMeta??={};
  next.runtimeMeta.npcEventTransactions??={};
  const txId=String(transactionId??'').trim();
  if(txId&&next.runtimeMeta.npcEventTransactions[txId]){
    return {applied:false,idempotent:true,transactionId:txId,state};
  }

  const actionLedger=[];
  const invoke=(role,payload)=>{
    const handler=handlerFor(handlers,role);
    if(!handler)return {ok:false,reason:'event-action-handler-required',role,payload};
    try{
      const result=handler(next,payload);
      const normalized=normalizeHandlerResult(result,role);
      if(!normalized.ok)return normalized;
      actionLedger.push({role,payload});
      return {ok:true};
    }catch(error){
      return {ok:false,reason:'event-action-handler-error',role,message:String(error?.message??error),payload};
    }
  };

  const actions=plan.actions;
  for(const action of Array.isArray(actions.literalGetItem)?actions.literalGetItem:[]){
    const result=invoke('GetItem',{itemId:action.itemId,role:action.role??'GetItem',eventPlan:plan});
    if(!result.ok)return {applied:false,...result,transactionId:txId||null,state};
  }
  for(const action of Array.isArray(actions.literalGetPet)?actions.literalGetPet:[]){
    const result=invoke('GetPet',{petId:action.petId,role:action.role??'GetPet',eventPlan:plan});
    if(!result.ok)return {applied:false,...result,transactionId:txId||null,state};
  }
  if(actions.charm!=null){
    const result=invoke('Charm',{value:actions.charm.value,role:actions.charm.role??'Charm',eventPlan:plan});
    if(!result.ok)return {applied:false,...result,transactionId:txId||null,state};
  }
  for(const action of Array.isArray(actions.setEndEvents)?actions.setEndEvents:[]){
    const result=invoke('EndSetFlg',{eventId:action.eventId,role:action.role??'EndSetFlg',eventPlan:plan});
    if(!result.ok)return {applied:false,...result,transactionId:txId||null,state};
  }
  for(const action of Array.isArray(actions.setNowEvents)?actions.setNowEvents:[]){
    const result=invoke('NowSetFlg',{eventId:action.eventId,role:action.role??'NowSetFlg',eventPlan:plan});
    if(!result.ok)return {applied:false,...result,transactionId:txId||null,state};
  }

  if(txId)next.runtimeMeta.npcEventTransactions[txId]={
    sourceScript:plan.sourceScript??null,
    eventNo:plan.eventNo??null,
    actionCount:actionLedger.length,
    committedAt:String(now())
  };
  next.runtimeMeta.updatedAt=String(now());
  next.revision=(Number.isInteger(next.revision)?next.revision:0)+1;
  return {
    applied:true,
    idempotent:false,
    transactionId:txId||null,
    actionCount:actionLedger.length,
    actionLedger,
    state:next
  };
}

export {
  NPC_EVENT_TRANSACTION_FORMAT,
  validatePlan,
  applyNpcEventActionPlan
};
