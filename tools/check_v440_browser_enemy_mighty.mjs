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
  createBrowserStateController
} from '../src/stoneage_browser_state_controller.mjs';
import { buildEnemyEntryLayout } from '../src/stoneage_browser_battle_context_runtime.mjs';
import { planEnemyAiCommands, commitEnemyAiCommands, BATTLE_COM_S_MIGHTY } from '../src/stoneage_browser_battle_enemy_ai_runtime.mjs';
import { duckCheck } from '../src/stoneage_browser_battle_attack_seq_prelude_runtime.mjs';

const groups=JSON.parse(fs.readFileSync('data/generated/stoneage_start_encounter_group_runtime.json','utf8'));
const skillCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const sourceGroup=groups.groups.find(g=>g.groupId===711);
assert.ok(sourceGroup,'source encounter group 711 must exist');
const member=sourceGroup.members.find(m=>m.enemyId===1305);
assert.ok(member,'source Enemy 1305 must exist in group 711');
assert.equal(member.enemy.base.petSkills[1],41,'source Enemy 1305 WAZA slot 1 must be Mighty skill 41');
assert.equal(member.enemy.ai.skillWeights[1],1,'source Enemy 1305 must have a positive Mighty WAZA weight');

const state=freshPersistentState({playerId:'v440-mighty-integration'});
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
const ai=await controller.dispatch({type:ACTION_BATTLE_ENEMY_AI_APPLY,actionRolls:[3],targetRolls:[0]});
assert.equal(ai.ok,true,JSON.stringify(ai));
const command=ai.commands.find(c=>c.action==='petskill-mighty');
assert.ok(command,'weighted WAZA slot must resolve to Mighty');
assert.equal(command.skillId,41);
assert.equal(command.commandCode,BATTLE_COM_S_MIGHTY);
assert.equal(command.targetBid,0);
assert.equal(command.mightyDamageModifier,3);
assert.equal(command.mightyDuckModifier,15);
assert.equal(command.command3,15*65536+300);
assert.deepEqual(ai.rngConsumed,{action:1,target:1,total:2});
const actorBid=command.actorBid;
const actor=ai.battleContext.sides[1].entries.find(e=>e?.bid===actorBid);
assert.equal(actor.battleCommands[0],BATTLE_COM_S_MIGHTY);
assert.equal(actor.battleCommands[1],0);
assert.equal(actor.battleCommands[2],15*65536+300);
assert.equal(actor.attackPower,actor.fixStr,'Mighty is a damage modifier, not an attackPower rewrite');

const target=ai.battleContext.sides[0].entries.find(e=>e?.bid===0);
const baselineActor={...actor,battleCommands:[1,0,0]};
const baselineDuck=duckCheck(baselineActor,target,{duckRoll:10000});
const mightyDuck=duckCheck(actor,target,{duckRoll:10000});
assert.equal(baselineDuck.ok,true,JSON.stringify(baselineDuck));
assert.equal(mightyDuck.ok,true,JSON.stringify(mightyDuck));
assert.equal(mightyDuck.per-baselineDuck.per,1500,'Mighty 回避+15 adds 15 percentage points to target dodge');
const prelude=await controller.dispatch({
  type:ACTION_BATTLE_ATTACK_SEQ_PRELUDE,attackerBid:actorBid,targetBid:0,
  weaponType:'none',duckRoll:10000,criticalRoll:10000
});
assert.equal(prelude.ok,true,JSON.stringify(prelude));
assert.equal(prelude.stage,'attack-seq-prelude-ready');
assert.equal(prelude.duck.per,mightyDuck.per,'controller attack prelude carries Mighty dodge modifier');
const damage=await controller.dispatch({
  type:ACTION_BATTLE_DAMAGE_PLAN,attackerBid:actorBid,targetBid:0,
  damageRollNear:1,damageRollWide:1,includeAttr:false
});
assert.equal(damage.ok,true,JSON.stringify(damage));
const critical=await controller.dispatch({
  type:ACTION_BATTLE_CRITICAL_DAMAGE_PLAN,attackerBid:actorBid,targetBid:0,lowDamageRoll:1
});
assert.equal(critical.ok,true,JSON.stringify(critical));
assert.equal(critical.damageModifier,3,'Mighty skill 41 applies the source 3x damage multiplier');
assert.equal(critical.damage,Math.trunc(critical.damageBeforeModifier*3));
assert.equal(critical.persistentMutation,false);
assert.equal(critical.hpMutation,false);
assert.equal(critical.damageExecuted,false);

const ai40={
  format:'stoneage-enemy-ai-source-v1',raw:'at:0;1;1|gu:0|es:0|wa:1;0;0;0;0;0;0;',
  attackWeight:0,targetType:1,selectMode:1,targetRollRange:1,
  guardWeight:0,magicWeight:0,escapeWeight:0,skillWeights:[1,0,0,0,0,0,0]
};
const layout40=buildEnemyEntryLayout([{
  enemyId:4040,size:0,createMaxNum:1,
  enemy:{tempNo:4040,ai:ai40,base:{petSkills:[40,-1,-1,-1,-1,-1,-1]},dropTable:[]}
}],{petSkillCatalog:skillCatalog});
assert.equal(layout40.ok,true,JSON.stringify(layout40));
const enemy40={...layout40.entries[5],bid:15,sourceType:'enemy',hp:10,maxHp:10,isDie:false,sourceBattleCharMode:2,battleCommands:[-1,-1,-1]};
const context40={format:'stoneage-browser-battle-context-runtime-v1',context:{mode:'battle',sourceMode:2,turn:1,sides:[
  {side:0,type:0,flg:0,entries:[{bid:0,sourceType:'player',hp:20,maxHp:20,isDie:false,sourceBattleCharMode:3,battleCommands:[1,15,1]},...Array(9).fill(null)]},
  {side:1,type:1,flg:0,entries:[...Array(5).fill(null),enemy40,...Array(4).fill(null)]}
]}};
const plan40=planEnemyAiCommands(context40,{actionRolls:[0],targetRolls:[0]});
assert.equal(plan40.ok,true,JSON.stringify(plan40));
assert.equal(plan40.commands[0].skillId,40);
assert.equal(plan40.commands[0].mightyDamageModifier,2);
assert.equal(plan40.commands[0].mightyDuckModifier,30);
assert.equal(plan40.commands[0].command3,30*65536+200);
const commit40=commitEnemyAiCommands(context40,{plan:plan40});
assert.equal(commit40.ok,true,JSON.stringify(commit40));
assert.equal(commit40.battleContext.context.sides[1].entries[5].battleCommands[0],BATTLE_COM_S_MIGHTY);
assert.equal(commit40.battleContext.context.sides[1].entries[5].battleCommands[2],30*65536+200);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v440-browser-enemy-mighty-integration-v1',
  source:{groupId:711,enemyId:1305,skillId:41},
  order:['encounter roster -> enemy AI WAZA','Mighty COM1/2/3','DuckCheck / AttackSeqPrelude','DamagePlan','CriticalDamagePlan'],
  skill40:{multiplier:2,duck:30,command3:30*65536+200},
  skill41:{multiplier:3,duck:15,command3:15*65536+300},
  rngConsumed:ai.rngConsumed,
  persistentMutation:false,damageExecuted:false
},null,2));
