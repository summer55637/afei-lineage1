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

const row=runtime.bySkillId['42'];
assert.ok(row);
assert.equal(row.name,'混乱攻击');
assert.equal(row.func,'PROFESSION_CHAOS');
assert.equal(row.commonCommand,'BATTLE_COM_S_CHAOS');
assert.equal(row.target,1);
assert.equal(row.kind,1);
assert.equal(row.useFlag,1);
assert.equal(row.costMp,28);
assert.equal(row.option,'效%1|');

let attackWork=101;
const ctx={
  Math,Number,Object,Array,Set,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  cRand:(a)=>a,
  sourceProfessionPlayerAttackWork:()=>attackWork,
  sourceProfessionSetPlayerAttackWork:v=>(attackWork=Math.trunc(Number(v)||0))
};
vm.createContext(ctx);

vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),ctx);
assert.equal(ctx.sourceProfessionBattleFunctionSupported('PROFESSION_CHAOS'),true);

vm.runInContext(extractFunction(game,'sourceProfessionChaosAttackCount'),ctx);
assert.equal(ctx.sourceProfessionChaosAttackCount(0),3);
assert.equal(ctx.sourceProfessionChaosAttackCount(4),3);
assert.equal(ctx.sourceProfessionChaosAttackCount(5),4);
assert.equal(ctx.sourceProfessionChaosAttackCount(9),4);
assert.equal(ctx.sourceProfessionChaosAttackCount(10),5);

vm.runInContext(extractFunction(game,'sourceProfessionChaosAttackPowerStep'),ctx);
let step=ctx.sourceProfessionChaosAttackPowerStep();
assert.deepEqual(JSON.parse(JSON.stringify(step)),{before:101,after:70,pct:70});
attackWork=70;
step=ctx.sourceProfessionChaosAttackPowerStep();
assert.equal(step.after,49);

vm.runInContext(extractFunction(game,'sourceProfessionChaosDuckRaw'),ctx);
assert.equal(ctx.sourceProfessionChaosDuckRaw(5000),7000);
assert.equal(ctx.sourceProfessionChaosDuckRaw(7500),10500);
assert.equal(ctx.sourceProfessionChaosDuckRaw(1),1);

vm.runInContext(extractFunction(game,'sourceProfessionChaosDrawBatch'),ctx);
const seq=[2,0,2,1];
let qi=0;
const batch=ctx.sourceProfessionChaosDrawBatch([10,11,12],4,()=>seq[qi++]);
assert.deepEqual(Array.from(batch),[12,10,12,11]);

const duck=extractFunction(game,'sourceBattleDuckTotal');
assert.ok(duck.includes("if(options.sourceProfessionChaos===true)"));
assert.ok(duck.includes('duck=sourceProfessionChaosDuckRaw(duck)'));
assert.ok(duck.indexOf('duck=clamp(duck,1,7500)')<duck.indexOf("if(attacker?.type==='player')"));
assert.ok(duck.indexOf("if(attacker?.type==='player')")<duck.indexOf("if(options.sourceProfessionChaos===true)"));
assert.equal(duck.indexOf('clamp(',duck.indexOf("if(options.sourceProfessionChaos===true)")),-1);

const physical=extractFunction(game,'sourceProfessionPhysicalCalcOnlyResult');
assert.ok(physical.includes("Object.assign({},attackOptions,{guarding:originalGuarding})"));
assert.ok(physical.includes('delete dodgeOptions.attackerOverride'));
assert.ok(physical.includes('sourceInitialDodgeOnly(attacker,enemyBattleView(target),dodgeOptions)'));

const ordinary=extractFunction(game,'sourceProfessionOrdinaryPlayerAttackResult');
assert.ok(ordinary.includes('sourceProfessionChaos=false'));
assert.ok(ordinary.includes('sourceProfessionChaos:!!sourceProfessionChaos'));

const chaos=extractFunction(game,'sourceProfessionChaosExecute');
assert.ok(chaos.indexOf('sourceProfessionChaosAttackPowerStep()')<chaos.indexOf('sourceProfessionPhysicalCalcOnlyResult(target,{'));
assert.ok(chaos.includes('sourceProfessionChaos:true'));
assert.ok(chaos.includes('{suppressSuitPoison:true,suppressDamageReact:true}'));
assert.ok(chaos.indexOf('sourceProfessionChaosAliveSideSlots(prepared.toNo)')<chaos.indexOf('sourceProfessionChaosDrawBatch(pool,remaining)'));
assert.ok(chaos.includes("extraTarget,{sourceProfessionChaos:true}"));
assert.ok(chaos.includes("applyFriendlyEnemyHit('player','你',extraTarget,attack)"));
assert.ok(chaos.includes("reason:'invalid-predrawn-target-reroll'"));
assert.ok(chaos.includes("sourceInfiniteLoopReason='earthround-only-candidate-pool'"));
assert.ok(chaos.includes('finalWorkAttack:sourceProfessionPlayerAttackWork()'));
assert.ok(chaos.includes('noOrdinaryCounter:true'));
assert.ok(chaos.includes('workAttackPersists:true'));

const exec=extractFunction(game,'sourceProfessionBattleSkillExecute');
const hiddenAt=exec.indexOf('if(enemyUnitHidden(target))');
const chaosAt=exec.indexOf("if(prepared.functionName==='PROFESSION_CHAOS')");
const genericAt=exec.indexOf('const first=sourceProfessionPhysicalCalcOnlyResult(target)');
assert.ok(hiddenAt>=0&&chaosAt>hiddenAt&&genericAt>chaosAt);

assert.match(html,/PLAYABLE CORE V2\.40/);
assert.match(html,/V2\.40 live：[^<]*混亂攻擊/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.31',
  focus:'PROFESSION_CHAOS fixed WORK/dodge/batched-target RNG lifecycle',
  liveSkillId:42,mpCost:28,
  totalHits:'tier<5:3, tier5..9:4, tier10:5',
  attackWork:'current WORKATTACKPOWER * 70%',
  chaosDuck:'post-cap/post-HITRIGHT threshold * 1.4, no recap',
  targetRng:'pre-draw remaining batch with replacement; redraw whole remainder on invalid',
  sourceBugGuard:'earthround-only candidate pool would loop forever in fixed C',
  saveSchema:30
}));
