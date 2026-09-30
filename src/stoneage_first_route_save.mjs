import { executeNpcSourceEvent, NPC_EVENT_ORCHESTRATOR_FORMAT } from './stoneage_npc_event_orchestrator.mjs';
import { commitSave, SAVE_ENVELOPE_FORMAT } from './stoneage_save_transaction.mjs';

const FIRST_ROUTE_SAVE_FORMAT='stoneage-first-route-save-v1';

async function executeAndSaveNpcSourceEvent(
  state,
  script,
  {
    context=null,
    handlers={},
    transactionId=null,
    now=()=>new Date().toISOString(),
    source='npc-event'
  }={}
){
  const executed=executeNpcSourceEvent(state,script,{
    context,
    handlers,
    transactionId,
    now,
    execute:true
  });
  if(!executed.ok){
    return {
      ok:false,
      applied:false,
      format:FIRST_ROUTE_SAVE_FORMAT,
      orchestratorFormat:NPC_EVENT_ORCHESTRATOR_FORMAT,
      execution:executed,
      state
    };
  }
  if(executed.matched===false || executed.applied===false){
    return {
      ok:true,
      applied:false,
      matched:false,
      idempotent:executed.idempotent===true,
      format:FIRST_ROUTE_SAVE_FORMAT,
      orchestratorFormat:NPC_EVENT_ORCHESTRATOR_FORMAT,
      save:null,
      execution:executed,
      state
    };
  }
  if(executed.idempotent){
    return {
      ok:true,
      applied:false,
      idempotent:true,
      format:FIRST_ROUTE_SAVE_FORMAT,
      orchestratorFormat:NPC_EVENT_ORCHESTRATOR_FORMAT,
      save:null,
      execution:executed,
      state
    };
  }
  const saved=await commitSave(state,executed.state,{
    expectedRevision:Number.isInteger(state?.revision)?state.revision:0,
    savedAt:now,
    source
  });
  if(!saved.ok){
    return {
      ok:false,
      applied:false,
      format:FIRST_ROUTE_SAVE_FORMAT,
      execution:executed,
      save:saved,
      state
    };
  }
  return {
    ok:true,
    applied:true,
    idempotent:false,
    format:FIRST_ROUTE_SAVE_FORMAT,
    orchestratorFormat:NPC_EVENT_ORCHESTRATOR_FORMAT,
    saveEnvelopeFormat:SAVE_ENVELOPE_FORMAT,
    execution:executed,
    save:saved,
    state:saved.state
  };
}

export { FIRST_ROUTE_SAVE_FORMAT, executeAndSaveNpcSourceEvent };
