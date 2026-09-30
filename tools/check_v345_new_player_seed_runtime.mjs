#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const seed=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_seed_runtime.json','utf8'));
const config=JSON.parse(fs.readFileSync('data/generated/stoneage_server_config_index.json','utf8'));
const flow=JSON.parse(fs.readFileSync('data/generated/stoneage_start_flow_index.json','utf8'));

assert.equal(seed.format,'stoneage-new-player-seed-runtime-v1');
assert.equal(seed.fixedSource.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.deepEqual(
  {transmigration:seed.sourceConfig.transmigration,level:seed.sourceConfig.level,petLevel:seed.sourceConfig.petLevel,gold:seed.sourceConfig.gold,item1:seed.sourceConfig.itemSlots.ITEM1},
  {transmigration:1,level:1,petLevel:1,gold:30000,item1:24114}
);
assert.equal(seed.sourceConfig.getterPetSlot0,-1);
assert.equal(seed.sourceConfig.itemSlots.ITEM2,null);
assert.equal(seed.sourceConfig.configuredPetSlots.PET1,null);
assert.equal(seed.starterItem.allocatorRequired,true);
assert.equal(seed.starterItem.itemTemplatePromoted,false);
assert.equal(seed.starterPet.sourceClosed,true);
assert.deepEqual(
  seed.starterPet.entries.map(p=>({hometown:p.hometown,enemyId:p.enemyId,tempNo:p.tempNo})),
  [{hometown:0,enemyId:1,tempNo:2},{hometown:1,enemyId:2,tempNo:112},{hometown:2,enemyId:3,tempNo:102},{hometown:3,enemyId:4,tempNo:34}]
);
assert.deepEqual(
  seed.hometowns.map(p=>({hometown:p.hometown,floor:p.floor,x:p.x,y:p.y})),
  [{hometown:0,floor:1006,x:15,y:22},{hometown:1,floor:2006,x:20,y:16},{hometown:2,floor:3006,x:21,y:16},{hometown:3,floor:4006,x:14,y:20}]
);
assert.equal(config.fixedSource.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
const keyIndex=Object.fromEntries((config.keyIndex??[]).map(x=>[x.key,x.value]));
assert.equal(keyIndex.TRANS,'1');
assert.equal(keyIndex.LV,'1');
assert.equal(keyIndex.PETLV,'1');
assert.equal(keyIndex.GOLD,'30000');
assert.equal(keyIndex.ITEM1,'24114');
assert.equal(flow.newPlayerPet.enabledBySourceFlag,true);
assert.equal(flow.newPlayerPet.rules.length,4);
assert.equal(seed.policy.noPlayableHtml,true);
console.log(JSON.stringify({pass:true,format:'stoneage-new-player-seed-closure-v1',seed:{transmigration:1,level:1,petLevel:1,gold:30000,item1:24114},starterPets:seed.starterPet.entries.map(p=>({hometown:p.hometown,enemyId:p.enemyId,tempNo:p.tempNo})),itemTemplatePromoted:false}));
