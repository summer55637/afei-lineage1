import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

// StatusSeq -> AttackCount -> command execution order must stay intact for Player confusion.
const turnStart=game.indexOf('function attackTurn()');
const turnEnd=game.indexOf('function guardTurn()',turnStart);
assert.ok(turnStart>=0&&turnEnd>turnStart);
const turn=game.slice(turnStart,turnEnd);
const statusAt=turn.indexOf('const statusTurn=processBattleStatusTurn(actor);');
const attackCountAt=turn.indexOf("if(actor.kind==='player')sourcePlayerPrimeExecutionAttackCount(actor);");
const confusionAt=turn.indexOf('performConfusionAttack(actor,statusTurn');
assert.ok(statusAt>=0&&attackCountAt>statusAt&&confusionAt>attackCountAt);

// V1.75 removes V1.74's ranged-confusion fail-closed boundary.
assert.ok(!game.includes('sourceRangedFailClosed:true'));
assert.ok(game.includes("if(attackerDesc.kind==='player'&&attackerView.throwWeapon){"));
assert.ok(game.includes('return sourcePerformPlayerRangedConfusionAttack(actor,pick,options)||true;'));

// Cross-side battle-slot resolver must accept modeled Player / Pet / Enemy slots,
// while still respecting hidden Pet / Enemy states.
for(const needle of [
  'function sourcePlayerConfusionTargetableFromBattleSlot(slot)',
  'const desc=sourceBattleStatusDescFromSlot(slot);',
  "if(desc.kind==='pet'&&sourcePlayerPetHidden(desc.pet))return null;",
  "if(desc.kind==='enemy'&&enemyUnitHidden(desc.unit))return null;"
])assert.ok(game.includes(needle),'missing confusion slot lifecycle '+needle);

// Guard state on a same-side Pet is still honored unless that Pet is itself confused.
assert.ok(game.includes("if(targetDesc?.kind==='pet')return sourcePlayerPetGuardAdjust(targetDesc.pet);"));

// BOW: valid raw COM2 consumes exactly one TargetListSet RAND(0,1);
// raw COM2=-1 must return the invalid plan before that RAND is reached.
const bowListStart=game.indexOf('function sourceBowTargetListFromBattleSlots');
const bowListEnd=game.indexOf('function sourceBowTargetList(',bowListStart);
assert.ok(bowListStart>=0&&bowListEnd>bowListStart);
const bowList=game.slice(bowListStart,bowListEnd);
assert.ok(bowList.indexOf("return {defNo:sourceDefNo,random:null") < bowList.indexOf('const random=cRand(0,1);'));

const bowStart=game.indexOf('function sourcePerformPlayerConfusionBowAttack');
const bowEnd=game.indexOf('function sourcePerformPlayerConfusionBoomerangAttack',bowStart);
assert.ok(bowStart>=0&&bowEnd>bowStart);
const bow=game.slice(bowStart,bowEnd);
assert.ok(bow.includes("const rawSlot=pick?.fallback?-1:sourceBattleStatusSlot(pick?.target);"));
assert.ok(bow.includes("sourceLoopExit:'raw-com2-invalid'"));
assert.ok(bow.includes('const targetDesc=sourcePlayerConfusionTargetableFromBattleSlot(slot);'));

// For a Player at slot 0 confused into own Pet slot 5, aBowW interleaves row 5 with row 0.
// The self slot 0 becomes -1, so the common loop stops immediately after the Pet segment.
const bowW=[
  0,2,1,4,3, 0,1,2,3,4,
  1,0,3,2,4, 1,3,0,2,4,
  2,4,0,1,3, 2,0,4,1,3,
  3,1,0,2,4, 3,1,0,2,4,
  4,2,0,1,3, 4,2,0,1,3
];
function bowOrder(defNo,random,attackNo=0){
  const defsub=defNo%5,deftop=defNo-defsub,out=[];
  for(let j=0;j<5;j++){
    let first=bowW[defsub*10+random*5+j]+deftop;
    let second=(deftop===0||deftop===10)?first+5:first-5;
    if(first===attackNo)first=-1;
    if(second===attackNo)second=-1;
    out.push(first,second);
  }
  return out;
}
assert.deepEqual(bowOrder(5,0),[5,-1,7,2,6,1,9,4,8,3]);
assert.deepEqual(bowOrder(5,1),[5,-1,6,1,7,2,8,3,9,4]);

// BOOMERANG: AttackNum was already consumed but remains unused by this dedicated case.
// COM2=-1 performs DefaultAttacker; Player side 0 traverses the chosen row forward.
const boomStart=game.indexOf('function sourcePerformPlayerConfusionBoomerangAttack');
const boomEnd=game.indexOf('function sourcePerformPlayerConfusionThrowAttack',boomStart);
assert.ok(boomStart>=0&&boomEnd>boomStart);
const boom=game.slice(boomStart,boomEnd);
assert.ok(boom.includes('fallbackTarget=sourcePlayerConfusionDefaultAttackerDesc();'));
assert.ok(boom.includes('if(row===attackerRow)'));
assert.ok(boom.includes('const order=SOURCE_BOOMERANG_VS_TBL[row].slice();'));
assert.ok(boom.includes('{damageMultiplier:.3}'));
assert.ok(!boom.includes('sourceAttackMax'),'confusion boomerang must ignore primed AttackNum value');

// BOUNDTHROW / BREAKTHROW: a valid raw COM2 is retried every segment.
// A raw -1 only gets the first TargetAdjust fallback because aDefList[++k] is already sentinel -1.
const thrStart=game.indexOf('function sourcePerformPlayerConfusionThrowAttack');
const thrEnd=game.indexOf('function sourcePerformPlayerRangedConfusionAttack',thrStart);
assert.ok(thrStart>=0&&thrEnd>thrStart);
const thr=game.slice(thrStart,thrEnd);
assert.ok(thr.includes("const rawSlot=pick?.fallback?-1:sourceBattleStatusSlot(pick?.target);"));
assert.ok(thr.includes('if(!targetDesc)targetDesc=sourcePlayerConfusionDefaultAttackerDesc();'));
assert.ok(thr.includes("if(rawSlot<0){"));
assert.ok(thr.includes("sourceLoopExit='target-list-end';"));

// BREAKTHROW source order remains WakeUp/damage -> paralysis -> ItemCrush -> AddProfit.
const applyStart=game.indexOf('function sourceApplyPlayerConfusionRangedHit');
const applyEnd=game.indexOf('function sourcePerformPlayerConfusionBowAttack',applyStart);
assert.ok(applyStart>=0&&applyEnd>applyStart);
const apply=game.slice(applyStart,applyEnd);
const paralysisAt=apply.indexOf('sourcePlayerBreakthrowParalysisDesc(resolvedTarget,r)');
const crushAt=apply.indexOf('sourceBattleFinalizeItemCrushRng(r)');
const profitAt=apply.indexOf('sourceProcessBattleDeathsAtAddProfit()');
assert.ok(paralysisAt>=0&&crushAt>paralysisAt&&profitAt>crushAt);
assert.ok(game.includes('deferItemCrush=false,deferAddProfit=false'));
assert.ok(game.includes('if(!deferItemCrush)sourceBattleFinalizeItemCrushRng(r);'));
assert.ok(game.includes('if(!deferAddProfit)sourceProcessBattleDeathsAtAddProfit();'));

// Dispatcher covers all four source indirect weapon types.
const dispatchStart=game.indexOf('function sourcePerformPlayerRangedConfusionAttack');
const dispatchEnd=game.indexOf('function sourcePerformPlayerBowWeaponAttack',dispatchStart);
assert.ok(dispatchStart>=0&&dispatchEnd>dispatchStart);
const dispatch=game.slice(dispatchStart,dispatchEnd);
assert.ok(dispatch.includes('if(weaponType===4)return sourcePerformPlayerConfusionBowAttack'));
assert.ok(dispatch.includes('if(weaponType===17)return sourcePerformPlayerConfusionBoomerangAttack'));
assert.ok(dispatch.includes('if(weaponType===18||weaponType===19)'));

assert.ok(/PLAYABLE CORE V1\.(?:75|76)/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.75',
  focus:'player-ranged-confusion-cross-side',
  bowOwnPetOrders:[bowOrder(5,0),bowOrder(5,1)]
}));
