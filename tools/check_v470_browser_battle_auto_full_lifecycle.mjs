#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { createBrowserIdleRuntime } from '../src/stoneage_browser_idle_runtime.mjs';
import { applyBattleProfitCredit } from '../src/stoneage_browser_battle_profit_credit_runtime.mjs';
import { applyBattleRelife } from '../src/stoneage_browser_battle_relife_runtime.mjs';
import { planBattleEnd } from '../src/stoneage_browser_battle_end_runtime.mjs';
import { createBrowserBattleFinishCommitRuntime } from '../src/stoneage_browser_battle_finish_commit_runtime.mjs';
import { createBrowserBattleExpPlanRuntime } from '../src/stoneage_browser_battle_exp_runtime.mjs';
import { createBrowserBattleLevelUpPlanRuntime } from '../src/stoneage_browser_battle_levelup_runtime.mjs';
import { createBrowserBattlePetGrowthPlanRuntime } from '../src/stoneage_browser_battle_pet_growth_runtime.mjs';
import { createBrowserBattleLevelUpCommitRuntime } from '../src/stoneage_browser_battle_levelup_commit_runtime.mjs';
import { createBrowserBattleDeathExtraCommitRuntime } from '../src/stoneage_browser_battle_death_extra_commit_runtime.mjs';
import { createBrowserBattleRelifeCommitRuntime } from '../src/stoneage_browser_battle_relife_commit_runtime.mjs';
import { createBrowserBattleSettlementRuntime } from '../src/stoneage_browser_battle_settlement_runtime.mjs';
import { createBrowserBattlePlayerExitRuntime } from '../src/stoneage_browser_battle_player_exit_runtime.mjs';
import { createBrowserBattlePlayerExitCommitRuntime } from '../src/stoneage_browser_battle_player_exit_commit_runtime.mjs';
import { createBrowserBattleExitPlanRuntime } from '../src/stoneage_browser_battle_exit_runtime.mjs';
import { createBrowserBattleExitCommitRuntime } from '../src/stoneage_browser_battle_exit_commit_runtime.mjs';
import { createBrowserBattleContextClearRuntime } from '../src/stoneage_browser_battle_context_clear_runtime.mjs';
import { runBattleAutoLifecycle } from '../src/stoneage_browser_battle_auto_lifecycle_runtime.mjs';

const routeCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
const now=()=> '2026-10-03T22:35:00+08:00';

const state=freshPersistentState({now,playerId:'v470-life',playerName:'V4.70 Lifecycle'});
state.revision=0;
state.player.level=1;
state.player.exp=0;
state.player.hp=1;
state.player.maxHp=200;
state.player.mp=30;
state.player.maxMp=50;
state.player.charm=20;
state.player.duelPoint=0;
state.player.profession.skillPoint=0;
state.idle.enabled=true;
state.idle.mode='in_battle';
state.idle.routeId='hometown-0/floor-1000-to-100/1000_to_100_a';

state.inventory.playerItemSlots[3]=400;
state.inventory.itemRuntime.slots['400']={use:true,itemId:20131,owner:'player',pile:1,data:[20131]};
state.inventory.piles['20131']=1;

const context={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',
    sourceMode:2,
    turn:1,
    norisk:0,
    dpbattle:0,
    sourceEncounter:{encounterId:470},
    finishHookProfile:{
      auditFormat:'stoneage-battle-finish-hook-audit-v1',
      profile:'ordinary-world-encounter',
      winFuncInjected:false,
      pkFuncInjected:false,
      dantai:false,
      linkedBattleCount:0
    },
    sourcePlayerItemSlotsSnapshot:[null,null,null,400,...Array(20).fill(null)],
    sourcePlayerRelifeCandidates:[{
      playerSlot:3,
      existingIndex:400,
      itemId:20131,
      itemName:'替身娃娃 Lv1',
      relifeFunc:'ITEM_DIErelife',
      equipPlace:3,
      hpArgument:200
    }],
    sourceRelifeConsumedExistingIndexes:[],
    sourceRelifeEvents:[],
    sourceDeathExtraEvents:[],
    sourceBattleExitedBids:[],
    sides:[
      {side:0,type:0,flg:0,entries:[{
        bid:0,battleSlot:0,battleSide:0,sourceType:'player',characterId:'v470-life',
        hp:0,maxHp:200,mp:30,maxMp:50,level:1,
        fixDex:1,quick:1,fixVital:1,attackPower:1,defencePower:1,fixStr:1,fixTgh:1,fixLuck:0,
        battleFlg:0,battleCommands:[-1,-1,-1],sourceBattleCharMode:3,battleMode:'c_ok',
        elements:{fire:0,water:0,earth:0,wind:0},
        damageVanish:0,damageAbsorb:0,damageReflect:0,damageReact:0,
        isDie:true,deadCount:1,ultimate:0,charm:20,deadPetCount:0,
        variableAi:0,sourceAddProfitDeathPending:true,sourceDeathExtraProcessed:false,
        getitem:[-1,-1,-1],workGetExp:0
      },...Array(9).fill(null)]},
      {side:1,type:1,flg:0,entries:Array(10).fill(null)}
    ]
  }
};

const profit=applyBattleProfitCredit(context,{
  attackerBids:[],
  allowPlayerCredit:false,
  allowCommittedDeath:true,
  hitIndex:0,
  source:'v470-lifecycle',
  now
});
assert.equal(profit.ok,true,JSON.stringify(profit));

const relife=applyBattleRelife(
  {format:'stoneage-browser-battle-context-runtime-v1',context:profit.context},
  {trigger:'v470-lifecycle-relife',now}
);
assert.equal(relife.ok,true,JSON.stringify(relife));
assert.equal(relife.applied,true,JSON.stringify(relife));

const finishPlan=planBattleEnd({
  format:'stoneage-browser-battle-context-runtime-v1',
  context:relife.context
});
assert.equal(finishPlan.ok,true,JSON.stringify(finishPlan));
assert.equal(finishPlan.finished,true);
relife.context.finishPlan=finishPlan;

const idleRuntime=createBrowserIdleRuntime({routeCatalog});
assert.equal(idleRuntime.ok,true,JSON.stringify(idleRuntime));

const result=await runBattleAutoLifecycle(
  {format:'stoneage-browser-battle-context-runtime-v1',context:relife.context},
  state,
  {
    idleRuntime,
    battleFinishCommitRuntime:createBrowserBattleFinishCommitRuntime(),
    battleExpPlanRuntime:createBrowserBattleExpPlanRuntime(),
    battleLevelUpPlanRuntime:createBrowserBattleLevelUpPlanRuntime(),
    battlePetGrowthPlanRuntime:createBrowserBattlePetGrowthPlanRuntime(),
    battleLevelUpCommitRuntime:createBrowserBattleLevelUpCommitRuntime(),
    battleDeathExtraCommitRuntime:createBrowserBattleDeathExtraCommitRuntime(),
    battleRelifeCommitRuntime:createBrowserBattleRelifeCommitRuntime(),
    battleSettlementRuntime:createBrowserBattleSettlementRuntime(),
    battlePlayerExitRuntime:createBrowserBattlePlayerExitRuntime(),
    battlePlayerExitCommitRuntime:createBrowserBattlePlayerExitCommitRuntime(),
    battleExitPlanRuntime:createBrowserBattleExitPlanRuntime(),
    battleExitCommitRuntime:createBrowserBattleExitCommitRuntime(),
    battleContextClearRuntime:createBrowserBattleContextClearRuntime(),
    settlementId:'v470-settlement-1',
    transactionPrefix:'v470',
    supplyRequired:false,
    now,
  }
);

assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.stage,'battle-auto-lifecycle-complete');
assert.equal(result.contextCleared,true);
assert.equal(result.requiredSettlementBranches.includes('levelUp'),true);
assert.equal(result.requiredSettlementBranches.includes('deathExtra'),true);
assert.equal(result.requiredSettlementBranches.includes('relife'),true);
assert.equal(result.transactions.length,3);
assert.deepEqual(result.transactions.map(x=>x.kind),['deathExtra','relife','levelUp']);
assert.equal(result.state.revision,8);
assert.equal(result.state.player.charm,19);
assert.equal(result.state.player.hp,200);
assert.equal(result.state.inventory.playerItemSlots[3],null);
assert.equal(result.state.inventory.itemRuntime.slots['400'],undefined);
assert.equal(result.state.inventory.piles['20131'],undefined);
assert.equal(result.state.idle.mode,'moving');
assert.equal(result.state.idle.enabled,true);
assert.equal(result.battleExitTransactionId,'v470:battle-exit');
assert.equal(result.settlementId,'v470-settlement-1');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v470-browser-battle-auto-lifecycle-v1',
  revisionChain:[0,1,2,3,4,5,6,7,8],
  requiredSettlementBranches:result.requiredSettlementBranches,
  transactions:result.transactions,
  playerExitCommitted:true,
  battleExitCommitted:true,
  contextCleared:true,
  idleResumed:result.worldLoopResumed,
  persistentRevision:result.state.revision
},null,2));
