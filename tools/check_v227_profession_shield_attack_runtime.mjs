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

let roll=1;
let alive=true;
let hasStatus=false;
const ctx={
  Math,Number,Object,
  PLAYER_SHIELD_SLOT:6,
  state:null,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourcePlayerItemSlots:t=>t?.slots||Array(24).fill(null),
  sourcePlayerEquipTemplateForExisting:(idx,t)=>t?.templates?.[idx]||null,
  cRand:()=>roll,
  battleStatusDescAlive:()=>alive,
  battleHasAnyStatus:()=>hasStatus
};
vm.createContext(ctx);
for(const name of [
  'sourceProfessionBattleFunctionSupported',
  'sourceProfessionPlayerShieldEquipped',
  'sourceProfessionShieldAttackPower',
  'sourceProfessionStatusAttackCheck'
])vm.runInContext(extractFunction(game,name),ctx);

// Fixed runtime row.
const row=runtime.bySkillId['38'];
assert.ok(row);
assert.equal(row.name,'盾击');
assert.equal(row.func,'PROFESSION_SHIELD_ATTACK');
assert.equal(row.commonCommand,'BATTLE_COM_S_SHIELD_ATTACK');
assert.equal(row.target,1);
assert.equal(row.kind,1);
assert.equal(row.useFlag,1);
assert.equal(row.costMp,5);
assert.equal(row.option,'晕|成%30|效%2|回%2');
assert.equal(ctx.sourceProfessionBattleFunctionSupported('PROFESSION_SHIELD_ATTACK'),true);

// Shield gate is ITEM_WSHIELD type 25 in CHAR_EQSHIELD / player slot 6.
let p={slots:Array(24).fill(null),templates:{}};
assert.equal(ctx.sourceProfessionPlayerShieldEquipped(p).equipped,false);
p.slots[6]=123;
p.templates[123]={type:4};
assert.equal(ctx.sourceProfessionPlayerShieldEquipped(p).equipped,false);
p.templates[123]={type:25};
assert.equal(ctx.sourceProfessionPlayerShieldEquipped(p).equipped,true);

// fixed: tier 10 keeps current WORKATTACKPOWER; every other tier halves it.
assert.equal(ctx.sourceProfessionShieldAttackPower(101,0),50);
assert.equal(ctx.sourceProfessionShieldAttackPower(101,9),50);
assert.equal(ctx.sourceProfessionShieldAttackPower(101,10),101);

// PROFESSION_BATTLE_StatusAttackCheck: RAND first, strict < threshold, then early returns.
roll=49;alive=true;hasStatus=false;
let chk=ctx.sourceProfessionStatusAttackCheck({},50);
assert.equal(chk.success,true);
assert.equal(chk.roll,49);
roll=50;
chk=ctx.sourceProfessionStatusAttackCheck({},50);
assert.equal(chk.success,false);
roll=1;alive=false;
chk=ctx.sourceProfessionStatusAttackCheck({},70);
assert.equal(chk.success,false);
assert.equal(chk.roll,1);
assert.equal(chk.reason,'dead-or-missing');
alive=true;hasStatus=true;roll=1;
chk=ctx.sourceProfessionStatusAttackCheck({},70);
assert.equal(chk.success,false);
assert.equal(chk.roll,1);
assert.equal(chk.reason,'existing-status');

// Execution branch details.
const shieldExec=extractFunction(game,'sourceProfessionShieldAttackExecute');
assert.ok(shieldExec.includes('sourceProfessionPlayerShieldEquipped(state)'));
assert.ok(shieldExec.includes("reason:'shield-required'"));
assert.ok(shieldExec.includes('sourceProfessionShieldAttackPower(base?.attack,prepared.attackSkillTier)'));
assert.ok(shieldExec.includes("sourceProfessionPhysicalCalcOnlyResult(target,{attackerOverride:{attack:attackPower}})"));
assert.ok(shieldExec.includes("{suppressSuitPoison:true}"));
assert.ok(shieldExec.includes('const success=30+prepared.attackSkillTier*4'));
assert.ok(shieldExec.includes('sourceProfessionStatusAttackCheck(targetDesc,success)'));
assert.ok(shieldExec.includes("battleStatusApply(targetDesc,'dizzy',2)"));
assert.ok(shieldExec.includes('target.guardThisTurn=false'));
assert.ok(shieldExec.includes('dizzyStoredTurns:applied?3:0'));
assert.ok(shieldExec.includes('noOrdinaryCounter:true'));

// ItemCrush is inside applyFriendlyEnemyHit and therefore must occur before the later dizzy roll.
assert.ok(shieldExec.indexOf("applyFriendlyEnemyHit('player','你',target,r,null,{suppressSuitPoison:true})")
  <shieldExec.indexOf('sourceProfessionStatusAttackCheck(targetDesc,success)'));

// Status roll only runs for source NORMAL/CRITICAL equivalent, never dodge/miss.
assert.ok(shieldExec.includes('const sourceHit=!r.dodged&&!r.miss'));
assert.ok(shieldExec.includes('if(sourceHit){'));

// Shield is checked only on battle execution, not command receipt, so MP/proficiency can already be spent.
const prepare=extractFunction(game,'sourceProfessionBattleSkillPrepare');
assert.equal(prepare.includes('sourceProfessionPlayerShieldEquipped'),false);
assert.ok(prepare.indexOf('target.mp=plan.use.mpAfter')
  <prepare.indexOf('sourceProfessionSkillPostDispatchProficiency'));

const exec=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(exec.includes("if(prepared.functionName==='PROFESSION_SHIELD_ATTACK')"));
assert.ok(exec.includes('return sourceProfessionShieldAttackExecute(target,prepared,name);'));

assert.match(html,/PLAYABLE CORE V2\.27/);
assert.match(html,/V2\.27 live：暴擊／連環攻擊／雙重攻擊／盾擊。/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.27',
  focus:'PROFESSION_SHIELD_ATTACK shield gate + half attack + strict profession dizzy',
  liveSkillId:38,
  mpCost:5,
  successPct:'30+tier*4',
  fixedStoredDizzyTurns:3,
  saveSchema:30
}));
