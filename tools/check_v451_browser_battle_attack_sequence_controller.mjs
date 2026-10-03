#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
  ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_INITIALIZE,
  ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';

const encounterIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json','utf8'));
const groupCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_group_runtime.json','utf8'));

const state=freshPersistentState({playerId:'v451-controller'});
state.player.name='阿飛';
state.player.hp=1000; state.player.maxHp=1000;
state.player.mp=100; state.player.maxMp=100;
state.player.stats={str:100,dex:100,tgh:100,vital:100};

const controller=createBrowserStateController({
  state,
  encounterTargetIndex:encounterIndex,
  encounterGroupCatalog:groupCatalog,
  battleFieldNoProvider:0
});
const encounter={encounterId:65,floorId:100,x:610,y:538};

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
  enemyStatRolls:[
    {levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:Array(10).fill(0)},
    {levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:Array(10).fill(0)}
  ]
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

const before=controller.getBattleContext();
const enemyEntry=before.sides[1].entries.find(e=>e?.sourceType==='enemy'&&Number(e.hp)>0);
assert.ok(enemyEntry,'enemy battle entry required');

const bundle=()=>({
  weaponCritical:0,
  throwWeapon:false,
  duckRoll:10000,
  criticalRoll:10000,
  damageRollNear:1,
  damageRollWide:1,
  guardRoll:96,
  lowDamageRoll:1,
  battleDamageModify:1,
  includeAttr:false
});

const result=await controller.dispatch({
  type:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,
  attackerBid:0,
  requestedTargetBid:enemyEntry.bid,
  weaponType:'fist',
  attackCount:3,
  targets:[enemyEntry.bid,enemyEntry.bid,enemyEntry.bid],
  hitRollBundles:[bundle(),bundle(),bundle()],
  transactionPrefix:'v451-controller'
});

assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.stage,'battle-attack-sequence-resolved');
assert.equal(result.attackCount,3);
assert.equal(result.executedHitCount,3);
assert.deepEqual(result.hits.map(x=>x.damageDiv),[3,3,3]);
assert.equal(result.persistentMutation,false);
assert.equal(controller.getState().revision,0);

const after=controller.getBattleContext();
assert.ok(Number(after.sides[1].entries.find(e=>e?.bid===enemyEntry.bid)?.hp)<Number(enemyEntry.hp));

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v451-browser-battle-attack-sequence-controller-v1',
  action:ACTION_BATTLE_ATTACK_SEQUENCE_RESOLVE,
  attackCount:result.attackCount,
  executedHitCount:result.executedHitCount,
  damageDivisors:result.hits.map(x=>x.damageDiv),
  persistentRevision:controller.getState().revision,
  persistentMutation:false
},null,2));
