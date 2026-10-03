#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createBrowserBattleDeathExtraRuntime } from '../src/stoneage_browser_battle_death_extra_runtime.mjs';
import { createBrowserBattleProfitCreditRuntime } from '../src/stoneage_browser_battle_profit_credit_runtime.mjs';

const runtime=createBrowserBattleDeathExtraRuntime();
const profit=createBrowserBattleProfitCreditRuntime();
assert.equal(runtime.ok,true);
assert.equal(profit.ok,true);

function baseContext({playerLevel=10,playerDead=false,playerUltimate=0,petId=500,petLevel=8,petDead=false,petUltimate=0,norisk=0,allocPointPacked=null,modAi=100,variableAi=0}={}){
  return {
    format:'stoneage-browser-battle-context-runtime-v1',
    context:{
      mode:'battle',sourceMode:2,norisk,
      finishHookProfile:{auditFormat:'stoneage-battle-finish-hook-audit-v1',profile:'ordinary-world-encounter'},
      sides:[
        {side:0,type:0,entries:[
          {bid:0,sourceType:'player',characterId:'p1',level:playerLevel,hp:playerDead?0:100,maxHp:100,isDie:playerDead,ultimate:playerUltimate,
            charm:20,deadPetCount:0,battleCommands:[1,10,-1],variableAi:0,sourceAddProfitDeathPending:playerDead},
          null,null,null,null,
          {bid:5,sourceType:'pet',characterId:'pet-1',petId:petId,tempNo:petId,level:petLevel,hp:petDead?0:100,maxHp:100,isDie:petDead,
            ultimate:petUltimate,variableAi,modAi,allocPointPacked,battleCommands:[1,10,-1],sourceAddProfitDeathPending:petDead}
        ]},
        {side:1,type:1,entries:[null,null,null,null,null,null,null,null,null,null]}
      ]
    }
  };
}

const normalPlayer=runtime.apply(baseContext({playerDead:true}),{defaultPetBidByPlayerBid:{0:5}});
assert.equal(normalPlayer.ok,true,JSON.stringify(normalPlayer));
assert.equal(normalPlayer.rngConsumed,0);
assert.equal(normalPlayer.context.sides[0].entries[0].charm,19);
assert.equal(normalPlayer.context.sides[0].entries[5].variableAi,-50);
assert.equal(normalPlayer.newEvents[0].kind,'player-normal-death');

const playerUltimateContext=baseContext({playerDead:true,playerUltimate:1});
playerUltimateContext.context.sides[0].entries[0].charm=20;
playerUltimateContext.context.sides[0].entries[5].sourceAddProfitDeathPending=false;
const playerUltimate=runtime.apply(playerUltimateContext,{defaultPetBidByPlayerBid:{0:5}});
assert.equal(playerUltimate.ok,true,JSON.stringify(playerUltimate));
assert.equal(playerUltimate.context.sides[0].entries[0].charm,18);
assert.equal(playerUltimate.context.sides[0].entries[5],null);
assert.equal(playerUltimate.newEvents[0].defaultPetEvent.variableAiDelta,-500);
assert.equal(playerUltimate.newEvents[0].defaultPetRelationPreserved,true);
assert.equal(playerUltimate.context.sourceBattleExitedBids.includes(5),true);

const petNormal=runtime.apply(baseContext({petDead:true,petLevel:10,petId:500,variableAi:600}),{});
assert.equal(petNormal.ok,true,JSON.stringify(petNormal));
assert.equal(petNormal.context.sides[0].entries[5].variableAi,350);
assert.equal(petNormal.context.sides[0].entries[0].deadPetCount,1);
assert.equal(petNormal.newEvents[0].variableAiDelta,-250);

const packed=((10*256+20)*256+30)*256+40;
const marefia=runtime.apply(baseContext({petDead:true,petId:718,petLevel:10,allocPointPacked:packed,modAi:100}),{
  deathExtraRandomRollsByBid:{5:[1,2,3,4]}
});
assert.equal(marefia.ok,true,JSON.stringify(marefia));
assert.equal(marefia.rngConsumed,4);
assert.equal(marefia.context.sides[0].entries[5].allocPointPacked,((9*256+18)*256+27)*256+36);
assert.equal(marefia.context.sides[0].entries[5].modAi,95);
assert.deepEqual(marefia.newEvents[0].marefia.rolls,[1,2,3,4]);

const missingRng=runtime.apply(baseContext({petDead:true,petId:718,allocPointPacked:packed,modAi:100}),{});
assert.equal(missingRng.ok,false);
assert.equal(missingRng.reason,'marefia-death-rng-required');

const noRisk=runtime.apply(baseContext({playerDead:true,norisk:1}),{});
assert.equal(noRisk.ok,true);
assert.equal(noRisk.stage,'battle-death-extra-skipped-norisk');
assert.equal(noRisk.rngConsumed,0);
assert.equal(noRisk.context.sides[0].entries[0].charm,20);

const profitResult=profit.apply(baseContext({petDead:true,petId:500,variableAi:600}),{
  attackerBids:[0],
  allowPlayerCredit:true,
  allowCommittedDeath:true,
  defaultPetBidByPlayerBid:{0:5}
});
assert.equal(profitResult.ok,true,JSON.stringify(profitResult));
assert.equal(profitResult.deathExtra.newEvents[0].kind,'pet-normal-death');
assert.equal(profitResult.context.sides[0].entries[5].variableAi,350);

const again=profit.apply({format:'stoneage-browser-battle-context-runtime-v1',context:profitResult.context},{
  attackerBids:[0],
  allowPlayerCredit:true,
  allowCommittedDeath:true
});
assert.equal(again.ok,true,JSON.stringify(again));
assert.equal(again.deathExtra.newEvents.length,0);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v461-browser-battle-death-extra-v1',
  normalPlayerCharmDelta:-1,
  playerUltimateCharmDelta:-2,
  petDeathVariableAiDelta:-250,
  marefiaRngConsumed:4,
  marefiaModAiAfter:95,
  noRiskSkipped:true,
  idempotent:true
},null,2));
