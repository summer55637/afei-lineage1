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
    const c=src[p],n=src[p+1];
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;p++;}continue;}
    if(quote){
      if(esc){esc=false;continue;}
      if(c==='\\'){esc=true;continue;}
      if(c===quote)quote=null;
      continue;
    }
    if(c==='/'&&n==='/'){line=true;p++;continue;}
    if(c==='/'&&n==='*'){block=true;p++;continue;}
    if(c==="'"||c==='"'||c==='\`'){quote=c;continue;}
    if(c==='{')depth++;
    else if(c==='}'&&--depth===0)return src.slice(i,p+1);
  }
  throw new Error('unterminated '+name);
}

const row=runtime.bySkillId['62'];
assert.ok(row);
assert.equal(row.name,'遗忘');
assert.equal(row.func,'PROFESSION_OBLIVION');
assert.equal(row.option,'忘|成%100|回%3');
assert.equal(row.professionClass,3);
assert.equal(row.target,1);
assert.equal(row.costMp,21);
assert.equal(row.useFlag,1);
assert.equal(row.kind,2);
assert.equal(row.commonCommand,'BATTLE_COM_S_OBLIVION');

assert.ok(extractFunction(game,'sourceProfessionBattleFunctionSupported').includes("PROFESSION_OBLIVION"));

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
for(const fn of ['sourceProfessionOblivionTurns','sourceProfessionOblivionMode','sourceProfessionOblivionSpec']){
  vm.runInContext(extractFunction(game,fn),specCtx);
}
for(const [tier,turns,stored,mode,budget] of [
  [0,2,3,1,2],[4,2,3,2,3],[5,3,4,2,3],[9,3,4,4,5],[10,4,5,5,6]
]){
  const s=specCtx.sourceProfessionOblivionSpec({skillId:62,attackSkillTier:tier});
  assert.equal(s.success,100+tier*4);
  assert.equal(s.turns,turns);
  assert.equal(s.storedTurns,stored);
  assert.equal(s.mode,mode);
  assert.equal(s.clientForgetBudget,budget);
}

const petSkillDb={byId:{}};
for(let id=1;id<=7;id++)petSkillDb.byId[String(id)]={id,field:1,target:1};
const maskCtx={
  Math,Number,String,Array,
  petSkillDb,
  n:v=>Number.isFinite(Number(v))?Number(v):0
};
vm.createContext(maskCtx);
vm.runInContext(extractFunction(game,'sourceProfessionPetOblivionBuildClientMask'),maskCtx);
const rolls=[0,60,61,0,99,99,99];
let rp=0;
const mask=maskCtx.sourceProfessionPetOblivionBuildClientMask(
  {petSkills:[1,2,3,4,5,6,7]},1,()=>rolls[rp++]
);
assert.equal(mask.budget,2);
assert.equal(mask.rollsConsumed,7);
assert.deepEqual(Array.from(mask.forgottenSlots),[1,3]);
assert.equal(mask.rows[0].skillId,1);
assert.equal(mask.rows[0].forgotten,false);
assert.equal(mask.rows[1].field,2);
assert.equal(mask.rows[1].target,5);
assert.equal(mask.rows[3].field,2);
assert.equal(mask.rows[3].target,5);
assert.equal(rp,7);

let invalidRolls=0;
const mask2=maskCtx.sourceProfessionPetOblivionBuildClientMask(
  {petSkills:[1,-1,2,-1,3,-1,4]},1,()=>{invalidRolls++;return 99;}
);
assert.equal(invalidRolls,4);
assert.equal(mask2.rollsConsumed,4);

const dispatch=extractFunction(game,'sourceProfessionBattleSkillExecute');
const obAt=dispatch.indexOf("prepared.functionName==='PROFESSION_OBLIVION'");
const sameSideAt=dispatch.indexOf('if(toNo<10){');
assert.ok(obAt>=0&&sameSideAt>obAt);
assert.ok(dispatch.includes('sourceProfessionOblivionExecute(prepared,oblivionName)'));

const exec=extractFunction(game,'sourceProfessionOblivionExecute');
assert.ok(exec.includes("battleStatusApplyRaw(targetDesc,'oblivion',spec.storedTurns)"));
assert.ok(exec.includes('sourceProfessionPetOblivionBuildClientMask'));
assert.ok(exec.includes('serverPetRandomActUnaffected:true'));
assert.ok(exec.indexOf("enemyUnitHidden(targetDesc.unit)")<exec.indexOf('const check=statusCheck'));

const process=extractFunction(game,'processBattleStatusTurn');
assert.ok(process.includes("st.type==='oblivion'&&st.turns<=1"));
assert.ok(process.includes("battleStatusClear(desc,'oblivion')"));
assert.ok(process.includes('sourceRestoreAtCounterOne:true'));
assert.ok(process.includes('battlePetProfessionOblivionStates.delete'));

const randomPlan=extractFunction(game,'sourcePetRandomSkillPlan');
assert.ok(!randomPlan.includes('battlePetProfessionOblivionStates'));
assert.ok(!randomPlan.includes("battleStatusActive(desc,'oblivion')"));

const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battlePetProfessionOblivionStates=new Map()'));

assert.ok(html.includes('PLAYABLE CORE V2.49'));
assert.match(html,/V2\.49 live：[^<]*遺忘/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.49-core',
  focus:'Skill 62 PROFESSION_OBLIVION StatusTbl + Pet client Y/W mask lifecycle',
  success:'100+tier*4 strict RAND(1,100)<threshold',
  storedTurns:'3/4/5',
  mode:'max(1,trunc(tier/2)); client budget = mode+1',
  mask:'valid PetSkill RAND(0,100)<=60; skillId 1 immune; FIELD_MAP=2 TARGET_NONE=5',
  restore:'StatusSeq decrement then cnt<=1; battle reset clears mask',
  serverRandomAct:'unaffected by client-only mask',
  saveSchema:30
}));
