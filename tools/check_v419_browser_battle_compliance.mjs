import assert from 'node:assert/strict';
import {
  derivePlayerCompliance,
  derivePetCompliance,
  planBattleCompliance
} from '../src/stoneage_browser_battle_compliance_runtime.mjs';

const state={
  revision:8,
  player:{id:'p1',level:5,stats:{vital:5,str:5,tgh:5,dex:5}},
  pets:{petBox:[{
    id:'pet-1',
    level:5,
    stats:{vital:208,str:313,tgh:414,dex:509},
    serverStats:{vital:208,str:313,tgh:414,dex:509},
    serverProgression:true
  }]}
};

const player=derivePlayerCompliance(state.player.stats);
assert.equal(player.ok,true);
assert.equal(player.derived.attackPower,6.25);
assert.equal(player.derived.defencePower,6.25);
assert.equal(player.derived.quick,5);
assert.equal(player.derived.maxHp,30);
assert.equal(player.derived.maxMp,null);

const pet=derivePetCompliance(state.pets.petBox[0].stats);
assert.equal(pet.ok,true);
assert.equal(pet.derived.attackPower,4);
assert.equal(pet.derived.defencePower,4);
assert.equal(pet.derived.quick,5);
assert.equal(pet.derived.maxHp,20);
assert.equal(pet.derived.maxMp,null);

const before=JSON.stringify(state);
const planned=planBattleCompliance(state);
assert.equal(planned.ok,true);
assert.equal(planned.stage,'battle-compliance-plan-ready');
assert.equal(planned.characters.length,2);
assert.equal(planned.characters[0].kind,'player');
assert.equal(planned.characters[1].kind,'pet');
assert.equal(planned.characters[1].derived.maxHp,20);
assert.equal(planned.persistentStateMutation,false);
assert.equal(planned.nextBoundary,'BATTLE_COMPLIANCE_COMMIT');
assert.equal(JSON.stringify(state),before);

const legacy={...state,pets:{petBox:[{id:'legacy',level:1}]}};
const fail=planBattleCompliance(legacy);
assert.equal(fail.ok,false);
assert.equal(fail.reason,'pet-compliance-source-required');

console.log('V4.19 Browser Battle compliance plan regression: PASS');
