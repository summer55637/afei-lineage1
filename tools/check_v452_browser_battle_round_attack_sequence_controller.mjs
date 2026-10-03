#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
  ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_INITIALIZE,
  ACTION_BATTLE_IDLE_STRATEGY_APPLY,
  ACTION_BATTLE_ROUND_RESOLVE,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';

import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';

const encounterIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json','utf8'));
const groupCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_group_runtime.json','utf8'));

const state=freshPersistentState({playerId:'v452-controller'});
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

const strategy=await controller.dispatch({
  type:ACTION_BATTLE_IDLE_STRATEGY_APPLY,
  defaultTargetRoll:0,
  weaponKind:'none'
});
assert.equal(strategy.ok,true,JSON.stringify(strategy));

const before=controller.getBattleContext();
const enemyEntry=before.sides[1].entries.find(e=>e?.sourceType==='enemy'&&Number(e.hp)>0);
assert.ok(enemyEntry,'enemy battle entry required');
const enemyHpBefore=Number(enemyEntry.hp);

const bundle={
  weaponType:'fist',
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

const round=await controller.dispatch({
  type:ACTION_BATTLE_ROUND_RESOLVE,
  roundId:'v452-controller-round',
  counterPolicy:'defer',
  attackRolls:[{attackerBid:0,...bundle}],
  attackCountInputsByBid:{
    0:{itemPresent:true,attackNumMin:1,attackNumMax:3,roll:3,weaponType:'fist'}
  }
});
assert.equal(round.ok,true,JSON.stringify(round));
assert.equal(round.stage,'battle-round-resolved');
assert.equal(round.attackCountPrimes.length,1);
assert.equal(round.attackCountPrimes[0].actorBid,0);
assert.equal(round.attackCountPrimes[0].attackCount,3);
assert.equal(round.attackCountPrimes[0].rngConsumed,1);
assert.equal(round.attacks.length,1);
assert.equal(round.attacks[0].attackCount,3);
assert.equal(round.attacks[0].attackSequence.executedHitCount,3);
assert.deepEqual(round.attacks[0].attackSequence.hits.map(x=>x.damageDiv),[3,3,3]);
assert.equal(round.persistentMutation,false);
assert.equal(controller.getState().revision,0);

const after=controller.getBattleContext();
const enemyHpAfter=Number(after.sides[1].entries.find(e=>e?.bid===enemyEntry.bid)?.hp);
assert.ok(enemyHpAfter<enemyHpBefore);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v452-browser-battle-round-runtime-v1',
  attackCount:round.attackCountPrimes[0].attackCount,
  executedHitCount:round.attacks[0].attackSequence.executedHitCount,
  damageDivisors:round.attacks[0].attackSequence.hits.map(x=>x.damageDiv),
  enemyHp:{before:enemyHpBefore,after:enemyHpAfter},
  persistentRevision:controller.getState().revision,
  persistentMutation:false
},null,2));
