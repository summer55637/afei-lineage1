import { canInteractWithNpc } from './stoneage_npc_interaction_runtime.mjs';
import { executeAndSaveNpcSourceEvent } from './stoneage_first_route_save.mjs';
import { resolveAuditedNpcModule, createAuditedNpcModuleRegistry, createCompatibilityNpcModuleRegistry } from './stoneage_npc_module_registry_runtime.mjs';
import { assertBrowserCompatibilityPolicy, createNpcModuleRegistryOptions } from './stoneage_npc_runtime_config.mjs';

const NPC_DISPATCH_RUNTIME_FORMAT='stoneage-npc-dispatch-runtime-v1';

function resolveInteractionModule(npc,{modules={},moduleRegistry=null}={}){
  const name=String(npc?.template??npc?.templateName??'').trim();
  if(!name)return {ok:false,reason:'npc-template-name-required'};
  if(moduleRegistry){
    return resolveAuditedNpcModule(moduleRegistry,name);
  }
  const module=modules[name]??modules[name.toLowerCase()]??null;
  if(!module)return {ok:true,resolved:false,reason:'npc-runtime-module-unresolved',template:name};
  return {ok:true,resolved:true,template:name,module};
}

async function dispatchNpcInteraction(
  state,
  npc,
  player,
  {
    interactionRule=null,
    maxDistance=null,
    action='talk',
    modules={},
    moduleRegistry=null,
    moduleAudit=null,
    compatibilityCatalog=null,
    runtimeConfig=null,
    handlerFactory=null,
    now=()=>new Date().toISOString(),
    transactionId=null
  }={}
){
  const policy=assertBrowserCompatibilityPolicy(runtimeConfig??{});
  if(!policy.ok)return {ok:false,stage:'runtime-config',reason:policy.reason,state};
  let resolvedRegistry=moduleRegistry;
  if(!resolvedRegistry&&moduleAudit){
    const registryOptions=createNpcModuleRegistryOptions(policy.config);
    resolvedRegistry=registryOptions.allowExternalCompatibilityAliases&&compatibilityCatalog
      ? createCompatibilityNpcModuleRegistry(moduleAudit,compatibilityCatalog,{modules,allowExternalCompatibilityAliases:true})
      : createAuditedNpcModuleRegistry(moduleAudit,{modules});
    if(!resolvedRegistry.ok)return {ok:false,stage:'module-registry',reason:resolvedRegistry.reason,state};
  }
  const resolved=resolveInteractionModule(npc,{modules,resolvedRegistry,moduleRegistry:resolvedRegistry});
  if(!resolved.ok)return {ok:false,stage:'module-resolution',reason:resolved.reason,state};
  if(!resolved.resolved)return {ok:true,handled:false,stage:'module-resolution',reason:resolved.reason,template:resolved.template,state};
  const gateNpc=resolved.compatibilityAlias ? {...npc,runtimeModuleStatus:'resolved_compatibility_alias'} : npc;
  const gate=canInteractWithNpc(gateNpc,player,{interactionRule,maxDistance});
  if(!gate.ok)return {ok:false,stage:'interaction-gate',reason:gate.reason,state};
  if(!gate.interactable)return {ok:true,handled:false,stage:'interaction-gate',reason:gate.reason,state};
  if(action!=='talk')return {ok:true,handled:false,stage:'dispatch',reason:'unsupported-npc-action',action,template:resolved.template,state};
  if(typeof handlerFactory!=='function')return {ok:false,stage:'dispatch',reason:'npc-handler-factory-required',template:resolved.template,state};
  const script=resolved.module?.script??null;
  if(!script)return {ok:false,stage:'dispatch',reason:'npc-event-script-required',template:resolved.template,state};
  const handlers=handlerFactory(resolved.module);
  if(!handlers||typeof handlers!=='object')return {ok:false,stage:'dispatch',reason:'npc-handler-factory-invalid',template:resolved.template,state};
  const execution=await executeAndSaveNpcSourceEvent(state,script,{
    handlers,
    transactionId,
    now,
    source:'npc-interaction'
  });
  return {
    ok:execution.ok,
    handled:execution.applied===true,
    stage:'dispatch',
    template:resolved.template,
    execution,
    state:execution.state
  };
}

export { NPC_DISPATCH_RUNTIME_FORMAT, resolveInteractionModule, dispatchNpcInteraction };
