import assert from 'node:assert/strict';
import { commitBattleCompliance } from '../src/stoneage_browser_battle_compliance_commit_runtime.mjs';

const state={
  revision:8,
  player:{id:'p1',stats:{vital:5,str:5,tgh:5,dex:5},hp:27,maxHp:25,mp:10,maxMp:50},
  pets:{petBox:[{id:'pet-1',stats:{vital:208,str:313,tgh:414,dex:509},hp:12,maxHp:18,mp:4,maxMp:20}]},
  runtimeMeta:{}
};

const plan={
  ok:true,stage:'battle-compliance-plan-ready',format:'stoneage-v419-browser-battle-compliance-plan-v1',
  characters:[
    {kind:'player',characterId:'p1',statsBefore:{vital:5,str:5,tgh:5,dex:5},derived:{maxHp:30}},
    {kind:'pet',petId:'pet-1',statsBefore:{vital:208,str:313,tgh:414,dex:509},derived:{maxHp:20}}
  ]
};

const committed=commitBattleCompliance(state,plan,{transactionId:'battle-v420-1',expectedRevision:8,now:()=> '2026-10-01T12:00:00+08:00'});
assert.equal(committed.ok,true);
assert.equal(committed.applied,true);
assert.equal(committed.revisionBefore,8);
assert.equal(committed.revisionAfter,9);
assert.equal(committed.state.player.maxHp,30);
assert.equal(committed.state.player.hp,27);
assert.equal(committed.state.player.mp,10);
assert.equal(committed.state.pets.petBox[0].maxHp,20);
assert.equal(committed.state.pets.petBox[0].hp,12);
assert.equal(committed.maxMpDeferred,true);
assert.equal(committed.specialComplianceDeferred,true);

const retry=commitBattleCompliance(committed.state,plan,{transactionId:'battle-v420-1',expectedRevision:8,now:()=> '2026-10-01T12:00:00+08:00'});
assert.equal(retry.ok,true);
assert.equal(retry.idempotent,true);
assert.equal(retry.applied,false);
assert.equal(retry.state.revision,9);

const stale=commitBattleCompliance({...state,player:{...state.player,stats:{...state.player.stats,vital:6}}},plan,{transactionId:'battle-v420-stale',expectedRevision:8});
assert.equal(stale.ok,false);
assert.equal(stale.reason,'player-stats-stale-plan');

const missing=commitBattleCompliance({...state,pets:{petBox:[]}},plan,{transactionId:'battle-v420-missing',expectedRevision:8});
assert.equal(missing.ok,false);
assert.equal(missing.reason,'persistent-pet-missing');

console.log('V4.20 Browser Battle compliance commit regression: PASS');
