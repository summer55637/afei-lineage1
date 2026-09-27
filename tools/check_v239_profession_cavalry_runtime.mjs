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
  assert.ok(pe>=0);
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

const row=runtime.bySkillId['54'];
assert.ok(row);
assert.equal(row.name,'座骑攻击');
assert.equal(row.func,'PROFESSION_CAVALRY');
assert.equal(row.commonCommand,'BATTLE_COM_S_CAVALRY');
assert.equal(row.professionClass,1);
assert.equal(row.target,1);
assert.equal(row.kind,1);
assert.equal(row.useFlag,1);
assert.equal(row.costMp,11);

const supported=extractFunction(game,'sourceProfessionBattleFunctionSupported');
const sctx={};
vm.createContext(sctx);
vm.runInContext(supported,sctx);
assert.equal(sctx.sourceProfessionBattleFunctionSupported('PROFESSION_CAVALRY'),true);

let calcCalls=0,applyCalls=0,applyOptions=null,logCalls=0;
const ctx={
  Math,Number,String,Object,Array,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionPhysicalCalcOnlyResult:target=>{
    calcCalls++;
    return {damage:37,targetId:target.id};
  },
  applyFriendlyEnemyHit:(kind,name,target,r,unused,options)=>{
    applyCalls++;
    applyOptions=options;
    return {id:target.id,hpAfter:63};
  },
  addLog:()=>{logCalls++}
};
vm.createContext(ctx);
vm.runInContext(extractFunction(game,'sourceProfessionCavalryExecute'),ctx);

const target={id:901,hp:100};
const prepared={skillId:54,functionName:'PROFESSION_CAVALRY',toNo:10,attackSkillTier:7};
let result=ctx.sourceProfessionCavalryExecute(target,prepared,'座騎攻擊');
assert.equal(calcCalls,1);
assert.equal(applyCalls,1);
assert.equal(logCalls,1);
assert.equal(result.handled,true);
assert.equal(result.attackSkillTier,7);
assert.equal(result.sourceCavalryDebug,true);
assert.equal(result.ordinaryDamageSub,true);
assert.equal(result.ridePetDamageSplitDisabled,true);
assert.equal(result.noFormalRideSystem,true);
assert.equal(result.damageReactSuppressed,true);
assert.equal(result.suitPoisonSuppressed,true);
assert.equal(result.noOrdinaryCounter,true);
assert.equal(applyOptions.suppressSuitPoison,true);
assert.equal(applyOptions.suppressDamageReact,true);

const cav=extractFunction(game,'sourceProfessionCavalryExecute');
assert.ok(cav.includes('fixed version.h defines CAVALRY_DEBUG'));
assert.ok(cav.includes('BATTLE_PROFESSION_ATK_PET_DamageSub()'));
assert.ok(cav.includes('ordinary BATTLE_DamageSub()'));
assert.equal(cav.includes('skill_level * 2 + 60'),false,'disabled non-debug ride-pet split formula must not be implemented');
assert.equal(cav.includes('BATTLE_adjustRidePet3A('),false,'web must not fabricate formal ride-stat calls');

const exec=extractFunction(game,'sourceProfessionBattleSkillExecute');
const cavalryAt=exec.indexOf("prepared.functionName==='PROFESSION_CAVALRY'");
const chaosAt=exec.indexOf("prepared.functionName==='PROFESSION_CHAOS'");
assert.ok(cavalryAt>=0&&chaosAt>cavalryAt);
assert.ok(exec.slice(cavalryAt,chaosAt).includes('sourceProfessionCavalryExecute(target,prepared,name)'));

assert.match(html,/PLAYABLE CORE V2\.40/);
assert.match(html,/V2\.40 live：[^<]*座騎攻擊/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.39',
  focus:'Skill 54 PROFESSION_CAVALRY fixed CAVALRY_DEBUG ordinary DamageSub path',
  skillId:54,mpCost:11,
  compiledPath:'CAVALRY_DEBUG -> BATTLE_DamageSub',
  excluded:'BATTLE_PROFESSION_ATK_PET_DamageSub ride-pet split',
  saveSchema:30
}));
