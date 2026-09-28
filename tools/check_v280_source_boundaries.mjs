import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const encounter=JSON.parse(fs.readFileSync('data/generated/stoneage_general_encounter_runtime.json','utf8'));
const petskill=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const attackMagic=JSON.parse(fs.readFileSync('data/generated/stoneage_attack_magic_runtime.json','utf8'));

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const fallRow=petskill.byId?.['210'];
assert.ok(fallRow,'fixed PETSKILL_FallGround row 210 must exist');
assert.equal(fallRow.f,'PETSKILL_FallGround');
assert.equal(fallRow.o,'攻%-30');
assert.equal(Number(fallRow.field),1);
assert.equal(Number(fallRow.illegal),0);

const fallStart=game.indexOf('function sourcePerformPetFallGroundSkill');
const fallEnd=game.indexOf('function sourcePerformPetCombinedAttackMagic',fallStart);
assert.ok(fallStart>=0&&fallEnd>fallStart,'FallGround source adapter must exist');
const fallFn=game.slice(fallStart,fallEnd);
assert.ok(fallFn.includes('fallRoll=cRand(0,100)'),'FallGround must preserve RAND(0,100)');
assert.ok(fallFn.includes('if(fallRoll>50)'),'FallGround must preserve >50 source threshold');
assert.ok(fallFn.includes('target?.ridePetId'),'FallGround must only act on an existing ridePetId');
assert.ok(fallFn.includes('fixed enemy.c only converts matching'),'FallGround source-boundary comment must stay explicit');
assert.ok(fallFn.includes('does not assign a positive CHAR_RIDEPET'),'Enemy CHAR_RIDEPET source boundary must stay explicit');
assert.ok(fallFn.includes('do not apply the STR/TOUGH/VITAL *0.7 branch'),'Enemy stat penalty must remain fail-closed without ridePetId');

const makeStart=game.indexOf('function makeEnemyUnit');
const makeEnd=game.indexOf('function randomEnemyReplacement',makeStart);
assert.ok(makeStart>=0&&makeEnd>makeStart,'makeEnemyUnit must exist');
const makeFn=game.slice(makeStart,makeEnd);
assert.ok(makeFn.includes('sourcePetFlg:sourceEnemyPetFlg(resolvedEnemyId)'),'existing Enemy source chain must remain');
assert.equal(makeFn.includes('ridePetId:'),false,'makeEnemyUnit must not synthesize ridePetId');

const encounterJson=JSON.stringify(encounter);
assert.equal(encounterJson.includes('"ridePetId"'),false,'generated Enemy runtime must not claim a ridePetId field without source proof');
assert.match(String(encounter?._meta?.source||''),/enemy\\.c/,'encounter runtime source must retain enemy.c provenance');

const combinedRows=Object.entries(petskill.byId||{}).filter(([,row])=>row?.f==='PETSKILL_Combined');
assert.equal(combinedRows.length,36,'fixed runtime must contain exactly 36 PETSKILL_Combined rows');
const fireBull=petskill.byId?.['715'];
assert.ok(fireBull,'fixed PETSKILL_Combined skill 715 must exist');
assert.equal(fireBull.o,'綜合法|5|458|459|460|461|462');

const missingIds=[458,459,462];
for(const id of missingIds){
  assert.equal(attackMagic.byMagicId?.[String(id)],undefined,'fixed magic runtime must have no row '+id);
}
const combinedStart=game.indexOf('const SOURCE_COMBINED_MISSING_MAGIC_IDS');
const combinedEnd=game.indexOf('function sourcePetCombinedOption',combinedStart);
assert.ok(combinedStart>=0&&combinedEnd>combinedStart,'Combined missing-magic boundary must exist');
const combinedConstants=game.slice(combinedStart,combinedEnd);
for(const id of missingIds)assert.ok(combinedConstants.includes(String(id)), 'Combined missing-magic set must keep '+id);
const combinedFnStart=game.indexOf('function sourcePerformPetCombinedSkill',combinedEnd);
const combinedFnEnd=game.indexOf('function sourcePerformPetLoyalAction',combinedFnStart);
assert.ok(combinedFnStart>=0&&combinedFnEnd>combinedFnStart,'Combined dispatcher must exist');
const combinedFn=game.slice(combinedFnStart,combinedFnEnd);
assert.ok(combinedFn.includes('SOURCE_COMBINED_MISSING_MAGIC_IDS.includes(magicId)'),'Combined must gate fixed no-row magic IDs');
assert.ok(combinedFn.includes('missingMagicRow:true'),'Combined no-row result must remain explicit');
assert.ok(combinedFn.includes('mpDelta:0'),'missing magic must not invent MP/effect behavior');

assert.ok(html.includes('PLAYABLE CORE V2.80'));
console.log(JSON.stringify({pass:true,version:'V2.80',focus:'enemy-fallground-char-ridepet-boundary-and-combined-missing-magic-boundary',fallGroundSkill:210,combinedRows:combinedRows.length,missingCombinedMagicIds:missingIds,saveSchema:30}));