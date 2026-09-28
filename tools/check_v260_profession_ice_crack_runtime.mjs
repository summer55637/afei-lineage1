import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const workflow=fs.readFileSync('.github/workflows/generate-item-make-runtime.yml','utf8');
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

const row=runtime.bySkillId['4'];
assert.ok(row);
assert.equal(row.name,'冰爆术');
assert.equal(row.func,'PROFESSION_ICE_CRACK');
assert.equal(row.option,'冰|1|1|320|240|2700|3800|0|320|240');
assert.equal(row.professionClass,2);
assert.equal(row.target,3);
assert.equal(row.kind,1);
assert.equal(row.costMp,10);
assert.equal(row.img1,101697);
assert.equal(row.img2,101651);
assert.equal(row.commonCommand,'BATTLE_COM_S_ICE_CRACK');

const supportCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_ICE_CRACK',4),true);

const levelM=level=>{
  level=Math.trunc(Number(level)||0);
  if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;
  if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;
};
const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,sourceProfessionMagicLevelM:levelM};
vm.createContext(costCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [raw,cost] of [[10,30],[20,30],[30,40],[40,40],[50,50],[60,50],[70,60],[80,60],[90,70],[100,80]]){
  const x=costCtx.sourceProfessionMagicCostPlan('PROFESSION_ICE_CRACK',raw,row.option);
  assert.equal(x.dynamic,true);
  assert.equal(x.cost,cost);
}

const dexCtx={
  Math,Number,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  battleDexRoll:()=>999,
  sourceCRandMacroValue:()=>0
};
vm.createContext(dexCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleDexRoll'),dexCtx);
let dexArgs=null;
const dex=dexCtx.sourceProfessionBattleDexRoll(
  {commonCommand:'BATTLE_COM_S_ICE_CRACK'},80,
  {randMacro:(a,b)=>{dexArgs=[a,b];return 25;}}
);
assert.deepEqual(dexArgs,[0,50]);
assert.equal(dex,75);

const logs=[];
const execCtx={
  Math,Number,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionPlayerMagicSameSide:toNo=>toNo<10,
  addLog:(...args)=>logs.push(args)
};
vm.createContext(execCtx);
vm.runInContext(extractFunction(game,'sourceProfessionIceCrackExecute'),execCtx);

let out=execCtx.sourceProfessionIceCrackExecute({
  skillId:4,functionName:'PROFESSION_ICE_CRACK',
  toNo:21,displayLevel:87
},'冰爆術');
assert.equal(out.handled,true);
assert.equal(out.noAction,true);
assert.equal(out.reason,'source-ice-queue-executor-commented');
assert.equal(out.rawToNo,21);
assert.equal(out.sourceQueueWrite.use,true);
assert.equal(out.sourceQueueWrite.bout,2);
assert.equal(out.sourceQueueWrite.toNo,21);
assert.equal(out.sourceQueueWrite.rawSkillLevel,87);
assert.equal(out.sourceQueueWrite.sourceCapacity,20);
assert.equal(out.sourceQueueWrite.sourceWrapAt20,true);
assert.equal(out.sourceQueueExecutorCommentedOut,true);
assert.equal(out.sourceDormantMagicAttackUnreachable,true);
assert.equal(out.sourceDormantIceCrackSlotsUnreachable,true);
assert.equal(logs.length,1);

out=execCtx.sourceProfessionIceCrackExecute({
  skillId:4,functionName:'PROFESSION_ICE_CRACK',
  toNo:0,displayLevel:87
},'冰爆術');
assert.equal(out.noAction,true);
assert.equal(out.reason,'same-side-target');
assert.equal(logs.length,1);

const iceFn=extractFunction(game,'sourceProfessionIceCrackExecute');
assert.equal(iceFn.includes('sourceProfessionMagicPracticePower'),false);
assert.equal(iceFn.includes('sourceProfessionMagicEnemyDodge'),false);
assert.equal(iceFn.includes('sourceProfessionMagicGetDamage'),false);
assert.equal(iceFn.includes('battleStatusApply'),false);
assert.equal(iceFn.includes('cRand('),false);

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("prepared.functionName==='PROFESSION_ICE_CRACK'"));
assert.ok(dispatcher.includes('sourceProfessionIceCrackExecute(prepared,magicName)'));
assert.ok(dispatcher.indexOf("prepared.functionName==='PROFESSION_ICE_CRACK'")<dispatcher.indexOf('if(toNo<10)'));

const dexFn=extractFunction(game,'sourceProfessionBattleDexRoll');
assert.ok(dexFn.includes("command!=='BATTLE_COM_S_ICE_CRACK'"));
assert.ok(dexFn.includes("command==='BATTLE_COM_S_ICE_CRACK'"));

assert.ok(game.includes('sourceQueueExecutorCommentedOut:true'));
assert.ok(game.includes('sourceDormantMagicAttackUnreachable:true'));
assert.ok(game.includes('sourceDormantIceCrackSlotsUnreachable:true'));

assert.ok(workflow.includes('"tools/check_v260_profession_ice_crack_runtime.mjs"'));
assert.ok(workflow.includes('Run V2.60 Ice Crack regression'));
for(const v of ['2.59','2.60'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.60 live：[^<]*冰爆術/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.60-core',focus:'Skill 4 ICE_CRACK',
  mp:'M-tier 1-2=30,3-4=40,5-6=50,7-8=60,9=70,10=80',
  dex:'WORKQUICK+20 - RAND(0, work*0.5)',
  live:'queue write + COM NONE + NoAction',
  dormant:'ice_bout executor and delayed 10-slot magic chain are commented out in pinned C',
  saveSchema:30
}));
