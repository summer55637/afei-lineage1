import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
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

const logs=[];
const ctx={
  Math,Number,String,Object,Array,Date,
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
  professionEncounterFix:0,professionEncounterUntilSec:0,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  addLog:(text,type)=>logs.push({text,type}),
  cRand:()=>0,sourceRandModulo:()=>0
};
vm.createContext(ctx);
for(const name of [
  'sourceProfessionMagicLevelM','sourceProfessionSkillTemplate',
  'sourcePlayerProfessionSkillAt','sourcePlayerProfessionSkillDisplayLevel',
  'sourceProfessionMagicCostPlan','sourceProfessionSkillMpCost',
  'sourceProfessionCommonCommandPlan','sourceProfessionSkillUsePreflight',
  'sourceProfessionLevelCheckPlan','sourceProfessionLevelCheckApply',
  'sourceProfessionSkillProficiencyRollPlan','sourceProfessionSkillProficiencyApply',
  'sourceProfessionSkillPostDispatchProficiency','sourceProfessionLogProficiencyResult',
  'sourceProfessionSkillStatusRow','sourceProfessionSkillStatusString','sourceProfessionSkillMenu',
  'sourceProfessionKindSemantic','sourceProfessionTargetSemantic','sourceProfessionTargetToNo',
  'sourceProfessionBattleCommandPlan','sourceProfessionEncounterRate',
  'sourceProfessionEncounterRollPlan','sourceProfessionOutOfBattleSkillPlan',
  'sourceProfessionOutOfBattleSkillUse'
])vm.runInContext(extractFunction(game,name),ctx);

const blank=()=>({
  professionClass:3,professionLevel:1,professionSkillPoint:0,
  professionSkills:Array(26).fill(null),mp:100
});

// Exact S-status field order, with dynamic/fallback MP and raw/100 level.
let p=blank();
p.professionSkills[2]={skillId:44,rawLevel:7000};
p.professionSkills[5]={skillId:45,rawLevel:7000};
let row=ctx.sourceProfessionSkillStatusRow(2,p);
assert.deepEqual(JSON.parse(JSON.stringify(row)),{
  slot:2,useFlag:0,skillId:44,targetType:3,kind:2,icon:29222,
  costMp:13,displayLevel:70,rawLevel:7000,
  name:'追寻敌踪',text:'提升遇敌机率',functionName:'PROFESSION_TRACK'
});
assert.equal(
  ctx.sourceProfessionSkillStatusString(2,p),
  '0|44|3|2|29222|13|70|追寻敌踪|提升遇敌机率'
);
const menu=ctx.sourceProfessionSkillMenu(p);
assert.equal(menu.length,26);
assert.equal(menu[0],null);
assert.equal(menu[2].skillId,44);
assert.equal(menu[5].skillId,45);

// Battle command uses SLOT, not Skill ID.
let cmd=ctx.sourceProfessionBattleCommandPlan({slot:2,toNo:20,target:p});
assert.equal(cmd.ok,true);
assert.equal(cmd.slot,2);
assert.equal(cmd.skillId,44);
assert.equal(cmd.command,'P|2|14');
assert.equal(cmd.clientBattleUse,false); // metadata only; server top-level Use itself does not gate USE_FLAG.
const autoTargetCmd=ctx.sourceProfessionBattleCommandPlan({slot:2,toNo:null,target:p});
assert.equal(autoTargetCmd.ok,true);
assert.equal(autoTargetCmd.toNo,21); // TARGET=ALLOTHERSIDE, player BattleMyNo=0.
assert.equal(autoTargetCmd.command,'P|2|15');

// Track: display 70 -> (70/10)*5 = +35, MP first, 180s Work timer.
let rngCalls=[];
let use=ctx.sourceProfessionOutOfBattleSkillUse({
  slot:2,target:p,nowMs:1000_000,
  randModulo:()=>{throw new Error('first use must not consume modulo')},
  randInclusive:(a,b)=>{rngCalls.push([a,b]);return a===0&&b===10000?7001:0}
});
assert.equal(use.ok,true);
assert.equal(use.encounterFix,35);
assert.equal(use.dispatchRet,1);
assert.equal(use.protocolWouldReject,false);
assert.equal(use.untilSec,1180);
assert.equal(p.mp,87);
assert.equal(ctx.professionEncounterFix,35);
assert.equal(ctx.professionEncounterUntilSec,1180);
assert.equal(p.professionSkills[2].rawLevel,7001);
assert.deepEqual(rngCalls,[[0,10000],[0,0]]);

// Re-use before expiry: MP and effect still apply/refresh, callback ret=-1, protocol would reject.
// rand()%10 >5 means proficiency is skipped.
p.mp=100;
use=ctx.sourceProfessionOutOfBattleSkillUse({
  slot:2,target:p,nowMs:1010_000,
  randModulo:()=>6,
  randInclusive:()=>{throw new Error('ret=-1 >5 must skip proficiency RNG')}
});
assert.equal(use.effectApplied,true);
assert.equal(use.dispatchRet,-1);
assert.equal(use.protocolWouldReject,true);
assert.equal(use.untilSec,1190);
assert.equal(p.mp,87);
assert.equal(ctx.professionEncounterFix,35);
assert.equal(p.professionSkills[2].rawLevel,7001);

// Escape flips sign and can replace the Work even though active ret remains -1.
p.mp=100;
use=ctx.sourceProfessionOutOfBattleSkillUse({
  slot:5,target:p,nowMs:1020_000,
  randModulo:()=>6,
  randInclusive:()=>{throw new Error('skipped')}
});
assert.equal(use.encounterFix,-35);
assert.equal(ctx.professionEncounterFix,-35);
assert.equal(ctx.professionEncounterUntilSec,1200);
assert.equal(p.mp,87);

// Encounter temp uses PRE-clamp CEP. 1 * 65 / 100 truncates to 0; normal CEP can later clamp to min.
let roll=ctx.sourceProfessionEncounterRollPlan(1,{nowMs:1100_000});
assert.equal(roll.pCep,-35);
assert.equal(roll.rollCep,0);
assert.equal(roll.expired,false);

// Expiry bug: clear Work now, but this ONE check still uses stale local p_cep.
roll=ctx.sourceProfessionEncounterRollPlan(40,{nowMs:1201_000});
assert.equal(roll.expired,true);
assert.equal(roll.pCep,-35);
assert.equal(roll.rollCep,26);
assert.equal(ctx.professionEncounterFix,0);
assert.equal(ctx.professionEncounterUntilSec,0);
roll=ctx.sourceProfessionEncounterRollPlan(40,{nowMs:1202_000});
assert.equal(roll.pCep,0);
assert.equal(roll.rollCep,40);

// Low display level can produce p_cep 0, and char_walk's p_cep!=0 branch therefore never clears NUM.
p=blank();p.professionSkills[0]={skillId:44,rawLevel:900};p.mp=100;
ctx.professionEncounterFix=0;ctx.professionEncounterUntilSec=0;
use=ctx.sourceProfessionOutOfBattleSkillUse({
  slot:0,target:p,nowMs:2000_000,
  randModulo:()=>0,randInclusive:()=>0
});
assert.equal(use.displayLevel,9);
assert.equal(use.encounterFix,0);
assert.equal(ctx.professionEncounterUntilSec,2180);
roll=ctx.sourceProfessionEncounterRollPlan(10,{nowMs:2300_000});
assert.equal(roll.pCep,0);
assert.equal(roll.expired,false);
assert.equal(ctx.professionEncounterUntilSec,2180);

const walk=extractFunction(game,'walkEncounterStep');
assert.ok(walk.includes('const professionEncounter=sourceProfessionEncounterRollPlan(cep);'));
assert.ok(walk.indexOf('sourceProfessionEncounterRollPlan(cep)')<walk.indexOf('if(cep<min)cep=min;'));
assert.ok(walk.includes('if(roll<rollCep){'));

assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.24',
  focus:'profession status/command slot bridge + TRACK/ESCAPE live encounter Work',
  battleCommand:'P|slotHex|toNoHex',
  outOfBattleSkillIds:[44,45],durationSec:180,ratePerTenLevels:5,
  transientWork:true,saveSchema:30
}));
