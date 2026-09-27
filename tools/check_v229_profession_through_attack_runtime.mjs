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

const row=runtime.bySkillId['39'];
assert.ok(row);
assert.equal(row.name,'贯穿攻击');
assert.equal(row.func,'PROFESSION_THROUGH_ATTACK');
assert.equal(row.commonCommand,'BATTLE_COM_S_THROUGH_ATTACK');
assert.equal(row.target,1);
assert.equal(row.kind,1);
assert.equal(row.useFlag,1);
assert.equal(row.costMp,21);
assert.ok(String(row.option).startsWith('无|1|1|320|240|'));

let randQueue=[];
const ctx={
  Math,Number,Object,Set,Array,
  state:{},
  enemy:null,
  battlePlayerProfessionHitState:null,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceRandModulo:()=>randQueue.shift()??0,
  cRand:()=>randQueue.shift()??1,
  enemyUnitHidden:t=>!!t?.hidden,
  sourceProfessionPlayerHitRight:()=>{
    if(ctx.battlePlayerProfessionHitState)return Math.trunc(Number(ctx.battlePlayerProfessionHitState.workHitRight)||0);
    return 20;
  }
};
vm.createContext(ctx);
for(const name of [
  'sourceProfessionMagicLevelM',
  'sourceProfessionMagicPracticePower',
  'sourceProfessionBattleFunctionSupported',
  'sourceProfessionEnemyByBattleSlot',
  'sourceProfessionThroughAliveEnemySlots',
  'sourceProfessionThroughResolveInitialSlot',
  'sourceProfessionThroughTargetSlots',
  'sourceProfessionThroughMagicDodge',
  'sourceProfessionThroughHitPenalty'
])vm.runInContext(extractFunction(game,name),ctx);

assert.equal(ctx.sourceProfessionBattleFunctionSupported('PROFESSION_THROUGH_ATTACK'),true);

// Profession lookup now works for both group battles and the single-enemy object path.
ctx.enemy={battleSlot:0,hp:100,id:'solo'};
assert.equal(ctx.sourceProfessionEnemyByBattleSlot(10).id,'solo');

// __ATTACK_MAGIC BATTLE_MultiList: dead requested target repeatedly rand()%10 over packed alive slots.
ctx.enemy={units:[
  {battleSlot:0,hp:0,id:'dead0'},
  {battleSlot:2,hp:30,id:'alive2'},
  {battleSlot:6,hp:40,id:'alive6'}
]};
randQueue=[9,1];
let resolved=ctx.sourceProfessionThroughResolveInitialSlot(10);
assert.equal(resolved.ok,true);
assert.equal(resolved.retargeted,true);
assert.deepEqual(Array.from(resolved.retargetRolls),[9,1]);
assert.equal(resolved.toNo,16);

// Live requested target consumes no retarget RNG.
randQueue=[7];
resolved=ctx.sourceProfessionThroughResolveInitialSlot(12);
assert.equal(resolved.toNo,12);
assert.equal(resolved.retargeted,false);
assert.deepEqual(Array.from(resolved.retargetRolls),[]);
assert.deepEqual(randQueue,[7]);

// PROFESSION_MAGIC_TOLIST_SORT: paired same-column front row always comes first.
ctx.enemy={units:[
  {battleSlot:0,hp:30,id:'back'},
  {battleSlot:5,hp:30,id:'front'}
]};
assert.deepEqual(Array.from(ctx.sourceProfessionThroughTargetSlots(10)),[15,10]);
assert.deepEqual(Array.from(ctx.sourceProfessionThroughTargetSlots(15)),[15,10]);
// Sole back-row target remains index 0; later source multiplier therefore uses the front multiplier.
ctx.enemy={units:[{battleSlot:0,hp:30,id:'back'}]};
assert.deepEqual(Array.from(ctx.sourceProfessionThroughTargetSlots(10)),[10]);

// PROFESSION_MAGIC_DODGE: RAND first; Enemy branch uses trunc(LV*0.15), capped 20.
let t={hp:100,level:100,hidden:false};
randQueue=[15];
let md=ctx.sourceProfessionThroughMagicDodge(t);
assert.equal(md.luck,15);
assert.equal(md.miss,true);
randQueue=[16];
md=ctx.sourceProfessionThroughMagicDodge(t);
assert.equal(md.miss,false);
t.hidden=true;randQueue=[99];
md=ctx.sourceProfessionThroughMagicDodge(t);
assert.equal(md.miss,true);
assert.equal(md.roll,99);
assert.equal(md.reason,'earthround');

// Through has no GET_PRACTICE command case, but fixed still consumes critical + M2 rand.
randQueue=[77,88];
const practice=ctx.sourceProfessionMagicPracticePower(
  'BATTLE_COM_S_THROUGH_ATTACK',55,100,{mPower:0,m2Power:0}
);
assert.equal(practice.power,0);
assert.equal(practice.criticalRoll,77);
assert.equal(practice.m2Roll,88);
assert.equal(practice.varianceRoll,null);
assert.deepEqual(randQueue,[]);

// Every magic-dodge-passing target at tier !=10 overwrites MYSKILLHIT=1/NUM=-70 and WORKHITRIGHT -=50.
ctx.battlePlayerProfessionHitState=null;
let penalty=ctx.sourceProfessionThroughHitPenalty(5);
assert.equal(penalty.before,20);
assert.equal(penalty.after,-30);
assert.equal(ctx.battlePlayerProfessionHitState.turns,1);
assert.equal(ctx.battlePlayerProfessionHitState.power,-70);
penalty=ctx.sourceProfessionThroughHitPenalty(5);
assert.equal(penalty.before,-30);
assert.equal(penalty.after,-80);
assert.equal(ctx.battlePlayerProfessionHitState.power,-70);
const beforeTier10=ctx.battlePlayerProfessionHitState;
penalty=ctx.sourceProfessionThroughHitPenalty(10);
assert.equal(penalty.applied,false);
assert.equal(ctx.battlePlayerProfessionHitState,beforeTier10);

// Physical helper source order: critical roll precedes ordinary duck, and critical bypasses duck.
const physical=extractFunction(game,'sourceProfessionThroughPhysicalResult');
assert.ok(physical.indexOf('const criticalRoll=cRand(1,10000)')
  <physical.indexOf('const skillDuckPower=Math.trunc(n(defender.skillDuckPower))'));
assert.ok(physical.includes('const critical=criticalRoll<criticalRaw'));
assert.ok(physical.includes('if(critical){'));
assert.ok(physical.includes('damage+n(defender.defense)*Math.max(1,n(attacker.level))/Math.max(1,n(defender.level))*.5'));
assert.equal(physical.includes("weaponType")&&physical.includes("!==4"),false);
assert.equal(physical.includes('sourceProfessionPlayerCriticalEvent'),false);
assert.equal(physical.includes('sourceSuitDuckCheck'),false);
assert.ok(physical.includes('const damageReact=!!target.acupunctureActive'));
assert.ok(physical.includes('if(!guarding&&!damageReact&&defender.canMove!==false)'));
assert.equal(physical.includes('battleGuardAdjust'),false);
assert.equal(physical.includes('enemyGuardianFor'),false);

// Full execution order and special magic-pipeline exclusions.
const through=extractFunction(game,'sourceProfessionThroughAttackExecute');
assert.ok(through.indexOf('sourceProfessionThroughResolveInitialSlot(prepared.toNo)')
  <through.indexOf('sourceProfessionMagicPracticePower('));
assert.ok(through.indexOf('sourceProfessionMagicPracticePower(')
  <through.indexOf('sourceProfessionThroughTargetSlots(resolved.toNo)'));
assert.ok(through.indexOf('sourceProfessionThroughMagicDodge(target)')
  <through.indexOf('sourceProfessionThroughHitPenalty(prepared.attackSkillTier)'));
assert.ok(through.indexOf('sourceProfessionThroughPhysicalResult(target)')
  <through.indexOf('sourcePlayerProfessionMagicDamageCore({'));
assert.ok(through.indexOf('sourcePlayerProfessionMagicDamageCore({')
  <through.indexOf('const unusedChangeStatusRoll=cRand(1,100)'));
assert.ok(through.includes("magicType:-1,power:rawPhysical,command:'BATTLE_COM_S_THROUGH_ATTACK'"));
assert.ok(through.includes("const multiplier=i===0?(prepared.attackSkillTier*2+70):(prepared.attackSkillTier*2+50)"));
assert.ok(through.includes("target.hp=Math.max(0,before-damage)"));
assert.ok(through.includes("sourceMarkEnemyDeathCredit(target,[{kind:'player'}])"));
assert.ok(through.includes('wakeTargets.push(target)'));
assert.ok(through.includes('sourceProfessionThroughWakeTarget(target)'));
assert.ok(through.includes('noDamageSub:true'));
assert.ok(through.includes('noGuardian:true'));
assert.ok(through.includes('noDamageReact:true'));
assert.ok(through.includes('noItemCrush:true'));
assert.ok(through.includes('noCounter:true'));
assert.ok(through.includes('noGuardAdjust:true'));
assert.equal(through.includes('applyFriendlyEnemyHit'),false);
assert.equal(through.includes('sourceBattleFinalizeItemCrushRng'),false);
assert.equal(through.includes('sourceTrackDamageSubUltimate'),false);

// Tail wake is deliberately not gated by positive damage.
const wake=extractFunction(game,'sourceProfessionThroughWakeTarget');
assert.equal(wake.includes('n(damage)>0'),false);
assert.ok(wake.includes("battleStatusClear(desc,'sleep')"));

// Through routing occurs before generic dead/hidden physical target rejection.
const exec=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(exec.indexOf("prepared.functionName==='PROFESSION_THROUGH_ATTACK'")
  <exec.indexOf("reason:'target-dead-or-missing'"));
assert.ok(exec.indexOf("prepared.functionName==='PROFESSION_THROUGH_ATTACK'")
  <exec.indexOf("reason:'target-earthround'"));

assert.match(html,/PLAYABLE CORE V\d+\.\d+/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.29',
  focus:'PROFESSION_THROUGH_ATTACK fixed magic-pipeline physical pierce',
  liveSkillId:39,
  mpCost:21,
  targetOrder:'front then paired back',
  magicType:-1,
  multipliers:'index0 70+tier*2; index1 50+tier*2',
  sourceBugs:['practice consumes two RNG at zero power','tier<10 subtracts 50 HITRIGHT per magic-hit target','single back-row target gets index0 multiplier'],
  excluded:['Guardian','GuardAdjust','DamageSub','DamageReact consumption','ItemCrush','Counter','suit dodge'],
  saveSchema:30
}));
