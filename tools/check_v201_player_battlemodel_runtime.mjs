import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');

const expectedIds=[
  590,638,641,649,650,654,655,664,668,669,689,690,691,692,717,
  812,813,814,815,816,817,818,819,820,821,822,823,829
];
const rows=expectedIds.map(id=>runtime.byId[String(id)]);
assert.equal(rows.length,28);
for(let i=0;i<rows.length;i++){
  const row=rows[i];
  assert.ok(row,'missing BattleModel row '+expectedIds[i]);
  assert.equal(row.f,'PETSKILL_BattleModel');
  assert.equal(Number(row.field),1);
  assert.equal(Number(row.illegal),0);
  const p=String(row.o||'').split('|');
  assert.equal(p[0],'5');
  assert.ok(p[1]==='4'||p[1]==='5');
  assert.ok(/^攻%[+-]?\d+/.test(p[5]||''));
}

const tokens=new Set(rows.map(row=>String(row.o).split('|')[2]));
for(const token of ['麻','眠','石','障','剧','虚','罗'])assert.ok(tokens.has(token),'missing status token '+token);

const specStart=game.indexOf('function sourcePetBattleModelSpec');
const execStart=game.indexOf('function sourcePerformPetBattleModelSkill',specStart);
const nextStart=game.indexOf('function sourcePerformPetAttackCrazedSkill',execStart);
assert.ok(specStart>=0&&execStart>specStart&&nextStart>execStart);
const helpers=game.slice(specStart,execStart);
const fn=game.slice(execStart,nextStart);

// PETSKILL_BattleModel COM2 no longer contains RANDOMACT toNo: low=type / high=objectNum.
assert.ok(helpers.includes("const type=Math.max(0,sourceCAtoi(p[0]))"));
assert.ok(helpers.includes('let objectNum=sourceCAtoi(p[1]),objectNumRoll=null'));
assert.ok(helpers.includes('objectNumRoll=cRand(1,10)'));
assert.ok(helpers.includes('}else if(objectNum>10){'));
assert.ok(fn.includes('sourceTargetDescIgnored:true'));
assert.equal(fn.includes('action.targetDesc'),false);

// Source stat parser is positional and has the original bug: all matched stats start from WORKATTACKPOWER.
assert.ok(helpers.includes("const words=['攻','防','敏']"));
assert.ok(helpers.includes("const keys=['attack','defense','quick']"));
assert.ok(helpers.includes('let value=attackBase'));
assert.ok(helpers.includes('value=value+Math.trunc(value*pct/100)'));
assert.ok(helpers.includes('battlePetPowerMods.set'));

// BATTLE_MultiList + SortLoc source order for side 1 is 13,11,10,12,14,18,16,15,17,19.
assert.ok(helpers.includes('for(const slot of SOURCE_SARS_SLOT_ORDER)'));
assert.ok(fn.includes('sourceSortSlots:SOURCE_SARS_SLOT_ORDER.slice()'));

// type=5 means physical bit 4 + cover-all bit 1.
assert.ok(helpers.includes('physical:(type&4)!==0'));
assert.ok(helpers.includes('coverAll:(type&1)!==0'));

// Extra random objects are NOT pre-rolled. RAND happens only inside the execution loop,
// after the deterministic initial iToList sequence has been constructed.
const sequenceBuild=fn.indexOf('const sequence=[]');
const execLoop=fn.indexOf('for(let i=0;i<sequence.length;i++)');
const randomRoll=fn.indexOf('randomTargetRoll=cRand(0,initial.length-1)');
const attackCall=fn.indexOf('resolveAttackToEnemyWithGuardian');
assert.ok(sequenceBuild>=0&&execLoop>sequenceBuild&&randomRoll>execLoop&&attackCall>randomRoll);
assert.ok(fn.includes('target=initial[randomTargetRoll]'));

// A random object that picks an entry killed by an earlier object is skipped; no fallback target RNG.
assert.ok(fn.includes("skippedDead:true"));
const deadBranchStart=fn.indexOf("if(!target||n(target.hp)<=0||enemyUnitHidden(target))");
const deadBranchEnd=fn.indexOf('continue;',deadBranchStart);
assert.ok(deadBranchStart>=0&&deadBranchEnd>deadBranchStart);
assert.equal(fn.slice(deadBranchStart,deadBranchEnd).includes('cRand('),false);

// Pet has no arm, so source gDamageDiv remains 1.0 for BattleModel; no per-object division.
assert.equal(fn.includes('damageDivisor'),false);

// Physical type=5 uses real Guardian substitution. Damage is applied with ordinary ItemCrush deferred.
assert.ok(fn.includes('resolveAttackToEnemyWithGuardian'));
assert.ok(fn.includes("{deferItemCrush:true}"));

// BattleModel's special alive branch: ItemCrush even on dodge/miss/0-damage, lethal skips.
// The helper must run before optional status check.
const itemCrush=fn.indexOf('sourceBattleModelAliveItemCrushRng(r,actualDesc)');
const statusIf=fn.indexOf('if(spec.statusType&&n(r?.damage)>0&&battleStatusDescAlive(actualDesc))');
assert.ok(itemCrush>=0&&statusIf>itemCrush);

// StatusAttackCheck uses fixed BattleModel parameters: EffectHit offset, range 30, Bai 1.
// It stores iTurn exactly (raw), not common StatusChange turn+1.
assert.ok(fn.includes('{perOffset:spec.effectHit,range:30,bai:1,forceGeneral:true}'));
assert.ok(fn.includes('battleStatusApplyRaw(actualDesc,spec.statusType,spec.turns)'));

// Required status tokens are source-backed, including profession-status 罗/天罗地网.
assert.ok(game.includes("if(t.includes('麻'))return 'paralysis'"));
assert.ok(game.includes("if(t.includes('罗')||t.includes('羅'))return 'dragnet'"));
assert.ok(game.includes("dragnet:'天羅地網'"));
assert.ok(game.includes("st.type==='dragnet'"));

// BattleModel command breaks directly: no ordinary Counter and no per-object AddProfit.
assert.equal(fn.includes('resolvePetEnemyCounterChain'),false);
assert.equal(fn.includes('sourceProcessBattleDeathsAtAddProfit'),false);
assert.ok(fn.includes('sourceNoCounter:true'));
assert.ok(fn.includes('sourceNoPerObjectAddProfit:true'));

// Player RANDOMACT dispatch must precede the generic runtime-pending fallback.
const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
const loyal=game.slice(loyalStart,loyalEnd);
const dispatch=loyal.indexOf("meta?.f==='PETSKILL_BattleModel'");
const fallback=loyal.indexOf('sourceRuntimePending:true');
assert.ok(dispatch>=0&&fallback>dispatch);

assert.ok(/PLAYABLE CORE V\d+\.\d+/.test(html));

console.log(JSON.stringify({
  pass:true,
  version:'V2.01',
  focus:'player-randomact-battlemodel-type5-sortloc-guardian-alive-itemcrush-status-no-counter',
  skills:expectedIds
}));
