import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

const rows=Object.entries(runtime.byId||{})
  .map(([id,row])=>({id:Number(id),...row}))
  .filter(row=>(Number(row.field)===0||Number(row.field)===1)&&Number(row.illegal)===0)
  .sort((a,b)=>a.id-b.id);

assert.equal(rows.length,233,'fixed runtime field=0/1 legal Player-Pet coverage changed');

const functions=[...new Set(rows.map(row=>String(row.f||'')))].sort();
assert.equal(functions.length,62,'fixed runtime field=0/1 function count changed');

const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
assert.ok(loyalStart>=0&&loyalEnd>loyalStart,'missing Player RANDOMACT execution block');
const loyal=game.slice(loyalStart,loyalEnd);

const dispatched=[...loyal.matchAll(/meta\?\.f==='([^']+)'/g)].map(m=>m[1]);
const dispatchedSet=new Set(dispatched);

const missingSetStart=game.indexOf('const SOURCE_PLAYER_UNREGISTERED_PETSKILL_FUNCTIONS');
const missingSetEnd=game.indexOf(']);',missingSetStart);
assert.ok(missingSetStart>=0&&missingSetEnd>missingSetStart,'missing fixed unregistered-function audit');
const missingBlock=game.slice(missingSetStart,missingSetEnd+3);
const missingFunctions=[...missingBlock.matchAll(/'([^']+)'/g)].map(m=>m[1]).sort();
assert.deepEqual(missingFunctions,[
  'PETSKILL_Awaken',
  'PETSKILL_SelfExplodeAttack',
  'PETSKILL_Temptation'
].sort(),'fixed unregistered Player PetSkill set changed');

const uncovered=functions.filter(fn=>!dispatchedSet.has(fn)&&!missingFunctions.includes(fn));
assert.deepEqual(uncovered,[],'legal field=0/1 Player PetSkill function still reaches generic pending fallback');

const sourceMissingRows=rows
  .filter(row=>missingFunctions.includes(String(row.f||'')))
  .map(row=>({id:row.id,f:row.f,n:row.n}))
  .sort((a,b)=>a.id-b.id);
assert.deepEqual(sourceMissingRows,[
  {id:582,f:'PETSKILL_SelfExplodeAttack',n:'自爆攻击'},
  {id:642,f:'PETSKILL_Awaken',n:'觉醒'},
  {id:643,f:'PETSKILL_Temptation',n:'蛊惑'}
],'fixed functbl-missing row set changed');

// PETSKILL_Use() resolves the function pointer only after RANDOMACT already consumed
// its DefaultAttacker target RNG; the web must keep that ordering and return no command.
const planStart=game.indexOf('function sourcePetRandomSkillPlan');
const planEnd=game.indexOf('function sourcePetChargeSpec',planStart);
assert.ok(planStart>=0&&planEnd>planStart);
const plan=game.slice(planStart,planEnd);
assert.ok(plan.indexOf('const targetDesc=sourcePetRandomEnemyTarget()')>=0);
assert.ok(plan.indexOf('SOURCE_PLAYER_UNREGISTERED_PETSKILL_FUNCTIONS.has')>
          plan.indexOf('const targetDesc=sourcePetRandomEnemyTarget()'));
assert.ok(plan.includes('sourceFunctionMissing:true'));

assert.ok(loyal.includes('if(action.kind===\'none\')'));
assert.ok(loyal.includes('action.sourceFunctionMissing'));
assert.ok(loyal.includes('sourceFunctionMissing:!!action.sourceFunctionMissing'));

// The fallback remains as a forward-compatible no-guess boundary, but no current
// legal field=0/1 fixed function is allowed to depend on it.
assert.ok(loyal.includes('此玩家側 PetSkill 尚未接入'));
assert.ok(loyal.includes('sourceRuntimePending:true'));

// Current fixed rows that have handler-local defensive pending branches all satisfy
// their parser/source guard conditions, so those branches are unreachable for this dataset.
for(const row of rows.filter(r=>r.f==='PETSKILL_BattleProperty')){
  assert.equal(String(row.o||''),'PET_PetskillPropertyEvent');
}
for(const row of rows.filter(r=>r.f==='PETSKILL_MagicStatusChange')){
  const p=String(row.o||'').split('|');
  assert.ok(p[0]==='铁壁'||p[0]==='鐵壁');
  assert.ok(Number.isFinite(Number(p[1])));
  assert.ok(Number.isFinite(Number(p[2])));
}
for(const row of rows.filter(r=>r.f==='PETSKILL_Refresh')){
  assert.ok(['默','剧','障','全','虚'].includes(String(row.o||'')));
}
for(const row of rows.filter(r=>[
  'PETSKILL_Weaken','PETSKILL_Deeppoison','PETSKILL_Barrier','PETSKILL_Nocast'
].includes(r.f))){
  assert.match(String(row.o||''),/turn\s*-?\d+/);
  assert.match(String(row.o||''),/成\s*[+-]?\d+/);
}
for(const row of rows.filter(r=>r.f==='PETSKILL_StatusChange')){
  assert.match(String(row.o||''),/(毒|麻|眠|石|醉|乱|劇|剧|虚)/);
  assert.match(String(row.o||''),/turn\s*-?\d+/);
}

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V2.03',
  focus:'player-field01-petskill-coverage-closure',
  legalField01Rows:rows.length,
  uniqueFunctions:functions.length,
  sourceFunctionMissingRows:sourceMissingRows.map(x=>x.id),
  uncoveredFunctions:uncovered
}));
