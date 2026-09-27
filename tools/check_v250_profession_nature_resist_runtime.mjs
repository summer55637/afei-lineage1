import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(src,name){
  const sig='function '+name+'(';
  const i=src.indexOf(sig);
  assert.ok(i>=0,'missing '+name);
  const b=src.indexOf('{',i);
  let depth=0,quote=null,esc=false,line=false,block=false;
  for(let p=b;p<src.length;p++){
    const c=src[p],nx=src[p+1];
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='*'&&nx==='/'){block=false;p++;}continue;}
    if(quote){
      if(esc){esc=false;continue;}
      if(c==='\\'){esc=true;continue;}
      if(c===quote)quote=null;
      continue;
    }
    if(c==='/'&&nx==='/'){line=true;p++;continue;}
    if(c==='/'&&nx==='*'){block=true;p++;continue;}
    if(c==="'"||c==='"'||c.charCodeAt(0)===96){quote=c;continue;}
    if(c==='{')depth++;
    else if(c==='}'&&--depth===0)return src.slice(i,p+1);
  }
  throw new Error('unterminated '+name);
}

const row=runtime.bySkillId['66'];
assert.ok(row);
assert.equal(row.name,'自然威能');
assert.equal(row.func,'PROFESSION_RESIST_F_I_T');
assert.equal(row.option,'抗|成%100|回%3');
assert.equal(row.professionClass,3);
assert.equal(row.target,5);
assert.equal(row.costMp,14);
assert.equal(row.useFlag,1);
assert.equal(row.kind,3);
assert.equal(row.commonCommand,'BATTLE_COM_S_RESIST_F_I_T');

assert.ok(extractFunction(game,'sourceProfessionBattleFunctionSupported').includes('PROFESSION_RESIST_F_I_T'));

const costCtx={
  Math,Number,String,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:level=>{
    level=Math.trunc(Number(level)||0);
    if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;
    if(level>50)return 6;if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;
    if(level>10)return 2;return 1;
  }
};
vm.createContext(costCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [level,cost] of [[10,5],[60,10],[90,15],[100,20]]){
  const x=costCtx.sourceProfessionMagicCostPlan('PROFESSION_RESIST_F_I_T',level,'抗|成%100|回%3');
  assert.equal(x.dynamic,true);
  assert.equal(x.cost,cost);
}

const specCtx={
  Math,Number,String,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(id)]||null,
  sourceProfessionStatusOptionInt:(option,key,fallback=0)=>{
    const m=String(option||'').match(new RegExp(key+'%([+-]?\\d+)'));
    return m?Math.trunc(Number(m[1])):fallback;
  }
};
vm.createContext(specCtx);
for(const fn of ['sourceProfessionNatureResistTurns','sourceProfessionNatureResistUpValue','sourceProfessionNatureResistSpec']){
  vm.runInContext(extractFunction(game,fn),specCtx);
}
for(const [level,tier,up,stored] of [
  [1,0,2,4],[2,0,4,4],[5,0,10,4],[9,0,18,4],[10,0,20,4],
  [80,7,20,4],[81,8,20,5],[99,9,20,5],[100,10,20,6]
]){
  const s=specCtx.sourceProfessionNatureResistSpec({skillId:66,attackSkillTier:tier,displayLevel:level});
  assert.equal(s.upValue,up);
  assert.equal(s.storedTurns,stored);
  assert.equal(s.success,100+tier*4);
}

let active=false,rolls=0;
const checkCtx={
  Math,Number,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  cRand:()=>{throw new Error('injected RNG expected');},
  battleStatusDescAlive:()=>true,
  sourceProfessionPlayerResistStatusActive:()=>active
};
vm.createContext(checkCtx);
vm.runInContext(extractFunction(game,'sourceProfessionNatureResistStatusCheck'),checkCtx);
let ck=checkCtx.sourceProfessionNatureResistStatusCheck({kind:'player'},100,()=>{rolls++;return 100;});
assert.equal(rolls,1);
assert.equal(ck.success,true);
assert.equal(ck.roll,100);
assert.equal(ck.rollIgnored,true);
active=true;
ck=checkCtx.sourceProfessionNatureResistStatusCheck({kind:'player'},140,()=>{rolls++;return 1;});
assert.equal(rolls,2);
assert.equal(ck.success,false);
assert.equal(ck.reason,'existing-profession-resist');

const execCtx={
  Math,Number,String,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  battlePlayerProfessionResistState:null,
  battlePlayerProfessionResistWork:{fire:3,ice:4,thunder:5},
  battlePlayerProfessionResistMod:{fire:0,ice:0,thunder:0},
  sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(id)]||null,
  sourceProfessionStatusOptionInt:specCtx.sourceProfessionStatusOptionInt,
  sourceProfessionNatureResistTurns:specCtx.sourceProfessionNatureResistTurns,
  sourceProfessionNatureResistUpValue:specCtx.sourceProfessionNatureResistUpValue,
  sourceProfessionNatureResistSpec:specCtx.sourceProfessionNatureResistSpec,
  sourceProfessionPlayerResistValue:attr=>Math.trunc(Number(execCtx.battlePlayerProfessionResistWork[attr]||0)),
  sourceProfessionPlayerResistVector:()=>({
    fire:Math.trunc(Number(execCtx.battlePlayerProfessionResistWork.fire||0)),
    ice:Math.trunc(Number(execCtx.battlePlayerProfessionResistWork.ice||0)),
    thunder:Math.trunc(Number(execCtx.battlePlayerProfessionResistWork.thunder||0))
  }),
  sourceBattleStatusDescFromSlot:()=>null,
  enemyUnitHidden:()=>false,
  sourcePlayerPetHidden:()=>false,
  addLog:()=>{}
};
vm.createContext(execCtx);
vm.runInContext(extractFunction(game,'sourceProfessionNatureResistExecute'),execCtx);
let out=execCtx.sourceProfessionNatureResistExecute(
  {skillId:66,functionName:'PROFESSION_RESIST_F_I_T',attackSkillTier:0,displayLevel:10,toNo:0},
  '自然威能',
  (_desc,threshold)=>({success:true,roll:100,threshold,reason:'source-fit-special',rollIgnored:true})
);
assert.equal(out.applied,true);
assert.equal(out.toNo,0);
assert.equal(out.forcedSelfByProfessionAddskill,true);
assert.equal(out.threeStatusTbl,true);
assert.deepEqual(
  [execCtx.battlePlayerProfessionResistWork.fire,execCtx.battlePlayerProfessionResistWork.ice,execCtx.battlePlayerProfessionResistWork.thunder],
  [23,24,25]
);
assert.deepEqual(
  [execCtx.battlePlayerProfessionResistMod.fire,execCtx.battlePlayerProfessionResistMod.ice,execCtx.battlePlayerProfessionResistMod.thunder],
  [20,20,20]
);
assert.equal(execCtx.battlePlayerProfessionResistState.nature,true);
assert.equal(execCtx.battlePlayerProfessionResistState.turns,4);

const seqCtx={
  Math,Number,String,
  battlePlayerProfessionResistState:{nature:true,attrs:['fire','ice','thunder'],turns:4,upValue:20,effectActive:true},
  battlePlayerProfessionResistWork:{fire:20,ice:20,thunder:20},
  battlePlayerProfessionResistMod:{fire:20,ice:20,thunder:20},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionPlayerResistValue:attr=>Math.trunc(Number(seqCtx.battlePlayerProfessionResistWork[attr]||0)),
  sourceProfessionPlayerResistVector:()=>({
    fire:seqCtx.battlePlayerProfessionResistWork.fire,
    ice:seqCtx.battlePlayerProfessionResistWork.ice,
    thunder:seqCtx.battlePlayerProfessionResistWork.thunder
  }),
  addLog:()=>{}
};
vm.createContext(seqCtx);
vm.runInContext(extractFunction(game,'sourceProfessionPlayerResistStatusSeq'),seqCtx);
let q=seqCtx.sourceProfessionPlayerResistStatusSeq();
assert.equal(q.turns,3);assert.equal(q.effectActive,true);
q=seqCtx.sourceProfessionPlayerResistStatusSeq();
assert.equal(q.turns,2);assert.equal(q.effectActive,true);
q=seqCtx.sourceProfessionPlayerResistStatusSeq();
assert.equal(q.turns,1);assert.equal(q.effectRemoved,true);assert.equal(q.ghostStatus,true);
assert.deepEqual(
  [seqCtx.battlePlayerProfessionResistWork.fire,seqCtx.battlePlayerProfessionResistWork.ice,seqCtx.battlePlayerProfessionResistWork.thunder],
  [0,0,0]
);
assert.deepEqual(
  [seqCtx.battlePlayerProfessionResistMod.fire,seqCtx.battlePlayerProfessionResistMod.ice,seqCtx.battlePlayerProfessionResistMod.thunder],
  [20,20,20]
);
q=seqCtx.sourceProfessionPlayerResistStatusSeq();
assert.equal(q.turns,0);assert.equal(q.statusCleared,true);
assert.equal(seqCtx.battlePlayerProfessionResistState,null);

const dispatch=extractFunction(game,'sourceProfessionBattleSkillExecute');
const fitAt=dispatch.indexOf("prepared.functionName==='PROFESSION_RESIST_F_I_T'");
const sameSideAt=dispatch.indexOf('if(toNo<10){');
assert.ok(fitAt>=0&&sameSideAt>fitAt);
assert.ok(dispatch.includes('sourceProfessionNatureResistExecute(prepared,natureName)'));

const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battlePlayerProfessionResistState=null'));
assert.ok(reset.includes('battlePlayerProfessionResistWork={fire:0,ice:0,thunder:0}'));
assert.ok(reset.includes('battlePlayerProfessionResistMod={fire:0,ice:0,thunder:0}'));

for(const v of ['2.48','2.49','2.50'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.50 live：[^<]*自然威能/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.50-core',
  focus:'Skill 66 PROFESSION_RESIST_F_I_T triple-resist StatusTbl lifecycle',
  mp:'dynamic M-tier 5/10/15/20; row 14 is fallback only',
  hit:'RAND consumed but ignored; only existing F/I/T resist blocks',
  power:'raw display Lv1..9 => +2..18; Lv10+ => +20',
  turns:'raw display <=80/>80/>=100 => stored 4/5/6',
  saveSchema:30
}));
