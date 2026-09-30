#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { simulateFirstEncounter, simulateOfflineResume, routeVariantKey, normalizeSimulationBattleResult, BATTLE_RESULT_FORMAT } from '../src/stoneage_idle_simulation.mjs';

const base=freshPersistentState({now:()=> '2026-09-30T05:00:00.000Z',playerId:'p1'});
base.player.maxHp=100;base.player.hp=100;base.player.maxMp=50;base.player.mp=50;
const route={hometown:0,name:'samugiru',entryFloor:1000,encounterFloor:100};
const variant={portalId:'1000_to_100_a',originPathMin:120,landingPathMin:71,totalWalkBeforeEncounterMin:191,encounterId:65};
assert.equal(routeVariantKey(route,variant),'hometown-0/floor-1000-to-100/1000_to_100_a');
const rawAdapter=normalizeSimulationBattleResult(null,{battleIndex:99,winside:0,finished:true,player:{hp:90,mp:40}});
assert.equal(rawAdapter.ok,true);
assert.equal(rawAdapter.battleResult.format,BATTLE_RESULT_FORMAT);
assert.equal(rawAdapter.battleResult.outcome,'victory');

const win=await simulateFirstEncounter(base,route,variant,{
  encounter:{floorId:100,encounterId:65},
  battleResult:{outcome:'win',player:{hp:80,mp:45},reward:{transactionId:'sim-1',source:'battle:65',playerExp:20,gold:15,items:[],petCredits:[]}},
  knownExistingItemIds:new Set(),
  now:()=> '2026-09-30T05:00:00.000Z',
  save:true
});
assert.equal(win.ok,true);
assert.equal(win.idleState.state,'moving');
assert.equal(win.state.player.hp,80);
assert.equal(win.state.player.exp,20);
assert.equal(win.state.player.gold,15);
assert.equal(win.state.revision,1);
assert.equal(win.save.ok,true);
assert.equal(win.save.state.revision,1);
assert.equal(typeof win.save.envelope.payloadHash,'string');

const second=await simulateFirstEncounter(win.state,route,variant,{
  encounter:{floorId:100,encounterId:65},
  battleResult:{outcome:'defeat',player:{hp:0,mp:0}},
  policy:{death:{recoveryMode:'manual'}},
  now:()=> '2026-09-30T06:00:00.000Z',
  save:false
});
assert.equal(second.ok,true);
assert.equal(second.dead,true);
assert.equal(second.death.action,'await_manual_recovery');
assert.equal(second.state.idle.mode,'dead');
assert.equal(second.idleState.state,'dead');

const off=simulateOfflineResume(win.state,'2026-09-30T06:00:00Z','2026-09-30T08:00:00Z',{maxSeconds:3600});
assert.equal(off.ok,true);
assert.equal(off.offline.elapsedSeconds,7200);
assert.equal(off.offline.accruedSeconds,3600);
assert.equal(off.rewardsSimulated,false);

console.log(JSON.stringify({pass:true,format:'stoneage-idle-simulation-v1',sourceBattleInjected:true,saveCommitIntegrated:true,offlineRewardsSimulated:false}));
