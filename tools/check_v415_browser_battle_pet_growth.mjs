import assert from 'node:assert/strict';
import { freshPersistentState } from '../src/stoneage_persistent_state.mjs';
import { planBattlePetGrowth, calculatePetGrowthLevel, encodeAllocPointPacked, decodeAllocPointPacked } from '../src/stoneage_browser_battle_pet_growth_runtime.mjs';

const now=()=> '2026-10-01T10:45:00+08:00';
const state=freshPersistentState({now,playerId:'p1',playerName:'Tester'});
const alloc={vital:10,str:20,tgh:30,dex:40};
const packed=encodeAllocPointPacked(alloc);
assert.equal(decodeAllocPointPacked(packed).str,20);

const one=calculatePetGrowthLevel({allocPointPacked:packed,petRank:0,rngRolls:[0,1,2,3,0,1,2,3,0,1,450]});
assert.equal(one.ok,true);
assert.deepEqual(one.allocationCounts,{vital:3,str:3,tgh:2,dex:2});
assert.deepEqual(one.delta,{vital:58,str:103,tgh:144,dex:189});
assert.equal(one.rngCalls,11);

state.pets.petBox=[{
  id:'pet-1',
  level:1,
  exp:0,
  hp:100,
  maxHp:100,
  workGetExp:1,
  petRank:0,
  allocPointPacked:packed,
  stats:{vital:100,str:100,tgh:100,dex:100}
}];

const levelPlan={
  ok:true,
  stage:'battle-levelup-plan-ready',
  format:'stoneage-v414-browser-battle-levelup-plan-v1',
  pets:[{petId:'pet-1',levelBefore:1,levelUps:2}]
};
const result=planBattlePetGrowth(levelPlan,state,{
  rngEvidenceByPetId:{
    'pet-1':[
      [0,1,2,3,0,1,2,3,0,1,450],
      [3,3,3,3,2,2,2,2,1,1,500]
    ]
  }
});
assert.equal(result.ok,true);
assert.equal(result.stage,'battle-pet-growth-plan-ready');
assert.equal(result.pets.length,1);
assert.equal(result.pets[0].levelUps,2);
assert.deepEqual(result.pets[0].cumulativeDelta,{vital:108,str:213,tgh:314,dex:409});
assert.deepEqual(result.pets[0].statsAfter,{vital:208,str:313,tgh:414,dex:509});
assert.equal(result.persistentStateMutation,false);
assert.equal(result.rerollAtCommit,false);

const missing=planBattlePetGrowth(levelPlan,state,{rngEvidenceByPetId:{'pet-1':[[0,1,2,3,0,1,2,3,0,1,450]]}});
assert.equal(missing.ok,false);
assert.equal(missing.reason,'pet-growth-rng-evidence-count-mismatch');

console.log('V4.15 Browser Battle Pet growth plan regression: PASS');
