import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

const row=runtime.byId['211'];
assert.equal(row?.f,'PETSKILL_StealMoney');
assert.equal(row?.o,'');
assert.equal(Number(row?.target),7);
assert.equal(Number(row?.field),1);
assert.equal(Number(row?.illegal),0);

const fnStart=game.indexOf('function sourcePerformPetStealMoneySkill');
const stealStart=game.indexOf('function sourcePerformPetStealSkill',fnStart);
assert.ok(fnStart>=0&&stealStart>fnStart);
const fn=game.slice(fnStart,stealStart);

assert.ok(fn.includes('sourcePetEnemyTargetFromAction(action)'));
assert.ok(fn.includes('const maxGold=sourcePlayerMaxGold(state)'));

// CHAR_TYPEENEMY starts at per=5, but owner max-gold hard-forces per=0.
assert.ok(fn.includes('let per=5'));
assert.ok(fn.includes('const ownerGoldFull=goldBefore>=maxGold'));
assert.ok(fn.includes('if(ownerGoldFull)per=0'));

// First RAND is unconditional; strict <5 means effective success rolls 1..4.
assert.ok(fn.includes('const roll=cRand(1,100)'));
assert.ok(fn.includes('const success=roll<per'));

// Enemy-target success creates new stone via RAND(10,100), never subtracts Enemy GOLD.
assert.ok(fn.includes('goldRoll=cRand(10,100)'));
assert.ok(fn.includes('gained=Math.min(goldRoll,Math.max(0,maxGold-goldBefore))'));
assert.ok(fn.includes('state.gold=goldBefore+gained'));
assert.ok(fn.includes('sourceEnemyGoldUntouched:true'));

// Gold RNG is inside success branch only.
assert.ok(fn.indexOf('if(success)')<fn.indexOf('goldRoll=cRand(10,100)'));

// Successful PET attacker always leaves; failed one stays.
assert.ok(fn.includes('battlePetOutIds.add(pet.id)'));
assert.ok(fn.includes('if(state.activePetId===pet.id)state.activePetId=null'));
assert.ok(fn.includes('attackerExited:success'));
assert.ok(fn.includes('sourceDefaultPetCleared:success'));

assert.ok(fn.includes('sourceNoDamage:true'));
assert.ok(fn.includes('sourceNoCounter:true'));
assert.equal(fn.includes('resolvePetEnemyCounterChain'),false);

const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
assert.ok(loyal.includes("meta?.f==='PETSKILL_StealMoney'"));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_StealMoney'")<loyal.indexOf('sourceRuntimePending:true'));

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.98',
  focus:'player-randomact-stealmoney-enemy-per5-generated-gold-and-pet-exit',
  skills:[211]
}));
