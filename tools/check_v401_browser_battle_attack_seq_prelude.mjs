#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  BATTLE_COM_GUARD,
  CHAR_BATTLEFLG_GUARDIAN,
  criticalCheck,
  duckCheck,
  guardianCheck,
  runAttackSeqPrelude
} from '../src/stoneage_browser_battle_attack_seq_prelude_runtime.mjs';

const e=(bid,type,fixDex,overrides={})=>({
  bid,
  battleSlot:bid%10,
  battleSide:bid>=10?1:0,
  sourceType:type,
  characterId:'c'+bid,
  sourceBattleCharMode:3,
  battleMode:'c_ok',
  battleFlg:0,
  battleCommands:[1,-1,-1],
  hp:100,
  fixDex,
  fixLuck:type==='player'?0:0,
  guardian:-1,
  isAttacked:1,
  ...overrides
});

const context={
  format:'stoneage-browser-battle-context-runtime-v1',
  context:{
    mode:'battle',
    sourceMode:2,
    type:1,
    sides:[
      {side:0,type:0,entries:Array(10).fill(null)},
      {side:1,type:1,entries:Array(10).fill(null)}
    ]
  }
};
context.context.sides[0].entries[0]=e(0,'player',30);
context.context.sides[1].entries[0]=e(10,'enemy',20);

let duck=duckCheck(
  context.context.sides[0].entries[0],
  context.context.sides[1].entries[0],
  {duckRoll:1200}
);
assert.equal(duck.ok,true,JSON.stringify(duck));
assert.equal(duck.per,1200);
assert.equal(duck.dodged,true);
duck=duckCheck(
  context.context.sides[0].entries[0],
  context.context.sides[1].entries[0],
  {duckRoll:1201}
);
assert.equal(duck.dodged,false);

let cri=criticalCheck(
  context.context.sides[0].entries[0],
  context.context.sides[1].entries[0],
  {criticalRoll:1414}
);
assert.equal(cri.ok,true,JSON.stringify(cri));
assert.equal(cri.critical,true);
cri=criticalCheck(
  context.context.sides[0].entries[0],
  context.context.sides[1].entries[0],
  {criticalRoll:1415}
);
assert.equal(cri.critical,false);

let result=runAttackSeqPrelude(context,{
  attackerBid:0,
  targetBid:10,
  duckRoll:1201,
  criticalRoll:1415
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.stage,'attack-seq-prelude-ready');
assert.equal(result.finalTargetBid,10);
assert.equal(result.targetWasGuarded,false);
assert.equal(result.outcome,'normal');
assert.deepEqual(result.sourceOrder,[
  'BATTLE_DuckCheck',
  'BATTLE_GuardianCheck',
  'BATTLE_CriticalCheck'
]);
assert.equal(result.damageExecuted,false);
assert.equal(result.persistentMutation,false);

const guarded=structuredClone(context);
guarded.context.sides[1].entries[0]=e(10,'enemy',20,{guardian:12});
guarded.context.sides[1].entries[2]=e(12,'enemy',15,{
  battleFlg:CHAR_BATTLEFLG_GUARDIAN
});
result=runAttackSeqPrelude(guarded,{
  attackerBid:0,
  targetBid:10,
  duckRoll:3001,
  criticalRoll:1415
});
assert.equal(result.ok,true,JSON.stringify(result));
assert.equal(result.finalTargetBid,12);
assert.equal(result.targetWasGuarded,true);
assert.equal(result.guardian.guardianBid,12);
assert.equal(result.critical.dfDex,9);

const guardBlocked=structuredClone(guarded);
guardBlocked.context.sides[1].entries[2].battleFlg=0;
const g=guardianCheck(guardBlocked,0,10,{throwWeapon:false});
assert.equal(g.guardianBid,-1);
assert.equal(g.reason,'guardian-flag-missing');

const guardThrow=guardianCheck(guarded,0,10,{throwWeapon:true});
assert.equal(guardThrow.guardianBid,-1);
assert.equal(guardThrow.reason,'throw-weapon');

const defenderGuard=structuredClone(context);
defenderGuard.context.sides[1].entries[0].battleCommands[0]=BATTLE_COM_GUARD;
duck=duckCheck(
  defenderGuard.context.sides[0].entries[0],
  defenderGuard.context.sides[1].entries[0],
  {}
);
assert.equal(duck.ok,true);
assert.equal(duck.rollRequired,false);
assert.equal(duck.rngConsumed,false);
assert.equal(duck.dodged,false);

const missingDex=structuredClone(context);
delete missingDex.context.sides[1].entries[0].fixDex;
delete missingDex.context.sides[1].entries[0].quick;
result=runAttackSeqPrelude(missingDex,{
  attackerBid:0,
  targetBid:10,
  duckRoll:1,
  criticalRoll:1
});
assert.equal(result.ok,false);
assert.equal(result.reason,'fix-dex-required-for-duck');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v401-browser-battle-attack-seq-prelude-v1',
  sourceOrder:['BATTLE_DuckCheck','BATTLE_GuardianCheck','BATTLE_CriticalCheck'],
  duck:{per:1200,rollHit:1200,rollMiss:1201},
  critical:{rollHit:1414,rollMiss:1415,strictLessThan:true},
  guardianReplacement:{requested:10,final:12},
  guardianThrowWeaponExcluded:true,
  guardSkipsDuckRng:true,
  fixDexMissingFailsClosed:true,
  damageExecuted:false,
  persistentMutation:false
},null,2));
