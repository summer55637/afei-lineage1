import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

const row=runtime.byId['140'];
assert.equal(row?.f,'PETSKILL_Steal');
assert.equal(row?.o,'');
assert.equal(Number(row?.target),7);
assert.equal(Number(row?.field),1);
assert.equal(Number(row?.illegal),0);

const playerStart=game.indexOf('function sourcePerformPetStealSkill');
const abductStart=game.indexOf('function sourcePerformPetAbductSkill',playerStart);
assert.ok(playerStart>=0&&abductStart>playerStart);
const player=game.slice(playerStart,abductStart);

// battle.c first runs TargetAdjust; no valid target means BATTLE_Steal is never entered.
assert.ok(player.includes('sourcePetEnemyTargetFromAction(action)'));

// CHAR_TYPEENEMY => per=0, but RAND(1,100) is still unconditionally consumed once.
assert.ok(player.includes('const per=0'));
assert.ok(player.includes('const roll=cRand(1,100)'));
assert.ok(player.includes('const success=roll<per'));
assert.equal((player.match(/cRand\(/g)||[]).length,1);
assert.ok(player.includes("sourceTargetType:'CHAR_TYPEENEMY'"));
assert.ok(player.includes('sourceFirstRollConsumed:true'));
assert.ok(player.includes('sourceNoSecondRoll:true'));
assert.ok(player.includes('sourceNoGoldMutation:true'));
assert.ok(player.includes('sourceNoItemMutation:true'));
assert.ok(player.includes('sourceAttackerStays:true'));
assert.ok(player.includes('sourceNoDamage:true'));
assert.ok(player.includes('sourceNoCounter:true'));
assert.equal(player.includes('finishEnemyDirectExit'),false);
assert.equal(player.includes('battlePetOutIds.add'),false);

const enemyStart=game.indexOf('function performEnemySteal');
const modelStart=game.indexOf('function enemyBattleModelSpec',enemyStart);
assert.ok(enemyStart>=0&&modelStart>enemyStart);
const enemy=game.slice(enemyStart,modelStart);

// Source success chance depends only on target CHAR type.
assert.ok(enemy.includes("const per=chosen.kind==='player'?50:0"));
assert.ok(enemy.includes('const successRoll=cRand(1,100)'));
assert.ok(enemy.indexOf('if(!(successRoll<per))')<enemy.indexOf('const modeRoll=cRand(1,100)'));

// Mode/item RNG are only reached after the successful first roll.
assert.ok(enemy.includes('const modeRoll=cRand(1,100)'));
assert.ok(enemy.includes('const percentRoll=cRand(8,12)'));
assert.ok(enemy.includes('const itemRoll=cRand(0,candidates.length-1)'));

// Fixed item theft scans only ItemBox/backpack existing indices, never equipment
// or aggregate-only inventory.
assert.ok(enemy.includes('for(let slotIndex=PLAYER_BACKPACK_START;slotIndex<PLAYER_ITEM_SLOT_COUNT;slotIndex++)'));
assert.ok(enemy.includes("existing.owner!=='player'"));
assert.ok(enemy.includes('slots[picked.slotIndex]=null'));
assert.ok(enemy.includes('sourceItemRuntimeFree(picked.itemIndex)'));
assert.equal(enemy.includes('battleStealableInventoryKeys()'),false);
assert.equal(enemy.includes('consumeItem(key,1)'),false);

// Only a TRUE final theft flag makes the Enemy attacker BATTLE_Exit.
assert.equal((enemy.match(/finishEnemyDirectExit\(unit,label\+'成功後離場'\)/g)||[]).length,2);
assert.ok(enemy.includes('attackerExited:true'));
assert.ok(enemy.includes('attackerExited:false'));

// Player dispatch must be ahead of runtime-pending fallback.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
assert.ok(loyal.includes("meta?.f==='PETSKILL_Steal'"));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_Steal'")<loyal.indexOf('sourceRuntimePending:true'));

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.97',
  focus:'player-randomact-steal-per-zero-rng-and-enemy-existing-item-exit-lifecycle',
  skills:[140]
}));
