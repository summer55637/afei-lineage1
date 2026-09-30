#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SOURCE_PET_RANK_TABLE, resolveSourcePetRank, createSourceStarterPet, NEW_PLAYER_STARTER_PET_GRANT_FORMAT } from '../src/stoneage_new_player_starter_pet_runtime.mjs';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { applyPlayerCreationInput } from '../src/stoneage_player_creation_runtime.mjs';

const seed=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_seed_runtime.json','utf8'));
assert.equal(NEW_PLAYER_STARTER_PET_GRANT_FORMAT,'stoneage-new-player-starter-pet-grant-v1');
assert.deepEqual(SOURCE_PET_RANK_TABLE,[
  {num:100,rank:0},
  {num:95,rank:1},
  {num:90,rank:2},
  {num:85,rank:3},
  {num:80,rank:4},
  {num:0,rank:5}
]);

for(const [sum,expected] of [[100,0],[99,1],[95,1],[94,2],[90,2],[89,3],[85,3],[84,4],[80,4],[79,5],[0,5]]) {
  const result=resolveSourcePetRank({baseStats:{vital:sum,str:0,tgh:0,dex:0}});
  assert.equal(result.ok,true);
  assert.equal(result.paramsum,sum);
  assert.equal(result.petRank,expected);
}

assert.equal(seed.sourceFiles.enemyRank.path,'gmsv/src/char/enemy.c');
assert.equal(seed.sourceFiles.enemyRank.function,'ENEMY_getRank');
assert.equal(seed.sourceContracts.starterPetRank,'gmsv/src/char/enemy.c::ENEMY_getRank');
assert.equal(seed.starterPet.sourceClosed,true);
assert.equal(seed.starterPet.entries.length,4);

for(const entry of seed.starterPet.entries){
  assert.equal(entry.sourceRankParamsum,79);
  assert.equal(entry.sourceRank,5);
  const created=createSourceStarterPet(seed,entry.hometown,{randInclusive:()=>0,idFactory:()=> 'rank-'+entry.hometown});
  assert.equal(created.ok,true);
  assert.equal(created.petRank,5);
  assert.equal(created.sourceRankResolved,true);
  assert.equal(created.sourceRankEvidence.paramsum,79);
  assert.equal(created.sourceRankEvidence.threshold,0);
}

const base=freshPersistentState({playerId:'v348-rank'});
const prepared=applyPlayerCreationInput(base,{seed,hometown:0,stats:{vital:5,str:5,tgh:5,dex:5},elements:{earth:10,water:0,fire:0,wind:0}});
assert.equal(prepared.ok,true);

const tampered=JSON.parse(JSON.stringify(seed));
tampered.starterPet.entries[0].sourceRank=4;
const mismatch=createSourceStarterPet(tampered,0,{randInclusive:()=>0,idFactory:()=> 'tampered'});
assert.equal(mismatch.ok,false);
assert.equal(mismatch.reason,'starter-pet-rank-seed-mismatch');

console.log(JSON.stringify({pass:true,format:'stoneage-starter-pet-rank-regression-v1',sourceFunction:'gmsv/src/char/enemy.c::ENEMY_getRank',starterTemplates:4,sourceRankParamsum:[79,79,79,79],sourceRanks:[5,5,5,5],thresholdBoundaryCases:11,rankSeedJoinGuard:true}));
