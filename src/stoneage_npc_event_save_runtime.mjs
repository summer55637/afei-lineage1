import { executeNpcSourceEvent, NPC_EVENT_ORCHESTRATOR_FORMAT } from './stoneage_npc_event_orchestrator.mjs';
import { buildSaveEnvelope, commitSave, SAVE_ENVELOPE_FORMAT } from './stoneage_save_transaction.mjs';

const NPC_EVENT_SAVE_RUNTIME_FORMAT='stoneage-npc-event-save-runtime-v1';

function executeAndPersistNpcSourceEvent(state,script,{
  handlers={},
  transactionId=null,
  context=null,
  now=()=>new Date().toISOString(),
  source='npc-event'
}={}){
  const execution=executeNpcSourceEvent(state,script,{handlers,transactionId,context,now});
  if(!execution.ok)return {ok:false,stage:'event',execution,state};
  if(execution.plannedOnly){
    return {ok:true,plannedOnly:true,format:NPC_EVENT_SAVE_RUNTIME_FORMAT,orchestratorFormat:NPC_EVENT_ORCHESTRATOR_FORMAT,execution,state};
  }
  if(execution.idempotent){
    return {ok:true,applied:false,idempotent:true,format:NPC_EVENT_SAVE_RUNTIME_FORMAT,orchestratorFormat:NPC_EVENT_ORCHESTRATOR_FORMAT,execution,state:execution.state};
  }
  const saved=commitSave(state,execution.state,{expectedRevision:Number.isInteger(state?.revision)?state.revision:0,savedAt:now,source});
  if(!saved.ok)return {ok:false,stage:'save',reason:saved.reason,errors:saved.errors??[],execution,state};
  return {ok:true,format:NPC_EVENT_SAVE_RUNTIME_FORMAT,orchestratorFormat:NPC_EVENT_ORCHESTRATOR_FORMAT,saveEnvelopeFormat:SAVE_ENVELOPE_FORMAT,applied:true,idempotent:false,execution,state:saved.state,save:saved};
}

async function buildPersistedEnvelope(state,{savedAt=()=>new Date().toISOString(),source='runtime'}={}){
  return buildSaveEnvelope(state,{savedAt,source});
}

export { NPC_EVENT_SAVE_RUNTIME_FORMAT, executeAndPersistNpcSourceEvent, buildPersistedEnvelope };
