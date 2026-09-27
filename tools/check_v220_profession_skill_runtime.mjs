import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

assert.equal(runtime.format,'stoneage-profession-skill-runtime-v1');
assert.equal(runtime.source.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(runtime.source.professionBlobSha,'12d059fa6f3c972875fbddc3b20ce3ea3119b658');
assert.equal(runtime.source.professionSkillCBlobSha,'dde3f879f13be466efe051daadb4811b22acddbc');
assert.equal(runtime.source.versionBlobSha,'af6c866fd609a39e2960236275f6bf39e7f47b2c');
assert.equal(runtime.stats.rows,69);
assert.equal(runtime.stats.maxSkillId,72);
assert.equal(runtime.stats.tableSize,73);
assert.deepEqual(runtime.stats.holes,[63,64,65]);
assert.deepEqual(runtime.stats.byProfession,{'1':20,'2':21,'3':28});
assert.equal(runtime.stats.useFlag0,2);
assert.equal(runtime.stats.useFlag1,67);
assert.equal(runtime.stats.uniqueDataFunctions,57);
assert.equal(runtime.stats.functionTable,64);
assert.ok(runtime.stats.commonCommandFunctions>40);
assert.equal(Object.keys(runtime.bySkillId).length,69);
assert.equal(Object.values(runtime.bySkillId).every(x=>x.dispatchKnown===true),true);
assert.equal(runtime.bySkillId['63'],undefined);
assert.equal(runtime.bySkillId['64'],undefined);
assert.equal(runtime.bySkillId['65'],undefined);

assert.equal(runtime.bySkillId['1'].func,'PROFESSION_VOLCANO_SPRINGS');
assert.equal(runtime.bySkillId['1'].professionClass,2);
assert.equal(runtime.bySkillId['11'].func,'PROFESSION_BLOOD');
assert.equal(runtime.bySkillId['11'].costMp,0);
assert.equal(runtime.bySkillId['44'].func,'PROFESSION_TRACK');
assert.equal(runtime.bySkillId['44'].useFlag,0);
assert.equal(runtime.bySkillId['72'].func,'PROFESSION_BOUNDARY');
assert.ok(runtime.bySkillId['72'].option.includes('破结界'));

assert.equal(runtime.commonCommandByFunc.PROFESSION_VOLCANO_SPRINGS,'BATTLE_COM_S_VOLCANO_SPRINGS');
assert.equal(runtime.commonCommandByFunc.PROFESSION_ICE_ENCLOSE,'BATTLE_COM_S_ICE_ENCLOSE');
assert.equal(runtime.commonCommandByFunc.PROFESSION_DOOM,'BATTLE_COM_S_DOOM');
assert.equal(runtime.commonCommandByFunc.PROFESSION_FIRE_SPEAR,'BATTLE_COM_S_FIRE_SPEAR');
assert.equal(runtime.commonCommandByFunc.PROFESSION_FIRE_PRACTICE,undefined);

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

const ctx={Math,Number,String,Object,professionSkillDb:runtime,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(ctx);
for(const name of [
  'sourceProfessionMagicLevelM',
  'sourceProfessionSkillTemplate',
  'sourceProfessionMagicCostPlan',
  'sourceProfessionSkillMpCost',
  'sourceProfessionCommonCommandPlan',
  'sourceProfessionSkillUsePreflight'
])vm.runInContext(extractFunction(game,name),ctx);

let cost=ctx.sourceProfessionSkillMpCost(1,95);
assert.deepEqual(JSON.parse(JSON.stringify(cost)),{
  ok:true,skillId:1,rawSkillLevel:95,skillLevel:10,decMp:35,dynamic:true,fallbackCost:10
});
cost=ctx.sourceProfessionSkillMpCost(8,85);
assert.equal(cost.skillLevel,9);
assert.equal(cost.decMp,80);
cost=ctx.sourceProfessionSkillMpCost(7,85);
assert.equal(cost.decMp,50);
assert.equal(ctx.sourceProfessionSkillMpCost(68,50).decMp,10);
assert.equal(ctx.sourceProfessionSkillMpCost(72,50).decMp,15);

cost=ctx.sourceProfessionSkillMpCost(44,50);
assert.equal(cost.dynamic,false);
assert.equal(cost.decMp,13);

let p=ctx.sourceProfessionSkillUsePreflight({
  skillId:1,rawSkillLevel:95,professionClass:2,mp:40,isPlayer:true,toNo:12
});
assert.equal(p.ok,true);
assert.equal(p.mpBefore,40);
assert.equal(p.decMp,35);
assert.equal(p.mpAfter,5);
assert.equal(p.deductBeforeDispatch,true);
assert.equal(p.commonCommand.finalCom1,'BATTLE_COM_S_VOLCANO_SPRINGS');
assert.equal(p.commonCommand.com2,12);
assert.equal(p.commonCommand.com3High,95);
assert.equal(p.commonCommand.com3Low,1);

assert.equal(ctx.sourceProfessionSkillUsePreflight({
  skillId:1,rawSkillLevel:95,professionClass:1,mp:999,isPlayer:true
}).reason,'profession-mismatch');
assert.equal(ctx.sourceProfessionSkillUsePreflight({
  skillId:1,rawSkillLevel:95,professionClass:0,mp:999,isPlayer:true
}).reason,'profession-mismatch');

assert.equal(ctx.sourceProfessionSkillUsePreflight({
  skillId:1,rawSkillLevel:95,professionClass:2,mp:999,isPlayer:false
}).reason,'not-player');
assert.equal(ctx.sourceProfessionSkillUsePreflight({
  skillId:1,rawSkillLevel:0,professionClass:2,mp:999,isPlayer:true
}).reason,'skill-level');

p=ctx.sourceProfessionSkillUsePreflight({
  skillId:8,rawSkillLevel:85,professionClass:2,mp:79,isPlayer:true
});
assert.equal(p.reason,'mp-short');
assert.equal(p.decMp,80);

p=ctx.sourceProfessionSkillUsePreflight({
  skillId:11,rawSkillLevel:50,professionClass:2,mp:0,isPlayer:true
});
assert.equal(p.ok,true);
assert.equal(p.decMp,0);
assert.equal(p.mpAfter,0);
p=ctx.sourceProfessionSkillUsePreflight({
  skillId:18,rawSkillLevel:50,professionClass:2,mp:100,isPlayer:true
});
assert.equal(p.reason,'mp-cost-invalid');

p=ctx.sourceProfessionSkillUsePreflight({
  skillId:44,rawSkillLevel:50,professionClass:3,mp:20,isPlayer:true,toNo:0
});
assert.equal(p.ok,true);
assert.equal(p.useFlag,0);
assert.equal(p.decMp,13);

let plan=ctx.sourceProfessionCommonCommandPlan(3,20,95);
assert.equal(plan.initialCom1,'BATTLE_COM_S_DOOM');
assert.equal(plan.finalCom1,'BATTLE_COM_NONE');
assert.deepEqual(JSON.parse(JSON.stringify(plan.deferred)),{
  com1:'BATTLE_COM_S_DOOM',toNo:20,mode:'BATTLE_CHARMODE_C_OK',skillLevel:95,array:3,doomTime:3
});
plan=ctx.sourceProfessionCommonCommandPlan(13,7,85);
assert.equal(plan.finalCom1,'BATTLE_COM_NONE');
assert.equal(plan.deferred.doomTime,2);
assert.equal(ctx.sourceProfessionCommonCommandPlan(18,0,50),null);

assert.ok(game.includes("const PROFESSION_SKILL_RUNTIME_URL='data/generated/stoneage_profession_skill_runtime.json';"));
assert.ok(game.includes("fetch(PROFESSION_SKILL_RUNTIME_URL,{cache:'no-store'})"));
assert.ok(game.includes("Math.trunc(Number(professionSkillDb?.stats?.rows))!==69"));
assert.ok(game.includes("JSON.stringify(professionSkillDb?.stats?.holes)!=='[63,64,65]'"));

assert.match(game,/schemaVersion:29/);
assert.match(game,/s\.schemaVersion=29/);

console.log(JSON.stringify({
  pass:true,version:'V2.20',
  focus:'profession.txt runtime + PROFESSION_SKILL_Use preflight',
  rows:runtime.stats.rows,maxSkillId:runtime.stats.maxSkillId,holes:runtime.stats.holes,
  uniqueDataFunctions:runtime.stats.uniqueDataFunctions,functionTable:runtime.stats.functionTable,
  commonCommandFunctions:runtime.stats.commonCommandFunctions,
  saveSchema:29
}));
