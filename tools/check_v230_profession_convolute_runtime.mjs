import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(source,name){
  const marker='function '+name+'(';
  const start=source.indexOf(marker);
  assert.ok(start>=0,'missing '+name);
  const ps=source.indexOf('(',start);
  let pd=0,pe=-1,q=null,esc=false,lc=false,bc=false;
  for(let i=ps;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(lc){if(c==='\n')lc=false;continue}
    if(bc){if(c==='*'&&n==='/'){bc=false;i++}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='\x60'){q=c;continue}
    if(c==='/'&&n==='/'){lc=true;i++;continue}
    if(c==='/'&&n==='*'){bc=true;i++;continue}
    if(c==='(')pd++;
    else if(c===')'&&--pd===0){pe=i;break}
  }
  const bs=source.indexOf('{',pe);
  let d=0;q=null;esc=false;lc=false;bc=false;
  for(let i=bs;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(lc){if(c==='\n')lc=false;continue}
    if(bc){if(c==='*'&&n==='/'){bc=false;i++}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='\x60'){q=c;continue}
    if(c==='/'&&n==='/'){lc=true;i++;continue}
    if(c==='/'&&n==='*'){bc=true;i++;continue}
    if(c==='{')d++;
    else if(c==='}'&&--d===0)return source.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

const row=runtime.bySkillId['41'];
assert.ok(row);
assert.equal(row.name,'回旋攻击');
assert.equal(row.func,'PROFESSION_CONVOLUTE');
assert.equal(row.commonCommand,'BATTLE_COM_S_CONVOLUTE');
assert.equal(row.target,8);
assert.equal(row.kind,1);
assert.equal(row.useFlag,1);
assert.equal(row.costMp,28);
assert.equal(row.option,'无|1|1|150|150|0|0|0|350|280|500|320|100|150|180|230');

let attackWork=100;
const ctx={
  Math,Number,Object,Array,Set,
  enemy:null,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionThroughAliveEnemySlots:null,
  sourceProfessionPlayerAttackWork:()=>attackWork,
  sourceProfessionSetPlayerAttackWork:v=>(attackWork=Math.trunc(Number(v)||0))
};
vm.createContext(ctx);

// Test allowlist directly with no large battle dependencies.
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),ctx);
assert.equal(ctx.sourceProfessionBattleFunctionSupported('PROFESSION_CONVOLUTE'),true);

// Row resolution can be tested against an injected alive-slot provider.
ctx.sourceProfessionThroughAliveEnemySlots=()=>[10,12,14];
vm.runInContext(extractFunction(game,'sourceProfessionConvoluteResolveRow'),ctx);
let rowPlan=ctx.sourceProfessionConvoluteResolveRow(23);
assert.equal(rowPlan.ok,true);
assert.equal(rowPlan.toNo,23);
assert.equal(rowPlan.fallback,false);
assert.deepEqual(Array.from(rowPlan.targetSlots),[10,12,14]);

// Empty requested back row falls to front row and mutates effective COM2 23 -> 24.
ctx.sourceProfessionThroughAliveEnemySlots=()=>[15,16,19];
rowPlan=ctx.sourceProfessionConvoluteResolveRow(23);
assert.equal(rowPlan.ok,true);
assert.equal(rowPlan.toNo,24);
assert.equal(rowPlan.fallback,true);
assert.deepEqual(Array.from(rowPlan.targetSlots),[15,16,19]);

// Empty requested front row falls to back row 24 -> 23.
ctx.sourceProfessionThroughAliveEnemySlots=()=>[10,13];
rowPlan=ctx.sourceProfessionConvoluteResolveRow(24);
assert.equal(rowPlan.toNo,23);
assert.equal(rowPlan.fallback,true);
assert.deepEqual(Array.from(rowPlan.targetSlots),[10,13]);

ctx.sourceProfessionThroughAliveEnemySlots=()=>[];
rowPlan=ctx.sourceProfessionConvoluteResolveRow(24);
assert.equal(rowPlan.ok,false);
assert.equal(rowPlan.reason,'target-side-empty');
assert.equal(ctx.sourceProfessionConvoluteResolveRow(22).reason,'unsupported-convolute-row');

// Fixed GET_DAMAGE mutates current WORKATTACKPOWER by (50 + tier*2)% per magic-hit target.
// This is cumulative across a row, not recomputed from FIXSTR each time.
vm.runInContext(extractFunction(game,'sourceProfessionConvoluteAttackStep'),ctx);
attackWork=100;
let step=ctx.sourceProfessionConvoluteAttackStep(5);
assert.deepEqual(JSON.parse(JSON.stringify(step)),{before:100,after:60,pct:60});
step=ctx.sourceProfessionConvoluteAttackStep(5);
assert.deepEqual(JSON.parse(JSON.stringify(step)),{before:60,after:36,pct:60});
step=ctx.sourceProfessionConvoluteAttackStep(5);
assert.equal(step.after,21); // int(36*0.60)
attackWork=101;
step=ctx.sourceProfessionConvoluteAttackStep(10);
assert.equal(step.pct,70);
assert.equal(step.after,70);

// Full execution mirrors the same profession-magic skeleton as Through.
const conv=extractFunction(game,'sourceProfessionConvoluteExecute');
assert.ok(conv.indexOf('sourceProfessionConvoluteResolveRow(prepared.toNo)')
  <conv.indexOf('sourceProfessionMagicPracticePower('));
assert.ok(conv.indexOf('sourceProfessionMagicPracticePower(')
  <conv.indexOf('for(const slot of slots)'));
assert.ok(conv.indexOf('sourceProfessionThroughMagicDodge(target)')
  <conv.indexOf('sourceProfessionConvoluteAttackStep(prepared.attackSkillTier)'));
assert.ok(conv.indexOf('sourceProfessionConvoluteAttackStep(prepared.attackSkillTier)')
  <conv.indexOf('sourceProfessionThroughPhysicalResult(target)'));
assert.ok(conv.indexOf('sourceProfessionThroughPhysicalResult(target)')
  <conv.indexOf('sourcePlayerProfessionMagicDamageCore({'));
assert.ok(conv.indexOf('sourcePlayerProfessionMagicDamageCore({')
  <conv.indexOf('const unusedChangeStatusRoll=cRand(1,100)'));
assert.ok(conv.includes("magicType:-1,power:rawPhysical,command:'BATTLE_COM_S_CONVOLUTE'"));
assert.ok(conv.includes('target.hp=Math.max(0,before-damage)'));
assert.ok(conv.includes("sourceMarkEnemyDeathCredit(target,[{kind:'player'}])"));
assert.ok(conv.includes('wakeTargets.push(target)'));
assert.ok(conv.includes('sourceProfessionThroughWakeTarget(target)'));
assert.ok(conv.includes('finalWorkAttack:sourceProfessionPlayerAttackWork()'));
assert.ok(conv.includes('noOrdinaryCounter:true'));
assert.ok(conv.includes('noGuardian:true'));
assert.ok(conv.includes('noItemCrush:true'));
assert.ok(conv.includes('noDamageSub:true'));
assert.equal(conv.includes('applyFriendlyEnemyHit'),false);
assert.equal(conv.includes('sourceTrackDamageSubUltimate'),false);
assert.equal(conv.includes('sourceBattleFinalizeItemCrushRng'),false);

// Row skill must route before the generic direct-only >19 rejection.
const exec=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(exec.indexOf("prepared.functionName==='PROFESSION_CONVOLUTE'")
  <exec.indexOf('if(toNo>19){'));

// Shared special physical helper keeps critical-before-duck/no-suit/no-Guardian behavior.
const physical=extractFunction(game,'sourceProfessionThroughPhysicalResult');
assert.ok(physical.indexOf('const criticalRoll=cRand(1,10000)')
  <physical.indexOf('const skillDuckPower=Math.trunc(n(defender.skillDuckPower))'));
assert.equal(physical.includes('sourceSuitDuckCheck'),false);
assert.equal(physical.includes('enemyGuardianFor'),false);
assert.equal(physical.includes('battleGuardAdjust'),false);

// New battle-local WORKATTACKPOWER mirror: same-round counters can see profession mutations.
const view=extractFunction(game,'playerBattleView');
assert.ok(view.includes('battlePlayerAttackWork==null?compliantAttack:Math.trunc(n(battlePlayerAttackWork))'));
const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battlePlayerAttackWork=null'));
const order=extractFunction(game,'normalBattleOrder');
assert.ok(order.indexOf('playerComplianceParameter(state)')
  <order.indexOf('battlePlayerAttackWork=null'));

// Existing source callbacks that mutate WORKATTACKPOWER now persist the mutation too.
const shield=extractFunction(game,'sourceProfessionShieldAttackExecute');
assert.ok(shield.includes('sourceProfessionSetPlayerAttackWork(attackPower)'));
assert.ok(exec.includes('sourceProfessionSetPlayerAttackWork(attackPower)'));

assert.match(html,/PLAYABLE CORE V2\.36/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.30',
  focus:'PROFESSION_CONVOLUTE row magic-pipeline + persistent WORKATTACKPOWER',
  liveSkillId:41,
  mpCost:28,
  rowFallback:'23<->24',
  attackScale:'current WORKATTACKPOWER * (50+tier*2)%, cumulative per magic-hit target',
  sourceBugs:['row fallback rewrites COM2','attack reduction compounds across row','final reduced WORK attack survives same-round followups'],
  correctedPriorSkills:[24,38],
  saveSchema:30
}));
