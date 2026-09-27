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

const row=runtime.bySkillId['52'];
assert.ok(row);
assert.equal(row.name,'挑拨');
assert.equal(row.func,'PROFESSION_INSTIGATE');
assert.equal(row.option,'挑|成%20|敏%30|效%1|回%2');
assert.equal(row.costMp,17);
assert.equal(row.target,1);
assert.equal(row.kind,2);
assert.equal(row.commonCommand,'BATTLE_COM_S_INSTIGATE');

// Command bridge.
const supportCtx={};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_INSTIGATE'),true);

// Application: common StatusAttackCheck + tier formulas + tier-10 turn override.
// No immediate BATTLECOM1 cancel is allowed for INSTIGATE.
let stored=null,logs=0;
const appCtx={
  Math,Number,String,Object,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionSkillTemplate:()=>row,
  sourceProfessionStatusOptionInt:(option,label,fallback=0)=>{
    const m=String(option).match(new RegExp(label+'%([+-]?\\d+)'));
    return m?Number(m[1]):fallback;
  },
  sourceProfessionStatusAttackCheck:(desc,success)=>({success:true,roll:10,threshold:success,reason:'hit'}),
  battleStatusApply:(desc,type,turn)=>{stored={type,turns:turn+1};return true},
  battleStatusGet:()=>stored,
  addLog:()=>{logs++}
};
vm.createContext(appCtx);
vm.runInContext(extractFunction(game,'sourceProfessionInstigateExecute'),appCtx);
let out=appCtx.sourceProfessionInstigateExecute(
  {id:7,name:'Enemy'},
  {skillId:52,functionName:'PROFESSION_INSTIGATE',toNo:12,attackSkillTier:5},
  '挑撥'
);
assert.equal(out.baseSuccess,20);
assert.equal(out.success,40);
assert.equal(out.optionTurn,2);
assert.equal(out.turn,2);
assert.equal(out.storedTurns,3);
assert.equal(out.rate,15);
assert.equal(out.commandCancelledOnApply,false);
assert.equal(stored.type,'instigate');
assert.equal(stored.instigateRate,15);

stored=null;
out=appCtx.sourceProfessionInstigateExecute(
  {id:8,name:'Enemy2'},
  {skillId:52,functionName:'PROFESSION_INSTIGATE',toNo:13,attackSkillTier:10},
  '挑撥'
);
assert.equal(out.success,60);
assert.equal(out.turn,4);
assert.equal(out.storedTurns,5);
assert.equal(out.rate,20);
assert.equal(stored.turns,5);
assert.equal(stored.instigateRate,20);
assert.equal(logs,2);

const appFn=extractFunction(game,'sourceProfessionInstigateExecute');
assert.equal(appFn.includes('sourceProfessionCancelEnemyCurrentCommand'),false);
assert.ok(appFn.includes("battleStatusApply(targetDesc,'instigate',turn)"));
assert.ok(appFn.includes('if(st)st.instigateRate=rate'));

// Same-side slot scan consumes exactly RAND(0,9), starts from ++pos, excludes self.
let rngCalls=[],slots=[];
const pickCtx={
  Math,Number,
  sourceBattleStatusSlot:()=>12,
  cRand:(a,b)=>{rngCalls.push([a,b]);return 2},
  sourcePlayerConfusionTargetableFromBattleSlot:slot=>{
    slots.push(slot);
    return slot===14?{kind:'enemy',unit:{id:14},unitId:14}:null;
  }
};
vm.createContext(pickCtx);
vm.runInContext(extractFunction(game,'sourceProfessionInstigateSameSideTarget'),pickCtx);
let pick=pickCtx.sourceProfessionInstigateSameSideTarget({kind:'enemy'});
assert.deepEqual(rngCalls,[[0,9]]);
assert.deepEqual(slots,[13,14]);
assert.equal(pick.targetSlot,14);
assert.equal(pick.rawToNo,14);

rngCalls=[];slots=[];
pickCtx.sourcePlayerConfusionTargetableFromBattleSlot=slot=>{slots.push(slot);return null};
pick=pickCtx.sourceProfessionInstigateSameSideTarget({kind:'enemy'});
assert.deepEqual(rngCalls,[[0,9]]);
assert.equal(pick.target,null);
assert.equal(pick.rawToNo,-1);
assert.equal(slots.includes(12),false);

// Trigger-time stat mutation is FIX only. WORK + EntrySort snapshot stays unchanged.
const fixCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(fixCtx);
vm.runInContext(extractFunction(game,'sourceProfessionInstigateFixMutation'),fixCtx);
const unit={
  attack:100,defense:80,quick:60,
  roundFixAttack:100,roundFixDefense:80,roundFixQuick:60,
  roundAttack:111,roundDefense:91,roundQuick:71
};
const mutation=fixCtx.sourceProfessionInstigateFixMutation({kind:'enemy',unit},15);
assert.deepEqual(mutation.before,{attack:100,defense:80,quick:60});
assert.deepEqual(mutation.after,{attack:85,defense:68,quick:51});
assert.equal(unit.roundFixAttack,85);
assert.equal(unit.roundFixDefense,68);
assert.equal(unit.roundFixQuick,51);
assert.equal(unit.roundAttack,111);
assert.equal(unit.roundDefense,91);
assert.equal(unit.roundQuick,71);
assert.equal(mutation.workAttack,111);
assert.equal(mutation.workDefense,91);
assert.equal(mutation.workQuick,71);

// StatusSeq ordering: decrement -> expiry gate -> 80% roll -> FIX mutation -> same-side RAND.
// The target RAND is therefore before BATTLE_GetAttackCount, exactly as fixed C.
const statusFn=extractFunction(game,'processBattleStatusTurn');
const decAt=statusFn.indexOf('st.turns--;');
const expireAt=statusFn.indexOf('if(st.turns<=0)');
const instAt=statusFn.indexOf("if(st.type==='instigate')");
const rollAt=statusFn.indexOf('const roll=cRand(1,100)',instAt);
const fixAt=statusFn.indexOf('sourceProfessionInstigateFixMutation(desc,rate)',instAt);
const targetAt=statusFn.indexOf('sourceProfessionInstigateSameSideTarget(desc)',instAt);
assert.ok(decAt>=0&&expireAt>decAt&&instAt>expireAt);
assert.ok(rollAt>instAt&&fixAt>rollAt&&targetAt>fixAt);
assert.ok(statusFn.includes('if(roll<=80)'));

const turnFn=extractFunction(game,'attackTurn');
const statusAt=turnFn.indexOf('processBattleStatusTurn(actor)');
const countAt=turnFn.indexOf('sourceEnemyPrimeExecutionAttackCount(actor)');
const executeAt=turnFn.indexOf('if(statusTurn.instigateAttack)');
assert.ok(statusAt>=0&&countAt>statusAt&&executeAt>countAt);
assert.ok(turnFn.includes('performProfessionInstigateAttack(actor,statusTurn'));

// COM2=-1 fallback is intentionally deferred until execution, after attack-count RNG.
const defaultFn=extractFunction(game,'sourceProfessionInstigateDefaultTarget');
assert.ok(defaultFn.includes('cRand(0,list.length-1)'));

const performFn=extractFunction(game,'performProfessionInstigateAttack');
assert.ok(performFn.includes('unit.counterEligibleThisTurn=true'));
assert.ok(performFn.includes('unit.chargeState=null'));
assert.ok(performFn.includes('unit.earthRoundState=null'));
assert.ok(performFn.includes('sourceProfessionInstigateBoomerang(actor,attackerDesc,statusTurn,options)'));
assert.ok(performFn.includes('sourceProfessionInstigateBow(actor,attackerDesc,statusTurn,options)'));
assert.ok(performFn.includes('sourceProfessionInstigateCommonAttack(actor,attackerDesc,statusTurn,options)'));

// INSTIGATE rewrites to a real ordinary ATTACK, so the currently reachable fixed
// Enemy weapon set must keep its BOW / BOOMERANG / BOUNDTHROW / BREAKTHROW behavior.
const hitFn=extractFunction(game,'sourceProfessionInstigateApplyHit');
assert.ok(hitFn.includes('resolveAttackToEnemyWithGuardian'));
assert.ok(hitFn.includes('enemyAttackPetResult'));
assert.ok(hitFn.includes('resolveEnemyDirectAttackToPlayer'));
assert.ok(hitFn.includes('battleApplyPhysicalHit(attackerDesc,actualTargetDesc,r'));

const bowFn=extractFunction(game,'sourceProfessionInstigateBow');
assert.ok(bowFn.includes('sourceBowTargetListFromBattleSlots(rawToNo,attackSlot)'));
assert.ok(bowFn.includes("reason:'bow-raw-target-invalid'"));
assert.ok(bowFn.includes('actor?.sourceAttackMax'));
assert.equal(bowFn.includes('sourceEnemyBattleAttackMax'),false);

const boomFn=extractFunction(game,'sourceProfessionInstigateBoomerang');
assert.ok(boomFn.includes("reason:'boomerang-same-row'"));
assert.ok(boomFn.includes('SOURCE_BOOMERANG_VS_TBL[row].slice().reverse()'));
assert.ok(boomFn.includes('damageMultiplier:.3'));

const commonFn=extractFunction(game,'sourceProfessionInstigateCommonAttack');
assert.ok(commonFn.includes('sourceProfessionInstigateDefaultTarget(attackerDesc)'));
assert.ok(commonFn.includes('actor?.sourceAttackMax'));
assert.ok(commonFn.includes('if(rawToNo<0)break'));
const breakAt=commonFn.indexOf('sourceBreakthrowParalysis(unit,hit)');
const crushAt=commonFn.indexOf('sourceBattleFinalizeItemCrushRng(hit.r)');
assert.ok(breakAt>=0&&crushAt>breakAt);
assert.ok(commonFn.includes('resolveConfusionCounterChain(attackerDesc,last.targetDesc,last.r,options)'));

// Dispatcher and published marker.
const execFn=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(execFn.includes("prepared.functionName==='PROFESSION_INSTIGATE'"));
assert.ok(execFn.includes('sourceProfessionInstigateExecute(target,prepared,name)'));

assert.match(html,/PLAYABLE CORE V2\.42/);
assert.match(html,/V2\.42 live：[^<]*弱點攻擊[^<]*挑撥/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.42-core',
  focus:'Skill 52 PROFESSION_INSTIGATE application + StatusSeq forced same-side ATTACK lifecycle',
  skillId:52,mpCost:17,
  hitSuccess:'20+tier*4 strict < roll gate via shared helper',
  storedTurns:'tier0..9=3, tier10=5',
  proc:'remaining active StatusSeq tick RAND(1,100)<=80',
  fixPenalty:'FIXSTR/FIXTOUGH/FIXDEX * (100-(tier+10))%',
  sameSideTarget:'RAND(0,9), ++pos scan, self excluded; COM2=-1 falls to later TargetAdjust',
  saveSchema:30
}));
