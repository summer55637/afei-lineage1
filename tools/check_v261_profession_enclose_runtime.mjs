import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const workflow=fs.readFileSync('.github/workflows/generate-item-make-runtime.yml','utf8');
const readme=fs.readFileSync('README.md','utf8');
const changelog=fs.readFileSync('docs/changelog/part-07-v1.75-onward.md','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(src,name){
  const sig='function '+name+'(';const i=src.indexOf(sig);assert.ok(i>=0,'missing '+name);
  const op=src.indexOf('(',i);let pd=0,q=null,esc=false,line=false,block=false,cp=-1;
  for(let p=op;p<src.length;p++){const c=src[p],nx=src[p+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&nx==='/'){block=false;p++}continue}
    if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){line=true;p++;continue}
    if(c==='/'&&nx==='*'){block=true;p++;continue}
    if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue}
    if(c==='(')pd++;else if(c===')'&&--pd===0){cp=p;break}
  }
  assert.ok(cp>=0,'bad signature '+name);
  const bs=src.indexOf('{',cp);let d=0;q=null;esc=false;line=false;block=false;
  for(let p=bs;p<src.length;p++){const c=src[p],nx=src[p+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&nx==='/'){block=false;p++}continue}
    if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){line=true;p++;continue}
    if(c==='/'&&nx==='*'){block=true;p++;continue}
    if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue}
    if(c==='{')d++;else if(c==='}'&&--d===0)return src.slice(i,p+1);
  }
  throw new Error('unterminated '+name);
}

const row=runtime.bySkillId['5'];
assert.ok(row);
assert.equal(row.name,'附身术');
assert.equal(row.func,'PROFESSION_ENCLOSE');
assert.equal(row.option,'无|0|1|0|-60|0|0|0|0|60');
assert.equal(row.professionClass,2);
assert.equal(row.target,1);
assert.equal(row.kind,1);
assert.equal(row.costMp,10);
assert.equal(row.img1,101697);
assert.equal(row.img2,101643);
assert.equal(row.commonCommand,'BATTLE_COM_S_ENCLOSE');

const supportCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_ENCLOSE',5),true);

const levelM=level=>{
  level=Math.trunc(Number(level)||0);
  if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;
  if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;
};
const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionMagicLevelM:levelM};
vm.createContext(costCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [raw,cost] of [[10,50],[40,50],[50,60],[70,60],[80,70],[90,70],[100,80]]){
  const x=costCtx.sourceProfessionMagicCostPlan('PROFESSION_ENCLOSE',raw,row.option);
  assert.equal(x.dynamic,true);assert.equal(x.cost,cost);
}

const dexCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,battleDexRoll:()=>999,sourceCRandMacroValue:()=>0};
vm.createContext(dexCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleDexRoll'),dexCtx);
let dexArgs=null;
const dex=dexCtx.sourceProfessionBattleDexRoll(
  {commonCommand:'BATTLE_COM_S_ENCLOSE'},80,
  {randMacro:(a,b)=>{dexArgs=[a,b];return 30;}}
);
assert.deepEqual(dexArgs,[20,50]);
assert.equal(dex,70);

const specCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(specCtx);
vm.runInContext(extractFunction(game,'sourceProfessionEncloseSpec'),specCtx);
assert.deepEqual(JSON.parse(JSON.stringify(specCtx.sourceProfessionEncloseSpec(30))),{level:30,success:10,storedTurns:1,effectiveForcedTurns:0});
assert.deepEqual(JSON.parse(JSON.stringify(specCtx.sourceProfessionEncloseSpec(51))),{level:51,success:20,storedTurns:2,effectiveForcedTurns:1});
assert.deepEqual(JSON.parse(JSON.stringify(specCtx.sourceProfessionEncloseSpec(81))),{level:81,success:30,storedTurns:3,effectiveForcedTurns:2});
assert.equal(specCtx.sourceProfessionEncloseSpec(100).success,50);

const annexMap=new Map();
const annexCtx={
  Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,
  battleProfessionAnnexStates:annexMap,
  battleStatusKey:()=> 'enemy:e1',
  sourceProfessionEncloseSpec:specCtx.sourceProfessionEncloseSpec,
  sourceProfessionEncloseTargetHasAnyStatus:()=>false,
  cRand:()=>0
};
vm.createContext(annexCtx);
vm.runInContext(extractFunction(game,'sourceProfessionAnnexApply'),annexCtx);
let rolls=[50];
let a=annexCtx.sourceProfessionAnnexApply({},100,{randInclusive:()=>rolls.shift(),hasAnyStatus:()=>false});
assert.equal(a.applied,true);assert.equal(a.turns,3);assert.equal(a.effectiveForcedTurns,2);
annexMap.clear();
a=annexCtx.sourceProfessionAnnexApply({},100,{randInclusive:()=>51,hasAnyStatus:()=>false});
assert.equal(a.applied,false);assert.equal(a.reason,'success-roll');
annexMap.clear();
let called=false;
a=annexCtx.sourceProfessionAnnexApply({},100,{randInclusive:()=>{called=true;return 1},hasAnyStatus:()=>true});
assert.equal(a.blocked,true);assert.equal(a.roll,null);assert.equal(called,false);

const seqMap=new Map([['enemy:e1',{turns:3}]]);
const seqRolls=[1,7];
const seqCtx={
  Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,
  battleProfessionAnnexStates:seqMap,
  battleStatusKey:()=> 'enemy:e1',
  sourceBattleStatusSlot:()=>10,
  cRand:()=>0,
  sourcePlayerConfusionTargetableFromBattleSlot:()=>null
};
vm.createContext(seqCtx);
vm.runInContext(extractFunction(game,'sourceProfessionAnnexStatusSeq'),seqCtx);
let seq=seqCtx.sourceProfessionAnnexStatusSeq({},{
  randInclusive:()=>seqRolls.shift(),
  targetFromSlot:slot=>slot===18?{kind:'enemy',unitId:'e2'}:null
});
assert.equal(seq.beforeTurns,3);assert.equal(seq.turns,2);assert.equal(seq.forced,true);
assert.equal(seq.sideRoll,1);assert.equal(seq.posRoll,7);assert.equal(seq.targetSlot,18);
seqMap.set('enemy:e1',{turns:1});
let rngCount=0;
seq=seqCtx.sourceProfessionAnnexStatusSeq({},{
  randInclusive:()=>{rngCount++;return 0},
  targetFromSlot:()=>null
});
assert.equal(seq.expired,true);assert.equal(seq.forced,false);assert.equal(rngCount,0);

const execFn=extractFunction(game,'sourceProfessionEncloseExecute');
assert.ok(execFn.indexOf('sourceSetMagicPetMultiList(rawToNo)')<execFn.indexOf("sourceProfessionMagicPracticePower('BATTLE_COM_S_ENCLOSE'"));
assert.ok(execFn.indexOf('sourceProfessionMagicEnemyDodge')<execFn.indexOf('sourceProfessionMagicGetDamage'));
assert.ok(execFn.indexOf('unusedChangeStatusRoll=cRand(1,100)')<execFn.indexOf('sourceProfessionAnnexApply('));
assert.ok(execFn.includes('sourceMagicType:-1'));
assert.ok(execFn.includes('sourceNoElementPractice:true'));

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("prepared.functionName==='PROFESSION_ENCLOSE'"));
assert.ok(dispatcher.includes('sourceProfessionEncloseExecute(prepared,magicName)'));
assert.ok(dispatcher.indexOf("prepared.functionName==='PROFESSION_ENCLOSE'")<dispatcher.indexOf('if(toNo<10)'));

const process=extractFunction(game,'processBattleStatusTurn');
assert.ok(process.includes('sourceProfessionAnnexStatusSeq(desc)'));
assert.ok(process.includes('result.annexAttack=true'));
assert.equal((game.match(/if\(statusTurn\.annexAttack\)\{/g)||[]).length,3);
assert.ok(game.includes('function performProfessionAnnexAttack('));

assert.ok(workflow.includes('"tools/check_v261_profession_enclose_runtime.mjs"'));
assert.ok(workflow.includes('Run V2.61 Enclose regression'));
for(const v of ['2.60','2.61'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.61 live：[^<]*附身術/);
assert.ok(readme.includes('## V2.61 最新進度'));
assert.ok(changelog.includes('## V2.61 Skill 5 ENCLOSE / ANNEX'));
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.61-core',focus:'Skill 5 ENCLOSE / ANNEX',
  mp:'M-tier 1-4=50,5-7=60,8-9=70,10=80',
  dex:'WORKQUICK+20 - RAND(work*0.2, work*0.5)',
  annex:'raw success + stored 1/2/3; StatusSeq pre-decrement => forced 0/1/2',
  saveSchema:30
}));
