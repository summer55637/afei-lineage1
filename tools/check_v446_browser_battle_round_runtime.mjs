#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
  ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_INITIALIZE,
  ACTION_BATTLE_IDLE_STRATEGY_APPLY,
  ACTION_BATTLE_ENEMY_AI_APPLY,
  ACTION_BATTLE_ROUND_RESOLVE,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';
import { sortTurnEntries } from '../src/stoneage_browser_battle_round_runtime.mjs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';

const encounterIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json','utf8'));
const groupCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_group_runtime.json','utf8'));
const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));

const state=freshPersistentState({playerId:'v446-round'});
state.player.name='阿飛';
state.player.hp=1000; state.player.maxHp=1000;
state.player.mp=100; state.player.maxMp=100;
state.player.stats={str:100,dex:100,tgh:100,vital:100};
state.world.position={floorId:100,x:610,y:538};
state.idle.enabled=true;
state.idle.mode='encounter_pending';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';

const controller=createBrowserStateController({
  state,
  idleRouteCatalog:routeCatalog,
  encounterTargetIndex:encounterIndex,
  encounterGroupCatalog:groupCatalog,
  battleFieldNoProvider:0
});

const encounter={encounterId:65,floorId:100,x:610,y:538};
const coreStatRolls=[
  {levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:Array(10).fill(0)},
  {levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:Array(10).fill(0)}
];

const selected=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
  encounter,
  groupRoll:2
});
assert.equal(selected.ok,true,JSON.stringify(selected));

const generated=await controller.dispatch({
  type:ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  encounter,
  groupId:94,
  entryMaxRoll:2,
  enemyRolls:[0,1],
  enemyStatRolls:coreStatRolls
});
assert.equal(generated.ok,true,JSON.stringify(generated));
assert.equal(generated.team.length,2);

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
assert.equal(initialized.battleContext.mode,'battle');

const playerStrategy=await controller.dispatch({
  type:ACTION_BATTLE_IDLE_STRATEGY_APPLY,
  defaultTargetRoll:0,
  weaponKind:'none'
});
assert.equal(playerStrategy.ok,true,JSON.stringify(playerStrategy));

const waitingEnemies=controller.getBattleContext().sides[1].entries
  .filter(e=>e?.sourceType==='enemy'&&e.sourceBattleCharMode===2);
assert.equal(waitingEnemies.length,2);

const enemyAi=await controller.dispatch({
  type:ACTION_BATTLE_ENEMY_AI_APPLY,
  actionRolls:Array(waitingEnemies.length).fill(0),
  targetRolls:Array(waitingEnemies.length).fill(0)
});
assert.equal(enemyAi.ok,true,JSON.stringify(enemyAi));

const before=controller.getBattleContext();
const executable=sortTurnEntries({
  format:'stoneage-browser-battle-context-runtime-v1',
  context:before
}).filter(row=>{
  const code=Number(row.entry?.battleCommands?.[0]??0);
  return code===1||code===8||code===1014||code===1006||code===1007||code===1009||code===1015;
});

assert.equal(executable.length,3,'player + 2 source enemies should have executable basic attacks');
const attackRolls=executable.map(row=>({
  attackerBid:row.bid,
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
}));

const playerHpBefore=before.context
  ? before.context.sides[0].entries[0].hp
  : before.sides[0].entries[0].hp;
const enemyBeforeEntry=before.sides[1].entries.find(e=>e?.sourceType==='enemy'&&Number(e.hp)>0);
assert.ok(enemyBeforeEntry,'source enemy entry should exist');
const enemyBid=enemyBeforeEntry.bid;
const enemyHpBefore=enemyBeforeEntry.hp;

const round=await controller.dispatch({
  type:ACTION_BATTLE_ROUND_RESOLVE,
  roundId:'v446-round-1',
  counterPolicy:'defer',
  attackRolls
});
assert.equal(round.ok,true,JSON.stringify(round));
assert.equal(round.stage,'battle-round-resolved');
assert.equal(round.turn,1);
assert.equal(round.nextCommandPhase,true);
assert.equal(round.counterDeferredCount,round.deferred.length);
assert.ok(round.counterDeferredCount>=1);
assert.equal(round.scope.counterDeferred,true);
assert.equal(round.scope.maxAttackCountPerActor,1);
assert.equal(round.persistentMutation,false);
assert.equal(round.damageExecuted,true);

const after=controller.getBattleContext();
const playerHpAfter=after.sides[0].entries[0].hp;
const enemyAfterEntry=after.sides[1].entries.find(e=>e?.bid===enemyBid);
const enemyHpAfter=enemyAfterEntry?.hp??0;

assert.ok(playerHpAfter<playerHpBefore,'enemy attack should commit transient player HP damage');
assert.ok(enemyHpAfter<enemyHpBefore,'player attack should commit transient enemy HP damage');

for(const row of [...after.sides[0].entries,...after.sides[1].entries]){
  if(!row||Number(row.hp)<=0)continue;
  assert.equal(row.sourceBattleCharMode,2,'next round should return live actor to C_WAIT');
  assert.equal(row.battleMode,'c_wait');
  assert.equal(row.battleCommands?.[0],0);
}

assert.equal(controller.getState().revision,1,'battle HP changes remain transient');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v446-browser-battle-round-runtime-v1',
  encounterId:65,
  groupId:94,
  turn:round.turn,
  order:round.order,
  attackCount:round.attacks.length,
  counterDeferredCount:round.counterDeferredCount,
  playerHp:{before:playerHpBefore,after:playerHpAfter},
  enemyHp:{before:enemyHpBefore,after:enemyHpAfter},
  nextCommandPhase:round.nextCommandPhase,
  persistentMutation:false,
  scope:round.scope
},null,2));
