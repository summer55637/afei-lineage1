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
  assert.ok(pe>=0,'unterminated params '+name);
  const bs=source.indexOf('{',pe);
  assert.ok(bs>=0,'missing body '+name);
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

const row=runtime.bySkillId['25'];
assert.ok(row);
assert.equal(row.name,'回避');
assert.equal(row.func,'PROFESSION_AVOID');
assert.equal(row.commonCommand,'BATTLE_COM_S_AVOID');
assert.equal(row.professionClass,1);
assert.equal(row.target,1);
assert.equal(row.kind,2);
assert.equal(row.useFlag,1);
assert.equal(row.costMp,0);
assert.equal(row.option,'回');

const ctx={
  Math,Number,String,Object,Array,
  PROFESSION_CLASS_NONE:0,
  PROFESSION_SKILL_SLOT_COUNT:26,
  state:null,
  battlePlayerAvoidWork:null,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  cRand:(a,b)=>Math.trunc((Number(a)+Number(b))/2),
  battleDuckChance:()=>7500,
  sourceProfessionChaosDuckRaw:null
};
vm.createContext(ctx);
for(const name of [
  'sourceProfessionAttackSkillTier',
  'sourceProfessionPlayerAvoidRefresh',
  'sourceProfessionPlayerAvoidApply',
  'sourceProfessionChaosDuckRaw',
  'sourceBattleDuckTotal'
])vm.runInContext(extractFunction(game,name),ctx);

const target={professionClass:1};
ctx.state=target;
let skills=Array(26).fill(null);
skills[3]={skillId:25,rawLevel:6000};
ctx.sourcePlayerProfessionSkillAt=i=>skills[i]?{slot:i,...skills[i]}:null;
ctx.sourceProfessionSkillTemplate=id=>id===25?row:null;
ctx.sourcePlayerProfessionSkillDisplayLevel=e=>Math.trunc(Number(e.rawLevel)/100);

// Sparse slots use continue and still find Skill 25.
let work=ctx.sourceProfessionPlayerAvoidRefresh(target,'fixture');
assert.equal(work.active,true);
assert.equal(work.slot,3);
assert.equal(work.tier,5);
assert.equal(work.mod,10);

// Preserve fixed discontinuity: tier5=10, tier6=3.
skills[3]={skillId:25,rawLevel:6100};
work=ctx.sourceProfessionPlayerAvoidRefresh(target,'tier6');
assert.equal(work.tier,6);
assert.equal(work.mod,3);

// Profession mismatch is a source RETURN boundary.
target.professionClass=3;
work=ctx.sourceProfessionPlayerAvoidRefresh(target,'wrong-class');
assert.equal(work.active,false);
assert.equal(work.reason,'profession-mismatch-terminator');
target.professionClass=1;

// int parameter boundary happens even when mod=0.
let applied=ctx.sourceProfessionPlayerAvoidApply(1234.9,{active:true,mod:0});
assert.equal(applied.input,1234);
assert.equal(applied.after,1234);

// After ordinary 75% cap, Profession Avoid can exceed it with no re-cap.
applied=ctx.sourceProfessionPlayerAvoidApply(7500,{active:true,mod:10});
assert.equal(applied.after,8250);

// sourceBattleDuckTotal: Avoid runs after cap/HITRIGHT, before CHAOS.
const enemyAttacker={type:'enemy',drunk:false};
let playerDefender={type:'player',professionAvoidActive:true,professionAvoidMod:10,duckBonus:0};
ctx.battleDuckChance=()=>7500;
assert.equal(ctx.sourceBattleDuckTotal(enemyAttacker,playerDefender,{}),8250);

playerDefender={type:'player',professionAvoidActive:true,professionAvoidMod:15,duckBonus:0};
assert.equal(ctx.sourceBattleDuckTotal(enemyAttacker,playerDefender,{sourceProfessionChaos:true}),12075);

// Player HITRIGHT is subtracted before Profession Avoid.
ctx.cRand=(a,b)=>{
  if(Number(a)===80&&Number(b)===120)return 100;
  throw new Error('unexpected RNG '+a+'..'+b);
};
assert.equal(ctx.sourceBattleDuckTotal(
  {type:'player',hitRight:100,drunk:false},
  {type:'player',professionAvoidActive:true,professionAvoidMod:15,duckBonus:0},
  {}
),8510); // (7500-100)*1.15

// Without active WORK_P_DUCK there is no int-boundary truncation/multiplier.
ctx.battleDuckChance=()=>1234.9;
ctx.cRand=(a,b)=>Math.trunc((Number(a)+Number(b))/2);
assert.equal(ctx.sourceBattleDuckTotal(
  enemyAttacker,{type:'player',professionAvoidActive:false,professionAvoidMod:0,duckBonus:0},{}
),1234.9);

// Active command is source-valid at receipt but assist executor has no matching case.
const supported=extractFunction(game,'sourceProfessionBattleFunctionSupported');
const sctx={};
vm.createContext(sctx);
vm.runInContext(supported,sctx);
assert.equal(sctx.sourceProfessionBattleFunctionSupported('PROFESSION_AVOID'),true);

const exec=extractFunction(game,'sourceProfessionBattleSkillExecute');
const avoidAt=exec.indexOf("prepared.functionName==='PROFESSION_AVOID'");
const rebackAt=exec.indexOf("prepared.functionName==='PROFESSION_REBACK'");
assert.ok(avoidAt>=0&&rebackAt>avoidAt);
const avoidBranch=exec.slice(avoidAt,rebackAt);
assert.ok(avoidBranch.includes("reason:'source-avoid-assist-no-case'"));
assert.ok(avoidBranch.includes('sourceAssistNoCase:true'));
assert.equal(avoidBranch.includes('battlePlayerAvoidWork'),false);

// Successful ordinary Player dodge still owns the V2.23 proficiency hook.
const initial=extractFunction(game,'sourceInitialDodgeOnly');
assert.ok(initial.includes("defender?.type==='player'?sourceProfessionPlayerNormalDodgeEvent(state):null"));

// Player battle view exports the Work snapshot to DuckCheck.
const view=extractFunction(game,'playerBattleView');
assert.ok(view.includes('professionAvoidActive:!!battlePlayerAvoidWork?.active'));
assert.ok(view.includes('professionAvoidMod:Math.trunc(n(battlePlayerAvoidWork?.mod))'));

// Battle entry and source-accurate post-move Status_init refresh both Avoid and Weapon Focus.
const entry=extractFunction(game,'sourceInitPlayerSideEntrySnapshot');
assert.ok(entry.indexOf("sourceProfessionPlayerAvoidRefresh(state,'battle-entry')")
  <entry.indexOf("sourceProfessionPlayerWeaponFocusRefresh(state,'battle-entry')"));
const move=extractFunction(game,'sourcePlayerMoveItem');
const avoidMove=move.indexOf("sourceProfessionPlayerAvoidRefresh(target,'weapon-change')");
const focusMove=move.indexOf("sourceProfessionPlayerWeaponFocusRefresh(target,'weapon-change')");
assert.ok(avoidMove>=0&&focusMove>avoidMove);
assert.ok(move.includes('moved.postMoveEquipPlace===PLAYER_ARM_SLOT'));

// Reset is battle-local; schema remains unchanged.
const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battlePlayerAvoidWork=null'));

assert.match(html,/PLAYABLE CORE V2\.38/);
assert.match(html,/V2\.38 live：[^<]*回避/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.37',
  focus:'Skill 25 PROFESSION_AVOID WORK_P_DUCK / BATTLE_check_profession_duck lifecycle',
  skillId:25,
  modifier:'tier<=5 ? tier*2 : (tier-5)*3',
  order:'75% cap -> HITRIGHT -> Avoid int multiply -> Chaos +40%',
  sourceBugs:[
    'tier5=10 but tier6 drops to 3',
    'Avoid runs after 75% cap and is not recapped',
    'active BATTLE_COM_S_AVOID routes to assist function with no matching case'
  ],
  saveSchema:30
}));
