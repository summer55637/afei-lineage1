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

const ctx={
  Math,Number,String,Object,Array,
  PROFESSION_SKILL_SLOT_COUNT:26,PROFESSION_SKILL_LEVEL_MAX:100,
  professionSkillDb:runtime,state:null,
  SOURCE_PROFESSION_TARGET:{
    MYSELF:0,OTHER:1,ALL_MYSIDE:2,ALLOTHERSIDE:3,ALL:4,NONE:5,
    OTHER_WITHOUT_MYSELF:6,WITHOUT_MYSELF_AND_PET:7,ONE_ROW:8,ONE_LINE:9,DEATH:10
  },
  SOURCE_PROFESSION_KIND:{BATTLE:1,ASSIST:2,ADVANCE:3},
  SOURCE_PROFESSION_BATTLE_TO_NO:{
    SIDE_0:20,SIDE_1:21,ALL:22,SIDE_1_B_ROW:23,SIDE_1_F_ROW:24,SIDE_0_F_ROW:25,SIDE_0_B_ROW:26
  },
  n:v=>Number.isFinite(Number(v))?Number(v):0
};
vm.createContext(ctx);
for(const name of [
  'sourceProfessionMagicLevelM','sourceProfessionSkillTemplate',
  'sourcePlayerProfessionSkillAt','sourcePlayerProfessionSkillDisplayLevel',
  'sourceProfessionMagicCostPlan','sourceProfessionSkillMpCost',
  'sourceProfessionCommonCommandPlan','sourceProfessionSkillUsePreflight',
  'sourceProfessionKindSemantic','sourceProfessionTargetSemantic','sourceProfessionTargetToNo',
  'sourceProfessionBattleCommandPlan','sourceProfessionAttackSkillTier',
  'sourceProfessionBattleFunctionSupported'
])vm.runInContext(extractFunction(game,name),ctx);

// fixed client KIND semantics.
assert.equal(ctx.sourceProfessionKindSemantic(1),'battle');
assert.equal(ctx.sourceProfessionKindSemantic(2),'assist');
assert.equal(ctx.sourceProfessionKindSemantic(3),'advance');

// fixed client PETSKILL TARGET enum -> battle toNo.
assert.equal(ctx.sourceProfessionTargetToNo({targetType:0,battleMyNo:0}).toNo,0);
assert.equal(ctx.sourceProfessionTargetToNo({targetType:5,battleMyNo:0}).toNo,0);
assert.equal(ctx.sourceProfessionTargetToNo({targetType:1,selectedToNo:17,battleMyNo:0}).toNo,17);
assert.equal(ctx.sourceProfessionTargetToNo({targetType:2,battleMyNo:0}).toNo,20);
assert.equal(ctx.sourceProfessionTargetToNo({targetType:2,battleMyNo:10}).toNo,21);
assert.equal(ctx.sourceProfessionTargetToNo({targetType:3,battleMyNo:0}).toNo,21);
assert.equal(ctx.sourceProfessionTargetToNo({targetType:3,battleMyNo:10}).toNo,20);
assert.equal(ctx.sourceProfessionTargetToNo({targetType:4,battleMyNo:0}).toNo,22);
assert.equal(ctx.sourceProfessionTargetToNo({targetType:9,selectedToNo:14,battleMyNo:0}).toNo,14);
assert.equal(ctx.sourceProfessionTargetToNo({targetType:10,selectedToNo:3,battleMyNo:0}).toNo,3);
assert.equal(ctx.sourceProfessionTargetToNo({targetType:1,battleMyNo:0}).reason,'target-unresolved');

const rowCases=[[0,26],[4,26],[5,25],[9,25],[10,23],[14,23],[15,24],[19,24]];
for(const [selected,toNo] of rowCases){
  const r=ctx.sourceProfessionTargetToNo({targetType:8,selectedToNo:selected,battleMyNo:0});
  assert.equal(r.ok,true);
  assert.equal(r.toNo,toNo,'row selected '+selected);
}

// fixed PROFESSION_CHANGE_SKILL_LEVEL_A boundary semantics.
assert.equal(ctx.sourceProfessionAttackSkillTier(0),0);
assert.equal(ctx.sourceProfessionAttackSkillTier(10),0);
assert.equal(ctx.sourceProfessionAttackSkillTier(11),1);
assert.equal(ctx.sourceProfessionAttackSkillTier(20),1);
assert.equal(ctx.sourceProfessionAttackSkillTier(21),2);
assert.equal(ctx.sourceProfessionAttackSkillTier(90),8);
assert.equal(ctx.sourceProfessionAttackSkillTier(91),9);
assert.equal(ctx.sourceProfessionAttackSkillTier(99),9);
assert.equal(ctx.sourceProfessionAttackSkillTier(100),10);

// First live profession physical skills come directly from pinned profession runtime.
assert.equal(runtime.bySkillId['22'].func,'PROFESSION_BRUST');
assert.equal(runtime.bySkillId['22'].commonCommand,'BATTLE_COM_S_BRUST');
assert.equal(runtime.bySkillId['22'].target,1);
assert.equal(runtime.bySkillId['22'].useFlag,1);
assert.equal(runtime.bySkillId['22'].kind,1);
assert.equal(runtime.bySkillId['23'].func,'PROFESSION_CHAIN_ATK');
assert.equal(runtime.bySkillId['23'].commonCommand,'BATTLE_COM_S_CHAIN_ATK');
assert.equal(runtime.bySkillId['23'].target,1);
assert.equal(runtime.bySkillId['23'].useFlag,1);
assert.equal(runtime.bySkillId['23'].kind,1);

const p={
  professionClass:1,professionLevel:1,professionSkillPoint:0,
  professionSkills:Array(26).fill(null),mp:100
};
p.professionSkills[0]={skillId:22,rawLevel:1000};
p.professionSkills[1]={skillId:23,rawLevel:9100};
let cmd=ctx.sourceProfessionBattleCommandPlan({slot:0,selectedToNo:10,battleMyNo:0,target:p});
assert.equal(cmd.ok,true);
assert.equal(cmd.command,'P|0|A');
assert.equal(cmd.toNo,10);
assert.equal(cmd.kindSemantic,'battle');
assert.equal(cmd.targetSemantic,'other');
assert.equal(cmd.use.decMp,7);
cmd=ctx.sourceProfessionBattleCommandPlan({slot:1,selectedToNo:19,battleMyNo:0,target:p});
assert.equal(cmd.ok,true);
assert.equal(cmd.command,'P|1|13');
assert.equal(cmd.displayLevel,91);
assert.equal(ctx.sourceProfessionAttackSkillTier(cmd.displayLevel),9);

// Command-receipt lifecycle must happen before battle sorting / StatusSeq.
const prepare=extractFunction(game,'sourceProfessionBattleSkillPrepare');
assert.ok(prepare.indexOf('sourceProfessionBattleFunctionSupported')<prepare.indexOf('target.mp=plan.use.mpAfter'));
assert.ok(prepare.indexOf('target.mp=plan.use.mpAfter')<prepare.indexOf('sourceProfessionSkillPostDispatchProficiency'));
const turn=extractFunction(game,'attackTurn');
assert.ok(turn.indexOf('sourceProfessionBattleSkillPrepare')<turn.indexOf('normalBattleOrder'));
assert.ok(turn.indexOf('normalBattleOrder')<turn.indexOf('processBattleStatusTurn'));
assert.ok(
  turn.includes("playerCommand:professionPrepared?'profession':'attack'")
  ||turn.includes("playerCommand:(professionPrepared||chargeForOrder)?'profession':'attack'")
);

// battle_profession_attack_fun quirks:
// CHAIN proc RNG precedes the first AttackSeq-equivalent hit.
// First profession hit is calc-only Guardian and has no SUITPOISON branch.
// BRUST changes FIXSTR in source but current BATTLE_DamageCalc reads WORKATTACKPOWER,
// so Web must not manufacture a damage multiplier.
// CHAIN second hit is one normal BATTLE_Attack and does not enter ordinary Counter.
const exec=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(exec.indexOf('chainRoll=cRand(1,100)')<exec.indexOf('sourceProfessionPhysicalCalcOnlyResult(target)'));
assert.ok(exec.includes('suppressSuitPoison:true'));
assert.ok(exec.includes('sourceBrustAttackPowerUnchanged:true'));
assert.ok(exec.includes('sourceFixedStrMultiplier=prepared.attackSkillTier*3+100'));
assert.ok(exec.includes('second=playerAttackResult(target)'));
assert.ok(exec.includes("suppressDamageReact:prepared.functionName!=='PROFESSION_CHAIN_ATK'"));
assert.equal(exec.includes('resolvePlayerEnemyCounterChain'),false);
assert.equal(exec.includes('sourceProcessBattleDeathsAtAddProfit'),false);

const calcOnly=extractFunction(game,'sourceProfessionPhysicalCalcOnlyResult');
assert.ok(calcOnly.includes('enemyGuardianFor(target,null)'));
assert.ok(calcOnly.includes("guardianSourceBug='battle_profession_attack_fun-defindex-not-updated'"));
assert.ok(calcOnly.includes('r.actualTarget=target'));

assert.match(html,/PLAYABLE CORE V\d+\.\d+/);
assert.match(html,/id="professionBattleActions"/);
assert.match(html,/id="professionBattleInfo"/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.25',
  focus:'fixed profession TARGET/KIND + live BRUST/CHAIN_ATK battle command lifecycle',
  targetEnum:'PETSKILL 0..10',
  directBattleNo:'0..19',pseudoBattleNo:'20..26',
  liveSkillIds:[22,23],saveSchema:30
}));
