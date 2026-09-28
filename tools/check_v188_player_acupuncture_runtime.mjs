import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

const row=runtime.byId['622'];
assert.equal(row?.f,'PETSKILL_Acupuncture');
assert.equal(row?.o,'');
assert.equal(Number(row?.target),0);
assert.equal(Number(row?.illegal),0);

// Battle-local Pet flag exists and is reset with battle state.
assert.ok(game.includes('battlePetAcupunctureIds=new Set()'));
const resetStart=game.indexOf('function resetBattleStatuses');
const resetEnd=game.indexOf('function sourceEnemySkipsPreCommandCompliance',resetStart);
const reset=game.slice(resetStart,resetEnd);
assert.ok(reset.includes('battlePetAcupunctureIds=new Set()'));

// Shared DamageReact now supports Enemy or player Pet defenders.
const prepStart=game.indexOf('function sourcePrepareAcupunctureReaction');
const finishStart=game.indexOf('function sourceFinishAcupunctureReaction',prepStart);
const logStart=game.indexOf('function sourceLogAcupunctureReaction',finishStart);
assert.ok(prepStart>=0&&finishStart>prepStart&&logStart>finishStart);
const prep=game.slice(prepStart,finishStart);
const finish=game.slice(finishStart,logStart);
assert.ok(prep.includes("const pet=targetDesc?.kind==='pet'?targetDesc.pet:null"));
assert.ok(prep.includes('battlePetAcupunctureIds.has(pet.id)'));
assert.ok(prep.includes('if(attackerView?.throwWeapon)'));
assert.ok(prep.indexOf('if(attackerView?.throwWeapon)')<prep.indexOf('r.damage=fullDamage'));
assert.ok(prep.includes('if(fullDamage%2!==0)fullDamage+=1'));
assert.ok(prep.includes('const reflectedDamage=Math.trunc(fullDamage/2)'));
assert.ok(finish.includes('battlePetAcupunctureIds.delete(targetPet.id)'));
assert.ok(finish.includes('battleStatusSetHp(attackerDesc,beforeAttacker-reflectedDamage)'));
assert.ok(finish.includes("attackerDesc?.kind==='enemy'"));
assert.ok(finish.includes('sourceMarkEnemyDeathCredit(attackerDesc.unit,[targetDesc])'));

// Player RANDOMACT sets WORKACUPUNCTURE-equivalent flag, then falls through to common physical attack.
const handlerStart=game.indexOf('function sourcePerformPetAcupunctureSkill');
const hectorStart=game.indexOf('function sourcePerformPetHectorParalysis',handlerStart);
assert.ok(handlerStart>=0&&hectorStart>handlerStart);
const handler=game.slice(handlerStart,hectorStart);
assert.ok(handler.includes('battlePetAcupunctureIds.add(pet.id)'));
assert.ok(handler.indexOf('battlePetAcupunctureIds.add(pet.id)')<handler.indexOf('sourcePetEnemyTargetFromAction(action)'));
assert.ok(handler.includes('resolveAttackToEnemyWithGuardian'));
assert.ok(handler.includes("resolvePetEnemyCounterChain('pet',pet,target,r)"));
assert.equal(handler.includes('battlePetAcupunctureIds.delete'),false);

// Enemy ranged weapon -> Pet uses shared physical DamageSub and leaves ItemCrush/AddProfit to caller.
const weaponStart=game.indexOf('function enemyWeaponApplyHit');
const bowStart=game.indexOf('function sourceBreakthrowParalysis',weaponStart);
const weapon=game.slice(weaponStart,bowStart);
assert.ok(weapon.includes("battleApplyPhysicalHit("));
assert.ok(weapon.includes("{deferItemCrush:true,deferAddProfit:true}"));

// Plain Enemy attack -> Pet and Guardian Pet both use shared physical DamageSub.
const primaryStart=game.indexOf('function performEnemyPrimaryAttack');
const skillNumberStart=game.indexOf('function enemySkillNumber',primaryStart);
const primary=game.slice(primaryStart,skillNumberStart);
assert.ok(primary.includes("{kind:'enemy',unit,unitId:unit.id},targetDesc,r"));
assert.ok(primary.includes("{kind:'pet',pet,petId:pet.id},r"));
assert.ok(primary.includes("{deferAddProfit:true}"));

// Shared Enemy skill -> Pet explicitly performs prepare/finish so skill-specific caller retains ItemCrush order.
const skillHitStart=game.indexOf('function enemyApplySkillHit');
const chargeStart=game.indexOf('function enemyChargeSpec',skillHitStart);
const skillHit=game.slice(skillHitStart,chargeStart);
assert.ok(skillHit.includes('sourcePrepareAcupunctureReaction('));
assert.ok(skillHit.includes('sourceFinishAcupunctureReaction(acupuncture)'));
assert.ok(skillHit.includes('sourceLogAcupunctureReaction(acupuncture)'));

// Enemy Counter -> Pet uses counter=true so wake-up follows BATTLE_Counter's reflected-attacker path.
const counterStart=game.indexOf('function resolvePetEnemyCounterChain');
const resolveAttackStart=game.indexOf('function resolveAttackToEnemyWithGuardian',counterStart);
const counter=game.slice(counterStart,resolveAttackStart);
assert.ok(counter.includes('{counter:true,deferAddProfit:true}'));

// Combo already routes every reacting segment through sourcePrepareAcupunctureReaction;
// generalized Pet support therefore covers Combo without a second implementation.
const comboStart=game.indexOf('function sourceComboAcupunctureSegment');
const comboEnd=game.indexOf('function sourcePerformCombo',comboStart);
const combo=game.slice(comboStart,comboEnd);
assert.ok(combo.includes('sourcePrepareAcupunctureReaction(attackerDesc,target,r)'));
assert.ok(combo.includes('sourceFinishAcupunctureReaction(reaction)'));

// Dispatcher is live before pending fallback.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
assert.ok(loyal.includes("meta?.f==='PETSKILL_Acupuncture'"));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_Acupuncture'")<loyal.indexOf('sourceRuntimePending:true'));

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.88',
  focus:'player-randomact-acupuncture-damagereact-lifecycle',
  skill:622
}));
