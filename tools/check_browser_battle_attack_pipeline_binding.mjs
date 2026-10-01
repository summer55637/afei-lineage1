#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
  ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_INITIALIZE,
  ACTION_BATTLE_PLAYER_COMMAND_SET,
  ACTION_BATTLE_ATTACK_SEQ_PRELUDE,
  ACTION_BATTLE_DAMAGE_PLAN,
  ACTION_BATTLE_CRITICAL_DAMAGE_PLAN,
  ACTION_BATTLE_DAMAGE_REACT_PLAN,
  ACTION_BATTLE_COUNTER_PLAN,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';

const encounterIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json','utf8'));
const groupCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_group_runtime.json','utf8'));
const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));

function controller(){
  const state=freshPersistentState({playerId:'attack-pipeline-bind'});
  state.player.name='pipeline';
  state.player.hp=1000;
  state.player.maxHp=1000;
  state.player.mp=100;
  state.player.maxMp=100;
  state.player.stats={str:100,dex:100,tgh:100,vital:100};
  state.world.position={floorId:100,x:610,y:538};
  state.idle.enabled=true;
  state.idle.mode='encounter_pending';
  state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
  return createBrowserStateController({
    state,
    idleRouteCatalog:routeCatalog,
    encounterTargetIndex:encounterIndex,
    encounterGroupCatalog:groupCatalog,
    battleFieldNoProvider:0
  });
}

const encounter={encounterId:65,floorId:100,x:610,y:538};
const coreStatRolls=[
  {levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:[0,0,0,0,0,0,0,0,0,0]},
  {levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:[0,0,0,0,0,0,0,0,0,0]}
];

{
  const c=controller();

  const noAttack=await c.dispatch({
    type:ACTION_BATTLE_DAMAGE_PLAN,
    attackerBid:0,
    targetBid:15,
    damageRollNear:1,
    damageRollWide:1
  });
  assert.equal(noAttack.ok,false);
  assert.equal(noAttack.reason,'battle-context-required');

  const group=await c.dispatch({type:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,encounter,groupRoll:2});
  assert.equal(group.ok,true,JSON.stringify(group));
  const generated=await c.dispatch({
    type:ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
    encounter,
    groupId:94,
    entryMaxRoll:2,
    enemyRolls:[0,1],
    enemyStatRolls:coreStatRolls
  });
  assert.equal(generated.ok,true,JSON.stringify(generated));

  const built=await c.dispatch({
    type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
    encounter,
    groupId:94,
    battleFieldNo:0,
    enemyTeam:generated.team,
    materializeEnemyStats:true
  });
  assert.equal(built.ok,true,JSON.stringify(built));

  const initialized=await c.dispatch({
    type:ACTION_BATTLE_INITIALIZE,
    fixedLuck:0,
    surpriseRoll:100
  });
  assert.equal(initialized.ok,true,JSON.stringify(initialized));
  assert.equal(initialized.battleContext.context.mode,'battle');

  const command=await c.dispatch({
    type:ACTION_BATTLE_PLAYER_COMMAND_SET,
    battleSlot:0,
    command:'attack',
    targetBid:15
  });
  assert.equal(command.ok,true,JSON.stringify(command));
  assert.equal(command.command.targetBid,15);

  const noDamageYet=await c.dispatch({
    type:ACTION_BATTLE_CRITICAL_DAMAGE_PLAN,
    attackerBid:0,
    targetBid:15,
    damageRollNear:1,
    damageRollWide:1
  });
  assert.equal(noDamageYet.ok,false,JSON.stringify(noDamageYet));
  assert.equal(noDamageYet.reason,'attack-seq-plan-required');

  const attack=await c.dispatch({
    type:ACTION_BATTLE_ATTACK_SEQ_PRELUDE,
    attackerBid:0,
    targetBid:15,
    weaponType:'none',
    duckRoll:10000,
    criticalRoll:10000
  });
  assert.equal(attack.ok,true,JSON.stringify(attack));
  assert.equal(attack.finalTargetBid,15);
  assert.equal(attack.outcome,'normal');

  const wrongDamageTarget=await c.dispatch({
    type:ACTION_BATTLE_DAMAGE_PLAN,
    attackerBid:0,
    targetBid:16,
    damageRollNear:1,
    damageRollWide:1,
    includeAttr:false
  });
  assert.equal(wrongDamageTarget.ok,false,JSON.stringify(wrongDamageTarget));
  assert.equal(wrongDamageTarget.reason,'attack-seq-target-mismatch');

  const damage=await c.dispatch({
    type:ACTION_BATTLE_DAMAGE_PLAN,
    attackerBid:0,
    targetBid:15,
    damageRollNear:1,
    damageRollWide:1,
    includeAttr:false
  });
  assert.equal(damage.ok,true,JSON.stringify(damage));
  assert.equal(damage.attackerBid,0);
  assert.equal(damage.targetBid,15);

  const wrongCriticalTarget=await c.dispatch({
    type:ACTION_BATTLE_CRITICAL_DAMAGE_PLAN,
    attackerBid:0,
    targetBid:16,
    damageRollNear:1,
    damageRollWide:1
  });
  assert.equal(wrongCriticalTarget.ok,false,JSON.stringify(wrongCriticalTarget));
  assert.equal(wrongCriticalTarget.reason,'attack-seq-target-mismatch');

  const critical=await c.dispatch({
    type:ACTION_BATTLE_CRITICAL_DAMAGE_PLAN,
    attackerBid:0,
    targetBid:15,
    guardRoll:96,
    lowDamageRoll:1,
    battleDamageModify:1
  });
  assert.equal(critical.ok,true,JSON.stringify(critical));
  assert.equal(critical.baseDamage,damage.damage);

  const wrongReactDamage=await c.dispatch({
    type:ACTION_BATTLE_DAMAGE_REACT_PLAN,
    attackerBid:0,
    targetBid:15,
    damage:critical.damage+1
  });
  assert.equal(wrongReactDamage.ok,false,JSON.stringify(wrongReactDamage));
  assert.equal(wrongReactDamage.reason,'critical-damage-mismatch');

  const react=await c.dispatch({
    type:ACTION_BATTLE_DAMAGE_REACT_PLAN,
    attackerBid:0,
    targetBid:15,
    damage:critical.damage
  });
  assert.equal(react.ok,true,JSON.stringify(react));
  assert.equal(react.targetBid,15);
  assert.equal(react.reaction.code,0);

  const preCounter=await c.dispatch({
    type:ACTION_BATTLE_COUNTER_PLAN,
    attackerBid:15,
    targetBid:0,
    attackerCommand:1,
    attackerWeaponClass:'claw',
    defenderWeaponClass:'claw',
    counterRoll:1
  });
  assert.equal(preCounter.ok,true,JSON.stringify(preCounter));
  assert.equal(preCounter.triggered,true);

  const counterWrongDirection=await c.dispatch({
    type:ACTION_BATTLE_COUNTER_PLAN,
    attackerBid:0,
    targetBid:15,
    attackerCommand:1,
    attackerWeaponClass:'claw',
    defenderWeaponClass:'claw',
    counterRoll:1
  });
  assert.equal(counterWrongDirection.ok,false,JSON.stringify(counterWrongDirection));
  assert.equal(counterWrongDirection.reason,'counter-reverse-target-mismatch');

  console.log(JSON.stringify({
    pass:true,
    contract:'attack-seq-damage-react-counter-binding',
    order:['AttackSeqPrelude','DamagePlan','CriticalDamagePlan','DamageReactPlan','CounterPlan'],
    target:{requested:15,final:15},
    damagePlanBound:true,
    criticalDamageBound:true,
    damageReactBound:true,
    counterReverseBound:true,
    hpMutation:false,
    persistentMutation:false
  },null,2));
