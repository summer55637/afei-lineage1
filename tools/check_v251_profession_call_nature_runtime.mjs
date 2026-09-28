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

const row=runtime.bySkillId['67'];
assert.ok(row);
assert.equal(row.name,'号召自然');
assert.equal(row.func,'PROFESSION_CALL_NATURE');
assert.equal(row.professionClass,3);
assert.equal(row.target,2);
assert.equal(row.costMp,14);
assert.equal(row.useFlag,1);
assert.equal(row.kind,1);
assert.equal(row.img1,101773);
assert.equal(row.img2,101654);
assert.equal(row.commonCommand,'BATTLE_COM_S_CALL_NATURE');

assert.ok(extractFunction(game,'sourceProfessionBattleFunctionSupported').includes('PROFESSION_CALL_NATURE'));

const costCtx={
  Math,Number,String,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:()=>1
};
vm.createContext(costCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
const cost=costCtx.sourceProfessionMagicCostPlan('PROFESSION_CALL_NATURE',10,row.option);
assert.equal(cost.dynamic,true);
assert.equal(cost.cost,50);

const pure={Math,Number};
vm.createContext(pure);
pure.n=v=>Number.isFinite(Number(v))?Number(v):0;
vm.runInContext(extractFunction(game,'sourceProfessionCallNaturePool'),pure);
vm.runInContext(extractFunction(game,'sourceProfessionCallNatureEffect'),pure);
for(const [level,pool] of [
  [1,500],[20,500],[21,1000],[40,1000],[41,2000],[60,2000],
  [61,2500],[80,2500],[81,3000],[85,3000],[86,3500],[90,3500],
  [91,4000],[95,4000],[96,4500],[99,4500],[100,5000]
]){assert.equal(pure.sourceProfessionCallNaturePool(level),pool);}
assert.equal(pure.sourceProfessionCallNatureEffect(100),100601);
assert.equal(pure.sourceProfessionCallNatureEffect(101),100602);
assert.equal(pure.sourceProfessionCallNatureEffect(300),100602);
assert.equal(pure.sourceProfessionCallNatureEffect(301),100603);

const pet={id:'pet1',name:'小紅',hp:200,maxHp:800};
const state={hp:100,maxHp:1000};
let recoveryCalls=0;
const ctx={
  Math,Number,String,Set,
  state,pet,
  battlePetRecoveryAiIds:new Set(),
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(id)]||null,
  sourceProfessionCallNaturePool:pure.sourceProfessionCallNaturePool,
  sourceProfessionCallNatureEffect:pure.sourceProfessionCallNatureEffect,
  sourceSetMagicPetMultiList:raw=>({ok:true,toNo:raw,slots:[0,5],fallback:false,rolls:[]}),
  sourceSetMagicPetTargetableDescFromSlot:slot=>slot===0?{kind:'player'}:(slot===5?{kind:'pet',pet,petId:pet.id}:null),
  battleStatusHp:desc=>desc.kind==='player'?state.hp:desc.pet.hp,
  battleStatusSetHp:(desc,hp)=>{if(desc.kind==='player')state.hp=hp;else desc.pet.hp=hp;},
  sourceUltimateMaxHp:desc=>desc.kind==='player'?state.maxHp:desc.pet.maxHp,
  sourcePetAddVariableAi:(p,delta)=>{recoveryCalls++;return {delta,petId:p.id};},
  battleStatusDescName:desc=>desc.kind==='player'?'你':desc.pet.name,
  addLog:()=>{}
};
vm.createContext(ctx);
vm.runInContext(extractFunction(game,'sourceProfessionCallNaturePetRecoveryAi'),ctx);
vm.runInContext(extractFunction(game,'sourceProfessionCallNatureExecute'),ctx);
let out=ctx.sourceProfessionCallNatureExecute(
  {skillId:67,functionName:'PROFESSION_CALL_NATURE',displayLevel:10,toNo:20},'號召自然'
);
assert.equal(out.totalPool,500);
assert.equal(out.count,2);
assert.equal(out.addHp,250);
assert.equal(out.img1,101772);
assert.equal(out.img2,100602);
assert.equal(state.hp,350);
assert.equal(pet.hp,450);
assert.equal(recoveryCalls,1);
assert.equal(out.results[0].packetPetHp,250);
assert.equal(out.results[0].sourceRidePetNo,-1);
assert.equal(out.results[0].sourcePacketRidepetTruthinessBug,true);
assert.equal(out.results[1].packetPetHp,250);

out=ctx.sourceProfessionCallNatureExecute(
  {skillId:67,functionName:'PROFESSION_CALL_NATURE',displayLevel:10,toNo:20},'號召自然'
);
assert.equal(recoveryCalls,1,'recovery AI must be once per Pet per battle');

state.hp=990;pet.hp=790;
out=ctx.sourceProfessionCallNatureExecute(
  {skillId:67,functionName:'PROFESSION_CALL_NATURE',displayLevel:100,toNo:20},'號召自然'
);
assert.equal(out.totalPool,5000);
assert.equal(out.addHp,2500);
assert.equal(out.img2,100603);
assert.equal(state.hp,1000);
assert.equal(pet.hp,800);
assert.equal(out.results[0].actualHeal,10);
assert.equal(out.results[0].packetHp,2500);

const dispatch=extractFunction(game,'sourceProfessionBattleSkillExecute');
const callAt=dispatch.indexOf("prepared.functionName==='PROFESSION_CALL_NATURE'");
const pseudoAt=dispatch.indexOf('if(toNo>19){');
assert.ok(callAt>=0&&pseudoAt>callAt);
assert.ok(dispatch.includes('sourceProfessionCallNatureExecute(prepared,callNatureName)'));

const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battlePetRecoveryAiIds=new Set()'));

for(const v of ['2.48','2.49','2.50','2.51'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.51 live：[^<]*號召自然/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.51-core',
  focus:'Skill 67 PROFESSION_CALL_NATURE total-pool recovery lifecycle',
  mp:'dynamic fixed 50; row 14 fallback unused',
  pool:'raw display level 500..5000, divided by target/ride count',
  ride:'no formal ride system; active Pet remains independent entry',
  packetBug:'ridepet=-1 is truthy so p=addhp without actual mount heal',
  petRecoveryAi:'+10 once per battle',
  saveSchema:30
}));
