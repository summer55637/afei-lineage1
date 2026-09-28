import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

for(const [id,opt] of [['130',''],['607','60']]){
  const row=runtime.byId[id];
  assert.equal(row?.f,'PETSKILL_Abduct');
  assert.equal(row?.o,opt);
  assert.equal(Number(row?.target),7);
  assert.equal(Number(row?.field),1);
  assert.equal(Number(row?.illegal),0);
}

const abductStart=game.indexOf('function sourcePerformPetAbductSkill');
const roarStart=game.indexOf('function sourcePerformPetRoarSkill',abductStart);
assert.ok(abductStart>=0&&roarStart>abductStart);
const abduct=game.slice(abductStart,roarStart);

assert.ok(abduct.includes('sourcePetEnemyTargetFromAction(action)'));
assert.ok(abduct.includes('const aiPer=Math.max(0,sourceCAtoi(meta?.o))'));
// Enemy targets never use _BATTLE_ABDUCTII FIXAI/AiPer shortcut.
assert.ok(abduct.includes('const per=Math.max(Math.trunc((defLevel-attackLevel)*.6+30),50)'));
assert.ok(abduct.includes('const roll=cRand(1,100)'));
assert.ok(abduct.includes('const success=roll<per'));
assert.ok(abduct.includes("sourceTargetType:'CHAR_TYPEENEMY'"));
assert.ok(abduct.includes('sourceAiPerIgnoredForEnemy:true'));

// PET attacker always exits whether target removal succeeds or fails.
assert.ok(abduct.includes('battlePetOutIds.add(pet.id)'));
assert.ok(abduct.includes('if(state.activePetId===pet.id)state.activePetId=null'));
assert.ok(abduct.includes('attackerExited:true'));
assert.ok(abduct.indexOf('battlePetOutIds.add(pet.id)')<abduct.indexOf('if(success)'));

// Successful CHAR_TYPEENEMY Abduct is direct BATTLE_Exit, never kill credit.
assert.ok(abduct.includes("targetExit=finishEnemyDirectExit(target,label+'帶離')"));
assert.ok(abduct.includes('sourceNoKillReward:success'));
assert.equal(abduct.includes('sourceMarkEnemyDeathCredit'),false);
assert.equal(abduct.includes('sourceProcessBattleDeathsAtAddProfit'),false);
assert.equal(abduct.includes('resolvePetEnemyCounterChain'),false);
assert.ok(abduct.includes('sourceNoDamage:true'));
assert.ok(abduct.includes('sourceNoCounter:true'));

// Full battle teardown scans all owned pets, so clearing active/default Pet before
// finishEnemyDirectExit(last enemy) does not skip HP finalization.
const finalizeStart=game.indexOf('function sourceFinalizeOwnedPetsBattleExit');
const clearStart=game.indexOf('function clearEnemyBattleNoReward',finalizeStart);
const finalize=game.slice(finalizeStart,clearStart);
assert.ok(finalize.includes('for(const pet of state.petBox)'));
assert.ok(finalize.includes('syncPetBattleHp(pet,true)'));

const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
assert.ok(loyal.includes("meta?.f==='PETSKILL_Abduct'"));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_Abduct'")<loyal.indexOf('sourceRuntimePending:true'));

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.96',
  focus:'player-randomact-abduct-enemy-level-formula-and-dual-exit-lifecycle',
  skills:[130,607]
}));
