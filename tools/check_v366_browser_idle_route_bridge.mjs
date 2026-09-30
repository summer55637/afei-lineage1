#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { IDLE_STATES, IDLE_EVENTS } from '../src/stoneage_idle_loop.mjs';
import { BROWSER_STATE_CONTROLLER_FORMAT, ACTION_IDLE_LIST_ROUTES, ACTION_IDLE_ENABLE, ACTION_IDLE_EVENT, createBrowserStateController } from '../src/stoneage_browser_state_controller.mjs';
import { BROWSER_IDLE_RUNTIME_FORMAT } from '../src/stoneage_browser_idle_runtime.mjs';

const catalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const now=()=> '2026-09-30T20:00:00.000Z';
const controller=createBrowserStateController({
  state:freshPersistentState({playerId:'v366-browser-idle'}),
  idleRouteCatalog:catalog,
  now
});
assert.equal(controller.format,BROWSER_STATE_CONTROLLER_FORMAT);
const routes=await controller.dispatch({type:ACTION_IDLE_LIST_ROUTES});
assert.equal(routes.ok,true);
assert.equal(routes.handled,true);
assert.equal(routes.routes.length,6);
assert.equal(routes.routes.every(r=>r.eligible),true);

const routeId=routes.routes.find(r=>r.hometown===1&&r.portalId==='2000_to_100_a').routeId;
const enabled=await controller.dispatch({type:ACTION_IDLE_ENABLE,routeId,now});
assert.equal(enabled.ok,true);
assert.equal(enabled.handled,true);
assert.equal(enabled.stage,'idle-enable');
assert.equal(enabled.state.revision,1);
assert.equal(enabled.state.idle.enabled,true);
assert.equal(enabled.state.idle.mode,IDLE_STATES.MOVING);
assert.equal(enabled.state.idle.routeId,routeId);
assert.equal(enabled.routeId,routeId);

const tick=await controller.dispatch({type:ACTION_IDLE_EVENT,event:IDLE_EVENTS.MOVE_TICK,payload:{encounterTriggered:false},now:()=> '2026-09-30T20:01:00.000Z'});
assert.equal(tick.ok,true); assert.equal(tick.state.revision,2); assert.equal(tick.state.idle.mode,IDLE_STATES.MOVING);

const encounter=await controller.dispatch({type:ACTION_IDLE_EVENT,event:IDLE_EVENTS.MOVE_TICK,payload:{encounterTriggered:true,encounter:{floorId:100,encounterId:28}},now:()=> '2026-09-30T20:02:00.000Z'});
assert.equal(encounter.ok,true); assert.equal(encounter.state.revision,3); assert.equal(encounter.state.idle.mode,IDLE_STATES.ENCOUNTER_PENDING);

const rolled=await controller.dispatch({type:ACTION_IDLE_EVENT,event:IDLE_EVENTS.ENCOUNTER_ROLLED,payload:{active:true},now:()=> '2026-09-30T20:02:01.000Z'});
assert.equal(rolled.state.revision,4); assert.equal(rolled.state.idle.mode,IDLE_STATES.IN_BATTLE);

const finished=await controller.dispatch({type:ACTION_IDLE_EVENT,event:IDLE_EVENTS.BATTLE_FINISHED,payload:{battle:{resultId:'external-battle-1'}},now:()=> '2026-09-30T20:03:00.000Z'});
assert.equal(finished.state.revision,5); assert.equal(finished.state.idle.mode,IDLE_STATES.SETTLEMENT);

const reward=await controller.dispatch({type:ACTION_IDLE_EVENT,event:IDLE_EVENTS.REWARD_APPLIED,payload:{reward:{sourceResultId:'external-battle-1'},supplyRequired:false},now:()=> '2026-09-30T20:03:01.000Z'});
assert.equal(reward.state.revision,6); assert.equal(reward.state.idle.mode,IDLE_STATES.MOVING);
assert.equal(reward.state.player.exp,0);
assert.equal(reward.state.player.gold,0);

const badEvent=await controller.dispatch({type:ACTION_IDLE_EVENT,event:IDLE_EVENTS.OFFLINE_RESUME,payload:{},now});
assert.equal(badEvent.ok,false);
assert.equal(badEvent.reason,'idle-event-not-browser-boundary');
assert.equal(controller.getState().revision,6);

const blocked=await controller.dispatch({type:ACTION_IDLE_ENABLE,routeId:'hometown-3/floor-4000-to-200/4000_to_200_a',now});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'idle-route-not-eligible');
assert.equal(controller.getState().revision,6);

const conflict=await controller.dispatch({type:ACTION_IDLE_EVENT,event:IDLE_EVENTS.MOVE_TICK,payload:{encounterTriggered:false},expectedRevision:0,now});
assert.equal(conflict.ok,false);
assert.equal(conflict.reason,'revision-conflict');
assert.equal(controller.getState().revision,6);

const disabled=await controller.dispatch({type:ACTION_IDLE_EVENT,event:IDLE_EVENTS.DISABLE,payload:{},now:()=> '2026-09-30T20:04:00.000Z'});
assert.equal(disabled.ok,true); assert.equal(disabled.state.revision,7); assert.equal(disabled.state.idle.mode,IDLE_STATES.DISABLED); assert.equal(disabled.state.idle.enabled,false);

const noRouteController=createBrowserStateController({state:freshPersistentState({playerId:'no-idle'}),idleRouteCatalog:catalog,now});
const noRoute=await noRouteController.dispatch({type:ACTION_IDLE_EVENT,event:IDLE_EVENTS.MOVE_TICK,payload:{encounterTriggered:false},now});
assert.equal(noRoute.ok,false); assert.equal(noRoute.reason,'idle-route-not-enabled'); assert.equal(noRouteController.getState().revision,0);

console.log(JSON.stringify({pass:true,format:BROWSER_IDLE_RUNTIME_FORMAT,usableRoutes:routes.routes.length,enableRevision:1,lifecycleRevisions:[2,3,4,5,6],blocked4000:true,rewardNotAppliedByStateBridge:true,offlineNotImplicit:true,revisionConflictFailClosed:true,disableRevision:7}));
