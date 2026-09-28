import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(source,name){
  const marker='function '+name+'(';
  const start=source.indexOf(marker);
  assert.ok(start>=0,'missing '+name);
  const bs=source.indexOf('{',start);
  let d=0,q=null,esc=false,lc=false,bc=false;
  for(let i=bs;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(lc){if(c==='\n')lc=false;continue}
    if(bc){if(c==='*'&&n==='/'){bc=false;i++;}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='\x60'){q=c;continue}
    if(c==='/'&&n==='/'){lc=true;i++;continue}
    if(c==='/'&&n==='*'){bc=true;i++;continue}
    if(c==='{')d++;
    else if(c==='}'&&--d===0)return source.slice(start,i+1);
  }
  throw new Error('unterminated '+name);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const row=runtime.bySkillId['21'];
assert.ok(row);
assert.deepEqual(
  {skillId:row.skillId,name:row.name,func:row.func,professionClass:row.professionClass,target:row.target,kind:row.kind,costMp:row.costMp,option:row.option,commonCommand:row.commonCommand,img1:row.img1,img2:row.img2},
  {skillId:21,name:'移形换位',func:'PROFESSION_TRANSPOSE',professionClass:2,target:5,kind:2,costMp:10,option:'回%80|回%3',commonCommand:'BATTLE_COM_S_TRANSPOSE',img1:101697,img2:101695}
);

// Fixed C PROFESSION_CHANGE_SKILL_LEVEL_M + battle_event.c thresholds.
const profileCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(profileCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicLevelM'),profileCtx);
vm.runInContext(extractFunction(game,'sourceProfessionTransposeProfile'),profileCtx);

assert.deepEqual(JSON.parse(JSON.stringify(profileCtx.sourceProfessionTransposeProfile(1))),{skillLevel:1,avoid:10,turn:3});
assert.deepEqual(JSON.parse(JSON.stringify(profileCtx.sourceProfessionTransposeProfile(10))),{skillLevel:1,avoid:10,turn:3});
assert.deepEqual(JSON.parse(JSON.stringify(profileCtx.sourceProfessionTransposeProfile(11))),{skillLevel:2,avoid:10,turn:3});
assert.deepEqual(JSON.parse(JSON.stringify(profileCtx.sourceProfessionTransposeProfile(60))),{skillLevel:6,avoid:45,turn:4});
assert.deepEqual(JSON.parse(JSON.stringify(profileCtx.sourceProfessionTransposeProfile(80))),{skillLevel:8,avoid:50,turn:4});
assert.deepEqual(JSON.parse(JSON.stringify(profileCtx.sourceProfessionTransposeProfile(100))),{skillLevel:10,avoid:70,turn:5});

const logs=[];
const ctx={
  Math,Number,String,Object,Array,Map,
  state:{},
  battlePlayerSkillDuckTurns:0,
  battlePlayerSkillDuckPower:0,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  addLog:(m)=>logs.push(m),
  sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(id)]||null
};
vm.createContext(ctx);
for(const name of [
  'sourceProfessionMagicLevelM',
  'sourceProfessionTransposeProfile',
  'sourceProfessionTransposeExecute',
  'sourceProfessionTransposeStatusSeq',
  'sourceProfessionBattleFunctionSupported',
  'sourceProfessionBattleSkillExecute',
  'sourceProfessionTargetToNo',
  'resolveNormalAttack'
])vm.runInContext(extractFunction(game,name),ctx);

assert.equal(ctx.sourceProfessionBattleFunctionSupported('PROFESSION_TRANSPOSE',21),true);
assert.equal(ctx.sourceProfessionTargetToNo({targetType:5,selectedToNo:17,battleMyNo:0}).toNo,0);

let out=ctx.sourceProfessionBattleSkillExecute({
  ok:true,prepared:true,skillId:21,functionName:'PROFESSION_TRANSPOSE',toNo:0,displayLevel:100
},{});
assert.equal(out.handled,true);
assert.equal(out.skillId,21);
assert.equal(out.profile.avoid,70);
assert.equal(out.profile.turn,5);
assert.equal(out.skillDuckTurns,6);
assert.equal(out.skillDuckPower,70);
assert.equal(out.sourceTargetExpansion,'BATTLE_MultiList(defNo2)');
assert.equal(out.sourceTargetFilter,'charaindex===toindex');
assert.equal(out.img1,101697);
assert.equal(out.img2,101695);
assert.equal(ctx.battlePlayerSkillDuckTurns,6);
assert.equal(ctx.battlePlayerSkillDuckPower,70);

const again=ctx.sourceProfessionBattleSkillExecute({
  ok:true,prepared:true,skillId:21,functionName:'PROFESSION_TRANSPOSE',toNo:0,displayLevel:60
},{});
assert.equal(again.handled,true);
assert.equal(again.noAction,true);
assert.equal(again.reason,'existing-skill-duck');
assert.equal(ctx.battlePlayerSkillDuckTurns,6);
assert.equal(ctx.battlePlayerSkillDuckPower,70);

// Raw C status counter is turn+1, then StatusSeq decrements once per actor turn.
const counts=[];
for(let i=0;i<6;i++)counts.push(ctx.sourceProfessionTransposeStatusSeq());
assert.deepEqual(counts.map(x=>x.turns),[5,4,3,2,1,0]);
assert.equal(counts[5].expired,true);
assert.equal(ctx.battlePlayerSkillDuckTurns,0);
assert.equal(ctx.battlePlayerSkillDuckPower,0);

// Live dodge pipeline checks CHAR_MYSKILLDUCK before ordinary BATTLE_DuckCheck.
const dodgeRolls=[];
ctx.cRand=(a,b)=>{dodgeRolls.push([a,b]);return 0;};
const dodge=ctx.resolveNormalAttack(
  {type:'enemy',quick:100,fixedDex:100,drunk:false},
  {type:'player',quick:100,fixedDex:100,canMove:true,skillDuckPower:70}
);
assert.equal(dodge.dodged,true);
assert.equal(dodge.skillDuck,true);
assert.equal(dodge.skillDuckPower,70);
assert.equal(dodge.skillDuckRoll,0);
assert.deepEqual(dodgeRolls,[[0,99]]);

// Source lifecycle wiring remains in the actual game functions.
const view=extractFunction(game,'playerBattleView');
assert.ok(view.includes('skillDuckPower:battlePlayerSkillDuckTurns>0?Math.trunc(n(battlePlayerSkillDuckPower)):0'));
assert.ok(view.includes('skillDuckTurns:Math.max(0,Math.trunc(n(battlePlayerSkillDuckTurns)))'));
const status=extractFunction(game,'processBattleStatusTurn');
assert.ok(status.includes('sourceProfessionTransposeStatusSeq()'));
const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battlePlayerSkillDuckTurns=0;battlePlayerSkillDuckPower=0'));

assert.match(game,/function sourceProfessionTransposeExecute/);
assert.match(game,/functionName==='PROFESSION_TRANSPOSE'/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

const html=fs.readFileSync('game.html','utf8');
assert.match(html,/PLAYABLE CORE V2\.76/);
assert.match(html,/V2\.76 live：[^<]*移形換位/);

console.log(JSON.stringify({
  pass:true,
  version:'V2.76-live',
  focus:'Skill 21 PROFESSION_TRANSPOSE live battle execution',
  profile:'M-tier -> avoid 10/25/30/45/50/60/70; turns 3/4/5',
  rawCounter:'turn+1',
  dodge:'independent skill-duck roll before ordinary BATTLE_DuckCheck',
  saveSchema:30
}));
