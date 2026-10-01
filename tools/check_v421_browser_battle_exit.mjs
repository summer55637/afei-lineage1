import assert from 'node:assert/strict';
import { planBattleExit } from '../src/stoneage_browser_battle_exit_runtime.mjs';
const context={context:{mode:'finish',sourceMode:3,winnerSide:0}};
const state={pets:{petBox:[
  {id:'dead',hp:0,maxHp:20,mailMode:0},
  {id:'alive',hp:7,maxHp:20,mailMode:0},
  {id:'mail',hp:0,maxHp:20,mailMode:1},
  {id:'all-owned',hp:-3,maxHp:20,mailMode:0}
]}};
const denied=planBattleExit(context,state);
assert.equal(denied.ok,false);
assert.equal(denied.reason,'settlement-complete-flag-required');
const missingMail=planBattleExit(context,{pets:{petBox:[{id:'unknown',hp:0,maxHp:20}]}},{settlementComplete:true});
assert.equal(missingMail.ok,false);
assert.equal(missingMail.reason,'pet-mail-mode-required');

const plan=planBattleExit(context,state,{settlementComplete:true});
assert.equal(plan.ok,true);
assert.deepEqual(plan.pets,[{petId:'dead',hpBefore:0,hpAfter:1,mailMode:0},{petId:'all-owned',hpBefore:-3,hpAfter:1,mailMode:0}]);
assert.equal(plan.activePetIdPreserved,true);
assert.equal(plan.persistentStateMutation,false);
console.log('V4.21 Browser Battle exit plan regression: PASS');
