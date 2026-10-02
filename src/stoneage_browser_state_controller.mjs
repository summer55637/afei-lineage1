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
import { createBrowserWorldEncounterEnemyRuntime, ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE, BROWSER_WORLD_ENCOUNTER_ENEMY_RUNTIME_FORMAT } from './stoneage_browser_world_encounter_enemy_runtime.mjs';
import { createBrowserWorldEncounterIdleBridge, ACTION_WORLD_ENCOUNTER_ROLL_IDLE_COMMIT, BROWSER_WORLD_ENCOUNTER_IDLE_BRIDGE_FORMAT } from './stoneage_browser_world_encounter_idle_bridge.mjs';
import { buildBattleContext, validateBattleContext, ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD, BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT } from './stoneage_browser_battle_context_runtime.mjs';
import { ACTION_BATTLE_TURN_INITIALIZE, BROWSER_BATTLE_TURN_RUNTIME_FORMAT } from './stoneage_browser_battle_turn_runtime.mjs';
import { createBrowserBattleInitializeRuntime, ACTION_BATTLE_INITIALIZE, BROWSER_BATTLE_INITIALIZE_RUNTIME_FORMAT } from './stoneage_browser_battle_initialize_runtime.mjs';
import { createBrowserBattleCommandWaitRuntime, ACTION_BATTLE_COMMAND_WAIT_STATUS, BROWSER_BATTLE_COMMAND_WAIT_RUNTIME_FORMAT } from './stoneage_browser_battle_command_wait_runtime.mjs';
import { createBrowserBattlePlayerCommandRuntime, ACTION_BATTLE_PLAYER_COMMAND_SET, ACTION_BATTLE_PLAYER_COMMAND_PREFLIGHT, BROWSER_BATTLE_PLAYER_COMMAND_RUNTIME_FORMAT, preflightPlayerBattleCommand } from './stoneage_browser_battle_player_command_runtime.mjs';
import { createBrowserBattleTargetRuntime, ACTION_BATTLE_TARGET_RESOLVE, BROWSER_BATTLE_TARGET_RUNTIME_FORMAT } from './stoneage_browser_battle_target_runtime.mjs';
import { createBrowserBattleDefaultTargetRuntime, ACTION_BATTLE_DEFAULT_TARGET_RESOLVE, BROWSER_BATTLE_DEFAULT_TARGET_RUNTIME_FORMAT } from './stoneage_browser_battle_default_target_runtime.mjs';
import { createBrowserIdleBattleStrategyRuntime, ACTION_BATTLE_IDLE_STRATEGY_APPLY, BROWSER_IDLE_BATTLE_STRATEGY_RUNTIME_FORMAT } from './stoneage_browser_idle_battle_strategy_runtime.mjs';
import { createBrowserBattleAttackPreflightRuntime, ACTION_BATTLE_ATTACK_PREFLIGHT, BROWSER_BATTLE_ATTACK_PREFLIGHT_RUNTIME_FORMAT } from './stoneage_browser_battle_attack_preflight_runtime.mjs';
import { createBrowserBattleAttackSeqPreludeRuntime, ACTION_BATTLE_ATTACK_SEQ_PRELUDE, BROWSER_BATTLE_ATTACK_SEQ_PRELUDE_FORMAT } from './stoneage_browser_battle_attack_seq_prelude_runtime.mjs';
import { createBrowserBattleDamagePlanRuntime, ACTION_BATTLE_DAMAGE_PLAN, BROWSER_BATTLE_DAMAGE_PLAN_RUNTIME_FORMAT } from './stoneage_browser_battle_damage_plan_runtime.mjs';
import { createBrowserBattleCriticalDamageRuntime, ACTION_BATTLE_CRITICAL_DAMAGE_PLAN, BROWSER_BATTLE_CRITICAL_DAMAGE_RUNTIME_FORMAT } from './stoneage_browser_battle_critical_damage_runtime.mjs';
import { createBrowserBattleDamageReactRuntime, ACTION_BATTLE_DAMAGE_REACT_PLAN, BROWSER_BATTLE_DAMAGE_REACT_RUNTIME_FORMAT } from './stoneage_browser_battle_damage_react_runtime.mjs';
import { createBrowserBattleCounterRuntime, ACTION_BATTLE_COUNTER_PLAN, BROWSER_BATTLE_COUNTER_RUNTIME_FORMAT } from './stoneage_browser_battle_counter_runtime.mjs';
import { createBrowserBattleDeathRuntime, ACTION_BATTLE_DEATH_PLAN, BROWSER_BATTLE_DEATH_RUNTIME_FORMAT } from './stoneage_browser_battle_death_runtime.mjs';
import { createBrowserBattleDeathCommitRuntime, ACTION_BATTLE_DEATH_COMMIT, BROWSER_BATTLE_DEATH_COMMIT_RUNTIME_FORMAT } from './stoneage_browser_battle_death_commit_runtime.mjs';
import { createBrowserBattleEndRuntime, ACTION_BATTLE_END_PLAN, BROWSER_BATTLE_END_RUNTIME_FORMAT } from './stoneage_browser_battle_end_runtime.mjs';
import { createBrowserBattleFinishCommitRuntime, ACTION_BATTLE_FINISH_COMMIT, BROWSER_BATTLE_FINISH_COMMIT_RUNTIME_FORMAT } from './stoneage_browser_battle_finish_commit_runtime.mjs';
import { createBrowserBattleProfitRouteRuntime, ACTION_BATTLE_PROFIT_ROUTE_PLAN, BROWSER_BATTLE_PROFIT_ROUTE_RUNTIME_FORMAT } from './stoneage_browser_battle_profit_route_runtime.mjs';
import { createBrowserBattleDuelPointRuntime, ACTION_BATTLE_DUELPOINT_PLAN, BROWSER_BATTLE_DUELPOINT_RUNTIME_FORMAT } from './stoneage_browser_battle_duelpoint_runtime.mjs';
import { createBrowserBattleDuelPointCommitRuntime, ACTION_BATTLE_DUELPOINT_COMMIT, BROWSER_BATTLE_DUELPOINT_COMMIT_RUNTIME_FORMAT } from './stoneage_browser_battle_duelpoint_commit_runtime.mjs';
import { createBrowserBattleExpPlanRuntime, ACTION_BATTLE_EXP_PLAN, BROWSER_BATTLE_EXP_PLAN_RUNTIME_FORMAT } from './stoneage_browser_battle_exp_runtime.mjs';
import { createBrowserBattleLevelUpPlanRuntime, ACTION_BATTLE_LEVELUP_PLAN, BROWSER_BATTLE_LEVELUP_PLAN_RUNTIME_FORMAT } from './stoneage_browser_battle_levelup_runtime.mjs';
import { createBrowserBattlePetGrowthPlanRuntime, ACTION_BATTLE_PET_GROWTH_PLAN, BROWSER_BATTLE_PET_GROWTH_PLAN_RUNTIME_FORMAT } from './stoneage_browser_battle_pet_growth_runtime.mjs';
import { createBrowserBattleLevelUpCommitRuntime, ACTION_BATTLE_LEVELUP_COMMIT, BROWSER_BATTLE_LEVELUP_COMMIT_RUNTIME_FORMAT } from './stoneage_browser_battle_levelup_commit_runtime.mjs';
import { createBrowserBattleItemPlanRuntime, ACTION_BATTLE_ITEM_PLAN, BROWSER_BATTLE_ITEM_PLAN_RUNTIME_FORMAT } from './stoneage_browser_battle_item_runtime.mjs';
import { createBrowserBattleItemCommitRuntime, ACTION_BATTLE_ITEM_COMMIT, BROWSER_BATTLE_ITEM_COMMIT_RUNTIME_FORMAT } from './stoneage_browser_battle_item_commit_runtime.mjs';
import { createBrowserBattleCompliancePlanRuntime, ACTION_BATTLE_COMPLIANCE_PLAN, BROWSER_BATTLE_COMPLIANCE_PLAN_RUNTIME_FORMAT } from './stoneage_browser_battle_compliance_runtime.mjs';
import { createBrowserBattleComplianceCommitRuntime, ACTION_BATTLE_COMPLIANCE_COMMIT, BROWSER_BATTLE_COMPLIANCE_COMMIT_RUNTIME_FORMAT } from './stoneage_browser_battle_compliance_commit_runtime.mjs';
import { createBrowserBattleExitPlanRuntime, ACTION_BATTLE_EXIT_PLAN, BROWSER_BATTLE_EXIT_PLAN_RUNTIME_FORMAT } from './stoneage_browser_battle_exit_runtime.mjs';
import { createBrowserBattleExitCommitRuntime, ACTION_BATTLE_EXIT_COMMIT, BROWSER_BATTLE_EXIT_COMMIT_RUNTIME_FORMAT } from './stoneage_browser_battle_exit_commit_runtime.mjs';
import { createBrowserBattlePlayerExitRuntime, ACTION_BATTLE_PLAYER_EXIT_PLAN, BROWSER_BATTLE_PLAYER_EXIT_RUNTIME_FORMAT } from './stoneage_browser_battle_player_exit_runtime.mjs';
import { createBrowserBattlePlayerExitCommitRuntime, ACTION_BATTLE_PLAYER_EXIT_COMMIT, BROWSER_BATTLE_PLAYER_EXIT_COMMIT_RUNTIME_FORMAT } from './stoneage_browser_battle_player_exit_commit_runtime.mjs';
import { createBrowserBattleSettlementRuntime, ACTION_BATTLE_SETTLEMENT_RECEIPT_COMMIT, BROWSER_BATTLE_SETTLEMENT_RUNTIME_FORMAT, validateSettlementReceiptForBattle } from './stoneage_browser_battle_settlement_runtime.mjs';
import { createBrowserBattleContextClearRuntime, ACTION_BATTLE_CONTEXT_CLEAR, BROWSER_BATTLE_CONTEXT_CLEAR_RUNTIME_FORMAT } from './stoneage_browser_battle_context_clear_runtime.mjs';
import { createBrowserBattleFieldRuntime, ACTION_BATTLE_FIELD_RESOLVE, BROWSER_BATTLE_FIELD_RUNTIME_FORMAT } from './stoneage_browser_battle_field_runtime.mjs';
import { createBrowserWarpRuntime, BROWSER_WARP_RUNTIME_FORMAT } from './stoneage_browser_warp_runtime.mjs';
import { itemShopUiInitialState, openItemShopUiState, selectItemShopUiOffer, setItemShopUiQuantity, applyItemShopUiResult, closeItemShopUiState, ITEMSHOP_UI_STATE_FORMAT } from './stoneage_browser_itemshop_ui_state.mjs';
import { IDLE_EVENTS } from './stoneage_idle_loop.mjs';
import { buildSaveEnvelope } from './stoneage_save_transaction.mjs';
import { DEFAULT_SAVE_STORAGE_KEY, writeSaveEnvelopeToStorage } from './stoneage_save_storage.mjs';

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

function requireBattleContextClearForWorldLoop(battleContext,type,state){
  if(!battleContext)return null;
  return {
    ok:false,
    handled:false,
    stage:'battle-context-clear-gate',
    reason:'battle-context-clear-required',
    type,
    battleContext:clone(battleContext),
    state:clone(state)
  };
}

function requireBattlePhase(battleContext,type,state){
  if(!battleContext)return {
    ok:false,
    handled:false,
    stage:'battle-phase-gate',
    reason:'battle-context-required',
    type,
    state:clone(state)
  };
  const mode=String(battleContext?.context?.mode??'').trim();
  if(mode!=='battle')return {
    ok:false,
    handled:false,
    stage:'battle-phase-gate',
    reason:'battle-active-phase-required',
    type,
    mode,
    battleContext:clone(battleContext),
    state:clone(state)
  };
  return null;
}

function findBattleEntryByBid(battleContext,bid){
  const n=Number(bid);
  if(!Number.isInteger(n)||n<0||n>19)return null;
  const side=n>=10?1:0;
  const slot=n>=10?n-10:n;
  const sideObj=battleContext?.context?.sides?.find(x=>Number(x?.side)===side);
  return Array.isArray(sideObj?.entries)?sideObj.entries[slot]??null:null;
}

function requireAttackCommandBinding(battleContext,type,attackerBid,targetBid,state){
  const attacker=findBattleEntryByBid(battleContext,attackerBid);
  const a=Number(attackerBid),t=Number(targetBid);
  if(!attacker||!Number.isInteger(a)||!Number.isInteger(t))return {
    ok:false,handled:false,stage:'attack-command-binding',reason:'attack-command-entry-invalid',attackerBid:attackerBid,targetBid:targetBid,state:clone(state)
  };
  const command=Number(attacker?.battleCommands?.[0]);
  if(![1,8].includes(command))return {
    ok:false,handled:false,stage:'attack-command-binding',reason:'attack-command-required',attackerBid:a,targetBid:t,command:Number.isFinite(command)?command:null,state:clone(state)
  };
  const commandTarget=Number(attacker?.battleCommands?.[1]);
  if(!Number.isInteger(commandTarget)||commandTarget!==t)return {
    ok:false,handled:false,stage:'attack-command-binding',reason:'attack-command-target-mismatch',attackerBid:a,targetBid:t,commandTarget:Number.isFinite(commandTarget)?commandTarget:null,state:clone(state)
  };
  return null;
}

function createBrowserStateController({
  state,
  saveStorage=null,
  saveStorageKey=DEFAULT_SAVE_STORAGE_KEY,
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
  battleFieldNoProvider=null,
  battleFieldRuntimeOptions={},
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
  const worldEncounterEnemyRuntime=(encounterTargetIndex&&encounterGroupCatalog) ? createBrowserWorldEncounterEnemyRuntime({groupCatalog:encounterGroupCatalog}) : null;
  const worldEncounterIdleBridge=encounterTargetIndex ? createBrowserWorldEncounterIdleBridge({encounterTargetIndex}) : null;
  const battleFieldRuntime=createBrowserBattleFieldRuntime({mapRuntimeOptions:battleFieldRuntimeOptions});
  const battleTargetRuntime=createBrowserBattleTargetRuntime();
  const battleDefaultTargetRuntime=createBrowserBattleDefaultTargetRuntime();
  const idleBattleStrategyRuntime=createBrowserIdleBattleStrategyRuntime();
  const battleAttackPreflightRuntime=createBrowserBattleAttackPreflightRuntime();
  const battleAttackSeqPreludeRuntime=createBrowserBattleAttackSeqPreludeRuntime();
  const battleDamagePlanRuntime=createBrowserBattleDamagePlanRuntime();
  const battleCriticalDamageRuntime=createBrowserBattleCriticalDamageRuntime();
  const battleDamageReactRuntime=createBrowserBattleDamageReactRuntime();
  const battleCounterRuntime=createBrowserBattleCounterRuntime();
  const battleDeathRuntime=createBrowserBattleDeathRuntime();
  const battleDeathCommitRuntime=createBrowserBattleDeathCommitRuntime();
  const battleEndRuntime=createBrowserBattleEndRuntime();
  const battleFinishCommitRuntime=createBrowserBattleFinishCommitRuntime();
  const battleProfitRouteRuntime=createBrowserBattleProfitRouteRuntime();
  const battleDuelPointRuntime=createBrowserBattleDuelPointRuntime();
  const battleDuelPointCommitRuntime=createBrowserBattleDuelPointCommitRuntime();
  const battleExpPlanRuntime=createBrowserBattleExpPlanRuntime();
  const battleLevelUpPlanRuntime=createBrowserBattleLevelUpPlanRuntime();
  const battlePetGrowthPlanRuntime=createBrowserBattlePetGrowthPlanRuntime();
  const battleLevelUpCommitRuntime=createBrowserBattleLevelUpCommitRuntime();
  const battleItemPlanRuntime=createBrowserBattleItemPlanRuntime();
  const battleItemCommitRuntime=createBrowserBattleItemCommitRuntime();
  const battleCompliancePlanRuntime=createBrowserBattleCompliancePlanRuntime();
  const battleComplianceCommitRuntime=createBrowserBattleComplianceCommitRuntime();
  const battleExitPlanRuntime=createBrowserBattleExitPlanRuntime();
  const battleExitCommitRuntime=createBrowserBattleExitCommitRuntime();
  const battlePlayerExitRuntime=createBrowserBattlePlayerExitRuntime();
  const battlePlayerExitCommitRuntime=createBrowserBattlePlayerExitCommitRuntime();
  const battleSettlementRuntime=createBrowserBattleSettlementRuntime();
  const battleContextClearRuntime=createBrowserBattleContextClearRuntime();
  const battleInitializeRuntime=createBrowserBattleInitializeRuntime();
  const battleCommandWaitRuntime=createBrowserBattleCommandWaitRuntime();
  const battlePlayerCommandRuntime=createBrowserBattlePlayerCommandRuntime();
  const itemShopRuntime=(itemShopCatalog&&itemMakeCatalog)
    ? (worldNpcIndex
      ? createBrowserWorldItemShopRuntime({worldNpcIndex,catalog:itemShopCatalog,itemMakeCatalog,...itemShopRuntimeOptions})
      : createBrowserItemShopRuntime({catalog:itemShopCatalog,itemMakeCatalog,...itemShopRuntimeOptions}))
    : null;
  let sequence=0;
  let battleContext=null;
  let itemShopUi=itemShopUiInitialState();
  // Transient encounter pipeline; never persisted. Binds source encounter -> selected group -> generated enemy roster.
  let encounterPipeline=null;
  // Transient attack plan chain; never persisted. Binds command -> AttackSeq -> Damage -> React -> Counter.
  let battleAttackPipeline=null;
  // Serialize controller dispatches so async state-mutating actions cannot observe the same revision concurrently.
  let dispatchTail=Promise.resolve();
  return {
    getItemShopUiState(){return clone(itemShopUi);},
    getBattleContext(){return battleContext?clone(battleContext):null},
    format:BROWSER_STATE_CONTROLLER_FORMAT,
    getConfig(){return clone(config);},
    getState(){return clone(currentState);},
    dispatch(action={}){
      const execute=async()=>{
      const type=String(action?.type??'').trim();
      if(type===ACTION_IDLE_LIST_ROUTES||type===ACTION_IDLE_ENABLE||type===ACTION_IDLE_EVENT||type===ACTION_IDLE_SIMULATE_FIRST_ENCOUNTER||type===ACTION_IDLE_STATUS||type===ACTION_IDLE_OFFLINE_RESUME||type===ACTION_IDLE_OFFLINE_APPLY_REWARDS){
        if(type===ACTION_IDLE_EVENT&&String(action.event??'').trim()===IDLE_EVENTS.REWARD_APPLIED&&battleContext){
          const receiptId=String(action.payload?.settlementReceiptId??'').trim();
          if(!receiptId)return {ok:false,handled:false,stage:'idle-event',reason:'settlement-receipt-required',state:clone(currentState)};
          const receiptCheck=validateSettlementReceiptForBattle(currentState,{format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},receiptId);
          if(!receiptCheck.ok)return {ok:false,handled:false,stage:'idle-event',reason:receiptCheck.reason,receiptId,state:clone(currentState)};
        }
        if(!idleRuntime)return {ok:false,handled:false,stage:'idle-runtime',reason:'browser-idle-runtime-not-configured',state:clone(currentState)};
        if(idleRuntime.ok!==true)return {ok:false,handled:false,stage:'idle-runtime',reason:idleRuntime.reason??'browser-idle-runtime-invalid',errors:idleRuntime.errors??[],state:clone(currentState)};
        const result=await idleRuntime.dispatch(currentState,action,{now:action.now??now});
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {...result,state:clone(result.state??currentState)};
      }
      if(type===ACTION_WORLD_FIRST_ROUTE_PLAN){
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

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
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

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
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

        if(worldMovementRuntime.ok!==true)return {ok:false,handled:false,stage:'movement-runtime',reason:worldMovementRuntime.reason??'browser-world-movement-runtime-invalid',errors:worldMovementRuntime.errors??[],state:clone(currentState)};
        const result=await worldMovementRuntime.dispatch(currentState,action,{now:clockFactory(action.now,now),savedAt:clockFactory(action.savedAt??action.now,now)});
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {...result,state:clone(result.state??currentState)};
      }
      if(type===ACTION_WORLD_WARPPOINT_EXECUTE){
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

        if(worldWarpPointRuntime.ok!==true)return {ok:false,handled:false,stage:'warppoint-runtime',reason:worldWarpPointRuntime.reason??'browser-world-warppoint-runtime-invalid',errors:worldWarpPointRuntime.errors??[],state:clone(currentState)};
        const result=await worldWarpPointRuntime.execute(currentState,{portalId:action.portalId??null,position:action.player??action.position??null,expectedRevision:action.expectedRevision==null?Number(currentState?.revision??0):action.expectedRevision,savedAt:clockFactory(action.savedAt??action.now,now),now:clockFactory(action.now,now),source:'browser-world-warppoint'});
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {...result,state:clone(result.state??currentState)};
      }
      if(type===ACTION_WORLD_ENCOUNTER_PREPARE){
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

        if(!worldEncounterRuntime)return {ok:false,handled:false,stage:'encounter-runtime',reason:'browser-world-encounter-runtime-not-configured',state:clone(currentState)};
        if(worldEncounterRuntime.ok!==true)return {ok:false,handled:false,stage:'encounter-runtime',reason:worldEncounterRuntime.reason??'browser-world-encounter-runtime-invalid',errors:worldEncounterRuntime.errors??[],state:clone(currentState)};
        const result=await worldEncounterRuntime.prepare(currentState,{
          position:action.position??action.player??null,
          encounterId:action.encounterId??null
        });
        return {...result,state:clone(result.state??currentState)};
      }
      if(type===ACTION_WORLD_ENCOUNTER_ROLL){
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

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
      if(type===ACTION_BATTLE_IDLE_STRATEGY_APPLY){
        const phaseGate=requireBattlePhase(battleContext,type,currentState);
        if(phaseGate)return phaseGate;
        if(idleBattleStrategyRuntime.ok!==true)return {ok:false,handled:false,stage:'idle-battle-strategy',reason:'browser-idle-battle-strategy-runtime-invalid',state:clone(currentState)};
        const result=idleBattleStrategyRuntime.apply(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {
            strategy:action.strategy??currentState?.battleSettings?.strategy??null,
            playerId:action.playerId??currentState?.player?.id??battleContext?.leaderId??null,
            defaultTargetRoll:action.defaultTargetRoll??null,
            weaponKind:action.weaponKind??null
          }
        );
        if(result.ok&&result.handled===true&&result.battleContext){
          battleContext=clone(result.battleContext);
          if(result.command||result.petCommands?.length)battleAttackPipeline=null;
        }
        return {
          ...result,
          format:BROWSER_IDLE_BATTLE_STRATEGY_RUNTIME_FORMAT,
          battleContext:battleContext?clone(battleContext):null,
          state:clone(currentState)
        };
      }
      if(type===ACTION_BATTLE_PLAYER_COMMAND_PREFLIGHT){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-player-command-preflight',reason:'battle-context-required',state:clone(currentState)};
        const result=preflightPlayerBattleCommand(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {
            battleSlot:action.battleSlot??0,
            command:action.command??null,
            targetBid:action.targetBid==null?null:action.targetBid,
            petIndex:action.petIndex==null?null:action.petIndex
          }
        );
        return {...result,format:BROWSER_BATTLE_PLAYER_COMMAND_RUNTIME_FORMAT,state:clone(currentState)};
      }
      if(type===ACTION_BATTLE_PLAYER_COMMAND_SET){
        const phaseGate=requireBattlePhase(battleContext,type,currentState);
        if(phaseGate)return phaseGate;
        if(!battleContext)return {ok:false,handled:false,stage:'battle-player-command',reason:'battle-context-required',state:clone(currentState)};
        if(battlePlayerCommandRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-player-command',reason:'browser-battle-player-command-runtime-invalid',state:clone(currentState)};
        const result=battlePlayerCommandRuntime.set(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {
            battleSlot:action.battleSlot??0,
            command:action.command??null,
            targetBid:action.targetBid==null?null:action.targetBid,
            weaponKind:action.weaponKind??null,
            actorId:action.actorId??null
          }
        );
        if(!result.ok)return {...result,state:clone(currentState)};
        battleContext=clone(result.battleContext);
        battleAttackPipeline=null;
        return {...result,format:BROWSER_BATTLE_PLAYER_COMMAND_RUNTIME_FORMAT,battleContext:clone(battleContext),state:clone(currentState)};
      }
      if(type===ACTION_BATTLE_COMMAND_WAIT_STATUS){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-command-wait',reason:'battle-context-required',state:clone(currentState)};
        if(battleCommandWaitRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-command-wait',reason:'browser-battle-command-wait-runtime-invalid',state:clone(currentState)};
        const result=battleCommandWaitRuntime.status(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {timeoutExpired:action.timeoutExpired===true}
        );
        return {...result,format:BROWSER_BATTLE_COMMAND_WAIT_RUNTIME_FORMAT,battleContext:clone(battleContext),state:clone(currentState)};
      }
      if(type===ACTION_BATTLE_INITIALIZE){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-initialize',reason:'battle-context-required',state:clone(currentState)};
        if(String(battleContext?.context?.mode??'').trim()!=='init'){
          return {ok:false,handled:false,stage:'battle-initialize-gate',reason:'battle-initialize-requires-init-phase',mode:String(battleContext?.context?.mode??''),state:clone(currentState)};
        }
        if(battleInitializeRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-initialize',reason:'browser-battle-initialize-runtime-invalid',state:clone(currentState)};
        const result=battleInitializeRuntime.initialize(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {
            fixedLuck:action.fixedLuck??null,
            surpriseRoll:action.surpriseRoll??null,
            winFuncPresent:action.winFuncPresent===true,
            playerPresent:action.playerPresent!==false,
            chargeEntries:Array.isArray(action.chargeEntries)?action.chargeEntries:[]
          }
        );
        if(!result.ok)return {...result,state:clone(currentState)};
        battleContext=clone(result.context);
        return {...result,stage:'battle-initialized',format:BROWSER_BATTLE_INITIALIZE_RUNTIME_FORMAT,battleContext:clone(battleContext),state:clone(currentState)};
      }
      if(type===ACTION_BATTLE_TURN_INITIALIZE){
        return {
          ok:false,
          handled:false,
          stage:'battle-turn-gate',
          reason:'battle-turn-initialize-internal-only',
          state:clone(currentState),
          battleContext:battleContext?clone(battleContext):null
        };
      }
      if(type===ACTION_BATTLE_DAMAGE_PLAN){
        const phaseGate=requireBattlePhase(battleContext,type,currentState);
        if(phaseGate)return phaseGate;
        const pipeline=battleAttackPipeline;
        if(!pipeline?.prelude)return {ok:false,handled:false,stage:'battle-damage-plan-binding',reason:'attack-seq-plan-required',state:clone(currentState)};
        const attackerBid=action.attackerBid??null;
        const targetBid=action.targetBid??null;
        if(Number(attackerBid)!==Number(pipeline.attackerBid)||Number(targetBid)!==Number(pipeline.finalTargetBid)){
          return {ok:false,handled:false,stage:'battle-damage-plan-binding',reason:'attack-seq-target-mismatch',attackerBid,targetBid,expectedAttackerBid:pipeline.attackerBid,expectedTargetBid:pipeline.finalTargetBid,state:clone(currentState)};
        }
        if(battleDamagePlanRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-damage-plan',reason:'browser-battle-damage-plan-runtime-invalid',state:clone(currentState)};
        const result=battleDamagePlanRuntime.plan(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {
            attackerBid:pipeline.attackerBid,
            targetBid:pipeline.finalTargetBid,
            damageRollNear:action.damageRollNear??null,
            damageRollWide:action.damageRollWide??null,
            fieldAtt:action.fieldAtt??(battleContext?.context?.fieldAtt??4),
            fieldAttrPower:action.fieldAttrPower??(battleContext?.context?.attPow??0),
            includeAttr:action.includeAttr!==false
          }
        );
        if(result.ok===true){
          battleAttackPipeline.damage=clone(result);
          battleAttackPipeline.damageInput={
            damageRollNear:action.damageRollNear??null,
            damageRollWide:action.damageRollWide??null,
            fieldAtt:action.fieldAtt??(battleContext?.context?.fieldAtt??4),
            fieldAttrPower:action.fieldAttrPower??(battleContext?.context?.attPow??0),
            includeAttr:action.includeAttr!==false
          };
        }
        return {...result,format:BROWSER_BATTLE_DAMAGE_PLAN_RUNTIME_FORMAT,state:clone(currentState)};
      }
      if(type===ACTION_BATTLE_CRITICAL_DAMAGE_PLAN){
        const phaseGate=requireBattlePhase(battleContext,type,currentState);
        if(phaseGate)return phaseGate;
        const pipeline=battleAttackPipeline;
        if(!pipeline?.prelude)return {ok:false,handled:false,stage:'battle-critical-damage-binding',reason:'attack-seq-plan-required',state:clone(currentState)};
        if(!pipeline?.damage)return {ok:false,handled:false,stage:'battle-critical-damage-binding',reason:'damage-plan-required',state:clone(currentState)};
        const attackerBid=action.attackerBid??null;
        const targetBid=action.targetBid??null;
        if(Number(attackerBid)!==Number(pipeline.attackerBid)||Number(targetBid)!==Number(pipeline.finalTargetBid)){
          return {ok:false,handled:false,stage:'battle-critical-damage-binding',reason:'attack-seq-target-mismatch',attackerBid,targetBid,expectedAttackerBid:pipeline.attackerBid,expectedTargetBid:pipeline.finalTargetBid,state:clone(currentState)};
        }
        if(battleCriticalDamageRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-critical-damage',reason:'browser-battle-critical-damage-runtime-invalid',state:clone(currentState)};
        const input=pipeline.damageInput??{};
        const result=battleCriticalDamageRuntime.plan(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {
            attackerBid:pipeline.attackerBid,
            targetBid:pipeline.finalTargetBid,
            damageRollNear:input.damageRollNear,
            damageRollWide:input.damageRollWide,
            fieldAtt:input.fieldAtt,
            fieldAttrPower:input.fieldAttrPower,
            includeAttr:input.includeAttr!==false,
            critical:pipeline.prelude?.critical?.critical===true,
            attackSeqPrelude:clone(pipeline.prelude),
            weaponType:pipeline.weaponType,
            guardRoll:action.guardRoll??null,
            lowDamageRoll:action.lowDamageRoll??null,
            battleDamageModify:action.battleDamageModify??1
          }
        );
        if(result.ok===true){
          if(Number(result.baseDamage)!==Number(pipeline.damage.damage)){
            return {ok:false,handled:false,stage:'battle-critical-damage-binding',reason:'critical-base-damage-mismatch',expectedDamage:pipeline.damage.damage,actualDamage:result.baseDamage,state:clone(currentState)};
          }
          pipeline.criticalDamage=clone(result);
        }
        return {...result,format:BROWSER_BATTLE_CRITICAL_DAMAGE_RUNTIME_FORMAT,state:clone(currentState)};
      }
      if(type===ACTION_BATTLE_DEATH_PLAN){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-death',reason:'battle-context-required',state:clone(currentState)};
        if(battleDeathRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-death',reason:'browser-battle-death-runtime-invalid',state:clone(currentState)};
        const result=battleDeathRuntime.plan(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {
            targetBid:action.targetBid??null,
            hp:action.hp??null,
            battleFlags:action.battleFlags??0,
            critical:action.critical===true,
            criticalFlag:action.criticalFlag??null,
            ultimateFromDamage:action.ultimateFromDamage??0,
            lerImmune:action.lerImmune===true,
            deathRoll:action.deathRoll??null
          }
        );
        return {...result,format:BROWSER_BATTLE_DEATH_RUNTIME_FORMAT,state:clone(currentState)};
      }
      if(type===ACTION_BATTLE_DEATH_COMMIT){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-death-commit',reason:'battle-context-required',state:clone(currentState)};
        if(battleDeathCommitRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-death-commit',reason:'browser-battle-death-commit-runtime-invalid',state:clone(currentState)};

        let plan=action.deathPlan??null;
        if(!plan){
          plan=battleDeathRuntime.plan(
            {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
            {
              targetBid:action.targetBid??null,
              hp:action.hp??null,
              battleFlags:action.battleFlags??0,
              critical:action.critical===true,
              criticalFlag:action.criticalFlag??null,
              ultimateFromDamage:action.ultimateFromDamage??0,
              lerImmune:action.lerImmune===true,
              deathRoll:action.deathRoll??null
            }
          );
          if(!plan.ok)return {...plan,format:BROWSER_BATTLE_DEATH_RUNTIME_FORMAT,state:clone(currentState)};
        }

        const result=battleDeathCommitRuntime.commit(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {
            targetBid:action.targetBid??plan.targetBid??null,
            deathPlan:plan,
            clientFlags:action.clientFlags??plan.clientFlags??0,
            ultimate:action.ultimate??plan.ultimate??0
          }
        );
        if(result.ok&&result.handled===true&&result.battleContext){
          battleContext=clone(result.battleContext?.context??result.battleContext);
          battleAttackPipeline=null;
        }
        return {
          ...result,
          format:BROWSER_BATTLE_DEATH_COMMIT_RUNTIME_FORMAT,
          battleContext:result.battleContext?clone(result.battleContext):(battleContext?clone(battleContext):null),
          state:clone(currentState)
        };
      }
      if(type===ACTION_BATTLE_END_PLAN){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-end',reason:'battle-context-required',state:clone(currentState)};
        if(battleEndRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-end',reason:'browser-battle-end-runtime-invalid',state:clone(currentState)};
        const result=battleEndRuntime.plan({
          format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,
          context:clone(battleContext)
        });
        return {
          ...result,
          format:BROWSER_BATTLE_END_RUNTIME_FORMAT,
          battleContext:clone(battleContext),
          state:clone(currentState)
        };
      }
      if(type===ACTION_BATTLE_FINISH_COMMIT){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-finish-commit',reason:'battle-context-required',state:clone(currentState)};
        if(battleFinishCommitRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-finish-commit',reason:'browser-battle-finish-commit-runtime-invalid',state:clone(currentState)};

        let plan=action.finishPlan??null;
        if(!plan){
          const endResult=battleEndRuntime.plan({
            format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,
            context:clone(battleContext)
          });
          if(!endResult.ok)return {...endResult,format:BROWSER_BATTLE_END_RUNTIME_FORMAT,state:clone(currentState)};
          plan=endResult;
        }

        const result=battleFinishCommitRuntime.commit(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {
            finishPlan:plan,
            winnerSide:action.winnerSide??plan.winnerSide??null,
            settlementStartRevision:Number(currentState?.revision??0)
          }
        );
        if(result.ok&&result.handled===true&&result.battleContext){
          battleContext=clone(result.battleContext?.context??result.battleContext);
          battleAttackPipeline=null;
        }
        return {
          ...result,
          format:BROWSER_BATTLE_FINISH_COMMIT_RUNTIME_FORMAT,
          battleContext:result.battleContext?clone(result.battleContext):(battleContext?clone(battleContext):null),
          state:clone(currentState)
        };
      }
      if(type===ACTION_BATTLE_PROFIT_ROUTE_PLAN){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-profit-route',reason:'battle-context-required',state:clone(currentState)};
        if(battleProfitRouteRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-profit-route',reason:'browser-battle-profit-route-runtime-invalid',state:clone(currentState)};
        const result=battleProfitRouteRuntime.plan(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {dpbattle:action.dpbattle??null}
        );
        return {
          ...result,
          format:BROWSER_BATTLE_PROFIT_ROUTE_RUNTIME_FORMAT,
          battleContext:clone(battleContext),
          state:clone(currentState)
        };
      }
      if(type===ACTION_BATTLE_DUELPOINT_PLAN){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-duelpoint',reason:'battle-context-required',state:clone(currentState)};
        if(battleDuelPointRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-duelpoint',reason:'browser-battle-duelpoint-runtime-invalid',state:clone(currentState)};
        const result=battleDuelPointRuntime.plan(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {
            side:action.side??0,
            num:action.num??0,
            duelPoint:action.duelPoint??null,
            workGetExp:action.workGetExp??null
          }
        );
        return {
          ...result,
          format:BROWSER_BATTLE_DUELPOINT_RUNTIME_FORMAT,
          battleContext:clone(battleContext),
          state:clone(currentState)
        };
      }
      if(type===ACTION_BATTLE_SETTLEMENT_RECEIPT_COMMIT){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-settlement-receipt',reason:'battle-context-required',state:clone(currentState)};
        if(battleSettlementRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-settlement-receipt',reason:'browser-battle-settlement-runtime-invalid',state:clone(currentState)};
        const result=battleSettlementRuntime.commit(
          clone(currentState),
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {
            settlementId:action.settlementId??null,
            transactions:Array.isArray(action.transactions)?action.transactions:[],
            expectedRevision:action.expectedRevision==null?Number(currentState?.revision??0):action.expectedRevision,
            now:clockFactory(action.now,now)
          }
        );
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {
          ...result,
          format:BROWSER_BATTLE_SETTLEMENT_RUNTIME_FORMAT,
          battleContext:battleContext?clone(battleContext):null,
          state:clone(result.state??currentState)
        };
      }
      if(type===ACTION_BATTLE_PLAYER_EXIT_PLAN){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-player-exit-plan',reason:'battle-context-required',state:clone(currentState)};
        if(battlePlayerExitRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-player-exit-plan',reason:'browser-battle-player-exit-runtime-invalid',state:clone(currentState)};
        const result=battlePlayerExitRuntime.plan(
          clone(battleContext),
          clone(currentState),
          {settlementComplete:action.settlementComplete===true}
        );
        return {
          ...result,
          format:BROWSER_BATTLE_PLAYER_EXIT_RUNTIME_FORMAT,
          battleContext:clone(battleContext),
          state:clone(currentState)
        };
      }
      if(type===ACTION_BATTLE_PLAYER_EXIT_COMMIT){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-player-exit-commit',reason:'battle-context-required',state:clone(currentState)};
        if(battlePlayerExitCommitRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-player-exit-commit',reason:'browser-battle-player-exit-commit-runtime-invalid',state:clone(currentState)};
        let playerExitPlan=action.battlePlayerExitPlan??null;
        if(!playerExitPlan){
          playerExitPlan=battlePlayerExitRuntime.plan(
            clone(battleContext),
            clone(currentState),
            {settlementComplete:action.settlementComplete===true}
          );
        }
        if(!playerExitPlan?.ok)return {...playerExitPlan,format:BROWSER_BATTLE_PLAYER_EXIT_RUNTIME_FORMAT,state:clone(currentState)};
        const result=battlePlayerExitCommitRuntime.commit(
          clone(currentState),
          playerExitPlan,
          {
            transactionId:action.transactionId??null,
            expectedRevision:action.expectedRevision==null?Number(currentState?.revision??0):action.expectedRevision,
            now:clockFactory(action.now,now)
          }
        );
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {
          ...result,
          format:BROWSER_BATTLE_PLAYER_EXIT_COMMIT_RUNTIME_FORMAT,
          battleContext:battleContext?clone(battleContext):null,
          state:clone(result.state??currentState)
        };
      }
      if(type===ACTION_BATTLE_EXIT_PLAN){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-exit-plan',reason:'battle-context-required',state:clone(currentState)};
        if(battleExitPlanRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-exit-plan',reason:'browser-battle-exit-plan-runtime-invalid',state:clone(currentState)};
        const result=battleExitPlanRuntime.plan(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          clone(currentState),
          {settlementComplete:action.settlementComplete===true,petMailModeById:action.petMailModeById??null}
        );
        return {
          ...result,
          format:BROWSER_BATTLE_EXIT_PLAN_RUNTIME_FORMAT,
          battleContext:clone(battleContext),
          state:clone(currentState)
        };
      }
      if(type===ACTION_BATTLE_EXIT_COMMIT){
        const replayTx=String(action.transactionId??'').trim();
        const replayBucket=currentState?.runtimeMeta?.battleExitTransactions;
        const replayKnown=!!(replayTx && replayBucket!==null && typeof replayBucket==='object' && !Array.isArray(replayBucket) && replayBucket[replayTx]);
        if(!battleContext && !replayKnown)return {ok:false,handled:false,stage:'battle-exit-commit',reason:'battle-context-required',state:clone(currentState)};
        if(battleExitCommitRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-exit-commit',reason:'browser-battle-exit-commit-runtime-invalid',state:clone(currentState)};
        let exitPlan=action.battleExitPlan??null;
        if(!exitPlan){
          exitPlan=battleExitPlanRuntime.plan(
            {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
            clone(currentState),
            {settlementComplete:action.settlementComplete===true}
          );
        }
        if(!exitPlan?.ok)return {...exitPlan,format:BROWSER_BATTLE_EXIT_PLAN_RUNTIME_FORMAT,state:clone(currentState)};
        const result=battleExitCommitRuntime.commit(
          clone(currentState),
          exitPlan,
          {
            transactionId:action.transactionId??null,
            expectedRevision:action.expectedRevision==null?Number(currentState?.revision??0):action.expectedRevision,
            now:clockFactory(action.now,now)
          }
        );
        let contextClear=null;
        if(result.ok&&result.handled===true&&result.state){
          currentState=result.state;
          if(result.stage==='battle-exit-commit-applied'&&battleContext){
            contextClear=battleContextClearRuntime.clear(
              clone(currentState),
              {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
              {petExitTransactionId:action.transactionId??result.transactionId??null}
            );
            if(contextClear.ok===true&&contextClear.battleContextCleared===true){
              battleContext=null;
              battleAttackPipeline=null;
            }
          }
        }
        return {
          ...result,
          format:BROWSER_BATTLE_EXIT_COMMIT_RUNTIME_FORMAT,
          battleContextClear:contextClear?clone(contextClear):null,
          battleContext:battleContext?clone(battleContext):null,
          state:clone(result.state??currentState)
        };
      }
      if(type===ACTION_BATTLE_CONTEXT_CLEAR){
        if(!battleContext){
          battleAttackPipeline=null;
          return {
            ok:true,
            handled:true,
            stage:'battle-context-clear-idempotent',
            format:BROWSER_BATTLE_CONTEXT_CLEAR_RUNTIME_FORMAT,
            action:ACTION_BATTLE_CONTEXT_CLEAR,
            idempotent:true,
            applied:false,
            battleContextCleared:true,
            state:clone(currentState),
            battleContext:null
          };
        }
        if(battleContextClearRuntime.ok!==true)return {
          ok:false,
          handled:false,
          stage:'battle-context-clear',
          reason:'browser-battle-context-clear-runtime-invalid',
          state:clone(currentState),
          battleContext:clone(battleContext)
        };
        const clearResult=battleContextClearRuntime.clear(
          clone(currentState),
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {petExitTransactionId:action.petExitTransactionId??null}
        );
        if(clearResult.ok===true&&clearResult.battleContextCleared===true){battleContext=null;battleAttackPipeline=null;}
        return {
          ...clearResult,
          format:BROWSER_BATTLE_CONTEXT_CLEAR_RUNTIME_FORMAT,
          state:clone(currentState),
          battleContext:battleContext?clone(battleContext):null
        };
      }
      if(type===ACTION_BATTLE_COMPLIANCE_PLAN){
        if(battleCompliancePlanRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-compliance-plan',reason:'browser-battle-compliance-plan-runtime-invalid',state:clone(currentState)};
        const result=battleCompliancePlanRuntime.plan(
          clone(currentState),
          {petIds:action.petIds??null,includePlayer:action.includePlayer!==false}
        );
        return {
          ...result,
          format:BROWSER_BATTLE_COMPLIANCE_PLAN_RUNTIME_FORMAT,
          battleContext:battleContext?clone(battleContext):null,
          state:clone(currentState)
        };
      }
      if(type===ACTION_BATTLE_COMPLIANCE_COMMIT){
        if(battleComplianceCommitRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-compliance-commit',reason:'browser-battle-compliance-commit-runtime-invalid',state:clone(currentState)};
        let compliancePlan=action.battleCompliancePlan??null;
        if(!compliancePlan){
          compliancePlan=battleCompliancePlanRuntime.plan(clone(currentState),{petIds:action.petIds??null,includePlayer:action.includePlayer!==false});
        }
        if(!compliancePlan?.ok)return {...compliancePlan,format:BROWSER_BATTLE_COMPLIANCE_PLAN_RUNTIME_FORMAT,state:clone(currentState)};
        const result=battleComplianceCommitRuntime.commit(
          clone(currentState),
          compliancePlan,
          {
            transactionId:action.transactionId??null,
            expectedRevision:action.expectedRevision==null?Number(currentState?.revision??0):action.expectedRevision,
            now:clockFactory(action.now,now)
          }
        );
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {
          ...result,
          format:BROWSER_BATTLE_COMPLIANCE_COMMIT_RUNTIME_FORMAT,
          battleContext:battleContext?clone(battleContext):null,
          state:clone(result.state??currentState)
        };
      }

      if(type===ACTION_BATTLE_ITEM_COMMIT){
        if(battleItemCommitRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-item-commit',reason:'browser-battle-item-commit-runtime-invalid',state:clone(currentState)};
        let itemPlan=action.battleItemPlan??null;
        if(!itemPlan){
          if(!battleContext)return {ok:false,handled:false,stage:'battle-item-commit',reason:'battle-context-required',state:clone(currentState)};
          itemPlan=battleItemPlanRuntime.plan(
            {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
            clone(currentState),
            {getitem:action.getitem??null}
          );
        }
        if(!itemPlan?.ok)return {...itemPlan,format:BROWSER_BATTLE_ITEM_PLAN_RUNTIME_FORMAT,state:clone(currentState)};
        const result=battleItemCommitRuntime.commit(
          clone(currentState),
          itemPlan,
          {
            transactionId:action.transactionId??null,
            expectedRevision:action.expectedRevision==null?Number(currentState?.revision??0):action.expectedRevision,
            now:clockFactory(action.now,now)
          }
        );
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {
          ...result,
          format:BROWSER_BATTLE_ITEM_COMMIT_RUNTIME_FORMAT,
          battleContext:battleContext?clone(battleContext):null,
          state:clone(result.state??currentState)
        };
      }
      if(type===ACTION_BATTLE_ITEM_PLAN){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-item-plan',reason:'battle-context-required',state:clone(currentState)};
        if(battleItemPlanRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-item-plan',reason:'browser-battle-item-plan-runtime-invalid',state:clone(currentState)};
        const result=battleItemPlanRuntime.plan(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          clone(currentState),
          {getitem:action.getitem??null}
        );
        return {
          ...result,
          format:BROWSER_BATTLE_ITEM_PLAN_RUNTIME_FORMAT,
          battleContext:clone(battleContext),
          state:clone(currentState)
        };
      }
      if(type===ACTION_BATTLE_LEVELUP_COMMIT){
        if(battleLevelUpCommitRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-levelup-commit',reason:'browser-battle-levelup-commit-runtime-invalid',state:clone(currentState)};
        let levelPlan=action.battleLevelUpPlan??null;
        if(!levelPlan){
          let expPlan=action.battleExpPlan??null;
          if(!expPlan){
            expPlan=battleExpPlanRuntime.plan(
              {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext??{})},
              clone(currentState),
              {
                itemExpModifierPercent:action.itemExpModifierPercent??0,
                battleExpMultiplier:action.battleExpMultiplier??100
              }
            );
          }
          if(!expPlan?.ok)return {...expPlan,format:BROWSER_BATTLE_EXP_PLAN_RUNTIME_FORMAT,state:clone(currentState)};
          levelPlan=battleLevelUpPlanRuntime.plan(
            expPlan,
            clone(currentState),
            {
              playerNormalLevelCap:action.playerNormalLevelCap??140,
              chartrans:action.chartrans??5,
              pettrans:action.pettrans??-1
            }
          );
        }
        if(!levelPlan?.ok)return {...levelPlan,format:BROWSER_BATTLE_LEVELUP_PLAN_RUNTIME_FORMAT,state:clone(currentState)};
        let growthPlan=action.battlePetGrowthPlan??null;
        if(!growthPlan){
          growthPlan=battlePetGrowthPlanRuntime.plan(
            levelPlan,
            clone(currentState),
            {rngEvidenceByPetId:action.rngEvidenceByPetId??{}}
          );
        }
        if(!growthPlan?.ok)return {...growthPlan,format:BROWSER_BATTLE_PET_GROWTH_PLAN_RUNTIME_FORMAT,state:clone(currentState)};
        const result=battleLevelUpCommitRuntime.commit(
          clone(currentState),
          levelPlan,
          growthPlan,
          {
            transactionId:action.transactionId??null,
            expectedRevision:action.expectedRevision==null?Number(currentState?.revision??0):action.expectedRevision,
            now:clockFactory(action.now,now)
          }
        );
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {
          ...result,
          format:BROWSER_BATTLE_LEVELUP_COMMIT_RUNTIME_FORMAT,
          battleContext:battleContext?clone(battleContext):null,
          state:clone(result.state??currentState)
        };
      }
      if(type===ACTION_BATTLE_PET_GROWTH_PLAN){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-pet-growth-plan',reason:'battle-context-required',state:clone(currentState)};
        if(battlePetGrowthPlanRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-pet-growth-plan',reason:'browser-battle-pet-growth-plan-runtime-invalid',state:clone(currentState)};
        let levelPlan=action.battleLevelUpPlan??null;
        if(!levelPlan){
          levelPlan=battleLevelUpPlanRuntime.plan(
            action.battleExpPlan??battleExpPlanRuntime.plan(
              {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
              clone(currentState),
              {
                itemExpModifierPercent:action.itemExpModifierPercent??0,
                battleExpMultiplier:action.battleExpMultiplier??100
              }
            ),
            clone(currentState),
            {
              playerNormalLevelCap:action.playerNormalLevelCap??140,
              chartrans:action.chartrans??5,
              pettrans:action.pettrans??-1
            }
          );
          if(!levelPlan.ok)return {...levelPlan,format:BROWSER_BATTLE_LEVELUP_PLAN_RUNTIME_FORMAT,state:clone(currentState)};
        }
        const result=battlePetGrowthPlanRuntime.plan(
          levelPlan,
          clone(currentState),
          {rngEvidenceByPetId:action.rngEvidenceByPetId??{}}
        );
        return {
          ...result,
          format:BROWSER_BATTLE_PET_GROWTH_PLAN_RUNTIME_FORMAT,
          battleContext:clone(battleContext),
          state:clone(currentState)
        };
      }
      if(type===ACTION_BATTLE_LEVELUP_PLAN){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-levelup-plan',reason:'battle-context-required',state:clone(currentState)};
        if(battleLevelUpPlanRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-levelup-plan',reason:'browser-battle-levelup-plan-runtime-invalid',state:clone(currentState)};
        let expPlan=action.battleExpPlan??null;
        if(!expPlan){
          expPlan=battleExpPlanRuntime.plan(
            {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
            clone(currentState),
            {
              itemExpModifierPercent:action.itemExpModifierPercent??0,
              battleExpMultiplier:action.battleExpMultiplier??100
            }
          );
          if(!expPlan.ok)return {...expPlan,format:BROWSER_BATTLE_EXP_PLAN_RUNTIME_FORMAT,state:clone(currentState)};
        }
        const result=battleLevelUpPlanRuntime.plan(
          expPlan,
          clone(currentState),
          {
            playerNormalLevelCap:action.playerNormalLevelCap??140,
            chartrans:action.chartrans??5,
            pettrans:action.pettrans??-1
          }
        );
        return {
          ...result,
          format:BROWSER_BATTLE_LEVELUP_PLAN_RUNTIME_FORMAT,
          battleContext:clone(battleContext),
          state:clone(currentState)
        };
      }
      if(type===ACTION_BATTLE_EXP_PLAN){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-exp-plan',reason:'battle-context-required',state:clone(currentState)};
        if(battleExpPlanRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-exp-plan',reason:'browser-battle-exp-plan-runtime-invalid',state:clone(currentState)};
        const result=battleExpPlanRuntime.plan(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          clone(currentState),
          {
            itemExpModifierPercent:action.itemExpModifierPercent??0,
            battleExpMultiplier:action.battleExpMultiplier??100
          }
        );
        return {
          ...result,
          format:BROWSER_BATTLE_EXP_PLAN_RUNTIME_FORMAT,
          battleContext:clone(battleContext),
          state:clone(currentState)
        };
      }
      if(type===ACTION_BATTLE_DUELPOINT_COMMIT){
        if(!battleContext)return {ok:false,handled:false,stage:'battle-duelpoint-commit',reason:'battle-context-required',state:clone(currentState)};
        if(battleDuelPointCommitRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-duelpoint-commit',reason:'browser-battle-duelpoint-commit-runtime-invalid',state:clone(currentState)};
        let plan=action.duelPointPlan??null;
        if(!plan){
          plan=battleDuelPointRuntime.plan(
            {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
            {
              side:action.side??0,
              num:action.num??0,
              duelPoint:action.duelPoint??null,
              workGetExp:action.workGetExp??null
            }
          );
          if(!plan.ok)return {...plan,format:BROWSER_BATTLE_DUELPOINT_RUNTIME_FORMAT,state:clone(currentState)};
        }
        const result=battleDuelPointCommitRuntime.commit(
          clone(currentState),
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          plan,
          {
            transactionId:action.transactionId??null,
            expectedRevision:action.expectedRevision==null?Number(currentState?.revision??0):action.expectedRevision,
            now:clockFactory(action.now,now)
          }
        );
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {
          ...result,
          format:BROWSER_BATTLE_DUELPOINT_COMMIT_RUNTIME_FORMAT,
          battleContext:clone(battleContext),
          state:clone(result.state??currentState)
        };
      }
      if(type===ACTION_BATTLE_COUNTER_PLAN){
        const phaseGate=requireBattlePhase(battleContext,type,currentState);
        if(phaseGate)return phaseGate;
        const pipeline=battleAttackPipeline;
        if(!pipeline?.damageReact)return {ok:false,handled:false,stage:'battle-counter-binding',reason:'damage-react-plan-required',state:clone(currentState)};
        const expectedAttacker=Number(pipeline.finalTargetBid);
        const expectedTarget=Number(pipeline.attackerBid);
        if(Number(action.attackerBid)!==expectedAttacker||Number(action.targetBid)!==expectedTarget){
          return {ok:false,handled:false,stage:'battle-counter-binding',reason:'counter-reverse-target-mismatch',attackerBid:action.attackerBid,targetBid:action.targetBid,expectedAttackerBid:expectedAttacker,expectedTargetBid:expectedTarget,state:clone(currentState)};
        }
        if(battleCounterRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-counter',reason:'browser-battle-counter-runtime-invalid',state:clone(currentState)};
        const result=battleCounterRuntime.plan(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {
            attackerBid:expectedAttacker,
            targetBid:expectedTarget,
            attackerCommand:action.attackerCommand??null,
            attackerBattleFlg:action.attackerBattleFlg??null,
            attackerWeaponClass:action.attackerWeaponClass??'claw',
            defenderWeaponClass:action.defenderWeaponClass??'claw',
            attackerLuck:action.attackerLuck??0,
            attackerCounterBonus:action.attackerCounterBonus??0,
            noguardCounterAdjust:action.noguardCounterAdjust??0,
            counterRoll:action.counterRoll??null,
            counterPara:action.counterPara??0.08,
            attackerDamageReact:pipeline.damageReact.reaction?.code>0,
            defenderDamageReact:false
          }
        );
        if(result.ok===true)battleAttackPipeline.counter=clone(result);
        return {...result,format:BROWSER_BATTLE_COUNTER_RUNTIME_FORMAT,state:clone(currentState)};
      }
      if(type===ACTION_BATTLE_DAMAGE_REACT_PLAN){
        const phaseGate=requireBattlePhase(battleContext,type,currentState);
        if(phaseGate)return phaseGate;
        const pipeline=battleAttackPipeline;
        if(!pipeline?.criticalDamage)return {ok:false,handled:false,stage:'battle-damage-react-binding',reason:'critical-damage-plan-required',state:clone(currentState)};
        const attackerBid=action.attackerBid??null;
        const targetBid=action.targetBid??null;
        if(Number(attackerBid)!==Number(pipeline.attackerBid)||Number(targetBid)!==Number(pipeline.finalTargetBid)){
          return {ok:false,handled:false,stage:'battle-damage-react-binding',reason:'attack-seq-target-mismatch',attackerBid,targetBid,expectedAttackerBid:pipeline.attackerBid,expectedTargetBid:pipeline.finalTargetBid,state:clone(currentState)};
        }
        if(Number(action.damage??0)!==Number(pipeline.criticalDamage.damage)){
          return {ok:false,handled:false,stage:'battle-damage-react-binding',reason:'critical-damage-mismatch',expectedDamage:pipeline.criticalDamage.damage,actualDamage:action.damage??0,state:clone(currentState)};
        }
        if(battleDamageReactRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-damage-react',reason:'browser-battle-damage-react-runtime-invalid',state:clone(currentState)};
        const result=battleDamageReactRuntime.plan(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {
            attackerBid:pipeline.attackerBid,
            targetBid:pipeline.finalTargetBid,
            damage:pipeline.criticalDamage.damage,
            throwWeapon:pipeline.throwWeapon===true,
            weaponType:pipeline.weaponType,
            attackerRidePet:action.attackerRidePet===true,
            defenderRidePet:action.defenderRidePet===true,
            attackerDefencePower:action.attackerDefencePower??null,
            defenderDefencePower:action.defenderDefencePower??null,
            attackerPetDefencePower:action.attackerPetDefencePower??null,
            defenderPetDefencePower:action.defenderPetDefencePower??null,
            damageVanish:action.damageVanish??null,
            damageAbsorb:action.damageAbsorb??null,
            damageReflect:action.damageReflect??null,
            trap:action.trap??null,
            modTrap:action.modTrap??null,
            acupuncture:action.acupuncture??null
          }
        );
        if(result.ok===true)battleAttackPipeline.damageReact=clone(result);
        return {...result,format:BROWSER_BATTLE_DAMAGE_REACT_RUNTIME_FORMAT,state:clone(currentState)};
      }
      if(type===ACTION_BATTLE_ATTACK_SEQ_PRELUDE){
        const phaseGate=requireBattlePhase(battleContext,type,currentState);
        if(phaseGate)return phaseGate;
        const commandGate=requireAttackCommandBinding(battleContext,type,action.attackerBid??null,action.targetBid??null,currentState);
        if(commandGate)return commandGate;
        if(!battleContext)return {ok:false,handled:false,stage:'attack-seq-prelude',reason:'battle-context-required',state:clone(currentState)};
        if(battleAttackSeqPreludeRuntime.ok!==true)return {ok:false,handled:false,stage:'attack-seq-prelude',reason:'browser-battle-attack-seq-prelude-runtime-invalid',state:clone(currentState)};
        const result=battleAttackSeqPreludeRuntime.run(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {
            attackerBid:action.attackerBid??null,
            targetBid:action.targetBid??null,
            weaponType:action.weaponType??'none',
            weaponCritical:action.weaponCritical??0,
            throwWeapon:action.throwWeapon===true,
            battleDuckModify:action.battleDuckModify??0,
            duckRoll:action.duckRoll??null,
            drunkRoll:action.drunkRoll??null,
            hitRightRoll:action.hitRightRoll??null,
            criticalRoll:action.criticalRoll??null,
            guardianBitMask:action.guardianBitMask??(1<<3),
            noguardDuckBonus:action.noguardDuckBonus??0,
            enabledFeatures:Array.isArray(action.enabledFeatures)?action.enabledFeatures:[]
          }
        );
        if(result.ok===true){
          battleAttackPipeline={
            attackerBid:result.attackerBid,
            requestedTargetBid:result.requestedTargetBid,
            finalTargetBid:result.finalTargetBid,
            weaponType:String(action.weaponType??'none').trim().toLowerCase(),
            throwWeapon:action.throwWeapon===true,
            prelude:clone(result),
            damage:null,
            criticalDamage:null,
            damageReact:null,
            counter:null
          };
        }
        return {...result,format:BROWSER_BATTLE_ATTACK_SEQ_PRELUDE_FORMAT,state:clone(currentState)};
      }
      if(type===ACTION_BATTLE_ATTACK_PREFLIGHT){
        const phaseGate=requireBattlePhase(battleContext,type,currentState);
        if(phaseGate)return phaseGate;
        if(!battleContext)return {ok:false,handled:false,stage:'battle-attack-preflight',reason:'battle-context-required',state:clone(currentState)};
        if(battleAttackPreflightRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-attack-preflight',reason:'browser-battle-attack-preflight-runtime-invalid',state:clone(currentState)};
        const result=battleAttackPreflightRuntime.preflight(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {
            attackerBid:action.attackerBid??null,
            targetBid:action.targetBid??null,
            defaultTargetRoll:action.defaultTargetRoll??null
          }
        );
        return {...result,format:BROWSER_BATTLE_ATTACK_PREFLIGHT_RUNTIME_FORMAT,state:clone(currentState)};
      }
      if(type===ACTION_BATTLE_DEFAULT_TARGET_RESOLVE){
        const phaseGate=requireBattlePhase(battleContext,type,currentState);
        if(phaseGate)return phaseGate;
        if(!battleContext)return {ok:false,handled:false,stage:'battle-default-target',reason:'battle-context-required',state:clone(currentState)};
        if(battleDefaultTargetRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-default-target',reason:'browser-battle-default-target-runtime-invalid',state:clone(currentState)};
        const result=battleDefaultTargetRuntime.resolve(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {side:action.side??null,defaultTargetRoll:action.defaultTargetRoll??null}
        );
        return {...result,format:BROWSER_BATTLE_DEFAULT_TARGET_RUNTIME_FORMAT,state:clone(currentState)};
      }
      if(type===ACTION_BATTLE_TARGET_RESOLVE){
        const phaseGate=requireBattlePhase(battleContext,type,currentState);
        if(phaseGate)return phaseGate;
        if(!battleContext)return {ok:false,handled:false,stage:'battle-target',reason:'battle-context-required',state:clone(currentState)};
        if(battleTargetRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-target',reason:'browser-battle-target-runtime-invalid',state:clone(currentState)};
        const result=battleTargetRuntime.resolve(
          {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
          {attackerBid:action.attackerBid??null,targetBid:action.targetBid??null}
        );
        return {...result,format:BROWSER_BATTLE_TARGET_RUNTIME_FORMAT,state:clone(currentState)};
      }
      if(type===ACTION_BATTLE_FIELD_RESOLVE){
        if(battleFieldRuntime.ok!==true)return {ok:false,handled:false,stage:'battle-field',reason:'browser-battle-field-runtime-invalid',state:clone(currentState)};
        const encounter=action.encounter??{
          floorId:currentState?.world?.position?.floorId??null,
          x:currentState?.world?.position?.x??null,
          y:currentState?.world?.position?.y??null
        };
        const resolved=await battleFieldRuntime.resolve(
          encounter?.floorId??currentState?.world?.position?.floorId,
          encounter?.x??currentState?.world?.position?.x,
          encounter?.y??currentState?.world?.position?.y,
          {battleFieldRoll:action.battleFieldRoll??null}
        );
        return {...resolved,state:clone(currentState)};
      }
      if(type===ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD){
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

        const idleMode=String(currentState?.idle?.mode??'');
        if(idleMode!=='encounter_pending')return {ok:false,handled:false,stage:'battle-context',reason:'idle-state-not-encounter-pending',idleMode,state:clone(currentState)};
        if(!Array.isArray(action.enemyTeam)||action.enemyTeam.length<1)return {ok:false,handled:false,stage:'battle-context',reason:'enemy-team-required',state:clone(currentState)};
        let encounter=action.encounter??{
          floorId:currentState?.world?.position?.floorId??null,
          x:currentState?.world?.position?.x??null,
          y:currentState?.world?.position?.y??null,
          encounterId:null
        };
        if(worldEncounterRuntime?.ok===true){
          const resolvedEncounter=await worldEncounterRuntime.prepare(currentState,{
            position:encounter,
            encounterId:encounter?.encounterId??null
          });
          if(!resolvedEncounter.ok){
            return {
              ...resolvedEncounter,
              stage:'battle-context-encounter-binding',
              reason:resolvedEncounter.reason??'encounter-binding-failed',
              state:clone(currentState)
            };
          }
          encounter=resolvedEncounter.encounter;
        }
        const groupIdValue=action.groupId==null?null:Number(action.groupId);
        if(worldEncounterRuntime?.ok===true && !Number.isInteger(groupIdValue)){
          return {ok:false,handled:false,stage:'battle-context-encounter-binding',reason:'encounter-group-id-required',state:clone(currentState)};
        }
        let pipeline=null;
        if(encounterGroupCatalog){
          pipeline=encounterPipeline;
          const currentRevision=Number(currentState?.revision??0);
          if(!pipeline?.generation)return {ok:false,handled:false,stage:'battle-context-encounter-binding',reason:'enemy-generation-plan-required',state:clone(currentState)};
          if(Number(pipeline.revision)!==currentRevision){
            encounterPipeline=null;
            return {ok:false,handled:false,stage:'battle-context-encounter-binding',reason:'enemy-generation-plan-revision-stale',state:clone(currentState)};
          }
          if(Number(pipeline.encounter?.encounterId)!==Number(encounter?.encounterId)
            || Number(pipeline.encounter?.floorId)!==Number(encounter?.floorId)
            || Number(pipeline.encounter?.x)!==Number(encounter?.x)
            || Number(pipeline.encounter?.y)!==Number(encounter?.y)){
            return {ok:false,handled:false,stage:'battle-context-encounter-binding',reason:'enemy-generation-encounter-mismatch',state:clone(currentState)};
          }
          if(Number(pipeline.generation.group?.groupId)!==Number(groupIdValue)){
            return {ok:false,handled:false,stage:'battle-context-encounter-binding',reason:'enemy-generation-group-mismatch',state:clone(currentState)};
          }
          if(JSON.stringify(pipeline.generation.team??null)!==JSON.stringify(action.enemyTeam??null)){
            return {ok:false,handled:false,stage:'battle-context-encounter-binding',reason:'enemy-team-generation-mismatch',state:clone(currentState)};
          }
          if(action.materializeEnemyStats===true){
            const pipelineRolls=pipeline.generation.coreStatRolls;
            const actionRolls=Array.isArray(action.enemyStatRolls)?action.enemyStatRolls:null;
            if(!Array.isArray(pipelineRolls) || pipelineRolls.length!==pipeline.generation.team.length){
              return {ok:false,handled:false,stage:'enemy-core-stat-binding',reason:'enemy-stat-roll-plan-required',state:clone(currentState)};
            }
            if(actionRolls!=null && JSON.stringify(actionRolls)!==JSON.stringify(pipelineRolls)){
              return {ok:false,handled:false,stage:'enemy-core-stat-binding',reason:'enemy-stat-roll-plan-mismatch',state:clone(currentState)};
            }
          }
        }
        const player=currentState?.player??null;
        let activePet=action.activePet??null;
        if(activePet==null){
          const activeId=currentState?.pets?.activePetId??null;
          activePet=activeId==null?null:(currentState?.pets?.petBox??[]).find(p=>String(p?.id??p?.petId??'')===String(activeId))??null;
        }
        if(worldEncounterRuntime?.ok===true && Array.isArray(encounter?.groupIds) && !encounter.groupIds.map(Number).includes(groupIdValue)){
          return {ok:false,handled:false,stage:'battle-context-encounter-binding',reason:'group-not-in-encounter',groupId:groupIdValue,encounterId:encounter?.encounterId??null,state:clone(currentState)};
        }
        let battleFieldNo=action.battleFieldNo;
        let battleFieldResolution=null;
        if(battleFieldNo==null){
          if(battleFieldRuntime.ok===true){
            battleFieldResolution=await battleFieldRuntime.resolve(
              encounter?.floorId??currentState?.world?.position?.floorId,
              encounter?.x??currentState?.world?.position?.x,
              encounter?.y??currentState?.world?.position?.y,
              {battleFieldRoll:action.battleFieldRoll??null}
            );
            if(battleFieldResolution.ok===true){
              battleFieldNo=battleFieldResolution.battleFieldNo;
            }else if(typeof battleFieldNoProvider==='function'){
              battleFieldNo=await battleFieldNoProvider(encounter,currentState);
            }else{
              return {...battleFieldResolution,state:clone(currentState)};
            }
          }else if(typeof battleFieldNoProvider==='function'){
            battleFieldNo=await battleFieldNoProvider(encounter,currentState);
          }else{
            battleFieldNo=battleFieldNoProvider;
          }
        }
        const built=buildBattleContext({
          playerId:currentState?.player?.id??null,
          player,
          activePet,
          team:action.enemyTeam,
          encounter,
          groupId:groupIdValue,
          battleFieldNo,
          materializeEnemyStats:action.materializeEnemyStats===true,
          enemyStatRolls:encounterGroupCatalog && action.materializeEnemyStats===true
            ? pipeline?.generation?.coreStatRolls
            : (Array.isArray(action.enemyStatRolls)?action.enemyStatRolls:[])
        });
        if(!built.ok)return {...built,state:clone(currentState)};
        const check=validateBattleContext(built);
        if(!check.ok)return {ok:false,handled:false,stage:'battle-context',reason:'battle-context-validation-failed',errors:check.errors,state:clone(currentState)};
        const committed=await idleRuntime.dispatch(currentState,{
          type:ACTION_IDLE_EVENT,
          event:IDLE_EVENTS.BATTLE_STARTED,
          payload:{battle:built.context}
        },{now:action.now??now});
        if(!committed.ok)return {...committed,stage:'battle-start-idle',state:clone(currentState)};
        currentState=committed.state;
        battleContext=built.context;
        encounterPipeline=null;
        return {
          ...built,
          ok:true,
          handled:true,
          stage:'battle-context-started',
          format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,
          idleStateBefore:'encounter_pending',
          idleStateAfter:currentState.idle?.mode??null,
          battleFieldResolution,
          idleCommit:committed,
          state:clone(currentState)
        };
      }
      if(type===ACTION_WORLD_ENCOUNTER_ROLL_IDLE_COMMIT){
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

        if(!worldEncounterIdleBridge)return {ok:false,handled:false,stage:'encounter-idle-bridge',reason:'browser-world-encounter-idle-bridge-not-configured',state:clone(currentState)};
        if(worldEncounterIdleBridge.ok!==true)return {ok:false,handled:false,stage:'encounter-idle-bridge',reason:worldEncounterIdleBridge.reason??'browser-world-encounter-idle-bridge-invalid',errors:worldEncounterIdleBridge.errors??[],state:clone(currentState)};
        const result=await worldEncounterIdleBridge.commit(currentState,{
          position:action.position??action.player??null,
          encounterId:action.encounterId??null,
          cep:action.cep==null?null:action.cep,
          rng120:action.rng120??null,
          expectedRevision:action.expectedRevision==null?Number(currentState?.revision??0):action.expectedRevision,
          savedAt:clockFactory(action.savedAt??action.now,now),
          source:action.source??'browser-world-encounter-idle'
        });
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {...result,state:clone(result.state??currentState)};
      }
      if(type===ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE){
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

        if(!worldEncounterEnemyRuntime)return {ok:false,handled:false,stage:'encounter-enemy-runtime',reason:'browser-world-encounter-enemy-runtime-not-configured',state:clone(currentState)};
        if(worldEncounterEnemyRuntime.ok!==true)return {ok:false,handled:false,stage:'encounter-enemy-runtime',reason:worldEncounterEnemyRuntime.reason??'browser-world-encounter-enemy-runtime-invalid',errors:worldEncounterEnemyRuntime.errors??[],state:clone(currentState)};
        if(String(currentState?.idle?.mode??'')!=='encounter_pending')return {ok:false,handled:false,stage:'encounter-pipeline-binding',reason:'idle-state-not-encounter-pending',state:clone(currentState)};
        if(!worldEncounterRuntime)return {ok:false,handled:false,stage:'encounter-resolution',reason:'browser-world-encounter-runtime-not-configured',state:clone(currentState)};
        if(worldEncounterRuntime.ok!==true)return {ok:false,handled:false,stage:'encounter-resolution',reason:worldEncounterRuntime.reason??'browser-world-encounter-runtime-invalid',errors:worldEncounterRuntime.errors??[],state:clone(currentState)};
        const prepared=await worldEncounterRuntime.prepare(currentState,{position:action.position??action.player??null,encounterId:action.encounterId??null});
        if(!prepared.ok)return {...prepared,stage:prepared.stage??'encounter-resolution',state:clone(prepared.state??currentState)};
        const currentRevision=Number(currentState?.revision??0);
        if(encounterPipeline && encounterPipeline.revision!==currentRevision){
          encounterPipeline=null;
          return {ok:false,handled:false,stage:'encounter-pipeline-binding',reason:'encounter-pipeline-revision-stale',state:clone(currentState)};
        }
        const selectedGroupId=Number(action.groupId);
        if(!Number.isInteger(selectedGroupId))return {ok:false,handled:false,stage:'encounter-pipeline-binding',reason:'encounter-group-id-required',state:clone(currentState)};
        if(encounterGroupCatalog && !encounterPipeline?.selection){
          return {ok:false,handled:false,stage:'encounter-pipeline-binding',reason:'encounter-group-selection-required',state:clone(currentState)};
        }
        if(encounterPipeline?.selection?.group?.groupId!=null && Number(encounterPipeline.selection.group.groupId)!==selectedGroupId){
          return {ok:false,handled:false,stage:'encounter-pipeline-binding',reason:'encounter-group-selection-mismatch',selectedGroupId,currentGroupId:Number(encounterPipeline.selection.group.groupId),state:clone(currentState)};
        }
        const coreStatRolls=Array.isArray(action.enemyStatRolls)?clone(action.enemyStatRolls):null;
        const result=worldEncounterEnemyRuntime.generate(prepared.encounter,selectedGroupId,currentState,{
          entryMaxRoll:action.entryMaxRoll??null,
          enemyRolls:Array.isArray(action.enemyRolls)?action.enemyRolls:[]
        });
        if(result.ok===true){
          if(coreStatRolls!=null && coreStatRolls.length!==result.team.length){
            return {ok:false,handled:false,stage:'enemy-core-stat-binding',reason:'enemy-stat-roll-count-mismatch',expected:result.team.length,actual:coreStatRolls.length,state:clone(currentState)};
          }
          result.coreStatRolls=coreStatRolls;
          encounterPipeline={
            revision:currentRevision,
            encounter:clone(prepared.encounter),
            selection:encounterPipeline?.selection??null,
            generation:clone(result)
          };
        }
        return {...result,preparedEncounter:prepared.encounter,state:clone(result.state??currentState)};
      }
      if(type===ACTION_WORLD_ENCOUNTER_GROUP_SELECT){
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

        if(!worldEncounterGroupRuntime)return {ok:false,handled:false,stage:'encounter-group-runtime',reason:'browser-world-encounter-group-runtime-not-configured',state:clone(currentState)};
        if(worldEncounterGroupRuntime.ok!==true)return {ok:false,handled:false,stage:'encounter-group-runtime',reason:worldEncounterGroupRuntime.reason??'browser-world-encounter-group-runtime-invalid',errors:worldEncounterGroupRuntime.errors??[],state:clone(currentState)};
        if(String(currentState?.idle?.mode??'')!=='encounter_pending')return {ok:false,handled:false,stage:'encounter-pipeline-binding',reason:'idle-state-not-encounter-pending',state:clone(currentState)};
        if(!worldEncounterRuntime)return {ok:false,handled:false,stage:'encounter-resolution',reason:'browser-world-encounter-runtime-not-configured',state:clone(currentState)};
        if(worldEncounterRuntime.ok!==true)return {ok:false,handled:false,stage:'encounter-resolution',reason:worldEncounterRuntime.reason??'browser-world-encounter-runtime-invalid',errors:worldEncounterRuntime.errors??[],state:clone(currentState)};
        const prepared=await worldEncounterRuntime.prepare(currentState,{position:action.position??action.player??null,encounterId:action.encounterId??null});
        if(!prepared.ok)return {...prepared,stage:prepared.stage??'encounter-resolution',state:clone(prepared.state??currentState)};
        const result=worldEncounterGroupRuntime.select(prepared.encounter,currentState,{groupRoll:action.groupRoll??null});
        if(result.ok===true){
          encounterPipeline={
            revision:Number(currentState?.revision??0),
            encounter:clone(prepared.encounter),
            selection:clone(result),
            generation:null
          };
        }
        return {...result,preparedEncounter:prepared.encounter,state:clone(result.state??currentState)};
      }
      if(type===ACTION_WORLD_ENCOUNTER_ROLL_COMMIT){
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

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
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

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
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

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
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

        return {ok:true,handled:true,stage:'world-npc-resolution',worldNpc:clone(resolvedWorldNpc),state:clone(currentState)};
      }
      if(type===ITEMSHOP_UI_OPEN){
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

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
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

        const selected=selectItemShopUiOffer(itemShopUi,action.itemId);
        if(!selected.ok)return {ok:false,handled:false,stage:'shop-ui',reason:selected.reason,state:clone(currentState),ui:clone(selected.state)};
        itemShopUi=selected.state;
        return {ok:true,handled:true,stage:'shop-ui-select-offer',format:ITEMSHOP_UI_STATE_FORMAT,offer:selected.offer,ui:clone(itemShopUi),state:clone(currentState)};
      }
      if(type===ITEMSHOP_UI_SET_QUANTITY){
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

        const changed=setItemShopUiQuantity(itemShopUi,action.quantity);
        if(!changed.ok)return {ok:false,handled:false,stage:'shop-ui',reason:changed.reason,state:clone(currentState),ui:clone(changed.state)};
        itemShopUi=changed.state;
        return {ok:true,handled:true,stage:'shop-ui-set-quantity',format:ITEMSHOP_UI_STATE_FORMAT,quantity:changed.quantity,ui:clone(itemShopUi),state:clone(currentState)};
      }
      if(type===ITEMSHOP_UI_CLOSE){
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

        const closed=closeItemShopUiState(itemShopUi);
        itemShopUi=closed.state;
        return {ok:true,handled:true,stage:'shop-ui-close',format:ITEMSHOP_UI_STATE_FORMAT,ui:clone(itemShopUi),state:clone(currentState)};
      }
      if(type===ACTION_NPC_SAVEPOINT_SET||type===ACTION_NPC_SAVEPOINT_CONFIRM){
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

        if(!savePointRuntime)return {ok:false,handled:false,stage:'savepoint-runtime',reason:'browser-savepoint-runtime-not-configured',state:clone(currentState)};
        if(savePointRuntime.ok!==true)return {ok:false,handled:false,stage:'savepoint-runtime',reason:savePointRuntime.reason??'browser-savepoint-runtime-invalid',errors:savePointRuntime.errors??[],state:clone(currentState)};
        const player=action.player??null;
        const npc=requestedNpc??resolvedWorldNpc;
        const result=savePointRuntime.dispatch(currentState,{...action,npc,player,savePointCatalog:action.savePointCatalog??savePointCatalog},{now:action.now??now});
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {...result,worldNpc:resolvedWorldNpc?clone(resolvedWorldNpc):null,state:clone(result.state??currentState)};
      }
      if(type===ACTION_NPC_HEALER_USE){
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

        if(!healerRuntime)return {ok:false,handled:false,stage:'healer-runtime',reason:'browser-healer-runtime-not-configured',state:clone(currentState)};
        if(healerRuntime.ok!==true)return {ok:false,handled:false,stage:'healer-runtime',reason:healerRuntime.reason??'browser-healer-runtime-invalid',errors:healerRuntime.errors??[],state:clone(currentState)};
        const player=action.player??null;
        const npc=requestedNpc??resolvedWorldNpc;
        const result=healerRuntime.dispatch(currentState,{...action,npc,player},{maxDistance:action.maxDistance??maxDistance,now:action.now??now});
        if(result.ok&&result.handled===true&&result.state)currentState=result.state;
        return {...result,worldNpc:resolvedWorldNpc?clone(resolvedWorldNpc):null,state:clone(result.state??currentState)};
      }
      if([ACTION_NPC_ITEMSHOP_OPEN,ACTION_NPC_ITEMSHOP_BUY,ACTION_NPC_ITEMSHOP_SELL].includes(type)){
        const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
        if(clearGate)return clearGate;

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
      const clearGate=requireBattleContextClearForWorldLoop(battleContext,type,currentState);
      if(clearGate)return clearGate;
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
      };
      const run=async()=>{
        const beforeState=clone(currentState);
        const beforeBattleContext=clone(battleContext);
        const beforeItemShopUi=clone(itemShopUi);
        const beforeBattleAttackPipeline=clone(battleAttackPipeline);
        const result=await execute();
        const beforeRevision=Number(beforeState?.revision??0);
        const currentRevision=Number(currentState?.revision??0);
        const resultRevision=Number(result?.state?.revision??0);
        const afterRevision=Math.max(currentRevision,resultRevision);
        if(saveStorage&&result?.ok===true&&afterRevision>beforeRevision){
          if(resultRevision>currentRevision)currentState=clone(result.state);
          const savedAtFactory=clockFactory(action.savedAt??action.now,now);
          const timestamp=String(savedAtFactory());
          const built=await buildSaveEnvelope(currentState,{savedAt:()=>timestamp,source:'browser-state-controller'});
          if(!built.ok){
            currentState=beforeState;
            battleContext=beforeBattleContext;
            itemShopUi=beforeItemShopUi;
            battleAttackPipeline=beforeBattleAttackPipeline;
            return {...result,ok:false,handled:false,stage:'save-storage',reason:'save-envelope-build-failed',errors:built.errors,persisted:false,save:null,state:clone(currentState)};
          }
          const persisted=await writeSaveEnvelopeToStorage(saveStorage,built.envelope,{key:saveStorageKey,now:()=>timestamp});
          if(!persisted.ok){
            currentState=beforeState;
            battleContext=beforeBattleContext;
            itemShopUi=beforeItemShopUi;
            battleAttackPipeline=beforeBattleAttackPipeline;
            return {...result,ok:false,handled:false,stage:'save-storage',reason:persisted.reason,persistence:persisted,persisted:false,save:null,state:clone(currentState)};
          }
          return {...result,persisted:true,persistence:persisted,state:clone(currentState)};
        }
        return result;
      };
      const queued=dispatchTail.then(run,run);
      dispatchTail=queued.then(()=>undefined,()=>undefined);
      return queued;
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
  ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  ACTION_WORLD_ENCOUNTER_ROLL_IDLE_COMMIT,
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_FIELD_RESOLVE,
  ACTION_BATTLE_TARGET_RESOLVE,
  ACTION_BATTLE_DEFAULT_TARGET_RESOLVE,
  ACTION_BATTLE_ATTACK_PREFLIGHT,
  ACTION_BATTLE_ATTACK_SEQ_PRELUDE,
  ACTION_BATTLE_DAMAGE_PLAN,
  ACTION_BATTLE_CRITICAL_DAMAGE_PLAN,
  ACTION_BATTLE_DAMAGE_REACT_PLAN,
  ACTION_BATTLE_COUNTER_PLAN,
  ACTION_BATTLE_DEATH_PLAN,
  ACTION_BATTLE_DEATH_COMMIT,
  ACTION_BATTLE_END_PLAN,
  ACTION_BATTLE_FINISH_COMMIT,
  ACTION_BATTLE_PLAYER_EXIT_PLAN,
  ACTION_BATTLE_PLAYER_EXIT_COMMIT,
  ACTION_BATTLE_SETTLEMENT_RECEIPT_COMMIT,
  ACTION_BATTLE_CONTEXT_CLEAR,
  ACTION_BATTLE_PROFIT_ROUTE_PLAN,
  ACTION_BATTLE_DUELPOINT_PLAN,
  ACTION_BATTLE_TURN_INITIALIZE,
  ACTION_BATTLE_INITIALIZE,
  ACTION_BATTLE_COMMAND_WAIT_STATUS,
  ACTION_BATTLE_PLAYER_COMMAND_SET,
  ACTION_BATTLE_IDLE_STRATEGY_APPLY,
  BROWSER_IDLE_BATTLE_STRATEGY_RUNTIME_FORMAT,
  ACTION_BATTLE_PLAYER_COMMAND_PREFLIGHT,
  BROWSER_WORLD_NPC_RUNTIME_FORMAT,
  BROWSER_WARP_RUNTIME_FORMAT,
  BROWSER_WORLD_MOVEMENT_RUNTIME_FORMAT,
  BROWSER_WORLD_WARPPOINT_RUNTIME_FORMAT,
  BROWSER_WORLD_ROUTE_RUNTIME_FORMAT,
  BROWSER_WORLD_ROUTE_EXECUTION_RUNTIME_FORMAT,
  BROWSER_WORLD_ENCOUNTER_RUNTIME_FORMAT,
  BROWSER_WORLD_ENCOUNTER_PERSISTENCE_RUNTIME_FORMAT,
  BROWSER_WORLD_ENCOUNTER_GROUP_RUNTIME_FORMAT,
  BROWSER_WORLD_ENCOUNTER_ENEMY_RUNTIME_FORMAT,
  BROWSER_WORLD_ENCOUNTER_IDLE_BRIDGE_FORMAT,
  BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,
  BROWSER_BATTLE_FIELD_RUNTIME_FORMAT,
  BROWSER_BATTLE_TARGET_RUNTIME_FORMAT,
  BROWSER_BATTLE_DEFAULT_TARGET_RUNTIME_FORMAT,
  BROWSER_BATTLE_ATTACK_PREFLIGHT_RUNTIME_FORMAT,
  BROWSER_BATTLE_ATTACK_SEQ_PRELUDE_FORMAT,
  BROWSER_BATTLE_DAMAGE_PLAN_RUNTIME_FORMAT,
  BROWSER_BATTLE_CRITICAL_DAMAGE_RUNTIME_FORMAT,
  BROWSER_BATTLE_DAMAGE_REACT_RUNTIME_FORMAT,
  BROWSER_BATTLE_COUNTER_RUNTIME_FORMAT,
  BROWSER_BATTLE_DEATH_RUNTIME_FORMAT,
  BROWSER_BATTLE_DEATH_COMMIT_RUNTIME_FORMAT,
  BROWSER_BATTLE_END_RUNTIME_FORMAT,
  BROWSER_BATTLE_FINISH_COMMIT_RUNTIME_FORMAT,
  BROWSER_BATTLE_PLAYER_EXIT_RUNTIME_FORMAT,
  BROWSER_BATTLE_PLAYER_EXIT_COMMIT_RUNTIME_FORMAT,
  BROWSER_BATTLE_CONTEXT_CLEAR_RUNTIME_FORMAT,
  BROWSER_BATTLE_PROFIT_ROUTE_RUNTIME_FORMAT,
  BROWSER_BATTLE_DUELPOINT_RUNTIME_FORMAT,
  BROWSER_BATTLE_TURN_RUNTIME_FORMAT,
  BROWSER_BATTLE_INITIALIZE_RUNTIME_FORMAT,
  BROWSER_BATTLE_COMMAND_WAIT_RUNTIME_FORMAT,
  BROWSER_BATTLE_PLAYER_COMMAND_RUNTIME_FORMAT,
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
