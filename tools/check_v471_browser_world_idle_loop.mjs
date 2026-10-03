#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { createBrowserIdleRuntime } from '../src/stoneage_browser_idle_runtime.mjs';
import { createBrowserWorldMovementRuntime } from '../src/stoneage_browser_world_movement_runtime.mjs';
import { createBrowserWorldEncounterRuntime } from '../src/stoneage_browser_world_encounter_runtime.mjs';
import { createBrowserWorldEncounterIdleBridge } from '../src/stoneage_browser_world_encounter_idle_bridge.mjs';
import { createBrowserWorldEncounterGroupRuntime } from '../src/stoneage_browser_world_encounter_group_runtime.mjs';
import { createBrowserWorldEncounterEnemyRuntime } from '../src/stoneage_browser_world_encounter_enemy_runtime.mjs';
import { createBrowserBattleInitializeRuntime } from '../src/stoneage_browser_battle_initialize_runtime.mjs';
import {
  createBrowserWorldIdleLoopRuntime,
  ACTION_WORLD_IDLE_LOOP_TICK
} from '../src/stoneage_browser_world_idle_loop_runtime.mjs';

const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const groupCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_group_runtime.json','utf8'));

const encounterIndex={
  format:'stoneage-start-encounter-target-index-v1',
  fixedSource:{
    repository:'gavinlinasd/StoneAge',
    ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
    encountBlobSha:'89da97a15ea866a36f26ec3bb7ab5490f3eccc5f',
    groupBlobSha:'1be75eb3e56ab16d4b433146ec59538ad651c874'
  },
  floors:{
    100:{
      unconditionalRows:[{
        encounterId:65,
        rect:[1,0,1,0],
        probMin:1,
        probMax:5,
        enemyMax:4,
        zorder:30,
        groupIds:[89,92,94],
        groupProbs:[1,1,1],
        enemyIds:[120,123]
      }]
    }
  }
};

const state=freshPersistentState({
  playerId:'v471-loop',
  playerName:'V4.71 Loop',
  now:()=> '2026-10-03T23:00:00+08:00'
});
state.player.hp=1000;
state.player.maxHp=1000;
state.player.mp=100;
state.player.maxMp=100;
state.player.stats={str:100,dex:100,tgh:100,vital:100};
state.idle.enabled=true;
state.idle.mode='moving';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
state.world.position={floorId:100,x:0,y:0};

const movementRuntime=createBrowserWorldMovementRuntime({
  loadMap:async floorId=>({
    floorId,
    width:3,
    height:1,
    tiles:[1,1,1],
    objects:[1,1,1]
  }),
  loadMapset:async()=>({
    walkableByImageId:{'1':1},
    haveHeightImageIds:[],
    defaultData:{}
  })
});
assert.equal(movementRuntime.ok,true,JSON.stringify(movementRuntime));

const encounterRuntime=createBrowserWorldEncounterRuntime({encounterTargetIndex});
assert.equal(encounterRuntime.ok,true,JSON.stringify(encounterRuntime));
const encounterIdleBridge=createBrowserWorldEncounterIdleBridge({encounterTargetIndex});
assert.equal(encounterIdleBridge.ok,true,JSON.stringify(encounterIdleBridge));
const groupRuntime=createBrowserWorldEncounterGroupRuntime({groupCatalog});
assert.equal(groupRuntime.ok,true,JSON.stringify(groupRuntime));
const enemyRuntime=createBrowserWorldEncounterEnemyRuntime({groupCatalog});
assert.equal(enemyRuntime.ok,true,JSON.stringify(enemyRuntime));
const idleRuntime=createBrowserIdleRuntime({routeCatalog});
assert.equal(idleRuntime.ok,true,JSON.stringify(idleRuntime));
const battleInitializeRuntime=createBrowserBattleInitializeRuntime();

const battleAutoRuntime={
  ok:true,
  format:'stoneage-v469-browser-battle-auto-controller-v1',
  run:async(context,options)=>{
    assert.equal(options.completeLifecycle,true);
    assert.equal(context.context.mode,'battle');
    assert.equal(context.context.sourceEncounter.encounterId,65);
    const nextState=JSON.parse(JSON.stringify(options.state));
    nextState.idle.mode='moving';
    nextState.revision=Number(nextState.revision??0)+1;
    return {
      ok:true,
      handled:true,
      stage:'battle-auto-lifecycle-complete',
      format:'stoneage-v470-browser-battle-auto-lifecycle-v1',
      action:'BATTLE_AUTO_RUN',
      finished:true,
      roundsExecuted:1,
      contextCleared:true,
      state:nextState,
      context:null,
      persistentMutation:true,
      rngGeneratedInternally:false
    };
  }
};

const loop=createBrowserWorldIdleLoopRuntime({
  movementRuntime,
  encounterRuntime,
  encounterIdleBridge,
  encounterGroupRuntime:groupRuntime,
  encounterEnemyRuntime:enemyRuntime,
  idleRuntime,
  battleInitializeRuntime,
  battleAutoRuntime,
  petSkillCatalog:null,
  playerRelifeCatalog:null
});
assert.equal(loop.ok,true,JSON.stringify(loop));

const result=await loop.run(state,{
  ticks:[
    {
      move:{dx:1,dy:0},
      encounter:{rng120:0},
      groupRoll:2,
      enemyGeneration:{
        entryMaxRoll:2,
        enemyRolls:[0,1]
      },
      battle:{
        battleFieldNo:0,
        fixedLuck:0,
        surpriseRoll:100,
        enemyStatRolls:[
          {levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:Array(10).fill(0)},
          {levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:Array(10).fill(0)}
        ],
        maxRounds:1,
        rounds:[{}]
      },
      now:'2026-10-03T23:00:01+08:00'
    },
    {
      move:{dx:1,dy:0},
      now:'2026-10-03T23:00:02+08:00'
    }
  ],
  maxTicks:2,
  playerId:state.player.id,
  transactionPrefix:'v471'
});

assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.handled,true);
assert.equal(result.action,ACTION_WORLD_IDLE_LOOP_TICK);
assert.equal(result.ticksExecuted,2);
assert.equal(result.state.world.position.x,2);
assert.equal(result.state.world.position.y,0);
assert.equal(result.state.idle.mode,'moving');
assert.equal(result.battleContext,null);
assert.equal(result.history[0].encounter.triggered,true);
assert.equal(result.history[0].group.group.groupId,94);
assert.equal(result.history[0].enemyGeneration.team.length,2);
assert.equal(result.history[0].battleInitialize.stage,'battle-initialized');
assert.equal(result.history[0].battleAuto.contextCleared,true);
assert.equal(result.history[1].encounter.attempted,false);

const fail=await loop.run(state,{ticks:[{
  move:{dx:1,dy:0},
  encounter:{rng120:null}
}],maxTicks:1});
assert.equal(fail.ok,false);
assert.equal(fail.stage,'world-idle-loop-encounter-roll');
assert.equal(fail.reason,'encounter-rng-required');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v471-browser-world-idle-loop-v1',
  action:ACTION_WORLD_IDLE_LOOP_TICK,
  ticksExecuted:result.ticksExecuted,
  firstTick:{
    movedTo:result.history[0].movement.to,
    encounterTriggered:result.history[0].encounter.triggered,
    groupId:result.history[0].group.group.groupId,
    enemyCount:result.history[0].enemyGeneration.team.length,
    battleLifecycleCleared:result.history[0].battleAuto.contextCleared
  },
  secondTick:{
    movedTo:result.history[1].movement.to,
    encounterAttempted:result.history[1].encounter.attempted
  },
  finalIdleMode:result.state.idle.mode,
  failClosedReason:fail.reason
},null,2));
