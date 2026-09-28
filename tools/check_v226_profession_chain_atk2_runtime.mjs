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

const ctx={
  Math,Number,Object,
  state:null,
  battlePlayerFixedAttackWork:null,
  battlePlayerWeaponFocusWork:null,
  battleWeakenRoundActive:()=>false,
  n:v=>Number.isFinite(Number(v))?Number(v):0
};
vm.createContext(ctx);
for(const name of [
  'sourceProfessionBattleFunctionSupported',
  'sourceProfessionPlayerWeaponFocusApply',
  'sourceProfessionPlayerEffectiveFixedAttack',
  'sourceProfessionChainAtk2FixedStr',
  'sourceProfessionChainAtk2AttackPower',
  'sourceProfessionChainAtk2ReactionConsume'
])vm.runInContext(extractFunction(game,name),ctx);

// Fixed profession row.
const row=runtime.bySkillId['24'];
assert.ok(row);
assert.equal(row.name,'双重攻击');
assert.equal(row.func,'PROFESSION_CHAIN_ATK_2');
assert.equal(row.commonCommand,'BATTLE_COM_S_CHAIN_ATK_2');
assert.equal(row.target,1);
assert.equal(row.kind,1);
assert.equal(row.useFlag,1);
assert.equal(row.costMp,13);
assert.equal(ctx.sourceProfessionBattleFunctionSupported('PROFESSION_CHAIN_ATK_2'),true);

// WORKATTACKPOWER is rebuilt from FIXSTR * (100 + tier*2)%.
assert.equal(ctx.sourceProfessionChainAtk2AttackPower(100,0),100);
assert.equal(ctx.sourceProfessionChainAtk2AttackPower(100,1),102);
assert.equal(ctx.sourceProfessionChainAtk2AttackPower(100,5),110);
assert.equal(ctx.sourceProfessionChainAtk2AttackPower(100,10),120);
assert.equal(ctx.sourceProfessionChainAtk2AttackPower(101,1),103); // C truncation.

// V2.36 closes real FIXSTR: ChainAtk2 consumes the frozen compliance FIXSTR
// after MYSKILLSTR -> Weapon Focus, rather than raw equipment-only fixedAttack.
ctx.battlePlayerFixedAttackWork=123;
assert.equal(ctx.sourceProfessionChainAtk2FixedStr({attack:999}),123);
ctx.battlePlayerFixedAttackWork=null;
assert.equal(ctx.sourceProfessionChainAtk2FixedStr({attack:77}),77);

// Current source-backed Enemy DamageReact is ACUPUNCTURE only.
// CHAIN_ATK_2 source consumes ABSROB/VANISH/TRAP, not ACUPUNCTURE, so do not mutate it.
const target={acupunctureActive:true};
const react=ctx.sourceProfessionChainAtk2ReactionConsume(target);
assert.equal(target.acupunctureActive,true);
assert.equal(react.acupunctureUntouched,true);
assert.equal(react.sourceCountersUnreachable,true);

// Exact execution shape: CHAIN_ATK_2 exits before profession calc-only AttackSeq path.
// Its lead animation is zero damage; only the second stage is a true ordinary BATTLE_Attack mirror.
const exec=extractFunction(game,'sourceProfessionBattleSkillExecute');
const branchStart=exec.indexOf("if(prepared.functionName==='PROFESSION_CHAIN_ATK_2')");
const sharedStart=exec.indexOf("if(prepared.functionName==='PROFESSION_CHAIN_ATK'){",branchStart);
assert.ok(branchStart>=0&&sharedStart>branchStart);
const branch=exec.slice(branchStart,sharedStart);
assert.ok(branch.includes('sourceProfessionChainAtk2ReactionConsume(target)'));
assert.ok(branch.includes('sourceProfessionChainAtk2FixedStr(state)'));
assert.ok(branch.includes('sourceProfessionChainAtk2AttackPower(fixedStr,prepared.attackSkillTier)'));
assert.ok(branch.includes("sourceProfessionOrdinaryPlayerAttackResult(target,{attackPower})"));
assert.ok(branch.includes("applyFriendlyEnemyHit('player','你',target,attack)"));
assert.ok(branch.includes('zeroDamageLead:true'));
assert.ok(branch.includes('noOrdinaryCounter:true'));
assert.equal(branch.includes('sourceProfessionPhysicalCalcOnlyResult(target)'),false);
assert.equal(branch.includes('resolvePlayerEnemyCounterChain'),false);
assert.ok(branch.indexOf('sourceProfessionChainAtk2ReactionConsume(target)')
  <branch.indexOf('sourceProfessionChainAtk2FixedStr(state)'));
assert.ok(branch.indexOf('sourceProfessionChainAtk2FixedStr(state)')
  <branch.indexOf('sourceProfessionOrdinaryPlayerAttackResult(target,{attackPower})'));

const ordinary=extractFunction(game,'sourceProfessionOrdinaryPlayerAttackResult');
assert.ok(ordinary.includes('const attacker=playerBattleView();'));
assert.ok(ordinary.includes('attacker.attack=Math.trunc(Number(attackPower))'));
assert.ok(ordinary.includes('return resolveAttackToEnemyWithGuardian(attacker,target'));
assert.equal(ordinary.includes('suppressSuitPoison'),false);

// BATTLE_GetAttackCount remains consumed before command execution even though CHAIN_ATK_2 ignores it.
const turn=extractFunction(game,'attackTurn');
assert.ok(turn.indexOf("sourcePlayerPrimeExecutionAttackCount(actor)")
  <turn.indexOf('sourceProfessionBattleSkillExecute(professionPrepared,actor)'));

assert.match(html,/PLAYABLE CORE V\d+\.\d+/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.26',
  focus:'PROFESSION_CHAIN_ATK_2 zero-damage lead + FIXSTR boosted ordinary attack',
  liveSkillId:24,
  mpCost:13,
  sourceDamageReactConsume:['ABSROB','VANISH','TRAP'],
  currentReachableDamageReact:'ACUPUNCTURE untouched',
  saveSchema:30
}));
