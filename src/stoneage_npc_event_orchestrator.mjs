import {
  selectEventBranch,
  buildEventActionPlan,
  defaultContext,
  NPC_EVENT_RUNTIME_FORMAT
} from './stoneage_npc_event_runtime.mjs';
import {
  applyNpcEventActionPlan,
  NPC_EVENT_TRANSACTION_FORMAT
} from './stoneage_npc_event_transaction.mjs';

const NPC_EVENT_ORCHESTRATOR_FORMAT='stoneage-npc-event-orchestrator-v1';

function executeNpcSourceEvent(
  state,
  script,
  {
    context=null,
    handlers={},
    transactionId=null,
    now=()=>new Date().toISOString(),
    execute=true
  }={}
){
  if(!script||!Array.isArray(script.branches)){
    return {ok:false,reason:'source-event-script-required',state};
  }
  const resolvedContext=context??defaultContext(state);
  const selected=selectEventBranch(script.branches,resolvedContext);
  if(!selected.ok){
    return {
      ok:false,
      reason:selected.reason??'event-branch-selection-failed',
      detail:selected,
      state
    };
  }
  if(!selected.matched){
    return {
      ok:true,
      applied:false,
      matched:false,
      format:NPC_EVENT_ORCHESTRATOR_FORMAT,
      eventRuntimeFormat:NPC_EVENT_RUNTIME_FORMAT,
      transactionRuntimeFormat:NPC_EVENT_TRANSACTION_FORMAT,
      branchIndex:-1,
      scriptPath:script.path??null,
      eventNo:script.eventNo??null,
      state
    };
  }
  const plan=buildEventActionPlan(selected.branch);
  if(!plan.ok)return {ok:false,reason:'event-action-plan-build-failed',detail:plan,state};
  if(!execute){
    return {
      ok:true,
      applied:false,
      matched:true,
      plannedOnly:true,
      format:NPC_EVENT_ORCHESTRATOR_FORMAT,
      branchIndex:selected.index,
      plan,
      state
    };
  }
  const tx=applyNpcEventActionPlan(state,plan,{handlers,transactionId,now});
  return {
    ok:tx.applied===true||tx.idempotent===true,
    applied:tx.applied===true,
    idempotent:tx.idempotent===true,
    matched:true,
    format:NPC_EVENT_ORCHESTRATOR_FORMAT,
    branchIndex:selected.index,
    plan,
    transaction:tx,
    state:tx.state
  };
}

export {
  NPC_EVENT_ORCHESTRATOR_FORMAT,
  executeNpcSourceEvent
};
