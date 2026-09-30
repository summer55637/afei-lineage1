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
import { createBrowserWorldItemShopRuntime } from './stoneage_browser_world_itemshop_runtime.mjs';
import { createBrowserHealerRuntime, ACTION_NPC_HEALER_USE, BROWSER_HEALER_RUNTIME_FORMAT } from './stoneage_browser_healer_runtime.mjs';
import { createBrowserSavePointRuntime, ACTION_NPC_SAVEPOINT_SET, ACTION_NPC_SAVEPOINT_CONFIRM, BROWSER_SAVEPOINT_RUNTIME_FORMAT } from './stoneage_browser_savepoint_runtime.mjs';
import { createBrowserIdleRuntime, ACTION_IDLE_LIST_ROUTES, ACTION_IDLE_ENABLE, ACTION_IDLE_EVENT, ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER, ACTION_IDLE_STATUS, ACTION_IDLE_OFFLINE_RESUME, BROWSER_IDLE_RUNTIME_FORMAT } from './stoneage_browser_idle_runtime.mjs';

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
  worldNpcRuntimeOptions={},
  savePointCatalog=null,
  idleRouteCatalog=null
}={}){
  let currentState=state;
  const config=normalizeNpcRuntimeConfig(runtimeConfig);
  const worldNpcRuntime=worldNpcIndex
    ? createBrowserWorldNpcRuntime({worldNpcIndex,...worldNpcRuntimeOptions})
    : null;
  const healerRuntime=moduleAudit ? createBrowserHealerRuntime({moduleAudit}) : null;
  const savePointRuntime=moduleAudit ? createBrowserSavePointRuntime({moduleAudit,savePointCatalog}) : null;
  const idleRuntime=idleRouteCatalog ? createBrowserIdleRuntime({routeCatalog:idleRouteCatalog}) : null;
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
      if(type===ACTION_IDLE_LIST_ROUTES||type===ACTION_IDLE_ENABLE||type===ACTION_IDLE_EVENT||type===ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER||type===ACTION_IDLE_STATUS||type===ACTION_IDLE_OFFLINE_RESUME){
        if(!idleRuntime)return {ok:false,handled:false,stage:'idle-runtime',reason:'browser-idle-runtime-not-configured',state:clone(currentState)};
        if(idleRuntime.ok!==true)return {ok:false,handled:false,stage:'idle-runtime',reason:idleRuntime.reason??'browser-idle-runtime-invalid',errors:idleRuntime.errors??[],state:clone(currentState)};
        const result=await idleRuntime.dispatch(currentState,action,{now:action.now??now});
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {...result,state:clone(result.state??currentState)};
      }
      const requestedNpc=action?.npc??null;
      const targetCell=action?.targetCell??action?.targetPosition??action?.position??null;
      let resolvedWorldNpc=null;
      if((type===ACTION_NPC_RESOLVE_AT || (!requestedNpc && [ACTION_NPC_TALK,ACTION_NPC_HEALER_USE,ACTION_NPC_SAVEPOINT_SET,ACTION_NPC_SAVEPOINT_CONFIRM,ACTION_NPC_ITEMSHOP_OPEN,ACTION_NPC_ITEMSHOP_BUY,ACTION_NPC_ITEMSHOP_SELL].includes(type))) && targetCell){
        if(!worldNpcRuntime){
          return {ok:false,handled:false,stage:'world-npc-resolution',reason:'world-npc-runtime-not-configured',state:clone(currentState)};
        }
        if(worldNpcRuntime.ok!==true){
          return {ok:false,handled:false,stage:'world-npc-resolution',reason:worldNpcRuntime.reason??'world-npc-runtime-invalid',errors:worldNpcRuntime.errors??[],state:clone(currentState)};
        }
        const located=resolveWorldNpcAt(worldNpcRuntime.index,targetCell,{
          template:action.template??null,
          functionSet:action.serviceFunctionSet??action.functionSet??null
        });
        if(!located.ok){
          return {ok:false,handled:false,stage:'world-npc-resolution',reason:located.reason,npcs:located.npcs??[],state:clone(currentState)};
        }
        resolvedWorldNpc=located.npc;
      }
      if(type===ACTION_NPC_RESOLVE_AT){
        return {ok:true,handled:true,stage:'world-npc-resolution',worldNpc:clone(resolvedWorldNpc),state:clone(currentState)};
      }
      if(type===ACTION_NPC_SAVEPOINT_SET||type===ACTION_NPC_SAVEPOINT_CONFIRM){
        if(!savePointRuntime)return {ok:false,handled:false,stage:'savepoint-runtime',reason:'browser-savepoint-runtime-not-configured',state:clone(currentState)};
        if(savePointRuntime.ok!==true)return {ok:false,handled:false,stage:'savepoint-runtime',reason:savePointRuntime.reason??'browser-savepoint-runtime-invalid',errors:savePointRuntime.errors??[],state:clone(currentState)};
        const player=action.player??null;
        const npc=requestedNpc??resolvedWorldNpc;
        const result=savePointRuntime.dispatch(currentState,{...action,npc,player,savePointCatalog:action.savePointCatalog??savePointCatalog},{now:action.now??now});
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {...result,worldNpc:resolvedWorldNpc?clone(resolvedWorldNpc):null,state:clone(result.state??currentState)};
      }
      if(type===ACTION_NPC_HEALER_USE){
        if(!healerRuntime)return {ok:false,handled:false,stage:'healer-runtime',reason:'browser-healer-runtime-not-configured',state:clone(currentState)};
        if(healerRuntime.ok!==true)return {ok:false,handled:false,stage:'healer-runtime',reason:healerRuntime.reason??'browser-healer-runtime-invalid',errors:healerRuntime.errors??[],state:clone(currentState)};
        const player=action.player??null;
        const npc=requestedNpc??resolvedWorldNpc;
        const result=healerRuntime.dispatch(currentState,{...action,npc,player},{maxDistance:action.maxDistance??maxDistance,now:action.now??now});
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {...result,worldNpc:resolvedWorldNpc?clone(resolvedWorldNpc):null,state:clone(result.state??currentState)};
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
  ACTION_NPC_HEALER_USE,
  ACTION_NPC_SAVEPOINT_SET,
  ACTION_NPC_SAVEPOINT_CONFIRM,
  ACTION_NPC_RESOLVE_AT,
  BROWSER_WORLD_NPC_RUNTIME_FORMAT,
  BROWSER_HEALER_RUNTIME_FORMAT,
  BROWSER_SAVEPOINT_RUNTIME_FORMAT,
  BROWSER_IDLE_RUNTIME_FORMAT,
  ACTION_IDLE_LIST_ROUTES,
  ACTION_IDLE_ENABLE,
  ACTION_IDLE_EVENT,
  ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER,
  ACTION_IDLE_STATUS,
  ACTION_IDLE_OFFLINE_RESUME,
  createBrowserStateController
};
