import {
  buildBattleContext,
  validateBattleContext,
  BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT
} from './stoneage_browser_battle_context_runtime.mjs';
import { IDLE_EVENTS } from './stoneage_idle_loop.mjs';

const BROWSER_WORLD_IDLE_LOOP_RUNTIME_FORMAT='stoneage-v471-browser-world-idle-loop-v1';
const ACTION_WORLD_IDLE_LOOP_TICK='WORLD_IDLE_LOOP_TICK';

const clone=value=>JSON.parse(JSON.stringify(value));
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const int=value=>Number.isInteger(Number(value))?Number(value):null;

function validateDependencies({
  movementRuntime=null,
  encounterRuntime=null,
  encounterIdleBridge=null,
  encounterGroupRuntime=null,
  encounterEnemyRuntime=null,
  idleRuntime=null,
  battleInitializeRuntime=null,
  battleAutoRuntime=null
}={}){
  const deps={
    movementRuntime,
    encounterRuntime,
    encounterIdleBridge,
    encounterGroupRuntime,
    encounterEnemyRuntime,
    idleRuntime,
    battleInitializeRuntime,
    battleAutoRuntime
  };
  const errors=[];
  for(const [name,runtime] of Object.entries(deps)){
    if(!runtime||runtime.ok!==true)errors.push(name);
  }
  return {ok:errors.length===0,errors};
}

function fail(stage,reason,state,extra={}){
  return {
    ok:false,
    handled:false,
    stage,
    action:ACTION_WORLD_IDLE_LOOP_TICK,
    reason,
    state:clone(state),
    ...extra
  };
}

async function runWorldIdleLoop(state,{
  ticks=[],
  maxTicks=null,
  movementRuntime=null,
  encounterRuntime=null,
  encounterIdleBridge=null,
  encounterGroupRuntime=null,
  encounterEnemyRuntime=null,
  idleRuntime=null,
  battleInitializeRuntime=null,
  battleAutoRuntime=null,
  petSkillCatalog=null,
  playerRelifeCatalog=null,
  battleFieldNoProvider=null,
  strategy=null,
  playerId=null,
  transactionPrefix='v471-idle-loop',
  now=()=>new Date().toISOString()
}={}){
  const deps=validateDependencies({
    movementRuntime,
    encounterRuntime,
    encounterIdleBridge,
    encounterGroupRuntime,
    encounterEnemyRuntime,
    idleRuntime,
    battleInitializeRuntime,
    battleAutoRuntime
  });
  if(!deps.ok)return {
    ok:false,
    handled:false,
    stage:'world-idle-loop-dependency',
    action:ACTION_WORLD_IDLE_LOOP_TICK,
    reason:'world-idle-loop-runtime-dependency-invalid',
    dependencies:deps.errors
  };
  if(!Array.isArray(ticks))return fail('world-idle-loop-input','idle-loop-ticks-required',state);
  const limit=Math.max(1,int(maxTicks)??ticks.length);
  if(ticks.length<limit)return fail('world-idle-loop-input','idle-loop-tick-inputs-insufficient',state,{expected:limit,actual:ticks.length});

  let currentState=clone(state);
  let battleContext=null;
  const history=[];

  if(String(currentState?.idle?.mode??'')!=='moving'){
    return fail('world-idle-loop-state','idle-state-moving-required',currentState,{idleMode:currentState?.idle?.mode??null});
  }

  for(let tickIndex=0;tickIndex<limit;tickIndex++){
    if(String(currentState?.idle?.mode??'')!=='moving'){
      return fail('world-idle-loop-state','idle-state-moving-required',currentState,{tickIndex,history,idleMode:currentState?.idle?.mode??null});
    }
    const input=isObject(ticks[tickIndex])?ticks[tickIndex]:{};
    const move=input.move??null;
    if(!isObject(move))return fail('world-idle-loop-movement','movement-step-required',currentState,{tickIndex});

    const movement=await movementRuntime.dispatch(currentState,{
      type:'WORLD_MOVE_STEP',
      dx:move.dx,
      dy:move.dy,
      player:move.player??currentState?.world?.position??null,
      expectedRevision:currentState?.revision,
      savedAt:move.savedAt??input.now??now,
      now:input.now??now
    },{
      now:input.now??now,
      savedAt:move.savedAt??input.now??now
    });
    if(!movement.ok||movement.handled!==true){
      return {
        ...movement,
        handled:false,
        stage:'world-idle-loop-movement',
        action:ACTION_WORLD_IDLE_LOOP_TICK,
        tickIndex,
        state:clone(movement.state??currentState),
        history
      };
    }
    currentState=clone(movement.state);
    const tickRecord={
      tickIndex,
      movement:clone(movement),
      encounter:null,
      group:null,
      enemyGeneration:null,
      battleStart:null,
      battleInitialize:null,
      battleAuto:null
    };

    const target=encounterRuntime.resolve(currentState.world?.position??null,{
      encounterId:input.encounterId??null
    });
    if(!target.ok){
      if(target.reason==='unconditional-encounter-not-at-position' || target.reason==='encounter-id-not-at-position'){
        tickRecord.encounter={attempted:false,reason:'no-encounter-target-at-position',position:clone(currentState.world.position)};
        history.push(tickRecord);
        continue;
      }
      return fail('world-idle-loop-encounter-resolution','encounter-target-resolution-failed',currentState,{tickIndex,detail:target,history});
    }

    const rollInput=input.encounter??{};
    const roll=await encounterIdleBridge.commit(currentState,{
      position:currentState.world.position,
      encounterId:target.row?.encounterId??input.encounterId??null,
      cep:rollInput.cep==null?null:rollInput.cep,
      rng120:rollInput.rng120??null,
      noEnemy:rollInput.noEnemy===true,
      battleModeNone:rollInput.battleModeNone!==false,
      warpBlocked:rollInput.warpBlocked===true,
      expectedRevision:currentState.revision,
      savedAt:rollInput.savedAt??input.now??now,
      source:rollInput.source??`${transactionPrefix}:encounter`
    });
    if(!roll.ok||roll.handled!==true){
      return {
        ...roll,
        handled:false,
        stage:'world-idle-loop-encounter-roll',
        action:ACTION_WORLD_IDLE_LOOP_TICK,
        tickIndex,
        state:clone(roll.state??currentState),
        history
      };
    }
    currentState=clone(roll.state);
    tickRecord.encounter=clone(roll);

    if(roll.triggered!==true){
      history.push(tickRecord);
      continue;
    }
    if(String(currentState?.idle?.mode??'')!=='encounter_pending'){
      return fail('world-idle-loop-encounter-transition','encounter-pending-state-required',currentState,{tickIndex,history});
    }

    const encounter=clone(roll.encounter);
    const groupRoll=input.groupRoll??null;
    const group=encounterGroupRuntime.select(encounter,currentState,{groupRoll});
    if(!group.ok){
      return {
        ...group,
        handled:false,
        stage:'world-idle-loop-group-selection',
        action:ACTION_WORLD_IDLE_LOOP_TICK,
        tickIndex,
        state:clone(currentState),
        history
      };
    }
    tickRecord.group=clone(group);

    const groupId=int(group.group?.groupId);
    const enemyInput=isObject(input.enemyGeneration)?input.enemyGeneration:{};
    const enemyGeneration=encounterEnemyRuntime.generate(encounter,groupId,currentState,{
      entryMaxRoll:enemyInput.entryMaxRoll??null,
      enemyRolls:Array.isArray(enemyInput.enemyRolls)?enemyInput.enemyRolls:[],
    });
    if(!enemyGeneration.ok){
      return {
        ...enemyGeneration,
        handled:false,
        stage:'world-idle-loop-enemy-generation',
        action:ACTION_WORLD_IDLE_LOOP_TICK,
        tickIndex,
        state:clone(currentState),
        history
      };
    }
    if(Array.isArray(enemyInput.enemyStatRolls) && enemyInput.enemyStatRolls.length!==enemyGeneration.team.length){
      return fail('world-idle-loop-enemy-stats','enemy-stat-roll-count-mismatch',currentState,{tickIndex,expected:enemyGeneration.team.length,actual:enemyInput.enemyStatRolls.length,history});
    }
    tickRecord.enemyGeneration=clone({...enemyGeneration,coreStatRolls:Array.isArray(enemyInput.enemyStatRolls)?clone(enemyInput.enemyStatRolls):null});

    const battleInput=isObject(input.battle)?input.battle:{};
    let activePet=battleInput.activePet??null;
    if(activePet==null){
      const activePetId=currentState?.pets?.activePetId??null;
      activePet=activePetId==null?null:(currentState?.pets?.petBox??[]).find(p=>String(p?.id??p?.petId??'')===String(activePetId))??null;
    }
    let battleFieldNo=battleInput.battleFieldNo??null;
    let battleFieldResolution=null;
    if(battleFieldNo==null && typeof battleFieldNoProvider==='function'){
      battleFieldNo=await battleFieldNoProvider(encounter,currentState);
    }
    if(battleFieldNo==null)return fail('world-idle-loop-battle-context','battle-field-no-required',currentState,{tickIndex,history});

    const built=buildBattleContext({
      playerId:playerId??currentState?.player?.id??null,
      player:currentState?.player??null,
      playerElements:currentState?.creation?.elements??null,
      activePet,
      team:enemyGeneration.team,
      encounter,
      groupId,
      battleFieldNo,
      materializeEnemyStats:battleInput.materializeEnemyStats!==false,
      petSkillCatalog,
      playerItemSlots:currentState?.inventory?.playerItemSlots??[],
      playerItemRuntimeSlots:currentState?.inventory?.itemRuntime?.slots??{},
      playerRelifeCatalog,
      enemyStatRolls:Array.isArray(enemyInput.enemyStatRolls)?enemyInput.enemyStatRolls:[]
    });
    if(!built.ok)return fail('world-idle-loop-battle-context','battle-context-build-failed',currentState,{tickIndex,detail:built,history});
    const contextCheck=validateBattleContext(built);
    if(!contextCheck.ok)return fail('world-idle-loop-battle-context','battle-context-validation-failed',currentState,{tickIndex,errors:contextCheck.errors,history});

    const battleStarted=await idleRuntime.dispatch(currentState,{
      type:'ACTION_IDLE_EVENT',
      event:IDLE_EVENTS.BATTLE_STARTED,
      payload:{battle:built.context},
      now:input.now??now
    },{now:input.now??now});
    if(!battleStarted.ok||battleStarted.handled!==true){
      return fail('world-idle-loop-battle-start','battle-start-idle-transition-failed',currentState,{tickIndex,detail:battleStarted,history});
    }
    currentState=clone(battleStarted.state);
    battleContext=clone(built.context);
    tickRecord.battleStart=clone(battleStarted);

    const initialized=battleInitializeRuntime.initialize(
      {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
      {
        fixedLuck:battleInput.fixedLuck??null,
        surpriseRoll:battleInput.surpriseRoll??null,
        winFuncPresent:false,
        playerPresent:true,
        chargeEntries:Array.isArray(battleInput.chargeEntries)?battleInput.chargeEntries:[]
      }
    );
    if(!initialized.ok){
      return fail('world-idle-loop-battle-initialize','battle-initialize-failed',currentState,{tickIndex,detail:initialized,battleContext:clone(battleContext),history});
    }
    battleContext=clone(initialized.context);
    tickRecord.battleInitialize=clone(initialized);

    const rounds=Array.isArray(battleInput.rounds)?battleInput.rounds:[];
    const maxRounds=Math.max(1,int(battleInput.maxRounds)??rounds.length);
    if(rounds.length<maxRounds)return fail('world-idle-loop-battle-auto','battle-round-inputs-insufficient',currentState,{tickIndex,expected:maxRounds,actual:rounds.length,history,battleContext:clone(battleContext)});

    const auto=await battleAutoRuntime.run(
      {format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,context:clone(battleContext)},
      {
        state:clone(currentState),
        strategy:battleInput.strategy??strategy??undefined,
        playerId:playerId??currentState?.player?.id??null,
        rounds,
        maxRounds,
        counterPolicy:battleInput.counterPolicy??'execute',
        completeLifecycle:true,
        settlementId:battleInput.settlementId??`${transactionPrefix}:settlement:${tickIndex}`,
        supplyRequired:battleInput.supplyRequired===true,
        itemExpModifierPercent:battleInput.itemExpModifierPercent??0,
        battleExpMultiplier:battleInput.battleExpMultiplier??100,
        playerNormalLevelCap:battleInput.playerNormalLevelCap??140,
        chartrans:battleInput.chartrans??5,
        pettrans:battleInput.pettrans??-1,
        rngEvidenceByPetId:battleInput.rngEvidenceByPetId??{},
        petMailModeById:battleInput.petMailModeById??null,
        now:input.now??now,
        transactionPrefix:`${transactionPrefix}:battle:${tickIndex}`
      }
    );
    if(!auto.ok||auto.handled!==true){
      return {
        ...auto,
        handled:false,
        stage:'world-idle-loop-battle-auto',
        action:ACTION_WORLD_IDLE_LOOP_TICK,
        tickIndex,
        state:clone(auto.state??currentState),
        battleContext:auto.context?clone(auto.context):clone(battleContext),
        history
      };
    }
    if(auto.contextCleared!==true){
      return fail('world-idle-loop-battle-auto','complete-battle-lifecycle-required',currentState,{tickIndex,detail:auto,battleContext:clone(auto.context??battleContext),history});
    }
    currentState=clone(auto.state??currentState);
    battleContext=null;
    tickRecord.battleAuto=clone(auto);
    history.push(tickRecord);
    if(String(currentState?.idle?.mode??'')==='supply_check'){
      return {
        ok:true,
        handled:true,
        stage:'world-idle-loop-paused-supply',
        format:BROWSER_WORLD_IDLE_LOOP_RUNTIME_FORMAT,
        action:ACTION_WORLD_IDLE_LOOP_TICK,
        ticksExecuted:history.length,
        requestedTicks:limit,
        history,
        state:clone(currentState),
        battleContext:null,
        persistentMutation:true,
        rngGeneratedInternally:false,
        reason:'supply-check-required'
      };
    }
    if(String(currentState?.idle?.mode??'')!=='moving'){
      return fail('world-idle-loop-continuation','idle-loop-cannot-continue',currentState,{tickIndex,history,idleMode:currentState?.idle?.mode??null});
    }
  }

  return {
    ok:true,
    handled:true,
    stage:'world-idle-loop-complete',
    format:BROWSER_WORLD_IDLE_LOOP_RUNTIME_FORMAT,
    action:ACTION_WORLD_IDLE_LOOP_TICK,
    ticksExecuted:history.length,
    requestedTicks:limit,
    history,
    state:clone(currentState),
    battleContext:null,
    persistentMutation:true,
    rngGeneratedInternally:false,
    contract:{
      movement:'existing world movement runtime',
      encounter:'existing encounter target/roll/idle bridge',
      battle:'existing context/init/auto lifecycle runtime',
      continuation:'battle completion must return idle mode to moving or supply_check',
      unsupportedInput:'missing source-backed RNG or runtime prerequisites fail closed'
    }
  };
}

function createBrowserWorldIdleLoopRuntime(deps={}){
  const validation=validateDependencies(deps);
  return {
    ok:validation.ok,
    format:BROWSER_WORLD_IDLE_LOOP_RUNTIME_FORMAT,
    errors:validation.errors,
    run:(state,options={})=>runWorldIdleLoop(state,{...deps,...options})
  };
}

export {
  BROWSER_WORLD_IDLE_LOOP_RUNTIME_FORMAT,
  ACTION_WORLD_IDLE_LOOP_TICK,
  validateDependencies,
  runWorldIdleLoop,
  createBrowserWorldIdleLoopRuntime
};
