#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  NEW_PLAYER_PET_RUNTIME_FORMAT,
  PET_MAX_HAVE,
  createSourceNewPlayerPet,
  createSourcePetGetPetHandler,
  resolveNewPlayerPetTemplate
} from '../src/stoneage_new_player_pet_runtime.mjs';

const catalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_pet_runtime.json','utf8'));
assert.equal(NEW_PLAYER_PET_RUNTIME_FORMAT,'stoneage-new-player-pet-runtime-v1');
assert.equal(catalog.fixedSource.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(catalog.stats.requestedEnemyIds,5);
assert.equal(catalog.stats.resolvedEnemyIds,5);
assert.equal(Object.keys(catalog.byTempNo).length,5);
assert.equal(catalog.petMaxHave,PET_MAX_HAVE);

const expected={
  341:{tempNo:274,name:'朵拉比斯',imageNumber:100362,initNum:23,lvUpPoint:4},
  2057:{tempNo:1047,name:'洛奇斯德',imageNumber:101442,initNum:39,lvUpPoint:4},
  1645:{tempNo:812,name:'斑尼迪克',imageNumber:100907,initNum:30,lvUpPoint:4},
  1479:{tempNo:718,name:'玛蕾菲雅',imageNumber:100451,initNum:20,lvUpPoint:5},
  2547:{tempNo:401,name:'玛蕾菲雅',imageNumber:100454,initNum:20,lvUpPoint:5}
};
for(const [id,row] of Object.entries(expected)){
  const resolved=resolveNewPlayerPetTemplate(catalog,Number(id));
  assert.equal(resolved.ok,true);
  assert.equal(resolved.enemy.enemyId,Number(id));
  assert.equal(resolved.enemy.tempNo,row.tempNo);
  assert.equal(resolved.template.name,row.name);
  assert.equal(resolved.template.imageNumber,row.imageNumber);
  assert.equal(resolved.template.initNum,row.initNum);
  assert.equal(resolved.template.lvUpPoint,row.lvUpPoint);
  assert.equal(resolved.enemy.petFlg,1);
}

const rolls=[];
const pet=createSourceNewPlayerPet(catalog,341,{randInclusive:(a,b)=>{
  rolls.push([a,b]);
  if(rolls.length===1)return 1;
  if(rolls.length<=5)return 4;
  if(rolls.length<=15)return 0;
  return 1;
}});
assert.equal(pet.ok,true);
assert.equal(pet.level,1);
assert.equal(pet.petId,274);
assert.equal(pet.enemyId,341);
assert.equal(pet.name,'朵拉比斯');
assert.equal(pet.rngCalls,16);
assert.equal(pet.sourceBaseStats.multiplier,23);
assert.deepEqual(pet.sourceBaseStats.randomized,{vital:26,str:33,tgh:22,dex:32});
assert.deepEqual(pet.sourceBaseStats.allocationCounts,{vital:10,str:0,tgh:0,dex:0});
assert.deepEqual(pet.stats,{vital:828,str:759,tgh:506,dex:736});
assert.equal(pet.petMailEffect,1);

const state={pets:{petBox:[],team:[],activePetId:null}};
const handler=createSourcePetGetPetHandler({
  catalog,
  idFactory:(st,created)=>'new-pet-'+created.petId,
  randInclusive:(a,b)=>b
});
const handled=handler(state,{petId:341});
assert.equal(handled.ok,true);
assert.equal(state.pets.petBox.length,1);
assert.equal(state.pets.petBox[0].id,'new-pet-274');
assert.equal(state.pets.petBox[0].enemyId,341);
assert.equal(state.pets.petBox[0].petId,274);

const second=handler(state,{petId:2057});
assert.equal(second.ok,true);
assert.equal(state.pets.petBox.length,2);

const full={pets:{petBox:[{id:'1'},{id:'2'},{id:'3'},{id:'4'},{id:'5'}],team:[],activePetId:null}};
const fullHandled=handler(full,{petId:341});
assert.equal(fullHandled.ok,false);
assert.equal(fullHandled.reason,'pet-box-full');

const noFactory=handlerForTest(catalog,state);
assert.equal(noFactory.ok,false);
assert.equal(noFactory.reason,'pet-canonical-id-factory-required');

function handlerForTest(catalog,state){
  return createSourcePetGetPetHandler({catalog})(state,{petId:341});
}

console.log(JSON.stringify({
  pass:true,
  format:NEW_PLAYER_PET_RUNTIME_FORMAT,
  requestedEnemyIds:catalog.stats.requestedEnemyIds,
  resolvedEnemyIds:catalog.stats.resolvedEnemyIds,
  rngCallsPerPet:16,
  samplePet:{enemyId:341,petId:pet.petId,name:pet.name},
  canonicalPetIdsExplicit:true,
  petCapacity:PET_MAX_HAVE
}));
