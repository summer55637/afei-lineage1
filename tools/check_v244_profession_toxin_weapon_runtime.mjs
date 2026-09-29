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
    if(c==='(')pd++; else if(c===')'&&--pd===0){pe=i;break}
  }
  assert.ok(pe>=0,'unterminated params '+name);
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
    if(c==='{')d++; else if(c==='}'&&--d===0)return source.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

const row=runtime.bySkillId['50'];
assert.ok(row);
assert.equal(row.name,'毒素武器');
assert.equal(row.func,'PROFESSION_TOXIN_WEAPON');
assert.equal(row.option,'毒|前|成%20|敏%30|效%1|回%5');
assert.equal(row.costMp,5);
assert.equal(row.target,1);
assert.equal(row.kind,1);
assert.equal(row.commonCommand,'BATTLE_COM_S_TOXIN_WEAPON');

const supportCtx={};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_TOXIN_WEAPON'),true);

// A-tier comes from prepare; custom branch uses 20 + tier*2 and fixed 回%5 => stored 6.
const specCtx={
  Math,Number,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionPlayerWeaponType:()=>4,
  state:{},
  playerPigActive:()=>false
};
vm.createContext(specCtx);
vm.runInContext(extractFunction(game,'sourceProfessionToxinWeaponSpec'),specCtx);
let spec=specCtx.sourceProfessionToxinWeaponSpec({attackSkillTier:0});
assert.equal(spec.tier,0);
assert.equal(spec.success,20);
assert.equal(spec.turn,5);
assert.equal(spec.storedTurns,6);
spec=specCtx.sourceProfessionToxinWeaponSpec({attackSkillTier:10});
assert.equal(spec.success,40);

// Target-plan source quirks.
const planCtx={
  Math,Number,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  SOURCE_BOOMERANG_VS_TBL:Array.from({length:4},(_,r)=>[r*5,r*5+1,r*5+2,r*5+3,r*5+4]),
  sourceBowTargetListFromBattleSlots:(raw,attackNo)=>({
    random:1,slots:[12,17,13,18,-1]
  })
};
vm.createContext(planCtx);
vm.runInContext(extractFunction(game,'sourceProfessionToxinWeaponTargetPlan'),planCtx);

let plan=planCtx.sourceProfessionToxinWeaponTargetPlan({toNo:12},{weaponType:4,transformed:false});
assert.equal(plan.mode,'bow');
assert.equal(plan.random,1);
assert.equal(plan.targetSlots.join(','),'12,17,13,18');

plan=planCtx.sourceProfessionToxinWeaponTargetPlan({toNo:12},{weaponType:17,transformed:false});
assert.equal(plan.mode,'boomerang');
assert.equal(plan.row,2);
assert.equal(plan.targetSlots.join(','),'10,11,12,13,14');

plan=planCtx.sourceProfessionToxinWeaponTargetPlan({toNo:12},{weaponType:18,transformed:false});
assert.equal(plan.mode,'single');
assert.equal(plan.targetSlots.join(','),'12');

plan=planCtx.sourceProfessionToxinWeaponTargetPlan({toNo:12},{weaponType:4,transformed:true});
assert.equal(plan.mode,'transformed-single');
assert.equal(plan.targetSlots.join(','),'12');

// Structural ordering and boundaries.
const execFn=extractFunction(game,'sourceProfessionToxinWeaponExecute');
assert.ok(execFn.includes('const rawTarget=sourceProfessionEnemyByBattleSlot(rawToNo)'));
assert.ok(execFn.includes('if(enemyUnitHidden(rawTarget))'));
assert.ok(execFn.includes('const plan=sourceProfessionToxinWeaponTargetPlan(prepared,spec)'));
assert.ok(execFn.includes('const target=sourceProfessionEnemyByBattleSlot(slot)'));
assert.equal(execFn.includes('sourcePlayerEnemyTargetableFromBattleSlot(slot)'),false);
assert.ok(execFn.includes("plan.mode==='boomerang'?{damageMultiplier:.3}:{}"));
assert.ok(execFn.includes('suppressSuitPoison:true'));
assert.ok(execFn.includes('const positiveCalculated=!r.dodged&&!r.miss&&n(r.damage)>0'));

const applyAt=execFn.indexOf('applyFriendlyEnemyHit(');
const statusAt=execFn.indexOf('sourceProfessionStatusAttackCheck(targetDesc,spec.success)');
assert.ok(applyAt>=0&&statusAt>applyAt,'poison check must follow DamageSub/ItemCrush helper');
assert.ok(execFn.includes("battleStatusApply(targetDesc,'poison',spec.turn)"));
assert.ok(execFn.includes('poisonStoredTurns:poisonApplied?spec.storedTurns:0'));
assert.ok(execFn.includes('noAttackCount:true'));
assert.ok(execFn.includes('noOrdinarySuitPoison:true'));
assert.ok(execFn.includes('noOrdinaryCounter:true'));
assert.ok(execFn.includes('realGuardian:true'));
assert.ok(execFn.includes('damageReactEnabled:true'));

// No AttackCount helpers may be called from the custom branch.
assert.equal(execFn.includes('sourceAttackMax'),false);
assert.equal(execFn.includes('sourceEnemyBattleAttackMax'),false);
assert.equal(execFn.includes('sourcePerformPlayerBowWeaponAttack'),false);
assert.equal(execFn.includes('sourcePerformPlayerThrowWeaponAttack'),false);
assert.equal(execFn.includes('sourcePerformPlayerBoomerangWeaponAttack'),false);

// Dispatcher must occur after same-side/range rejection but BEFORE generic dead-target rejection.
// This preserves fixed behavior where a dead raw target can still seed BOW/BOOMERANG ToList.
const dispatch=extractFunction(game,'sourceProfessionBattleSkillExecute');
const sameSideAt=dispatch.indexOf('if(toNo<10){');
const rangeAt=dispatch.indexOf('if(toNo>19){');
const toxinAt=dispatch.indexOf("prepared.functionName==='PROFESSION_TOXIN_WEAPON'");
const targetResolveAt=dispatch.indexOf('const target=sourceProfessionEnemyByBattleSlot(toNo);');
const deadAt=dispatch.indexOf("reason:'target-dead-or-missing'");
assert.ok(sameSideAt>=0&&rangeAt>sameSideAt&&toxinAt>rangeAt);
assert.ok(targetResolveAt>toxinAt&&deadAt>toxinAt);
assert.ok(dispatch.includes('sourceProfessionToxinWeaponExecute(prepared,toxinName)'));

// Shared status helper remains strict roll < threshold and refuses any existing status.
const statusFn=extractFunction(game,'sourceProfessionStatusAttackCheck');
assert.ok(statusFn.includes('const roll=cRand(1,100)'));
assert.ok(statusFn.includes('battleHasAnyStatus(targetDesc)'));
assert.ok(statusFn.includes('success:roll<threshold'));

// Published marker + save schema remains unchanged.
assert.match(html,/PLAYABLE CORE V2\.44/);
assert.match(html,/V2\.44 live：[^<]*陷阱[^<]*毒素武器/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.44-core',
  focus:'Skill 50 PROFESSION_TOXIN_WEAPON immediate custom weapon attack + per-hit poison',
  skillId:50,mpCost:5,
  poisonSuccess:'20+A-tier*2',
  poisonStoredTurns:6,
  weaponRules:'melee/bound/break single raw; bow full aBowW list; boomerang five-slot row x0.3',
  attackCount:'not used',
  order:'DamageSub/WakeUp/ItemCrush -> poison StatusAttackCheck',
  saveSchema:30
}));
