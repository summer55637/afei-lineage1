#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  ACTION_BATTLE_INITIALIZE,
  ACTION_BATTLE_IDLE_STRATEGY_APPLY,
  ACTION_BATTLE_ENEMY_AI_APPLY,
  ACTION_BATTLE_CHARGE_STEP,
  ACTION_BATTLE_ATTACK_SEQ_PRELUDE,
  ACTION_BATTLE_DAMAGE_PLAN,
  ACTION_BATTLE_CRITICAL_DAMAGE_PLAN,
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';

const groups=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_group_runtime.json','utf8'));
const skillCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const sourceGroup=groups.groups.find(g=>g.groupId===711);
assert.ok(sourceGroup,'source encounter group 711 must exist');
const member=sourceGroup.members.find(m=>m.enemyId===1305);
assert.ok(member,'source Enemy 1305 must exist in group 712');
assert.equal(member.enemy.base.petSkills[0],30,'source Enemy 1305 WAZA slot 0 must be ChargeAttack');
assert.equal(member.enemy.ai.skillWeights[0],1,'source Enemy 1305 must have a positive ChargeAttack weight');

const state=freshPersistentState({playerId:'v439-charge-integration'});
state.player.name='阿肥';
state.player.hp=1000;state.player.maxHp=1000;
state.player.mp=100;state.player.maxMp=100;
state.player.stats={str:100,dex:100,tgh:100,vital:100};
state.world.position={floorId:100,x:610,y:538};
state.idle.enabled=true;
state.idle.mode='encounter_pending';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';
const controller=createBrowserStateController({state,idleRouteCatalog:routeCatalog,petSkillCatalog:skillCatalog,battleFieldNoProvider:0});
const encounter={encounterId:65,floorId:100,x:610,y:538};
const enemyTeam=[{enemyId:member.enemyId,size:member.enemy.size,createMaxNum:member.enemy.createMaxNum,enemy:member.enemy}];
const statRoll={levelRoll:0,baseStatRolls:[2,2,2,2],allocationRolls:Array(10).fill(0)};

const built=await controller.dispatch({
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,enemyTeam,groupId:711,battleFieldNo:0,
  encounter,materializeEnemyStats:true,enemyStatRolls:[statRoll]
});
assert.equal(built.ok,true,JSON.stringify(built));
const initialized=await controller.dispatch({type:ACTION_BATTLE_INITIALIZE,fixedLuck:0,surpriseRoll:100});
assert.equal(initialized.ok,true,JSON.stringify(initialized));
const player=await controller.dispatch({type:ACTION_BATTLE_IDLE_STRATEGY_APPLY,defaultTargetRoll:0,weaponKind:'none'});
assert.equal(player.ok,true,JSON.stringify(player));
const ai=await controller.dispatch({type:ACTION_BATTLE_ENEMY_AI_APPLY,actionRolls:[2],targetRolls:[0]});
assert.equal(ai.ok,true,JSON.stringify(ai));
const command=ai.commands.find(c=>c.action==='petskill-charge-attack');
assert.ok(command,'weighted WAZA slot must resolve to ChargeAttack');
assert.equal(command.skillId,30);
assert.equal(command.commandCode,1005);
assert.equal(command.targetBid,0);
assert.equal(command.chargeRounds,1);
assert.equal(command.chargeAttackPercent,90);
const actorBid=command.actorBid;
let actor=ai.battleContext.sides[1].entries.find(e=>e?.bid===actorBid);
assert.equal(actor.battleCommands[0],1005);
assert.equal(actor.battleCommands[1],0);
assert.equal(actor.battleCommands[2],90*65536+1);

const hold=await controller.dispatch({type:ACTION_BATTLE_CHARGE_STEP,actorBid});
assert.equal(hold.ok,true,JSON.stringify(hold));
assert.equal(hold.stage,'battle-charge-holding');
assert.equal(hold.remainingRounds,0);
assert.equal(hold.attackReady,false);
actor=hold.battleContext.sides[1].entries.find(e=>e?.bid===actorBid);
assert.equal(actor.battleCommands[0],1005);
assert.equal(actor.battleCommands[2],90*65536);
const release=await controller.dispatch({type:ACTION_BATTLE_CHARGE_STEP,actorBid});
assert.equal(release.ok,true,JSON.stringify(release));
assert.equal(release.stage,'battle-charge-ready');
assert.equal(release.command,1015);
assert.equal(release.attackReady,true);
actor=release.battleContext.sides[1].entries.find(e=>e?.bid===actorBid);
const expectedPower=Math.trunc(actor.fixStr+actor.fixStr*0.90)+actor.modAttack;
assert.equal(actor.attackPower,expectedPower);
assert.equal(actor.battleCommands[0],1015);
assert.equal(actor.battleCommands[1],0,'charged release retains the original AI target');
assert.equal(release.rngConsumed,0);
assert.equal(release.persistentMutation,false);
assert.equal(release.damageExecuted,false);

const prelude=await controller.dispatch({
  type:ACTION_BATTLE_ATTACK_SEQ_PRELUDE,attackerBid:actorBid,targetBid:0,
  weaponType:'none',duckRoll:10000,criticalRoll:10000
});
assert.equal(prelude.ok,true,JSON.stringify(prelude));
assert.equal(prelude.stage,'attack-seq-prelude-ready');
const damage=await controller.dispatch({
  type:ACTION_BATTLE_DAMAGE_PLAN,attackerBid:actorBid,targetBid:0,
  damageRollNear:1,damageRollWide:1,includeAttr:false
});
assert.equal(damage.ok,true,JSON.stringify(damage));
assert.equal(damage.attack,expectedPower,'charge release attack power reaches the existing damage calculation');
const critical=await controller.dispatch({
  type:ACTION_BATTLE_CRITICAL_DAMAGE_PLAN,attackerBid:actorBid,targetBid:0,lowDamageRoll:1
});
assert.equal(critical.ok,true,JSON.stringify(critical));
assert.equal(critical.damageModifier,1,'ChargeAttack uses charged attackPower, not the Mighty damage modifier');
assert.equal(critical.damage,damage.damage,'ordinary charge release continues through the existing damage pipeline');
assert.equal(critical.persistentMutation,false);
assert.equal(critical.damageExecuted,false);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v439-browser-enemy-charge-attack-integration-v1',
  source:{groupId:712,enemyId:1305,skillId:30},
  order:['encounter roster -> enemy AI WAZA','Charge COM1/2/3','Charge hold','Charge release to CHARGE_OK','AttackSeqPrelude','DamagePlan','CriticalDamagePlan'],
  charge:{rounds:1,attackPercent:90,attackPower:expectedPower},
  persistentMutation:false,damageExecuted:false
},null,2));
