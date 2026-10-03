#!/usr/bin/env node
import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { createBrowserBattleDeathExtraCommitRuntime } from '../src/stoneage_browser_battle_death_extra_commit_runtime.mjs';
import { createBrowserBattleSettlementRuntime } from '../src/stoneage_browser_battle_settlement_runtime.mjs';

const now=()=> '2026-10-03T20:10:00+08:00';
const state=freshPersistentState({now,playerId:'p1',playerName:'Tester'});
state.revision=7;
state.player.charm=20;
state.player.deadPetCount=0;
state.pets.petBox=[{
  id:'pet-1',petId:500,tempNo:500,level:10,exp:100,hp:0,maxHp:100,
  variableAi:600,modAi:100,allocPointPacked:((10*256+20)*256+30)*256+40
}];

const battleContext={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'finish',sourceMode:3,settlementStartRevision:7,
    dpbattle:0,
    finishHookProfile:{auditFormat:'stoneage-battle-finish-hook-audit-v1',profile:'ordinary-world-encounter'},
    sourceDeathExtraEvents:[{
      kind:'pet-normal-death',
      actorBid:5,
      petId:'pet-1',
      ownerBid:0,
      ownerPlayerId:'p1',
      variableAiBefore:600,
      variableAiAfter:350,
      variableAiDelta:-250,
      deadPetCountBefore:0,
      deadPetCountAfter:1,
      deadPetCountDelta:1,
      battleExited:false,
      persistent:true
    }],
    sides:[
      {side:0,type:0,entries:[
        {bid:0,sourceType:'player',characterId:'p1',level:10,hp:0,isDie:true,deadPetCount:1,getitem:[-1,-1,-1]}
      ]},
      {side:1,type:1,entries:Array(10).fill(null)}
    ]
  }
};

const runtime=createBrowserBattleDeathExtraCommitRuntime();
assert.equal(runtime.ok,true);
const committed=runtime.commit(state,battleContext,{transactionId:'death-extra-1',expectedRevision:7,now});
assert.equal(committed.ok,true,JSON.stringify(committed));
assert.equal(committed.state.revision,8);
assert.equal(committed.state.pets.petBox[0].variableAi,350);
assert.equal(committed.state.player.deadPetCount,1);

const retry=runtime.commit(committed.state,battleContext,{transactionId:'death-extra-1',expectedRevision:7,now});
assert.equal(retry.ok,true);
assert.equal(retry.idempotent,true);
assert.equal(retry.state.revision,8);

const settlement=createBrowserBattleSettlementRuntime();
const missing=settlement.commit(committed.state,battleContext,{
  settlementId:'settle-missing-death-extra',
  transactions:[],
  expectedRevision:8,
  now
});
assert.equal(missing.ok,false);
assert.equal(missing.reason,'settlement-transaction-required');
assert.equal(missing.kind,'deathExtra');

const settled=settlement.commit(committed.state,battleContext,{
  settlementId:'settle-with-death-extra',
  transactions:[{kind:'deathExtra',transactionId:'death-extra-1'}],
  expectedRevision:8,
  now
});
assert.equal(settled.ok,true,JSON.stringify(settled));
assert.equal(settled.applied,true);
assert.equal(settled.requiredBranches.length,1);
assert.equal(settled.requiredBranches[0],'deathExtra');

const marefiaState=freshPersistentState({now,playerId:'p1',playerName:'Tester'});
marefiaState.revision=10;
marefiaState.player.deadPetCount=0;
marefiaState.pets.petBox=[{
  id:'marefia-718',petId:718,tempNo:718,level:10,exp:0,hp:0,maxHp:100,
  variableAi:600,modAi:100,allocPointPacked:((10*256+20)*256+30)*256+40
}];
const marefiaContext={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'finish',sourceMode:3,settlementStartRevision:10,dpbattle:0,
    sourceDeathExtraEvents:[{
      kind:'pet-normal-death',actorBid:5,petId:'marefia-718',ownerBid:0,ownerPlayerId:'p1',
      variableAiBefore:600,variableAiAfter:350,variableAiDelta:-250,
      deadPetCountBefore:0,deadPetCountAfter:1,deadPetCountDelta:1,
      battleExited:false,persistent:true,
      marefia:{
        petId:718,allocPointKnown:true,
        allocPointPackedBefore:((10*256+20)*256+30)*256+40,
        allocPointPackedAfter:((9*256+18)*256+27)*256+36,
        modAiBefore:100,modAiAfter:95,modAiDelta:-5,
        rollsConsumed:4,rolls:[1,2,3,4]
      }
    }],
    sides:[
      {side:0,type:0,entries:[
        {bid:0,sourceType:'player',characterId:'p1',level:10,hp:100,isDie:false,deadPetCount:1,getitem:[-1,-1,-1]}
      ]},
      {side:1,type:1,entries:Array(10).fill(null)}
    ]
  }
};
const marefiaCommit=runtime.commit(marefiaState,marefiaContext,{
  transactionId:'death-extra-marefia-1',expectedRevision:10,now
});
assert.equal(marefiaCommit.ok,true,JSON.stringify(marefiaCommit));
assert.equal(marefiaCommit.state.pets.petBox[0].variableAi,350);
assert.equal(marefiaCommit.state.pets.petBox[0].allocPointPacked,((9*256+18)*256+27)*256+36);
assert.equal(marefiaCommit.state.pets.petBox[0].modAi,95);
assert.equal(marefiaCommit.state.player.deadPetCount,1);

const ultimateState=freshPersistentState({now,playerId:'p1',playerName:'Tester'});
ultimateState.revision=20;
ultimateState.player.charm=20;
ultimateState.pets.activePetId='pet-default';
ultimateState.pets.petBox=[{id:'pet-default',petId:500,tempNo:500,level:10,exp:0,hp:100,maxHp:100,variableAi:0}];
const playerUltimateContext={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'finish',sourceMode:3,settlementStartRevision:20,dpbattle:0,
    sourceDeathExtraEvents:[{
      kind:'player-ultimate-death',actorBid:0,playerId:'p1',level:10,levelFlag:2,
      charmBefore:20,charmAfter:18,charmDelta:-2,
      defaultPetEvent:{petBid:5,petId:'pet-default',variableAiBefore:0,variableAiAfter:-500,variableAiDelta:-500},
      defaultPetRelationPreserved:true,persistent:true
    }],
    sides:[{side:0,type:0,entries:[{bid:0,sourceType:'player',characterId:'p1',level:10,hp:0,isDie:true}]},{side:1,type:1,entries:Array(10).fill(null)}]
  }
};
const playerUltimateCommit=runtime.commit(ultimateState,playerUltimateContext,{transactionId:'death-extra-player-ultimate',expectedRevision:20,now});
assert.equal(playerUltimateCommit.ok,true,JSON.stringify(playerUltimateCommit));
assert.equal(playerUltimateCommit.state.player.charm,18);
assert.equal(playerUltimateCommit.state.pets.activePetId,'pet-default');
assert.equal(playerUltimateCommit.state.pets.petBox[0].variableAi,-500);

const petUltimateState=freshPersistentState({now,playerId:'p1',playerName:'Tester'});
petUltimateState.revision=30;
petUltimateState.pets.activePetId='pet-ultimate';
petUltimateState.pets.petBox=[{id:'pet-ultimate',petId:500,tempNo:500,level:10,exp:0,hp:0,maxHp:100,variableAi:0}];
const petUltimateContext={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'finish',sourceMode:3,settlementStartRevision:30,dpbattle:0,
    sourceDeathExtraEvents:[{
      kind:'pet-ultimate-death',actorBid:5,petId:'pet-ultimate',ownerBid:0,ownerPlayerId:'p1',level:10,
      variableAiBefore:0,variableAiAfter:-500,variableAiDelta:-500,deadPetCountBefore:0,deadPetCountAfter:1,deadPetCountDelta:1,
      battleExited:true,persistent:true
    }],
    sides:[{side:0,type:0,entries:[{bid:0,sourceType:'player',characterId:'p1',level:10,hp:100,isDie:false,deadPetCount:1}]},{side:1,type:1,entries:Array(10).fill(null)}]
  }
};
const petUltimateCommit=runtime.commit(petUltimateState,petUltimateContext,{transactionId:'death-extra-pet-ultimate',expectedRevision:30,now});
assert.equal(petUltimateCommit.ok,true,JSON.stringify(petUltimateCommit));
assert.equal(petUltimateCommit.state.pets.activePetId,null);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v462-browser-battle-death-extra-commit-v1',
  revisionAfterDeathExtra:8,
  petVariableAi:350,
  deadPetCount:1,
  transactionIdempotent:true,
  settlementRequiresDeathExtra:true
},null,2));
