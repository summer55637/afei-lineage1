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

const row=runtime.bySkillId['40'];
assert.ok(row);
assert.equal(row.name,'濒死攻击');
assert.equal(row.func,'PROFESSION_DEAD_ATTACK');
assert.equal(row.commonCommand,'BATTLE_COM_S_DEAD_ATTACK');
assert.equal(row.option,'命%82|HP%10|倍%2|效%1|回%3');
assert.equal(row.target,1);
assert.equal(row.kind,1);
assert.equal(row.useFlag,1);
assert.equal(row.costMp,17);

const ctx={
  Math,Number,Object,
  state:null,
  battlePlayerProfessionHitState:null,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  addLog:()=>{},
  sourceProfessionPhysicalCalcOnlyResult:()=>({damage:7,dodged:false,miss:false}),
  applyFriendlyEnemyHit:()=>({id:'enemy'}),
  sourcePlayerItemSlots:()=>[],
  sourcePlayerEquipTemplateForExisting:()=>null
};
vm.createContext(ctx);
for(const name of [
  'sourceProfessionBattleFunctionSupported',
  'sourceProfessionPlayerHitRight',
  'sourceProfessionPlayerHitPreCommandCompliance',
  'sourceProfessionPlayerHitStatusSeq',
  'sourceProfessionDeadAttackExecute'
])vm.runInContext(extractFunction(game,name),ctx);

assert.equal(ctx.sourceProfessionBattleFunctionSupported('PROFESSION_DEAD_ATTACK'),true);

// Fixed DEAD_ATTACK execution formula.
ctx.state={hp:100,playerEquipCompliance:{hitRight:0,preSuitFixedTough:100}};
ctx.battlePlayerProfessionHitState=null;
let out=ctx.sourceProfessionDeadAttackExecute(
  {id:'enemy'},
  {attackSkillTier:5,skillId:40,functionName:'PROFESSION_DEAD_ATTACK',toNo:10},
  '瀕死攻擊'
);
assert.equal(out.handled,true);
assert.equal(out.noAction,undefined);
assert.equal(out.oldHp,100);
assert.equal(out.hpRate,20);
assert.equal(out.hpAfter,20);
assert.equal(ctx.state.hp,20);
assert.equal(out.hit,90);
assert.equal(out.hitRightBefore,0);
assert.equal(out.hitRightAfter,90);
assert.equal(ctx.battlePlayerProfessionHitState.turns,1);
assert.equal(ctx.battlePlayerProfessionHitState.power,90);
assert.equal(ctx.battlePlayerProfessionHitState.workHitRight,90);
assert.equal(out.damageReactSuppressed,true);
assert.equal(out.noOrdinaryCounter,true);

// HP gate is runtime execution gate, after command receipt.
ctx.state={hp:10,playerEquipCompliance:{hitRight:3,preSuitFixedTough:100}};
ctx.battlePlayerProfessionHitState=null;
out=ctx.sourceProfessionDeadAttackExecute(
  {id:'enemy'},
  {attackSkillTier:10,skillId:40,functionName:'PROFESSION_DEAD_ATTACK',toNo:10},
  '瀕死攻擊'
);
assert.equal(out.noAction,true);
assert.equal(out.reason,'dead-attack-hp-too-low');
assert.equal(ctx.state.hp,10);
assert.equal(ctx.battlePlayerProfessionHitState,null);

// C integer truncation and tier endpoints are present in the executable source.
const dead=extractFunction(game,'sourceProfessionDeadAttackExecute');
assert.ok(dead.includes('const hpRate=tier*2+10'));
assert.ok(dead.includes('const hpAfter=Math.trunc(oldHp*hpRate/100)'));
assert.ok(dead.includes('const hit=tier*2+80'));
assert.ok(dead.includes('turns:1,power:hit,workHitRight:hitRightBefore+hit'));
assert.ok(dead.includes('state.hp=hpAfter'));
assert.ok(dead.includes('{suppressSuitPoison:true,suppressDamageReact:true}'));
assert.ok(dead.indexOf('state.hp=hpAfter')<dead.indexOf('sourceProfessionPhysicalCalcOnlyResult(target)'));

// Next PreCommand rebuilds WORKHITRIGHT from equipment, then the fixed Other_DefcharWorkInt
// source bug writes mtgh*equipmentHitRight/100 into MYSKILLHIT (the turn counter).
ctx.state={playerEquipCompliance:{hitRight:0,preSuitFixedTough:100}};
ctx.battlePlayerProfessionHitState={turns:1,power:80,workHitRight:80};
let pre=ctx.sourceProfessionPlayerHitPreCommandCompliance(ctx.state);
assert.equal(pre.beforeTurns,1);
assert.equal(pre.afterTurns,1);
assert.equal(pre.workHitRight,0);
let seq=ctx.sourceProfessionPlayerHitStatusSeq(ctx.state);
assert.equal(seq.beforeTurns,1);
assert.equal(seq.turns,0);
assert.equal(seq.restored,true);
// Source bug: compliance rebuilt to equipment 0, then StatusSeq subtracts skill hit 80 -> -80
// for this command. The following round compliance rebuilds it normally again.
assert.equal(seq.workHitRight,-80);
assert.equal(ctx.sourceProfessionPlayerHitRight(ctx.state.playerEquipCompliance),-80);

// With equipment HITRIGHT=40 and pre-suit FIXTOUGH=100, the bad field write extends
// MYSKILLHIT from 1 to 41, then StatusSeq only decrements it to 40 and does not restore.
ctx.state={playerEquipCompliance:{hitRight:40,preSuitFixedTough:100}};
ctx.battlePlayerProfessionHitState={turns:1,power:80,workHitRight:120};
pre=ctx.sourceProfessionPlayerHitPreCommandCompliance(ctx.state);
assert.equal(pre.sourceEquipBugAdd,40);
assert.equal(pre.afterTurns,41);
assert.equal(pre.workHitRight,40);
seq=ctx.sourceProfessionPlayerHitStatusSeq(ctx.state);
assert.equal(seq.turns,40);
assert.equal(seq.restored,false);
assert.equal(seq.workHitRight,40);

// Fixed pre-suit TOUGH snapshot is retained by player compliance for the source bug.
const compliance=extractFunction(game,'playerComplianceParameter');
assert.ok(compliance.includes('const preSuitFixedTough=fixedTough'));
assert.ok(compliance.includes('preSuitFixedTough,suit,suitApplied'));

// PreCommand order: full compliance first, then MYSKILLHIT Other_Def mirror.
const order=extractFunction(game,'normalBattleOrder');
assert.ok(order.indexOf('playerComplianceParameter(state)')
  <order.indexOf('sourceProfessionPlayerHitPreCommandCompliance(state)'));

// StatusSeq tail happens before the actor's command.
const status=extractFunction(game,'processBattleStatusTurn');
assert.ok(status.includes("const professionHit=desc.kind==='player'?sourceProfessionPlayerHitStatusSeq(state):null"));
const turn=extractFunction(game,'attackTurn');
assert.ok(turn.indexOf('processBattleStatusTurn(actor)')
  <turn.indexOf('sourceProfessionBattleSkillExecute(professionPrepared,actor)'));

// playerBattleView must expose current WORKHITRIGHT, not only equipment baseline.
const view=extractFunction(game,'playerBattleView');
assert.ok(view.includes('hitRight:sourceProfessionPlayerHitRight(compliance)'));

// Generic fixed profession direct helper: only CHAIN_ATK preserves DamageReact.
// BRUST / DEAD_ATTACK must leave ACUPUNCTURE unconsumed.
const exec=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(exec.includes("suppressDamageReact:prepared.functionName!=='PROFESSION_CHAIN_ATK'"));
const apply=extractFunction(game,'applyFriendlyEnemyHit');
assert.ok(apply.includes('options.suppressDamageReact'));
assert.ok(apply.includes('{triggered:false,suppressed:true}'));

// Battle reset clears transient MYSKILLHIT Work.
const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battlePlayerProfessionHitState=null'));

assert.match(html,/PLAYABLE CORE V2\.28/);
assert.match(html,/V2\.28 live：暴擊／連環攻擊／雙重攻擊／盾擊／瀕死攻擊。/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.28',
  focus:'PROFESSION_DEAD_ATTACK HP sacrifice + HITRIGHT/MYSKILLHIT source lifecycle',
  liveSkillId:40,
  mpCost:17,
  hpRate:'10+tier*2 percent of current HP',
  hitRight:'80+tier*2',
  sourceBugs:['next-action negative HITRIGHT without equip hit','equipment HITRIGHT can extend MYSKILLHIT counter'],
  genericDamageReact:'only CHAIN_ATK preserves it',
  saveSchema:30
}));
