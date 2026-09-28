import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const encounter=JSON.parse(fs.readFileSync('data/generated/stoneage_general_encounter_runtime.json','utf8'));
const petskill=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const petFlg=encounter.enemyPetFlg||{};
assert.equal(Object.keys(petFlg).length,2958,'enemyPetFlg row count');
const dist=Object.values(petFlg).reduce((m,v)=>{const k=String(v);m[k]=(m[k]||0)+1;return m},{});
assert.deepEqual(dist,{'0':1557,'1':1401},'enemyPetFlg distribution');
assert.match(String(encounter?._meta?.source||''),/enemy1\.txt/,'runtime source must include enemy1.txt');

const petFlgStart=game.indexOf('function sourceEnemyPetFlg');
const makeStart=game.indexOf('function makeEnemyUnit');
const foxStart=game.indexOf('function sourcePerformPetBecomeFoxSkill');
assert.ok(petFlgStart>=0&&makeStart>petFlgStart&&foxStart>makeStart,'PETFLG helper order');

const petFlgFn=game.slice(petFlgStart,makeStart);
assert.ok(petFlgFn.includes('encounterRuntime?.enemyPetFlg'),'PETFLG reads encounter runtime');
assert.ok(petFlgFn.includes('Math.trunc(id)'),'PETFLG uses EnemyID key');
const makeFn=game.slice(makeStart,game.indexOf('function randomEnemyReplacement',makeStart));
assert.ok(makeFn.includes('sourcePetFlg:sourceEnemyPetFlg(resolvedEnemyId)'),'Enemy unit receives sourcePetFlg');

const foxEnd=game.indexOf('function sourcePerformPetFallGroundSkill',foxStart);
const foxFn=game.slice(foxStart,foxEnd);
assert.ok(foxFn.includes('const petFlg=target.sourcePetFlg'));
assert.ok(foxFn.includes('sourceDataMissing=petFlg==null'));
assert.ok(foxFn.includes('Math.trunc(Number(petFlg))!==0'));
assert.ok(foxFn.includes('roll=cRand(0,99)'));
assert.ok(foxFn.includes('if(roll<31'));

const missingFns=new Set(['PETSKILL_SelfExplodeAttack','PETSKILL_Awaken','PETSKILL_Temptation']);
for(const id of ['582','642','643']){
  const row=petskill.byId[id];
  assert.ok(row,'missing fixed runtime row '+id);
  assert.equal(Number(row.field),1,'field '+id);
  assert.equal(Number(row.illegal),0,'legal '+id);
  assert.ok(missingFns.has(row.f),'expected source-missing function family '+id);
}
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
for(const f of missingFns)assert.equal(loyal.includes("meta?.f==='"+f+"'"),false,f+' must remain unregistered');
const missPos=loyal.indexOf('sourceFunctionMissing:true');
assert.ok(missPos>=0,'fixed missing functbl boundary must remain explicit');

assert.ok(html.includes('PLAYABLE CORE V2.79'));
console.log(JSON.stringify({pass:true,version:'V2.79',focus:'enemy-petflg-source-parity-and-petskill-source-missing-boundary',enemyPetFlgRows:Object.keys(petFlg).length,petFlg0:dist['0'],petFlg1:dist['1'],sourceMissingSkills:[582,642,643],saveSchema:30}));