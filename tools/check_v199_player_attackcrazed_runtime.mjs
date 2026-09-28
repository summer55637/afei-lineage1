import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

const row=runtime.byId['613'];
assert.equal(row?.f,'PETSKILL_AttackCrazed');
assert.equal(row?.o,'3');
assert.equal(Number(row?.target),1);
assert.equal(Number(row?.field),1);
assert.equal(Number(row?.illegal),0);

const fnStart=game.indexOf('function sourcePerformPetAttackCrazedSkill');
const attackShootStart=game.indexOf('function sourcePerformPetAttackShootSkill',fnStart);
const wildStart=game.indexOf('function sourcePerformPetWildViolentSkill',fnStart);
const nextStart=attackShootStart>fnStart?attackShootStart:wildStart;
assert.ok(fnStart>=0&&nextStart>fnStart);
const fn=game.slice(fnStart,nextStart);

// PETSKILL_AttackCrazed writes exact FIX multipliers and COM3-high attack count.
assert.ok(fn.includes('const count=Math.max(0,sourceCAtoi(meta?.o))'));
assert.ok(fn.includes('const attack=Math.trunc(baseAttack*.8)'));
assert.ok(fn.includes('const defense=Math.trunc(baseDefense*.7)'));
assert.ok(fn.includes('sourceAttackCrazed:true'));

// Unlike RENZOKU / ATTSHOOT / WILDVIOLENT, ATTCRAZED never writes gDamageDiv.
assert.equal(fn.includes('damageDivisor'),false);

// Fixed BATTLE_TargetListSet has i < deftop, so Enemy side pre-roll pool is slots 10..18.
// Web battleSlot is zero-based, therefore sourcePool must stop at slot 8.
assert.ok(fn.includes('slot>=0&&slot<9'));

// All target-list RNG is consumed before the first physical attack.
const preRoll=fn.indexOf('const roll=cRand(0,sourcePool.length-1)');
const firstAttack=fn.indexOf('resolveAttackToEnemyWithGuardian');
assert.ok(preRoll>=0&&firstAttack>preRoll);

// If the buggy 10..18 scan finds no entry, the source leaves the original COM2-filled list
// untouched and consumes no target-list RNG.
assert.ok(fn.includes('}else{\n    for(let i=0;i<count;i++)plannedTargets.push(originalTarget);'));
assert.ok(fn.includes('targetRolls.push(roll)'));

// Non-BOW first hit ignores plannedTargets[0] even though its RNG was consumed.
assert.ok(fn.includes('if(i===0)'));
assert.ok(fn.includes('target=sourcePetEnemyTargetFromAction(action)'));
assert.ok(fn.indexOf('target=sourcePetEnemyTargetFromAction(action)')>preRoll);

// Later dead/hidden planned entries use a fresh DefaultAttacker-equivalent RNG.
assert.ok(fn.includes('const raw=plannedTargets[i]'));
assert.ok(fn.includes('target=list.length?list[cRand(0,list.length-1)]:null'));

// AddProfit/death processing happens after each BATTLE_Attack, while Counter is only
// attempted once after the complete attack_max loop.
assert.ok(fn.includes('sourceProcessBattleDeathsAtAddProfit()'));
const loopStart=fn.indexOf('for(let i=0;i<count;i++){',preRoll+1);
const counterPos=fn.lastIndexOf("resolvePetEnemyCounterChain('pet',pet,lastActual,lastResult)");
assert.ok(loopStart>=0&&counterPos>loopStart);
assert.equal((fn.match(/resolvePetEnemyCounterChain/g)||[]).length,1);
assert.ok(fn.includes('sourceCounterReady=true'));

// Player-side RANDOMACT dispatch must be before the generic runtime-pending fallback.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
const dispatch=loyal.indexOf("meta?.f==='PETSKILL_AttackCrazed'");
const fallback=loyal.indexOf('sourceRuntimePending:true');
assert.ok(dispatch>=0&&fallback>dispatch);

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.99',
  focus:'player-randomact-attackcrazed-fixstr80-fixtough70-preroll-targetlist-no-damage-divisor',
  skills:[613]
}));
