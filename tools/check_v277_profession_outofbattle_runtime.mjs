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
    const c=source[i],nn=source[i+1];
    if(lc){if(c==='\n')lc=false;continue}
    if(bc){if(c==='*'&&nn==='/'){bc=false;i++;}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='\x60'){q=c;continue}
    if(c==='/'&&nn==='/'){lc=true;i++;continue}
    if(c==='/'&&nn==='*'){bc=true;i++;continue}
    if(c==='(')pd++;
    else if(c===')'&&--pd===0){pe=i;break}
  }
  assert.ok(pe>=0,'unterminated params '+name);
  const bs=source.indexOf('{',pe);
  assert.ok(bs>=0,'missing body '+name);
  let d=0;q=null;esc=false;lc=false;bc=false;
  for(let i=bs;i<source.length;i++){
    const c=source[i],nn=source[i+1];
    if(lc){if(c==='\n')lc=false;continue}
    if(bc){if(c==='*'&&nn==='/'){bc=false;i++;}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='\x60'){q=c;continue}
    if(c==='/'&&nn==='/'){lc=true;i++;continue}
    if(c==='/'&&nn==='*'){bc=true;i++;continue}
    if(c==='{')d++;
    else if(c==='}'&&--d===0)return source.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const track=runtime.bySkillId['44'];
const escape=runtime.bySkillId['45'];
assert.ok(track);assert.ok(escape);

assert.deepEqual(
  {skillId:track.skillId,name:track.name,func:track.func,useFlag:track.useFlag,costMp:track.costMp,option:track.option,img1:track.img1,img2:track.img2},
  {skillId:44,name:'追寻敌踪',func:'PROFESSION_TRACK',useFlag:0,costMp:13,option:'倍%5|升',img1:101627,img2:101629}
);
assert.deepEqual(
  {skillId:escape.skillId,name:escape.name,func:escape.func,useFlag:escape.useFlag,costMp:escape.costMp,option:escape.option,img1:escape.img1,img2:escape.img2},
  {skillId:45,name:'回避战斗',func:'PROFESSION_ESCAPE',useFlag:0,costMp:13,option:'倍%5|降',img1:101629,img2:101638}
);

const logs=[];
const ctx={
  Math,Number,String,Object,Array,
  Date:{now:()=>200000},
  state:{professionClass:3,mp:50,hp:100},
  professionEncounterFix:0,
  professionEncounterUntilSec:0,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourcePlayerProfessionSkillAt:(slot)=>slot===0
    ?{slot:0,skillId:44}
    :slot===1?{slot:1,skillId:45}:null,
  sourceProfessionSkillTemplate:(id)=>runtime.bySkillId[String(id)]||null,
  sourcePlayerProfessionSkillDisplayLevel:()=>70,
  sourceProfessionSkillUsePreflight:({skillId,mp})=>({ok:true,mpAfter:mp-13,skillId}),
  sourceRandModulo:(m)=>0,
  cRand:(a,b)=>0,
  sourceProfessionSkillPostDispatchProficiency:({dispatchRet})=>({dispatchRet,ok:true}),
  sourceProfessionLogProficiencyResult:()=>{},
  addLog:(m)=>logs.push(m)
};
vm.createContext(ctx);
for(const name of [
  'sourceProfessionEncounterRate',
  'sourceProfessionEncounterRollPlan',
  'sourceProfessionOutOfBattleSkillPlan',
  'sourceProfessionOutOfBattleSkillUse'
])vm.runInContext(extractFunction(game,name),ctx);

assert.equal(ctx.sourceProfessionEncounterRate('倍%5|升'),5);
assert.equal(ctx.sourceProfessionEncounterRate('倍%5|降'),5);

let roll=ctx.sourceProfessionEncounterRollPlan(20,{nowMs:200000});
assert.deepEqual(JSON.parse(JSON.stringify(roll)),{
  baseCep:20,pCep:0,rollCep:20,nowSec:200,expired:false,workFixAfter:0,workUntilAfter:0
});

ctx.professionEncounterFix=30;
ctx.professionEncounterUntilSec=500;
roll=ctx.sourceProfessionEncounterRollPlan(20,{nowMs:200000});
assert.equal(roll.rollCep,26);
assert.equal(roll.pCep,30);
assert.equal(roll.expired,false);

ctx.professionEncounterUntilSec=100;
roll=ctx.sourceProfessionEncounterRollPlan(20,{nowMs:200000});
assert.equal(roll.expired,true);
assert.equal(roll.rollCep,26); // fixed char_walk uses stale pre-clear p_cep for this walk
assert.equal(ctx.professionEncounterFix,0);
assert.equal(ctx.professionEncounterUntilSec,0);

ctx.sourcePlayerProfessionSkillDisplayLevel=()=>70;
ctx.professionEncounterUntilSec=0;
let plan=ctx.sourceProfessionOutOfBattleSkillPlan({slot:0,target:ctx.state,nowMs:200000});
assert.equal(plan.ok,true);
assert.equal(plan.functionName,'PROFESSION_TRACK');
assert.equal(plan.displayLevel,70);
assert.equal(plan.level10,7);
assert.equal(plan.rate,5);
assert.equal(plan.encounterFix,35);
assert.equal(plan.untilSec,380);
assert.equal(plan.dispatchRet,1);
assert.equal(plan.img1,101627);
assert.equal(plan.img2,101629);

ctx.sourcePlayerProfessionSkillDisplayLevel=()=>100;
plan=ctx.sourceProfessionOutOfBattleSkillPlan({slot:1,target:ctx.state,nowMs:200000});
assert.equal(plan.ok,true);
assert.equal(plan.functionName,'PROFESSION_ESCAPE');
assert.equal(plan.level10,10);
assert.equal(plan.encounterFix,-50);
assert.equal(plan.img1,101629);
assert.equal(plan.img2,101638);

ctx.professionEncounterUntilSec=350;
ctx.sourcePlayerProfessionSkillDisplayLevel=()=>80;
plan=ctx.sourceProfessionOutOfBattleSkillPlan({slot:0,target:ctx.state,nowMs:200000});
assert.equal(plan.dispatchRet,-1);
assert.equal(plan.protocolWouldReject,true);
assert.equal(plan.encounterFix,40);

ctx.state.mp=50;
ctx.professionEncounterFix=0;
ctx.professionEncounterUntilSec=0;
ctx.sourcePlayerProfessionSkillDisplayLevel=()=>60;
const used=ctx.sourceProfessionOutOfBattleSkillUse({slot:0,target:ctx.state,nowMs:200000,randModulo:ctx.sourceRandModulo,randInclusive:ctx.cRand});
assert.equal(used.ok,true);
assert.equal(used.effectApplied,true);
assert.equal(used.encounterFix,30);
assert.equal(used.workFix,30);
assert.equal(used.workUntilSec,380);
assert.equal(used.animation.img1,101627);
assert.equal(used.animation.img2,101629);
assert.equal(ctx.state.mp,37);

const usedAgain=ctx.sourceProfessionOutOfBattleSkillUse({slot:0,target:ctx.state,nowMs:200000,randModulo:ctx.sourceRandModulo,randInclusive:ctx.cRand});
assert.equal(usedAgain.protocolWouldReject,true);
assert.equal(usedAgain.dispatchRet,-1);
assert.equal(usedAgain.encounterFix,30);

assert.match(game,/function renderProfessionOutOfBattleActions/);
assert.match(game,/sourceProfessionOutOfBattleSkillUse\(\{slot,target:state\}\)/);
assert.match(game,/renderProfessionOutOfBattleActions\(\);/);
assert.match(game,/professionOutOfBattleActions/);
assert.match(game,/CHAR_ENCOUNT_FIX/);
assert.match(game,/CHAR_ENCOUNT_NUM/);

const html=fs.readFileSync('game.html','utf8');
assert.match(html,/PLAYABLE CORE V2\.77/);
assert.match(html,/id="professionOutOfBattleActions"/);
assert.match(html,/V2\.77 live：追尋敵蹤／回避戰鬥/);

console.log(JSON.stringify({
  pass:true,
  version:'V2.77-out-of-battle-profession',
  skills:'44 追尋敵蹤 / 45 回避戰鬥',
  encounterFix:'display level / 10 × option rate 5',
  durationSeconds:180,
  repeatUse:'fixed ret=-1 still overwrites Work after MP deduction',
  animations:'Track 101627/101629; Escape 101629/101638',
  saveSchema:30
}));
