import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { commitBattleLevelUp } from '../src/stoneage_browser_battle_levelup_commit_runtime.mjs';

const now=()=> '2026-10-01T11:00:00+08:00';
const state=freshPersistentState({now,playerId:'p1',playerName:'Tester'});
state.revision=7;
state.player.level=1;
state.player.exp=37;
state.player.duelPoint=10;
state.player.charm=20;
state.player.profession.skillPoint=4;
state.pets.petBox=[{
  id:'pet-1',
  level:1,
  exp:37,
  hp:100,
  maxHp:100,
  petRank:0,
  allocPointPacked:16909060,
  stats:{vital:100,str:100,tgh:100,dex:100}
}];

const levelPlan={
  ok:true,stage:'battle-levelup-plan-ready',format:'stoneage-v414-browser-battle-levelup-plan-v1',
  player:{
    levelBefore:1,levelAfter:5,expBefore:37,expAfter:0,
    duelPointBefore:10,duelPointAfter:150,
    skillPointBefore:4,skillPointAfter:16,
    charmBefore:20,charmAfter:22
  },
  pets:[{
    petId:'pet-1',levelBefore:1,levelAfter:5,expBefore:37,expAfter:0,levelUps:4
  }]
};
const petGrowthPlan={
  ok:true,stage:'battle-pet-growth-plan-ready',format:'stoneage-v415-browser-battle-pet-growth-plan-v1',
  pets:[{
    petId:'pet-1',levelUps:4,
    statsBefore:{vital:100,str:100,tgh:100,dex:100},
    statsAfter:{vital:208,str:313,tgh:414,dex:509}
  }]
};

const committed=commitBattleLevelUp(
  state,levelPlan,petGrowthPlan,
  {transactionId:'battle-v416-1',expectedRevision:7,now}
);
assert.equal(committed.ok,true);
assert.equal(committed.applied,true);
assert.equal(committed.idempotent,false);
assert.equal(committed.stage,'battle-levelup-commit-applied');
assert.equal(committed.revisionBefore,7);
assert.equal(committed.revisionAfter,8);
assert.equal(committed.state.player.level,5);
assert.equal(committed.state.player.exp,0);
assert.equal(committed.state.player.duelPoint,150);
assert.equal(committed.state.player.profession.skillPoint,16);
assert.equal(committed.state.player.charm,22);
assert.equal(committed.state.pets.petBox[0].level,5);
assert.equal(committed.state.pets.petBox[0].exp,0);
assert.deepEqual(committed.state.pets.petBox[0].stats,{vital:208,str:313,tgh:414,dex:509});

const retry=commitBattleLevelUp(
  committed.state,levelPlan,petGrowthPlan,
  {transactionId:'battle-v416-1',expectedRevision:7,now}
);
assert.equal(retry.ok,true);
assert.equal(retry.idempotent,true);
assert.equal(retry.applied,false);
assert.equal(retry.state.revision,8);

const stale=commitBattleLevelUp(
  {...state,player:{...state.player,exp:38}},
  levelPlan,petGrowthPlan,
  {transactionId:'battle-v416-stale',expectedRevision:7,now}
);
assert.equal(stale.ok,false);
assert.equal(stale.reason,'player-progression-stale-plan');

const badPet=commitBattleLevelUp(
  {...state,pets:{...state.pets,petBox:[{...state.pets.petBox[0],stats:{...state.pets.petBox[0].stats,vital:101}}]}},
  levelPlan,petGrowthPlan,
  {transactionId:'battle-v416-bad-pet',expectedRevision:7,now}
);
assert.equal(badPet.ok,false);
assert.equal(badPet.reason,'pet-stats-stale-plan');

console.log('V4.16 Browser Battle level-up commit regression: PASS');
