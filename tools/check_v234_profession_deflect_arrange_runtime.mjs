import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(source,name,last=false){
  const marker='function '+name+'(';
  const start=last?source.lastIndexOf(marker):source.indexOf(marker);
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

const row=runtime.bySkillId['53'];
assert.equal(row.name,'格档');
assert.equal(row.func,'PROFESSION_DEFLECT');
assert.equal(row.commonCommand,'BATTLE_COM_S_DEFLECT');
assert.equal(row.professionClass,1);
assert.equal(row.target,1);
assert.equal(row.kind,2);
assert.equal(row.useFlag,1);
assert.equal(row.costMp,0);
assert.equal(row.fixValue,10);

const supported=extractFunction(game,'sourceProfessionBattleFunctionSupported');
assert.ok(supported.includes("functionName==='PROFESSION_DEFLECT'"));

const execute=extractFunction(game,'sourceProfessionBattleSkillExecute');
const deflectAt=execute.indexOf("prepared.functionName==='PROFESSION_DEFLECT'");
const sameSideAt=execute.indexOf('if(toNo<10)');
assert.ok(deflectAt>=0&&sameSideAt>deflectAt);
assert.ok(execute.includes("reason:'source-deflect-no-battle-case'"));
assert.ok(execute.includes('sourceNoBattleCase:true'));

const powerFn=extractFunction(game,'sourceProfessionPlayerDeflectArrangePower');
assert.ok(powerFn.includes('compliance?.arrange'));
assert.equal(powerFn.includes('attackSkillTier'),false);
const pctx={
  Math,Number,Object,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  state:{playerEquipCompliance:{arrange:915}}
};
vm.createContext(pctx);
vm.runInContext(powerFn,pctx);
assert.equal(pctx.sourceProfessionPlayerDeflectArrangePower(),915);
pctx.state.playerEquipCompliance.arrange=1500;
assert.equal(pctx.sourceProfessionPlayerDeflectArrangePower(),1000);

const deflectEvent=extractFunction(game,'sourceProfessionPlayerDeflectEvent');
assert.ok(deflectEvent.includes("'PROFESSION_DEFLECT'"));
assert.ok(deflectEvent.includes('sourceProfessionLogProficiencyResult(result)'));

const view=extractFunction(game,'playerBattleView');
assert.ok(view.includes('arrangePower:sourceProfessionPlayerDeflectArrangePower(compliance)'));
assert.ok(view.includes('rawGuardCommand:!!battlePlayerRawGuardCommand'));

const order=extractFunction(game,'normalBattleOrder');
assert.ok(order.includes("battlePlayerRawGuardCommand=String(options.playerCommand||'')==='guard'"));

const arrangeFn=extractFunction(game,'sourceBattleArrangeCheck');
const actx={
  Math,Number,Object,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  nextRoll:700,rolls:[]
};
actx.cRand=(a,b)=>{actx.rolls.push([a,b]);return actx.nextRoll};
vm.createContext(actx);
vm.runInContext(arrangeFn,actx);

let check=actx.sourceBattleArrangeCheck({arrangePower:900,canMove:true});
assert.equal(check.per,700);
assert.equal(check.roll,700);
assert.equal(check.arranged,true);
assert.deepEqual(Array.from(actx.rolls[0]),[1,1000]);

actx.rolls.length=0;actx.nextRoll=701;
check=actx.sourceBattleArrangeCheck({arrangePower:900,canMove:true});
assert.equal(check.arranged,false);
assert.equal(check.reason,'roll');

for(const [opts,defender,reason] of [
  [{},{arrangePower:900,canMove:true,rawGuardCommand:true},'guard'],
  [{guarding:true},{arrangePower:900,canMove:true},'guard'],
  [{damageReact:1},{arrangePower:900,canMove:true},'damage-react'],
  [{},{arrangePower:900,canMove:false},'cannot-move'],
  [{noDuck:true},{arrangePower:900,canMove:true},'no-duck'],
  [{abio:true},{arrangePower:900,canMove:true},'abio'],
  [{},{arrangePower:0,canMove:true},'no-power']
]){
  actx.rolls.length=0;
  const r=actx.sourceBattleArrangeCheck(defender,opts);
  assert.equal(r.arranged,false);
  assert.equal(r.reason,reason);
  assert.equal(actx.rolls.length,0);
}

const resolve=extractFunction(game,'resolveNormalAttack');
assert.ok(resolve.indexOf('if(damage<1)damage=cRand(0,1)')
  <resolve.indexOf('sourceBattleArrangeCheck(defender'));
assert.ok(resolve.indexOf('sourceBattleArrangeCheck(defender')
  <resolve.indexOf('const multiplier=Number.isFinite(Number(options.damageMultiplier))'));
assert.ok(resolve.includes('damage=Math.trunc(damage*.1)'));
assert.ok(resolve.includes('sourceProfessionPlayerDeflectEvent(state)'));

let baseDamage=50,deflectCalls=0;
const rctx={
  Math,Number,Object,
  state:{},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  sourceBattleDuckTotal:()=>0,
  sourceSuitDuckCheck:()=>({dodged:false,power:0,roll:null}),
  battleCriticalChance:()=>0,
  battleDamageCore:()=>baseDamage,
  sourceProfessionPlayerCriticalEvent:()=>null,
  sourceProfessionPlayerNormalDodgeEvent:()=>null,
  battleGuardAdjust:d=>d,
  sourceProfessionPlayerDeflectEvent:()=>{deflectCalls++;return {ok:true,marker:'deflect'}},
  cRand:(a,b)=>{
    if(a===1&&b===10000)return 10000;
    if(a===1&&b===1000)return 1;
    if(a===0&&b===1)return 1;
    throw new Error('unexpected RAND '+a+'..'+b);
  }
};
vm.createContext(rctx);
vm.runInContext(arrangeFn,rctx);
vm.runInContext(resolve,rctx);
const attacker={type:'enemy',weaponType:0,level:1};
const defender={type:'player',defense:0,level:1,canMove:true,arrangePower:1000};

let hit=rctx.resolveNormalAttack(attacker,defender,{});
assert.equal(hit.arrangeTriggered,true);
assert.equal(hit.arranged,true);
assert.equal(hit.damage,5);
assert.equal(hit.miss,false);
assert.equal(hit.arrangePer,700);
assert.equal(hit.arrangeRoll,1);
assert.equal(deflectCalls,1);

baseDamage=5;
hit=rctx.resolveNormalAttack(attacker,defender,{});
assert.equal(hit.arrangeTriggered,true);
assert.equal(hit.arranged,false);
assert.equal(hit.damage,0);
assert.equal(hit.miss,true);
assert.equal(deflectCalls,2);

const directPet=extractFunction(game,'resolveEnemyDirectAttackToPet');
assert.ok(directPet.includes('guardian?playerBattleView():original'));
assert.ok(directPet.includes('if(r.damage<=0){r.damage=1;r.miss=false}'));

const playerCounter=extractFunction(game,'resolvePlayerEnemyCounterChain');
const petCounter=extractFunction(game,'resolvePetEnemyCounterChain');
assert.equal(playerCounter.includes('primaryResult?.arranged'),false);
assert.equal(petCounter.includes('primaryResult?.arranged'),false);

const pig=extractFunction(game,'performEnemyBecomePig');
assert.ok(pig.includes('!result.r.arranged'));

const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battlePlayerRawGuardCommand=false'));

assert.match(html,/PLAYABLE CORE V2\.40/);
assert.match(html,/V2\.40 live：[^<]*格檔/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.34',
  focus:'PROFESSION_DEFLECT + BATTLE_ArrangeCheck fixed lifecycle',
  liveSkillId:53,
  activeCommand:'source switch has no BATTLE_COM_S_DEFLECT case -> NoAction',
  effectiveArrange:'equipment ITEM_MODIFYARRANGE only because source compliance erases tier+10',
  chance:'RAND(1,1000) <= min(ARRANGEPOWER,700)',
  damage:'successful Arrange int-truncates damage to 10%',
  counter:'ARRANGE keeps ordinary BATTLE_Attack ContFlg true',
  saveSchema:30
}));
