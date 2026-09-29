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

const row=runtime.bySkillId['47'];
assert.ok(row);
assert.equal(row.name,'陷阱');
assert.equal(row.func,'PROFESSION_TRAP');
assert.equal(row.option,'效%1|回%5');
assert.equal(row.costMp,11);
assert.equal(row.target,5);
assert.equal(row.kind,2);
assert.equal(row.commonCommand,'BATTLE_COM_S_TRAP');

const supportCtx={};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_TRAP'),true);

// Fixed M-tier mapping: >90=>10, >80=>9 ... >10=>2, else 1.
const tierCtx={
  Math,Number,
  n:v=>Number.isFinite(Number(v))?Number(v):0
};
vm.createContext(tierCtx);
vm.runInContext(extractFunction(game,'sourceProfessionMagicLevelM'),tierCtx);
for(const [raw,tier] of [[0,1],[10,1],[11,2],[40,4],[41,5],[80,8],[81,9],[90,9],[91,10],[100,10]]){
  assert.equal(tierCtx.sourceProfessionMagicLevelM(raw),tier,'M-tier '+raw);
}

// Execute formulas and runtime storage.
const execCtx={
  Math,Number,String,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:tierCtx.sourceProfessionMagicLevelM,
  addLog:()=>{}
};
vm.createContext(execCtx);
vm.runInContext('let battlePlayerProfessionTrap=null; globalThis.getTrap=()=>battlePlayerProfessionTrap;',execCtx);
vm.runInContext(extractFunction(game,'sourceProfessionTrapTier'),execCtx);
vm.runInContext(extractFunction(game,'sourceProfessionTrapExecute'),execCtx);

for(const [display,tier,value,turns] of [
  [10,1,130,1],
  [41,5,250,2],
  [91,10,400,3]
]){
  const out=execCtx.sourceProfessionTrapExecute({
    skillId:47,functionName:'PROFESSION_TRAP',toNo:0,displayLevel:display
  },'陷阱');
  assert.equal(out.tier,tier);
  assert.equal(out.value,value);
  assert.equal(out.turns,turns);
  const st=execCtx.getTrap();
  assert.equal(st.tier,tier);
  assert.equal(st.value,value);
  assert.equal(st.turns,turns);
}

// ProfessionStatusSeq bug/lifecycle: count>0 decrements; MOD is only cleared on a later pass that starts at 0.
vm.runInContext(extractFunction(game,'sourceProfessionPlayerTrapStatusSeq'),execCtx);
execCtx.sourceProfessionTrapExecute({skillId:47,functionName:'PROFESSION_TRAP',toNo:0,displayLevel:10},'陷阱');
let seq=execCtx.sourceProfessionPlayerTrapStatusSeq();
assert.equal(seq.before,1);
assert.equal(seq.after,0);
assert.equal(seq.active,false);
assert.equal(seq.modRetainedAtZero,true);
assert.equal(execCtx.getTrap().value,130);
seq=execCtx.sourceProfessionPlayerTrapStatusSeq();
assert.equal(seq.modCleared,true);
assert.equal(execCtx.getTrap(),null);

execCtx.sourceProfessionTrapExecute({skillId:47,functionName:'PROFESSION_TRAP',toNo:0,displayLevel:41},'陷阱');
seq=execCtx.sourceProfessionPlayerTrapStatusSeq();
assert.equal(seq.before,2);
assert.equal(seq.after,1);
assert.equal(seq.active,true);

// Reaction: positive melee hit redirects fixed damage to attacker and consumes trap.
const reactCtx={
  Math,Number,Object,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  battleStatusDescView:desc=>({throwWeapon:!!desc?.unit?.throwWeapon}),
  battleStatusHp:desc=>desc.kind==='player'?reactCtx.playerHp:desc.unit.hp,
  battleStatusSetHp:(desc,hp)=>{
    if(desc.kind==='player')reactCtx.playerHp=Math.max(0,hp);
    else desc.unit.hp=Math.max(0,hp);
  },
  sourceTrackDamageSubUltimate:()=>({type:0}),
  battleStatusWakeOnDamage:(desc,damage)=>{reactCtx.wake=[desc.kind,damage]},
  sourceMarkEnemyDeathCredit:()=>{reactCtx.credit++},
  battleStatusDescName:desc=>desc.kind==='player'?'你':desc.unit.name,
  addLog:()=>{},
  playerHp:500,wake:null,credit:0
};
vm.createContext(reactCtx);
vm.runInContext('let battlePlayerProfessionTrap=null; globalThis.setTrap=v=>{battlePlayerProfessionTrap=v}; globalThis.getTrap=()=>battlePlayerProfessionTrap;',reactCtx);
for(const name of [
  'sourceProfessionPlayerTrapActive',
  'sourcePrepareProfessionTrapReaction',
  'sourceFinishProfessionTrapReaction',
  'sourceLogProfessionTrapReaction'
])vm.runInContext(extractFunction(game,name),reactCtx);

const attacker={kind:'enemy',unit:{name:'Enemy',hp:500,throwWeapon:false},unitId:1};
const player={kind:'player'};
reactCtx.setTrap({turns:2,value:250,tier:5});
const r={damage:77,dodged:false,miss:false,critical:false};
let reaction=reactCtx.sourcePrepareProfessionTrapReaction(attacker,player,r);
assert.equal(reaction.triggered,true);
assert.equal(reaction.originalDamage,77);
assert.equal(reaction.trapDamage,250);
assert.equal(r.damage,250);
assert.equal(r.sourceCounterBlockedByTrap,true);
assert.equal(reactCtx.getTrap(),null);
reactCtx.sourceFinishProfessionTrapReaction(reaction);
assert.equal(attacker.unit.hp,250);
assert.equal(reactCtx.playerHp,500);
assert.deepEqual(reactCtx.wake,['enemy',250]);

// Throw weapon does not consume TRAP.
attacker.unit.throwWeapon=true;
attacker.unit.hp=500;
reactCtx.setTrap({turns:2,value:250,tier:5});
const ranged={damage:99,dodged:false,miss:false};
reaction=reactCtx.sourcePrepareProfessionTrapReaction(attacker,player,ranged);
assert.equal(reaction.triggered,false);
assert.equal(reaction.throwWeaponBlocked,true);
assert.equal(ranged.damage,99);
assert.equal(reactCtx.getTrap().turns,2);
assert.equal(reactCtx.getTrap().value,250);

// Zero/miss/dodge also leave it armed.
attacker.unit.throwWeapon=false;
for(const rr of [
  {damage:0,dodged:false,miss:false},
  {damage:50,dodged:true,miss:false},
  {damage:50,dodged:false,miss:true}
]){
  reactCtx.setTrap({turns:1,value:130,tier:1});
  const x=reactCtx.sourcePrepareProfessionTrapReaction(attacker,player,rr);
  assert.equal(x.triggered,false);
  assert.equal(reactCtx.getTrap().value,130);
}

// fixed main-loop ordering: ordinary StatusSeq / MagicStatusSeq -> ProfessionStatusSeq
// -> command execution. A newly cast TRAP is therefore not decremented on its cast turn.
const statusFn=extractFunction(game,'processBattleStatusTurn');
const rebackAt=statusFn.indexOf('sourceProfessionPlayerRebackStatusSeq(desc,state)');
const trapSeqAt=statusFn.indexOf('sourceProfessionPlayerTrapStatusSeq()');
assert.ok(rebackAt>=0&&trapSeqAt>rebackAt);
assert.ok(statusFn.includes('if(professionTrap)extra.professionTrap=professionTrap;'));
const turnFn=extractFunction(game,'attackTurn');
const statusAt=turnFn.indexOf('processBattleStatusTurn(actor)');
const castAt=turnFn.indexOf('sourceProfessionBattleSkillExecute(professionPrepared,actor)');
assert.ok(statusAt>=0&&castAt>statusAt);

// Dispatcher must happen before generic same-side direct-target rejection.
const execFn=extractFunction(game,'sourceProfessionBattleSkillExecute');
const trapDispatch=execFn.indexOf("prepared.functionName==='PROFESSION_TRAP'");
const sameSide=execFn.indexOf('if(toNo<10){');
assert.ok(trapDispatch>=0&&sameSide>trapDispatch);
assert.ok(execFn.includes('sourceProfessionTrapExecute(prepared,trapName)'));

// DamageReact coverage and redirect boundaries.
const generic=extractFunction(game,'battleApplyPhysicalHit');
assert.ok(generic.indexOf('sourcePrepareProfessionTrapReaction')<generic.indexOf('sourcePrepareAcupunctureReaction'));
assert.ok(generic.includes('sourceFinishProfessionTrapReaction(trap)'));

const enemySkill=extractFunction(game,'enemyApplySkillHit');
assert.ok(enemySkill.includes('sourcePrepareProfessionTrapReaction'));
assert.ok(enemySkill.includes('ignoreDamageReact:!!options.ignoreDamageReact'));

const enemyWeapon=extractFunction(game,'enemyWeaponApplyHit');
assert.ok(enemyWeapon.includes('battleApplyPhysicalHit('));
assert.ok(enemyWeapon.includes('{deferItemCrush:true,deferAddProfit:true}'));
assert.ok(enemyWeapon.includes("{kind:'enemy',unit,unitId:unit.id}"));

const enemyPrimary=extractFunction(game,'performEnemyPrimaryAttack');
assert.ok(enemyPrimary.includes('battleApplyPhysicalHit(')||enemyPrimary.includes('sourcePrepareProfessionTrapReaction'));
assert.ok(enemyPrimary.includes('sourceCounterBlockedByDamageReact:true'));

const direct=extractFunction(game,'enemyApplyDirectGuardianSkillHit');
assert.ok(direct.includes('const applied=enemyApplySkillHit(unit,actual,r,label,options);'));
assert.ok(direct.includes('if(applied?.triggered&&applied?.attackerDesc)return applied.attackerDesc;'));

const counter=extractFunction(game,'resolvePlayerEnemyCounterChain');
assert.ok(counter.includes('primaryResult?.sourceCounterBlockedByTrap'));
assert.ok(counter.includes('r.sourceCounterBlockedByTrap=true'));

const confusion=extractFunction(game,'resolveConfusionCounterChain');
assert.ok(confusion.includes('primaryResult?.sourceCounterBlockedByTrap'));

const weaponCounter=extractFunction(game,'sourceEnemyFinalizeWeaponSequenceCounter');
assert.ok(weaponCounter.includes('r.sourceCounterBlockedByTrap'));

const comboReact=extractFunction(game,'sourceComboAcupunctureSegment');
assert.ok(comboReact.indexOf('sourcePrepareProfessionTrapReaction')<comboReact.indexOf('sourcePrepareAcupunctureReaction'));
assert.ok(comboReact.includes("reactionType:'trap'"));
assert.ok(comboReact.includes('targetDamage:0'));

const combo=extractFunction(game,'sourcePerformCombo');
assert.ok(combo.includes("trap:acupuncture.reactionType==='trap'?acupuncture.reaction:null"));
assert.ok(combo.includes('damageReactType:acupuncture.reactionType'));

// Published marker + no save migration.
assert.match(html,/PLAYABLE CORE V2\.43/);
assert.match(html,/V2\.43 live：[^<]*挑撥[^<]*陷阱/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.43-core',
  focus:'Skill 47 PROFESSION_TRAP assist + fixed DamageReact redirect lifecycle',
  skillId:47,mpCost:11,
  tier:'PROFESSION_CHANGE_SKILL_LEVEL_M',
  value:'tier*30+100',
  turns:'tier1..4=1, tier5..9=2, tier10=3',
  trigger:'positive non-throw physical DamageSub',
  redirect:'Player takes 0; attacker takes fixed trap damage; trap consumed; Counter blocked',
  saveSchema:30
}));
