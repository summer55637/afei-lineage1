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
import { createBrowserIdleRuntime, ACTION_IDLE_LIST_ROUTES, ACTION_IDLE_ENABLE, ACTION_IDLE_EVENT, ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER, ACTION_IDLE_STATUS, ACTION_IDLE_OFFLINE_RESUME, ACTION_IDLE_OFFLINE_APPLY_REWARDS, BROWSER_IDLE_RUNTIME_FORMAT } from './stoneage_browser_idle_runtime.mjs';
import { createBrowserWorldMovementRuntime, ACTION_WORLD_MOVE_STEP, BROWSER_WORLD_MOVEMENT_RUNTIME_FORMAT } from './stoneage_browser_world_movement_runtime.mjs';
import { createBrowserWorldWarpPointRuntime, ACTION_WORLD_WARPPOINT_EXECUTE, BROWSER_WORLD_WARPPOINT_RUNTIME_FORMAT } from './stoneage_browser_world_warppoint_runtime.mjs';
import { createBrowserWorldFirstRouteRuntime, ACTION_WORLD_FIRST_ROUTE_PLAN, BROWSER_WORLD_ROUTE_RUNTIME_FORMAT } from './stoneage_browser_world_first_route_runtime.mjs';
import { createBrowserWorldFirstRouteExecutionRuntime, ACTION_WORLD_FIRST_ROUTE_EXECUTE, BROWSER_WORLD_ROUTE_EXECUTION_RUNTIME_FORMAT } from './stoneage_browser_world_first_route_execution_runtime.mjs';
import { createBrowserWorldEncounterRuntime, ACTION_WORLD_ENCOUNTER_PREPARE, ACTION_WORLD_ENCOUNTER_ROLL, BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT } from './stoneage_browser_world_encounter_runtime.mjs';
import { createBrowserWorldEncounterPersistenceRuntime, ACTION_WORLD_ENCOUNTER_ROLL_COMMIT, BROWSER_WORLD_ENCOUNTER_PERSISTENCE_RUNTIME_FORMAT } from './stoneage_browser_world_encounter_persistence_runtime.mjs';
import { createBrowserWorldEncounterGroupRuntime, ACTION_WORLD_ENCOUNTER_GROUP_SELECT, BROWSER_WORLD_ENCOUNTER_GROUP_RUNTIME_FORMAT } from './stoneage_browser_world_encounter_group_runtime.mjs';
import { createBrowserWarpRuntime, BROWSER_WARP_RUNTIME_FORMAT } from './stoneage_browser_warp_runtime.mjs';
import { itemShopUiInitialState, openItemShopUiState, selectItemShopUiOffer, setItemShopUiQuantity, applyItemShopUiResult, closeItemShopUiState, ITEMSHOP_UI_STATE_FORMAT } from './stoneage_browser_itemshop_ui_state.mjs';

const BROWSER_STATE_CONTROLLER_FORMAT='stoneage-browser-state-controller-v1';
const ACTION_NPC_TALK='NPC_TALK';
const ACTION_NPC_RESOLVE_AT='NPC_RESOLVE_AT';
const ACTION_NPC_EVENT_EXECUTE='NPC_EVENT_EXECUTE';
const ACTION_NPC_WARP_EXECUTE='NPC_WARP_EXECUTE';
const ITEMSHOP_UI_OPEN='ITEMSHOP_UI_OPEN';
const ITEMSHOP_UI_SELECT_OFFER='ITEMSHOP_UI_SELECT_OFFER';
const ITEMSHOP_UI_SET_QUANTITY='ITEMSHOP_UI_SET_QUANTITY';
const ITEMSHOP_UI_CLOSE='ITEMSHOP_UI_CLOSE';
const clone=value=>JSON.parse(JSON.stringify(value));
const clockFactory=(value,fallback)=>typeof value==='function'?value:()=>value!=null?String(value):String(fallback());

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
  idleRouteCatalog=null,
  warpCatalog=null,
  encounterTargetIndex=null,
  encounterGroupCatalog=null,
  worldMovementOptions={},
  worldWarpPointOptions={},
  worldFirstRouteOptions={}
}={}){
  let currentState=state;
  const config=normalizeNpcRuntimeConfig(runtimeConfig);
  const worldNpcRuntime=worldNpcIndex
    ? createBrowserWorldNpcRuntime({worldNpcIndex,...worldNpcRuntimeOptions})
    : null;
  const healerRuntime=moduleAudit ? createBrowserHealerRuntime({moduleAudit}) : null;
  const savePointRuntime=moduleAudit ? createBrowserSavePointRuntime({moduleAudit,savePointCatalog}) : null;
  const idleRuntime=idleRouteCatalog ? createBrowserIdleRuntime({routeCatalog:idleRouteCatalog}) : null;
  const warpRuntime=warpCatalog ? createBrowserWarpRuntime({warpCatalog}) : null;
  const worldMovementRuntime=createBrowserWorldMovementRuntime(worldMovementOptions);
  const worldWarpPointRuntime=createBrowserWorldWarpPointRuntime({catalog:warpCatalog,...worldWarpPointOptions});
  const worldFirstRouteRuntime=(idleRouteCatalog&&warpCatalog&&encounterTargetIndex)
    ? createBrowserWorldFirstRouteRuntime({routeCatalog:idleRouteCatalog,warpCatalog,encounterTargetIndex,...worldFirstRouteOptions})
    : null;
  const worldFirstRouteExecutionRuntime=createBrowserWorldFirstRouteExecutionRuntime();
  const worldEncounterRuntime=encounterTargetIndex ? createBrowserWorldEncounterRuntime({encounterTargetIndex}) : null;
  const worldEncounterPersistenceRuntime=encounterTargetIndex ? createBrowserWorldEncounterPersistenceRuntime({encounterTargetIndex}) : null;
  const worldEncounterGroupRuntime=(encounterTargetIndex&&encounterGroupCatalog) ? createBrowserWorldEncounterGroupRuntime({groupCatalog:encounterGroupCatalog}) : null;
  const itemShopRuntime=(itemShopCatalog&&itemMakeCatalog)
    ? (worldNpcIndex
      ? createBrowserWorldItemShopRuntime({worldNpcIndex,catalog:itemShopCatalog,itemMakeCatalog,...itemShopRuntimeOptions})
      : createBrowserItemShopRuntime({catalog:itemShopCatalog,itemMakeCatalog,...itemShopRuntimeOptions}))
    : null;
  let sequence=0;
  let itemShopUi=itemShopUiInitialState();
  return {
    getItemShopUiState(){return clone(itemShopUi);},
    format:BROWSER_STATE_CONTROLLER_FORMAT,
    getConfig(){return clone(config);},
    getState(){return clone(currentState);},
    async dispatch(action={}){
      const type=String(action?.type??'').trim();
      if(type===ACTION_IDLE_LIST_ROUTES||type===ACTION_IDLE_ENABLE||type===ACTION_IDLE_EVENT||type===ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER||type===ACTION_IDLE_STATUS||type===ACTION_IDLE_OFFLINE_RESUME||type===ACTION_IDLE_OFFLINE_APPLY_REWARDS){
        if(!idleRuntime)return {ok:false,handled:false,stage:'idle-runtime',reason:'browser-idle-runtime-not-configured',state:clone(currentState)};
        if(idleRuntime.ok!==true)return {ok:false,handled:false,stage:'idle-runtime',reason:idleRuntime.reason??'browser-idle-runtime-invalid',errors:idleRuntime.errors??[],state:clone(currentState)};
        const result=await idleRuntime.dispatch(currentState,action,{now:action.now??now});
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {...result,state:clone(result.state??currentState)};
      }
      if(type===ACTION_WORLD_FIRST_ROUTE_PLAN){
        if(!worldFirstRouteRuntime)return {ok:false,handled:false,stage:'first-route-plan',reason:'browser-world-first-route-runtime-not-configured',state:clone(currentState)};
        if(worldFirstRouteRuntime.ok!==true)return {ok:false,handled:false,stage:'first-route-plan',reason:worldFirstRouteRuntime.reason??'browser-world-first-route-runtime-invalid',errors:worldFirstRouteRuntime.errors??[],state:clone(currentState)};
        const result=await worldFirstRouteRuntime.plan(currentState,{
          routeId:action.routeId??null,
          hometown:action.hometown??null,
          portalId:action.portalId??null
        });
        return {...result,state:clone(currentState)};
      }
      if(type===ACTION_WORLD_FIRST_ROUTE_EXECUTE){
        if(!worldFirstRouteRuntime)return {ok:false,handled:false,stage:'first-route-execute',reason:'browser-world-first-route-runtime-not-configured',state:clone(currentState)};
        if(worldFirstRouteRuntime.ok!==true)return {ok:false,handled:false,stage:'first-route-execute',reason:worldFirstRouteRuntime.reason??'browser-world-first-route-runtime-invalid',errors:worldFirstRouteRuntime.errors??[],state:clone(currentState)};
        const plan=await worldFirstRouteRuntime.plan(currentState,{
          routeId:action.routeId??null,
          hometown:action.hometown??null,
          portalId:action.portalId??null
        });
        if(!plan.ok)return {...plan,stage:plan.stage??'first-route-plan',state:clone(currentState)};
        const execution=await worldFirstRouteExecutionRuntime.execute(plan,{
          initialRevision:Number(currentState?.revision??0),
          dispatchMove:async routeAction=>{
            const result=await worldMovementRuntime.dispatch(currentState,routeAction,{now:routeAction.now??now});
            if(result.ok&&result.handled===true&&result.state)currentState=result.state;
            return {...result,state:clone(result.state??currentState)};
          },
          dispatchWarp:async routeAction=>{
            const result=await worldWarpPointRuntime.execute(currentState,{
              portalId:routeAction.portalId??null,
              position:routeAction.player??routeAction.position??null,
              expectedRevision:routeAction.expectedRevision==null?Number(currentState?.revision??0):routeAction.expectedRevision,
              savedAt:clockFactory(routeAction.savedAt??routeAction.now,now),
              now:clockFactory(routeAction.now,now),
              source:'browser-world-first-route'
            });
            if(result.ok&&result.handled===true&&result.state)currentState=result.state;
            return {...result,state:clone(result.state??currentState)};
          }
        });
        return {...execution,state:clone(execution.state??currentState)};
      }
      if(type===ACTION_WORLD_MOVE_STEP){
        if(worldMovementRuntime.ok!==true)return {ok:false,handled:false,stage:'movement-runtime',reason:worldMovementRuntime.reason??'browser-world-movement-runtime-invalid',errors:worldMovementRuntime.errors??[],state:clone(currentState)};
        const result=await worldMovementRuntime.dispatch(currentState,action,{now:clockFactory(action.now,now),savedAt:clockFactory(action.savedAt??action.now,now)});
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {...result,state:clone(result.state??currentState)};
      }
      if(type===ACTION_WORLD_WARPPOINT_EXECUTE){
        if(worldWarpPointRuntime.ok!==true)return {ok:false,handled:false,stage:'warppoint-runtime',reason:worldWarpPointRuntime.reason??'browser-world-warppoint-runtime-invalid',errors:worldWarpPointRuntime.errors??[],state:clone(currentState)};
        const result=await worldWarpPointRuntime.execute(currentState,{portalId:action.portalId??null,position:action.player??action.position??null,expectedRevision:action.expectedRevision==null?Number(currentState?.revision??0):action.expectedRevision,savedAt:clockFactory(action.savedAt??action.now,now),now:clockFactory(action.now,now),source:'browser-world-warppoint'});
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {...result,state:clone(result.state??currentState)};
      }
      if(type===ACTION_WORLD_ENCOUNTER_PREPARE){
        if(!worldEncounterRuntime)return {ok:false,handled:false,stage:'encounter-runtime',reason:'browser-world-encounter-runtime-not-configured',state:clone(currentState)};
        if(worldEncounterRuntime.ok!==true)return {ok:false,handled:false,stage:'encounter-runtime',reason:worldEncounterRuntime.reason??'browser-world-encounter-runtime-invalid',errors:worldEncounterRuntime.errors??[],state:clone(currentState)};
        const result=await worldEncounterRuntime.prepare(currentState,{
          position:action.position??action.player??null,
          encounterId:action.encounterId??null
        });
        return {...result,state:clone(result.state??currentState)};
      }
      if(type===ACTION_WORLD_ENCOUNTER_ROLL){
        if(!worldEncounterRuntime)return {ok:false,handled:false,stage:'encounter-runtime',reason:'browser-world-encounter-runtime-not-configured',state:clone(currentState)};
        if(worldEncounterRuntime.ok!==true)return {ok:false,handled:false,stage:'encounter-runtime',reason:worldEncounterRuntime.reason??'browser-world-encounter-runtime-invalid',errors:worldEncounterRuntime.errors??[],state:clone(currentState)};
        const result=await worldEncounterRuntime.roll(currentState,{
          position:action.position??action.player??null,
          encounterId:action.encounterId??null,
          cep:action.cep??0,
          rng120:action.rng120??null,
          noEnemy:action.noEnemy===true,
          battleModeNone:action.battleModeNone!==false,
          warpBlocked:action.warpBlocked===true
        });
        return {...result,state:clone(result.state??currentState)};
      }
      if(type===ACTION_WORLD_ENCOUNTER_GROUP_SELECT){
        if(!worldEncounterGroupRuntime)return {ok:false,handled:false,stage:'encounter-group-runtime',reason:'browser-world-encounter-group-runtime-not-configured',state:clone(currentState)};
        if(worldEncounterGroupRuntime.ok!==true)return {ok:false,handled:false,stage:'encounter-group-runtime',reason:worldEncounterGroupRuntime.reason??'browser-world-encounter-group-runtime-invalid',errors:worldEncounterGroupRuntime.errors??[],state:clone(currentState)};
        if(!worldEncounterRuntime)return {ok:false,handled:false,stage:'encounter-resolution',reason:'browser-world-encounter-runtime-not-configured',state:clone(currentState)};
        if(worldEncounterRuntime.ok!==true)return {ok:false,handled:false,stage:'encounter-resolution',reason:worldEncounterRuntime.reason??'browser-world-encounter-runtime-invalid',errors:worldEncounterRuntime.errors??[],state:clone(currentState)};
        const prepared=await worldEncounterRuntime.prepare(currentState,{position:action.position??action.player??null,encounterId:action.encounterId??null});
        if(!prepared.ok)return {...prepared,stage:prepared.stage??'encounter-resolution',state:clone(prepared.state??currentState)};
        const result=worldEncounterGroupRuntime.select(prepared.encounter,currentState,{groupRoll:action.groupRoll??null});
        return {...result,preparedEncounter:prepared.encounter,state:clone(result.state??currentState)};
      }
      if(type===ACTION_WORLD_ENCOUNTER_ROLL_COMMIT){
        if(!worldEncounterPersistenceRuntime)return {ok:false,handled:false,stage:'encounter-persistence-runtime',reason:'browser-world-encounter-persistence-runtime-not-configured',state:clone(currentState)};
        if(worldEncounterPersistenceRuntime.ok!==true)return {ok:false,handled:false,stage:'encounter-persistence-runtime',reason:worldEncounterPersistenceRuntime.reason??'browser-world-encounter-persistence-runtime-invalid',errors:worldEncounterPersistenceRuntime.errors??[],state:clone(currentState)};
        const result=await worldEncounterPersistenceRuntime.commit(currentState,{
          position:action.position??action.player??null,
          encounterId:action.encounterId??null,
          cep:action.cep==null?null:action.cep,
          rng120:action.rng120??null,
          noEnemy:action.noEnemy===true,
          battleModeNone:action.battleModeNone!==false,
          warpBlocked:action.warpBlocked===true,
          expectedRevision:action.expectedRevision==null?Number(currentState?.revision??0):action.expectedRevision,
          savedAt:clockFactory(action.savedAt??action.now,now),
          source:action.source??'browser-world-encounter'
        });
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {...result,state:clone(result.state??currentState)};
      }
      const requestedNpc=action?.npc??null;
      const targetCell=action?.targetCell??action?.targetPosition??action?.position??null;
      let resolvedWorldNpc=null;
      if((type===ACTION_NPC_RESOLVE_AT || (!requestedNpc && [ACTION_NPC_TALK,ACTION_NPC_HEALER_USE,ACTION_NPC_SAVEPOINT_SET,ACTION_NPC_SAVEPOINT_CONFIRM,ACTION_NPC_ITEMSHOP_OPEN,ACTION_NPC_ITEMSHOP_BUY,ACTION_NPC_ITEMSHOP_SELL,ITEMSHOP_UI_OPEN,ACTION_NPC_EVENT_EXECUTE,ACTION_NPC_WARP_EXECUTE].includes(type))) && targetCell){
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
      if(type===ACTION_NPC_WARP_EXECUTE){
        if(!warpRuntime)return {ok:false,handled:false,stage:'warp-runtime',reason:'browser-warp-runtime-not-configured',state:clone(currentState)};
        if(warpRuntime.ok!==true)return {ok:false,handled:false,stage:'warp-runtime',reason:warpRuntime.reason??'browser-warp-runtime-invalid',errors:warpRuntime.errors??[],state:clone(currentState)};
        const player=action.player??null;
        const npc=requestedNpc??resolvedWorldNpc;
        if(!npc)return {ok:false,handled:false,stage:'warp',reason:'warp-npc-required',state:clone(currentState)};
        const result=await warpRuntime.execute(currentState,npc,player,{
          expectedRevision:action.expectedRevision==null?Number(currentState?.revision??0):action.expectedRevision,
          savedAt:action.savedAt??action.now??now,
          now:action.now??now,
          source:'browser-warp'
        });
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {...result,stage:result.stage??'warp',worldNpc:resolvedWorldNpc?clone(resolvedWorldNpc):null,state:clone(result.state??currentState)};
      }
      if(type===ACTION_NPC_EVENT_EXECUTE){
        if(!moduleAudit)return {ok:false,handled:false,stage:'npc-event',reason:'npc-event-module-audit-required',state:clone(currentState)};
        const npc=requestedNpc??resolvedWorldNpc;
        if(!npc)return {ok:false,handled:false,stage:'npc-event',reason:'npc-event-npc-required',state:clone(currentState)};
        const player=action.player??null;
        const transactionId=String(action.transactionId??`${transactionPrefix}-npc-event-${++sequence}`).trim();
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
        return {...result,stage:'npc-event',event:true,worldNpc:resolvedWorldNpc?clone(resolvedWorldNpc):null,state:clone(result.state??currentState)};
      }
      if(type===ACTION_NPC_RESOLVE_AT){
        return {ok:true,handled:true,stage:'world-npc-resolution',worldNpc:clone(resolvedWorldNpc),state:clone(currentState)};
      }
      if(type===ITEMSHOP_UI_OPEN){
        if(!itemShopRuntime)return {ok:false,handled:false,stage:'itemshop-ui',reason:'browser-itemshop-runtime-not-configured',state:clone(currentState),ui:clone(itemShopUi)};
        if(itemShopRuntime.ok!==true)return {ok:false,handled:false,stage:'itemshop-ui',reason:'browser-itemshop-runtime-invalid',errors:itemShopRuntime.errors??[],state:clone(currentState),ui:clone(itemShopUi)};
        const npc=requestedNpc??resolvedWorldNpc;
        const opened=itemShopRuntime.dispatch(currentState,{...action,type:ACTION_NPC_ITEMSHOP_OPEN,npc,transactionId:action.transactionId},{interactionRule:action.interactionRule??interactionRule,maxDistance:action.maxDistance??maxDistance});
        if(!opened.ok)return {...opened,handled:false,stage:'shop-ui-open',ui:clone(applyItemShopUiResult(itemShopUi,{action:'open',ok:false,reason:opened.reason,result:opened.result??opened})) ,state:clone(currentState)};
        const ui=openItemShopUiState(itemShopUi,opened.shop);
        if(!ui.ok)return {ok:false,handled:false,stage:'shop-ui-open',reason:ui.reason,state:clone(currentState),ui:clone(itemShopUi)};
        itemShopUi=ui.state;
        return {...opened,handled:true,stage:'shop-ui-open',format:ITEMSHOP_UI_STATE_FORMAT,ui:clone(itemShopUi),state:clone(currentState)};
      }
      if(type===ITEMSHOP_UI_SELECT_OFFER){
        const selected=selectItemShopUiOffer(itemShopUi,action.itemId);
        if(!selected.ok)return {ok:false,handled:false,stage:'shop-ui',reason:selected.reason,state:clone(currentState),ui:clone(selected.state)};
        itemShopUi=selected.state;
        return {ok:true,handled:true,stage:'shop-ui-select-offer',format:ITEMSHOP_UI_STATE_FORMAT,offer:selected.offer,ui:clone(itemShopUi),state:clone(currentState)};
      }
      if(type===ITEMSHOP_UI_SET_QUANTITY){
        const changed=setItemShopUiQuantity(itemShopUi,action.quantity);
        if(!changed.ok)return {ok:false,handled:false,stage:'shop-ui',reason:changed.reason,state:clone(currentState),ui:clone(changed.state)};
        itemShopUi=changed.state;
        return {ok:true,handled:true,stage:'shop-ui-set-quantity',format:ITEMSHOP_UI_STATE_FORMAT,quantity:changed.quantity,ui:clone(itemShopUi),state:clone(currentState)};
      }
      if(type===ITEMSHOP_UI_CLOSE){
        const closed=closeItemShopUiState(itemShopUi);
        itemShopUi=closed.state;
        return {ok:true,handled:true,stage:'shop-ui-close',format:ITEMSHOP_UI_STATE_FORMAT,ui:clone(itemShopUi),state:clone(currentState)};
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
        const effectiveItemId=type===ACTION_NPC_ITEMSHOP_BUY ? (action.itemId??itemShopUi.selectedItemId) : action.itemId;
        const effectiveQuantity=type===ACTION_NPC_ITEMSHOP_BUY ? (action.quantity??itemShopUi.quantity) : action.quantity;
        const result=itemShopRuntime.dispatch(currentState,{...action,npc:requestedNpc??resolvedWorldNpc,transactionId,itemId:effectiveItemId,quantity:effectiveQuantity},{
          interactionRule:action.interactionRule??interactionRule,
          maxDistance:action.maxDistance??maxDistance
        });
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        itemShopUi=applyItemShopUiResult(itemShopUi,{action:type,ok:result.ok,reason:result.reason,result:result.result??result});
        return {...result,ui:clone(itemShopUi),state:clone(result.state??currentState)};
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
  ACTION_NPC_EVENT_EXECUTE,
  ACTION_NPC_WARP_EXECUTE,
  ACTION_WORLD_MOVE_STEP,
  ACTION_WORLD_WARPPOINT_EXECUTE,
  ACTION_WORLD_FIRST_ROUTE_PLAN,
  ACTION_WORLD_FIRST_ROUTE_EXECUTE,
  ACTION_WORLD_ENCOUNTER_PREPARE,
  ACTION_WORLD_ENCOUNTER_ROLL,
  ACTION_WORLD_ENCOUNTER_ROLL_COMMIT,
  ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
  BROWSER_WORLD_NPC_RUNTIME_FORMAT,
  BROWSER_WARP_RUNTIME_FORMAT,
  BROWSER_WORLD_MOVEMENT_RUNTIME_FORMAT,
  BROWSER_WORLD_WARPPOINT_RUNTIME_FORMAT,
  BROWSER_WORLD_ROUTE_RUNTIME_FORMAT,
  BROWSER_WORLD_ROUTE_EXECUTION_RUNTIME_FORMAT,
  BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT,
  BROWSER_WORLD_ENCOUNTER_PERSISTENCE_RUNTIME_FORMAT,
  BROWSER_WORLD_ENCOUNTER_GROUP_RUNTIME_FORMAT,
  BROWSER_HEALER_RUNTIME_FORMAT,
  BROWSER_SAVEPOINT_RUNTIME_FORMAT,
  BROWSER_IDLE_RUNTIME_FORMAT,
  ACTION_IDLE_LIST_ROUTES,
  ACTION_IDLE_ENABLE,
  ACTION_IDLE_EVENT,
  ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER,
  ACTION_IDLE_STATUS,
  ACTION_IDLE_OFFLINE_RESUME,
  ACTION_IDLE_OFFLINE_APPLY_REWARDS,
  ITEMSHOP_UI_OPEN,
  ITEMSHOP_UI_SELECT_OFFER,
  ITEMSHOP_UI_SET_QUANTITY,
  ITEMSHOP_UI_CLOSE,
  createBrowserStateController
};
