#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  createBrowserStateController,
  ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
  ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_INITIALIZE,
  ACTION_BATTLE_AUTO_RUN
} from '../src/stoneage_browser_state_controller.mjs';
import {
  createBrowserBattleAutoRuntime
} from '../src/stoneage_browser_battle_auto_runtime.mjs';

const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const encounterIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json','utf8'));
const groupCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_group_runtime.json','utf8'));
const relifeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_item_relife_runtime.json','utf8'));

const state=freshPersistentState({playerId:'v469-auto',playerName:'V4.69'});
state.player.hp=1000;state.player.maxHp=1000;
state.player.mp=100;state.player.maxMp=100;
state.player.stats={str:100,dex:100,tgh:100,vital:100};
state.idle.enabled=true;
state.idle.mode='encounter_pending';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
state.world.position={floorId:100,x:610,y:538};

const controller=createBrowserStateController({
  state,
  idleRouteCatalog:routeCatalog,
  encounterTargetIndex:encounterIndex,
  encounterGroupCatalog:groupCatalog,
  battleFieldNoProvider:0,
  playerRelifeCatalog:relifeCatalog
});

const encounter={encounterId:65,floorId:100,x:610,y:538};
const selected=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
  encounter,
  groupRoll:2
});
assert.equal(selected.ok,true,JSON.stringify(selected));

const statRolls=[
  {levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:Array(10).fill(0)},
  {levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:Array(10).fill(0)}
];
const generated=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  encounter,
  groupId:94,
  entryMaxRoll:2,
  enemyRolls:[0,1],
  enemyStatRolls:statRolls
});
assert.equal(generated.ok,true,JSON.stringify(generated));

const built=await controller.dispatch({
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  encounter,
  groupId:94,
  battleFieldNo:0,
  enemyTeam:generated.team,
  materializeEnemyStats:true
});
assert.equal(built.ok,true,JSON.stringify(built));

const initialized=await controller.dispatch({
  type:ACTION_BATTLE_INITIALIZE,
  fixedLuck:0,
  surpriseRoll:100
});
assert.equal(initialized.ok,true,JSON.stringify(initialized));

const bundle={
  weaponType:'none',
  weaponCritical:0,
  throwWeapon:false,
  duckRoll:10000,
  criticalRoll:10000,
  damageRollNear:1,
  damageRollWide:1,
  guardRoll:96,
  lowDamageRoll:1,
  battleDamageModify:1,
  includeAttr:false,
  defaultTargetRoll:0
};

const revisionBefore=controller.getState().revision;
const result=await controller.dispatch({
  type:ACTION_BATTLE_AUTO_RUN,
  playerId:state.player.id,
  maxRounds:1,
  transactionPrefix:'v469-controller',
  rounds:[{
    defaultTargetRoll:0,
    enemyActionRolls:[0,0],
    enemyTargetRolls:[0,0],
    roundOptions:{
      attackRolls:[
        {attackerBid:0,...bundle},
        {attackerBid:15,...bundle},
        {attackerBid:16,...bundle}
      ],
      counterPolicy:'defer',
      weaponClassByBid:{0:'none',15:'none',16:'none'}
    }
  }]
});

assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.action,ACTION_BATTLE_AUTO_RUN);
assert.equal(result.stage,'battle-auto-round-limit');
assert.equal(result.roundsExecuted,1);
assert.equal(result.battleContext.turn,1);
assert.equal(result.persistentMutation,false);
assert.equal(result.rngGeneratedInternally,false);
assert.equal(controller.getState().revision,revisionBefore);
assert.equal(controller.getBattleContext().turn,1);

const noContextController=createBrowserStateController({state:freshPersistentState({playerId:'v469-no-context'})});
const noContext=await noContextController.dispatch({
  type:ACTION_BATTLE_AUTO_RUN,
  maxRounds:1,
  rounds:[{}]
});
assert.equal(noContext.ok,false);
assert.equal(noContext.reason,'battle-context-required');

const finishContext={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',
    sourceMode:2,
    turn:0,
    sides:[]
  }
};
const finishPlan={
  ok:true,
  handled:true,
  finished:true,
  stage:'battle-end-finished',
  winnerSide:0,
  finishReason:'all-enemies-defeated'
};
const stubAuto=createBrowserBattleAutoRuntime({
  playerStrategyRuntime:{ok:true,apply:async x=>({ok:true,handled:true,battleContext:x.context,command:null})},
  enemyAiRuntime:{ok:true,apply:async x=>({ok:true,handled:true,battleContext:x.context,commands:[]})},
  roundRuntime:{ok:true,resolve:async x=>({
    ok:true,
    handled:true,
    stage:'battle-round-resolved',
    context:x.context,
    turn:1,
    finished:true,
    winnerSide:0,
    finishReason:finishPlan.finishReason,
    finishPlan
  })}
});
const finished=await stubAuto.run(finishContext,{maxRounds:1,rounds:[{}]});
assert.equal(finished.ok,true,JSON.stringify(finished));
assert.deepEqual(finished.finishPlan,finishPlan);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v469-browser-battle-auto-controller-v1',
  controllerActionBound:true,
  roundsExecuted:result.roundsExecuted,
  finishPlanExposed:true,
  persistentMutation:result.persistentMutation,
  rngGeneratedInternally:result.rngGeneratedInternally
},null,2));
