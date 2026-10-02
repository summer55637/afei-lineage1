#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  buildBattleContext,
  validateBattleContext
} from '../src/stoneage_browser_battle_context_runtime.mjs';
import { commitBattleFinish } from '../src/stoneage_browser_battle_finish_commit_runtime.mjs';

const base=buildBattleContext({
  player:{
    id:'hook-test',
    name:'HookTest',
    level:1,
    hp:100,
    maxHp:100,
    mp:20,
    maxMp:20,
    luck:0,
    stats:{vital:10,str:10,tgh:10,dex:10}
  },
  team:[{enemyId:1,size:1,createMaxNum:1,enemy:{tempNo:1}}],
  encounter:{encounterId:1,floorId:100,x:610,y:538},
  groupId:94,
  battleFieldNo:0
});
assert.equal(base.ok,true,JSON.stringify(base));
base.context.mode='battle';
base.context.sourceMode=2;
assert.equal(validateBattleContext(base).ok,true,JSON.stringify(validateBattleContext(base)));
assert.equal(base.context.finishHookProfile.profile,'ordinary-world-encounter');
assert.equal(base.context.finishHookProfile.winFuncInjected,false);
assert.equal(base.context.finishHookProfile.pkFuncInjected,false);
assert.equal(base.context.finishHookProfile.dantai,false);
assert.equal(base.context.finishHookProfile.linkedBattleCount,0);

const finishPlan={ok:true,finished:true,winnerSide:0,finishReason:'enemy-side-empty'};

const special={
  ...base,
  context:{
    ...base.context,
    finishHookProfile:{
      ...base.context.finishHookProfile,
      winFuncInjected:true
    }
  }
};
const blocked=commitBattleFinish(special,{finishPlan,settlementStartRevision:0});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'finish-hook-special-branch-deferred');

const missing=commitBattleFinish({
  ...base,
  context:{...base.context,finishHookProfile:undefined}
},{finishPlan,settlementStartRevision:0});
assert.equal(missing.ok,false);
assert.equal(missing.reason,'finish-hook-profile-required');

const done=commitBattleFinish(base,{finishPlan,settlementStartRevision:0});
assert.equal(done.ok,true,JSON.stringify(done));
assert.equal(done.battleContext.context.finishHookProfile.profile,'ordinary-world-encounter');

console.log('Battle Finish hook profile runtime regression: PASS');
