import { dispatchNpcInteraction } from './stoneage_npc_dispatch_runtime.mjs';
import { normalizeNpcRuntimeConfig } from './stoneage_npc_runtime_config.mjs';
import {
  createBrowserItemShopRuntime,
  ACTION_NPC_ITEMSHOP_OPEN,
  ACTION_NPC_ITEMSHOP_BUY,
  ACTION_NPC_ITEMSHOP_SELL
} from './stoneage_browser_itemshop_runtime.mjs';
import {
  createBrowserWorldNpcRuntime,
  resolveWorldNpcAt,
  BROWSER_WORLD_NPC_RUNTIME_FORMAT
} from './stoneage_browser_world_npc_runtime.mjs';

const BROWSER_STATE_CONTROLLER_FORMAT='stoneage-browser-state-controller-v1';
const ACTION_NPC_TALK='NPC_TALK';
const ACTION_NPC_RESOLVE_AT='NPC_RESOLVE_AT';
const clone=value=>JSON.parse(JSON.stringify(value));

function createBrowserStateController({
  state,
  moduleAudit=null,
  compatibilityCatalog=null,
  modules={},
  handlerFactory=null,
  runtimeConfig={},
  interactionRule=null,
  maxDistance=null,
  now=()=>new Date().toISOString(),
  transactionPrefix='browser-npc',
  itemShopCatalog=null,
  itemMakeCatalog=null,
  worldNpcIndex=null,
  itemShopRuntimeOptions={},
  worldNpcRuntimeOptions={}
}={}){
  let currentState=state;
  const config=normalizeNpcRuntimeConfig(runtimeConfig);
  const worldNpcRuntime=worldNpcIndex
    ? createBrowserWorldNpcRuntime({worldNpcIndex,...worldNpcRuntimeOptions})
    : null;
  const itemShopRuntime=(itemShopCatalog&&itemMakeCatalog)
    ? (worldNpcIndex
      ? createBrowserWorldItemShopRuntime({worldNpcIndex,catalog:itemShopCatalog,itemMakeCatalog,...itemShopRuntimeOptions})
      : createBrowserItemShopRuntime({catalog:itemShopCatalog,itemMakeCatalog,...itemShopRuntimeOptions}))
    : null;
  let sequence=0;
  return {
    format:BROWSER_STATE_CONTROLLER_FORMAT,
    getConfig(){return clone(config);},
    getState(){return clone(currentState);},
    async dispatch(action={}){
      const type=String(action?.type??'').trim();
      const requestedNpc=action?.npc??null;
      const targetCell=action?.targetCell??action?.targetPosition??action?.position??null;
      let resolvedWorldNpc=null;
      if((type===ACTION_NPC_RESOLVE_AT || (!requestedNpc && [ACTION_NPC_TALK,ACTION_NPC_ITEMSHOP_OPEN,ACTION_NPC_ITEMSHOP_BUY,ACTION_NPC_ITEMSHOP_SELL].includes(type))) && targetCell){
        if(!worldNpcRuntime){
          return {ok:false,handled:false,stage:'world-npc-resolution',reason:'world-npc-runtime-not-configured',state:clone(currentState)};
        }
        if(worldNpcRuntime.ok!==true){
          return {ok:false,handled:false,stage:'world-npc-resolution',reason:worldNpcRuntime.reason??'world-npc-runtime-invalid',errors:worldNpcRuntime.errors??[],state:clone(currentState)};
        }
        const located=resolveWorldNpcAt(worldNpcRuntime.index,targetCell,{});
        if(!located.ok){
          return {ok:false,handled:false,stage:'world-npc-resolution',reason:located.reason,npcs:located.npcs??[],state:clone(currentState)};
        }
        resolvedWorldNpc=located.npc;
      }
      if(type===ACTION_NPC_RESOLVE_AT){
        return {ok:true,handled:true,stage:'world-npc-resolution',worldNpc:clone(resolvedWorldNpc),state:clone(currentState)};
      }
      if([ACTION_NPC_ITEMSHOP_OPEN,ACTION_NPC_ITEMSHOP_BUY,ACTION_NPC_ITEMSHOP_SELL].includes(type)){
        if(!itemShopRuntime)return {ok:false,handled:false,stage:'itemshop-runtime',reason:'browser-itemshop-runtime-not-configured',state:clone(currentState)};
        if(itemShopRuntime.ok!==true)return {ok:false,handled:false,stage:'itemshop-runtime',reason:itemShopRuntime.reason??'browser-itemshop-runtime-invalid',errors:itemShopRuntime.errors??[],state:clone(currentState)};
        const transactionId=String(action.transactionId??`${transactionPrefix}-itemshop-${++sequence}`).trim();
        const result=itemShopRuntime.dispatch(currentState,{...action,npc:requestedNpc??resolvedWorldNpc,transactionId},{
          interactionRule:action.interactionRule??interactionRule,
          maxDistance:action.maxDistance??maxDistance
        });
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {...result,state:clone(result.state??currentState)};
      }
      if(type!==ACTION_NPC_TALK){
        return {ok:false,handled:false,reason:'unsupported-browser-action',type,state:clone(currentState)};
      }
      const transactionId=String(action.transactionId??`${transactionPrefix}-${++sequence}`).trim();
      const player=action.player??null;
      const npc=requestedNpc??resolvedWorldNpc;
      const result=await dispatchNpcInteraction(currentState,npc,player,{
        interactionRule:action.interactionRule??interactionRule,
        maxDistance:action.maxDistance??maxDistance,
        action:'talk',
        modules:action.modules??modules,
        moduleAudit:action.moduleAudit??moduleAudit,
        compatibilityCatalog:action.compatibilityCatalog??compatibilityCatalog,
        runtimeConfig:action.runtimeConfig??config,
        handlerFactory:action.handlerFactory??handlerFactory,
        now:action.now??now,
        transactionId
      });
      if(result.ok&&result.handled===true&&result.state)currentState=result.state;
      return {...result,worldNpc:resolvedWorldNpc?clone(resolvedWorldNpc):null,state:clone(result.state??currentState)};
    }
  };
}

export {
  BROWSER_STATE_CONTROLLER_FORMAT,
  ACTION_NPC_TALK,
  ACTION_NPC_ITEMSHOP_OPEN,
  ACTION_NPC_ITEMSHOP_BUY,
  ACTION_NPC_ITEMSHOP_SELL,
  ACTION_NPC_RESOLVE_AT,
  BROWSER_WORLD_NPC_RUNTIME_FORMAT,
  createBrowserStateController
};
