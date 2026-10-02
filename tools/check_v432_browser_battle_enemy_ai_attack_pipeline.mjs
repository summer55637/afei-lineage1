#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
  ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_INITIALIZE,
  ACTION_BATTLE_IDLE_STRATEGY_APPLY,
  ACTION_BATTLE_ENEMY_AI_APPLY,
  ACTION_BATTLE_ATTACK_SEQ_PRELUDE,
  ACTION_BATTLE_DAMAGE_PLAN,
  ACTION_BATTLE_CRITICAL_DAMAGE_PLAN,
  ACTION_BATTLE_DAMAGE_REACT_PLAN,
  ACTION_BATTLE_DAMAGE_DEATH_COMMIT,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';

const encounterIndex=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_target_index.json','utf8'));
const groupCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_group_runtime.json','utf8'));
const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const state=freshPersistentState({playerId:'v432-enemy-ai-attack'});
state.player.name='阿飛';
state.player.hp=1000;state.player.maxHp=1000;
state.player.mp=100;state.player.maxMp=100;
state.player.stats={str:100,dex:100,tgh:100,vital:100};
state.world.position={floorId:100,x:610,y:538};
state.idle.enabled=true;
state.idle.mode='encounter_pending';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
const controller=createBrowserStateController({state,idleRouteCatalog:routeCatalog,encounterTargetIndex:encounterIndex,encounterGroupCatalog:groupCatalog,battleFieldNoProvider:0});
const encounter={encounterId:65,floorId:100,x:610,y:538};
const coreStatRolls=[
 {levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:Array(10).fill(0)},
 {levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:Array(10).fill(0)}
];

const selected=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,encounter,groupRoll:2});
assert.equal(selected.ok,true,JSON.stringify(selected));
const generated=await controller.dispatch({type:ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,encounter,groupId:94,entryMaxRoll:2,enemyRolls:[0,1],enemyStatRolls:coreStatRolls});
assert.equal(generated.ok,true,JSON.stringify(generated));
assert.ok(generated.team.length>0);
const built=await controller.dispatch({type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,encounter,groupId:94,battleFieldNo:0,enemyTeam:generated.team,materializeEnemyStats:true});
assert.equal(built.ok,true,JSON.stringify(built));
const initialized=await controller.dispatch({type:ACTION_BATTLE_INITIALIZE,fixedLuck:0,surpriseRoll:100});
assert.equal(initialized.ok,true,JSON.stringify(initialized));
assert.equal(initialized.battleContext.mode,'battle');

const playerStrategy=await controller.dispatch({type:ACTION_BATTLE_IDLE_STRATEGY_APPLY,defaultTargetRoll:0,weaponKind:'none'});
assert.equal(playerStrategy.ok,true,JSON.stringify(playerStrategy));
const waitingEnemies=initialized.battleContext.sides[1].entries.filter(e=>e?.sourceType==='enemy'&&e.sourceBattleCharMode===2);
assert.ok(waitingEnemies.length>0,'source encounter should materialize at least one waiting enemy');
const enemyAi=await controller.dispatch({type:ACTION_BATTLE_ENEMY_AI_APPLY,actionRolls:Array(waitingEnemies.length).fill(0),targetRolls:Array(waitingEnemies.length).fill(0)});
assert.equal(enemyAi.ok,true,JSON.stringify(enemyAi));
const command=enemyAi.commands.find(x=>x.action==='attack');
assert.ok(command,'source enemy AI should select an attack');
assert.equal(command.targetBid,0,'injected target roll 0 selects the first eligible player-side entry');

const prelude=await controller.dispatch({type:ACTION_BATTLE_ATTACK_SEQ_PRELUDE,attackerBid:command.actorBid,targetBid:command.targetBid,weaponType:'none',duckRoll:10000,criticalRoll:10000});
assert.equal(prelude.ok,true,JSON.stringify(prelude));
assert.equal(prelude.finalTargetBid,0);
assert.ok(['normal','critical'].includes(prelude.outcome));
const damage=await controller.dispatch({type:ACTION_BATTLE_DAMAGE_PLAN,attackerBid:command.actorBid,targetBid:prelude.finalTargetBid,damageRollNear:1,damageRollWide:1,includeAttr:false});
assert.equal(damage.ok,true,JSON.stringify(damage));
const critical=await controller.dispatch({type:ACTION_BATTLE_CRITICAL_DAMAGE_PLAN,attackerBid:command.actorBid,targetBid:prelude.finalTargetBid,guardRoll:96,lowDamageRoll:1,battleDamageModify:1});
assert.equal(critical.ok,true,JSON.stringify(critical));
assert.equal(critical.baseDamage,damage.damage);
const react=await controller.dispatch({type:ACTION_BATTLE_DAMAGE_REACT_PLAN,attackerBid:command.actorBid,targetBid:prelude.finalTargetBid,damage:critical.damage});
assert.equal(react.ok,true,JSON.stringify(react));
assert.equal(react.reaction.code,0,'regular enemy attack must follow the normal damage path');
const hpBefore=controller.getBattleContext().sides[0].entries[0].hp;
const committed=await controller.dispatch({type:ACTION_BATTLE_DAMAGE_DEATH_COMMIT,attackerBid:command.actorBid,targetBid:prelude.finalTargetBid,transactionId:'v432-enemy-ai-hit-1'});
assert.equal(committed.ok,true,JSON.stringify(committed));
assert.ok(['battle-damage-death-nonlethal','battle-damage-death-committed','battle-damage-death-idempotent'].includes(committed.stage));
const hpAfter=committed.battleContext.sides[0].entries[0].hp;
assert.equal(hpAfter,Math.max(0,hpBefore-react.defenderDamage));
assert.ok(hpAfter<hpBefore,'enemy attack should commit real HP damage');
assert.equal(committed.persistentMutation,false);
assert.equal(committed.damageExecuted,true);
assert.equal(controller.getState().revision,1,'combat HP commit must remain transient');

console.log(JSON.stringify({pass:true,format:'stoneage-v432-browser-battle-enemy-ai-attack-pipeline-v1',groupId:94,enemyBid:command.actorBid,targetBid:command.targetBid,order:['source encounter generation','battle context and initialization','idle player strategy','enemy AI command apply','AttackSeqPrelude','DamagePlan','CriticalDamagePlan','DamageReactPlan','DamageDeathCommit'],enemyAttackDamage:react.defenderDamage,hpBefore,hpAfter,persistentMutation:false},null,2));
