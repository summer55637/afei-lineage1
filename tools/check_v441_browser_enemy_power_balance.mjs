#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import {
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
import { BATTLE_COM_S_POWERBALANCE } from '../src/stoneage_browser_battle_enemy_ai_runtime.mjs';

const groups=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_group_runtime.json','utf8'));
const skillCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const sourceGroup=groups.groups.find(g=>g.groupId===712);
assert.ok(sourceGroup,'source encounter group 712 must exist');
const member=sourceGroup.members.find(m=>m.enemyId===1306);
assert.ok(member,'source Enemy 1306 must exist in group 712');
assert.equal(member.enemy.base.petSkills[6],52,'source Enemy 1306 WAZA slot 6 must be PowerBalance skill 52');
assert.equal(member.enemy.ai.skillWeights[6],1,'source Enemy 1306 must have positive PowerBalance WAZA weight');
assert.equal(skillCatalog.byId['52'].f,'PETSKILL_PowerBalance');
assert.equal(skillCatalog.byId['52'].o,'攻%+80 防%-50');

const state=freshPersistentState({playerId:'v441-power-balance-integration'});
state.player.name='阿肥';
state.player.hp=100000;state.player.maxHp=100000;
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
  type:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,enemyTeam,groupId:712,battleFieldNo:0,
  encounter,materializeEnemyStats:true,enemyStatRolls:[statRoll]
});
assert.equal(built.ok,true,JSON.stringify(built));
const initialized=await controller.dispatch({type:ACTION_BATTLE_INITIALIZE,fixedLuck:0,surpriseRoll:100});
assert.equal(initialized.ok,true,JSON.stringify(initialized));
const player=await controller.dispatch({type:ACTION_BATTLE_IDLE_STRATEGY_APPLY,defaultTargetRoll:0,weaponKind:'none'});
assert.equal(player.ok,true,JSON.stringify(player));
const ai=await controller.dispatch({type:ACTION_BATTLE_ENEMY_AI_APPLY,actionRolls:[8],targetRolls:[0]});
assert.equal(ai.ok,true,JSON.stringify(ai));
const command=ai.commands.find(c=>c.action==='petskill-power-balance');
assert.ok(command,'weighted WAZA slot 6 must resolve to PowerBalance');
assert.equal(command.skillId,52);
assert.equal(command.commandCode,BATTLE_COM_S_POWERBALANCE);
assert.equal(command.targetBid,0);
assert.equal(command.powerBalanceAttackPercent,80);
assert.equal(command.powerBalanceDefencePercent,-50);
assert.deepEqual(ai.rngConsumed,{action:1,target:1,total:2},'PowerBalance adds no action or target RNG');
const actorBid=command.actorBid;
const actor=ai.battleContext.sides[1].entries.find(e=>e?.bid===actorBid);
assert.equal(actor.battleCommands[0],BATTLE_COM_S_POWERBALANCE);
assert.equal(actor.battleCommands[1],0);
assert.equal(actor.attackPower,actor.fixStr+Math.trunc(actor.fixStr*0.8),'source attack power is FIXSTR + trunc(FIXSTR*80%)');
assert.equal(actor.defencePower,actor.fixTgh+Math.trunc(actor.fixTgh*-0.5),'source defence power is FIXTOUGH - trunc(FIXTOUGH*50%)');

const prelude=await controller.dispatch({
  type:ACTION_BATTLE_ATTACK_SEQ_PRELUDE,attackerBid:actorBid,targetBid:0,
  weaponType:'none',duckRoll:10000,criticalRoll:10000
});
assert.equal(prelude.ok,true,JSON.stringify(prelude));
assert.equal(prelude.finalTargetBid,0);
assert.ok(['normal','critical'].includes(prelude.outcome));
const damage=await controller.dispatch({
  type:ACTION_BATTLE_DAMAGE_PLAN,attackerBid:actorBid,targetBid:prelude.finalTargetBid,
  damageRollNear:1,damageRollWide:1,includeAttr:false
});
assert.equal(damage.ok,true,JSON.stringify(damage));
assert.equal(damage.attack,actor.attackPower,'DamagePlan consumes PowerBalance-adjusted attackPower');
const critical=await controller.dispatch({
  type:ACTION_BATTLE_CRITICAL_DAMAGE_PLAN,attackerBid:actorBid,targetBid:prelude.finalTargetBid,
  guardRoll:96,lowDamageRoll:1
});
assert.equal(critical.ok,true,JSON.stringify(critical));
assert.equal(critical.baseDamage,damage.damage);
assert.equal(critical.persistentMutation,false);
assert.equal(critical.damageExecuted,false);
const react=await controller.dispatch({
  type:ACTION_BATTLE_DAMAGE_REACT_PLAN,attackerBid:actorBid,targetBid:prelude.finalTargetBid,damage:critical.damage
});
assert.equal(react.ok,true,JSON.stringify(react));
assert.equal(react.reaction.code,0);
const persistentRevisionBefore=controller.getState().revision;
const committed=await controller.dispatch({
  type:ACTION_BATTLE_DAMAGE_DEATH_COMMIT,attackerBid:actorBid,targetBid:prelude.finalTargetBid,
  transactionId:'v441-power-balance-hit'
});
assert.equal(committed.ok,true,JSON.stringify(committed));
assert.ok(['battle-damage-death-nonlethal','battle-damage-death-committed','battle-damage-death-idempotent'].includes(committed.stage));
const target=committed.battleContext.context.sides[0].entries.find(e=>e?.bid===0);
assert.ok(target.hp<100000,'PowerBalance-enhanced enemy attack commits HP damage');
assert.equal(controller.getState().revision,persistentRevisionBefore,'combat damage remains outside Persistent State');
assert.equal(committed.persistentMutation,false);
assert.equal(committed.damageExecuted,true);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v441-browser-enemy-power-balance-v1',
  source:{groupId:712,enemyId:1306,skillId:52,option:'攻%+80 防%-50'},
  command:{COM1:BATTLE_COM_S_POWERBALANCE,COM2:0},
  actor:{fixStr:actor.fixStr,attackPower:actor.attackPower,fixTgh:actor.fixTgh,defencePower:actor.defencePower},
  enemyAttackDamage:react.defenderDamage,
  hpBefore:committed.hpBefore,hpAfter:committed.hpAfter,
  rngConsumed:ai.rngConsumed,
  persistentMutation:false
},null,2));
