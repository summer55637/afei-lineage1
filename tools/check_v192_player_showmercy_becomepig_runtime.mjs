import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

const show=runtime.byId['626'];
assert.equal(show?.f,'PETSKILL_ShowMercy');
assert.equal(show?.o,'');
assert.equal(Number(show?.target),1);
assert.equal(Number(show?.illegal),0);

const pig=runtime.byId['635'];
assert.equal(pig?.f,'PETSKILL_BecomePig');
assert.equal(pig?.o,'30 180 100388');
assert.equal(Number(pig?.target),7);
assert.equal(Number(pig?.illegal),0);

const contStart=game.indexOf('function sourcePetCommonAttackContFlg');
const seedStart=game.indexOf('function sourcePetCommonCounterResult',contStart);
const showStart=game.indexOf('function sourcePerformPetShowMercySkill',seedStart);
const pigStart=game.indexOf('function sourcePerformPetBecomePigSkill',showStart);
const foxStart=game.indexOf('function sourcePerformPetBecomeFoxSkill',pigStart);
assert.ok(contStart>=0&&seedStart>contStart&&showStart>seedStart&&pigStart>showStart&&foxStart>pigStart);

const cont=game.slice(contStart,seedStart);
assert.ok(cont.includes('battlePetAcupunctureIds.has(pet.id)'));
assert.ok(cont.includes('!!originalTarget?.acupunctureActive'));
assert.ok(cont.includes('!r?.critical&&!r?.guarded&&actualAlive'));
assert.ok(cont.includes('DODGE / MISS / ARRANGE do not by themselves clear iRet'));

const seed=game.slice(seedStart,showStart);
assert.ok(seed.includes('delete seed.guardian'));
assert.ok(seed.includes('delete seed.protectedTarget'));
assert.ok(seed.includes('sourceOuterDefNoPreservedThroughGuardian=true'));

const showFn=game.slice(showStart,pigStart);
// BATTLE_Attack rewrites its local defindex to Guardian before BATTLE_DamageSub,
// so HP-1 protection reads the actual Guardian-substituted target.
assert.ok(showFn.includes('const actual=r?.actualTarget||target'));
assert.ok(showFn.includes('const hpBefore=Math.max(0,Math.trunc(n(actual?.hp)))'));
assert.ok(showFn.includes('if(r&&!r.dodged&&!r.miss&&originalDamage>0&&hpBefore-originalDamage<=0)'));
assert.ok(showFn.includes('r.damage=Math.max(0,hpBefore-1)'));
assert.ok(showFn.indexOf('r.damage=Math.max(0,hpBefore-1)')<showFn.indexOf("applyFriendlyEnemyHit('pet',pet.name,target,r,pet.id)"));

// SHOWMERCY stays as COM1 through common BATTLE_Attack, so the target may counter once,
// but this Pet cannot counter the counter.
assert.ok(showFn.includes("resolvePetEnemyCounterChain("));
assert.ok(showFn.includes("{maxDepth:1}"));
assert.ok(showFn.includes('sourceOuterCounterTargetUnitId:target.id'));
assert.ok(showFn.includes('sourcePetCommonCounterResult(r)'));

const pigFn=game.slice(pigStart,foxStart);
// BECOMEPIG is rewritten to ATTACK before the physical hit, so full common Counter chain remains.
assert.ok(pigFn.includes('resolvePetEnemyCounterChain('));
assert.equal(pigFn.includes('{maxDepth:1}'),false);
assert.ok(pigFn.includes('sourceOuterCounterTargetUnitId:target.id'));

// Pig post-effect is after Counter. Enemy target fails CHAR_TYPEPLAYER before option parse / rand().
assert.ok(pigFn.indexOf('resolvePetEnemyCounterChain(')<pigFn.indexOf("const sourceTargetType='CHAR_TYPEENEMY'"));
assert.ok(pigFn.includes('const sourceTargetTypeEligible=false'));
assert.ok(pigFn.includes('const pigRoll=null'));
assert.ok(pigFn.includes('sourceOptionNotParsed:true'));
assert.ok(pigFn.includes('sourceNoPigRng:true'));
assert.equal(pigFn.includes('cRand('),false);

const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
assert.ok(loyal.includes("meta?.f==='PETSKILL_ShowMercy'"));
assert.ok(loyal.includes("meta?.f==='PETSKILL_BecomePig'"));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_ShowMercy'")<loyal.indexOf('sourceRuntimePending:true'));
assert.ok(loyal.indexOf("meta?.f==='PETSKILL_BecomePig'")<loyal.indexOf('sourceRuntimePending:true'));

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V1.92',
  focus:'player-randomact-showmercy-becomepig-common-counter-and-post-effect-order',
  skills:[626,635]
}));
