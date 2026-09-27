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
    if(c==='(')pd++; else if(c===')'&&--pd===0){pe=i;break}
  }
  assert.ok(pe>=0,'unterminated params '+name);
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
    if(c==='{')d++; else if(c==='}'&&--d===0)return source.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

const row=runtime.bySkillId['51'];
assert.ok(row);
assert.equal(row.name,'弱点攻击');
assert.equal(row.func,'PROFESSION_ATTACK_WEAK');
assert.equal(row.costMp,9);
assert.equal(row.target,1);
assert.equal(row.kind,1);
assert.equal(row.commonCommand,'BATTLE_COM_S_ATTACK_WEAK');

const sctx={};
vm.createContext(sctx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),sctx);
assert.equal(sctx.sourceProfessionBattleFunctionSupported('PROFESSION_ATTACK_WEAK'),true);

let attackWork=null,calcOptions=null,applyOptions=null,logs=0;
const ctx={
  Math,Number,String,Object,Array,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  playerBattleView:()=>({attack:100,fixedDex:80,quick:80}),
  sourceProfessionSetPlayerAttackWork:v=>{attackWork=Math.trunc(v);return attackWork},
  sourceProfessionPhysicalCalcOnlyResult:(target,options)=>{
    calcOptions=options;
    return {damage:33,dodged:false,miss:false};
  },
  applyFriendlyEnemyHit:(kind,name,target,r,id,options)=>{
    applyOptions=options;
    return target;
  },
  addLog:()=>{logs++}
};
vm.createContext(ctx);
vm.runInContext(extractFunction(game,'sourceProfessionAttackWeakExecute'),ctx);

const target={id:99,name:'Enemy'};
const prepared={skillId:51,functionName:'PROFESSION_ATTACK_WEAK',toNo:10,attackSkillTier:5};
const result=ctx.sourceProfessionAttackWeakExecute(target,prepared,'弱點攻擊');

assert.equal(result.attackBefore,100);
assert.equal(result.attackScale,120);
assert.equal(result.attackPower,120);
assert.equal(attackWork,120);
assert.equal(result.fixedDex,80);
assert.equal(result.quickScale,85);
assert.equal(result.workQuick,68);
assert.equal(calcOptions.attackerOverride.attack,120);
assert.equal(calcOptions.attackerOverride.quick,68);
assert.equal(result.entrySortAlreadyFixed,true);
assert.equal(result.damageReactSuppressed,true);
assert.equal(result.suitPoisonSuppressed,true);
assert.equal(result.noOrdinaryCounter,true);
assert.equal(applyOptions.suppressSuitPoison,true);
assert.equal(applyOptions.suppressDamageReact,true);
assert.equal(logs,1);

const weak=extractFunction(game,'sourceProfessionAttackWeakExecute');
assert.ok(weak.includes('const attackScale=tier*2+110'));
assert.ok(weak.includes('const quickScale=90-tier'));
assert.ok(weak.includes('sourceProfessionSetPlayerAttackWork(attackPower)'));
assert.ok(weak.includes("attackerOverride:{attack:attackPower,quick:workQuick}"));
assert.equal(weak.includes('target.roundQuick'),false);

const exec=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(exec.includes("prepared.functionName==='PROFESSION_ATTACK_WEAK'"));
assert.ok(exec.includes('sourceProfessionAttackWeakExecute(target,prepared,name)'));

assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.41-core',
  focus:'Skill 51 PROFESSION_ATTACK_WEAK Work attack/quick mutation',
  skillId:51,mpCost:9,
  attack:'WORKATTACKPOWER*(110+tier*2)%',
  quick:'FIXDEX*(90-tier)% on attacker',
  saveSchema:30
}));
