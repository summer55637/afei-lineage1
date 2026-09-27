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

const row=runtime.bySkillId['57'];
assert.ok(row);
assert.equal(row.name,'激怒宠物');
assert.equal(row.func,'PROFESSION_ENRAGE_PET');
assert.equal(row.costMp,13);
assert.equal(row.target,1);
assert.equal(row.kind,2);
assert.equal(row.option,'攻%20|防%10|倍%2|效%1|回%3');
assert.equal(row.commonCommand,'BATTLE_COM_S_ENRAGE_PET');

const support={};
vm.createContext(support);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),support);
assert.equal(support.sourceProfessionBattleFunctionSupported('PROFESSION_ENRAGE_PET'),true);

// Hard-coded fixed formulas ignore row attack/defense/turn tokens.
const formulaCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(formulaCtx);
vm.runInContext(extractFunction(game,'sourceProfessionEnragePetPower'),formulaCtx);
vm.runInContext(extractFunction(game,'sourceProfessionEnragePetTurns'),formulaCtx);
assert.equal(formulaCtx.sourceProfessionEnragePetPower({attackSkillTier:0}),10);
assert.equal(formulaCtx.sourceProfessionEnragePetPower({attackSkillTier:5}),20);
assert.equal(formulaCtx.sourceProfessionEnragePetPower({attackSkillTier:10}),30);
assert.equal(formulaCtx.sourceProfessionEnragePetTurns({attackSkillTier:0}),3);
assert.equal(formulaCtx.sourceProfessionEnragePetTurns({attackSkillTier:4}),3);
assert.equal(formulaCtx.sourceProfessionEnragePetTurns({attackSkillTier:5}),4);
assert.equal(formulaCtx.sourceProfessionEnragePetTurns({attackSkillTier:9}),4);
assert.equal(formulaCtx.sourceProfessionEnragePetTurns({attackSkillTier:10}),5);

// Shared raw MYSKILLSTR: overwrite MagicPet STR but keep TGH/DEX.
const pet={id:'p1',name:'Pet'};
const stateCtx={
  Math,Number,String,
  enemy:{sourceBattleTurn:7},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  battleProfessionPetStrStates:new Map(),
  battleProfessionPetStrRoundStates:new Map(),
  battleProfessionPetStrPowerRaw:new Map(),
  battleMagicPetStates:new Map(),
  battlePetOutIds:new Set(),
  state:{petBox:[pet]},
  sourceMagicPetState:desc=>stateCtx.battleMagicPetStates.get('pet:'+desc.pet.id)||null,
  addLog:()=>{}
};
vm.createContext(stateCtx);
for(const name of ['sourceProfessionPetStrState','sourceProfessionPetStrRoundState','sourceProfessionPetStrSet','sourceProfessionPetStrStatusSeq','sourceProfessionPetStrAdjusted']) {
  vm.runInContext(extractFunction(game,name),stateCtx);
}
stateCtx.battleMagicPetStates.set('pet:p1',{stat:'STR',turns:3,power:99});
let set=stateCtx.sourceProfessionPetStrSet(pet,4,20);
assert.equal(set.ok,true);
assert.equal(set.overwroteMagicStr,true);
assert.equal(stateCtx.battleMagicPetStates.has('pet:p1'),false);
assert.equal(stateCtx.battleProfessionPetStrPowerRaw.get('p1'),20);

stateCtx.battleMagicPetStates.set('pet:p1',{stat:'TGH',turns:3,power:15});
set=stateCtx.sourceProfessionPetStrSet(pet,5,30);
assert.equal(set.overwroteMagicStr,false);
assert.equal(stateCtx.battleMagicPetStates.get('pet:p1').stat,'TGH');

// Round snapshot math uses saved FIXTOUGH/defense, not attack, as STR add base.
stateCtx.battleProfessionPetStrRoundStates.set('p1',{turns:5,power:30});
const adjusted=stateCtx.sourceProfessionPetStrAdjusted(pet,100,80);
assert.equal(adjusted.add,24);
assert.equal(adjusted.attack,124);

// Expiry removes active turns but raw power stays stale.
stateCtx.battleProfessionPetStrStates.set('p1',{turns:1,power:30,appliedBattleTurn:7});
const seq=stateCtx.sourceProfessionPetStrStatusSeq({kind:'pet',pet});
assert.equal(seq.expired,true);
assert.equal(stateCtx.battleProfessionPetStrStates.has('p1'),false);
assert.equal(stateCtx.battleProfessionPetStrPowerRaw.get('p1'),30);

// SetMagicPet busy bridge must see active profession Pet STR.
const busy=extractFunction(game,'sourceMagicPetBusy');
assert.ok(busy.includes("desc?.kind==='pet'&&!!sourceProfessionPetStrState(desc.pet)"));

// Live UI: DOCILE -> self 0, ENRAGE_PET -> battle Pet 5.
const liveCtx={
  Array,Math,Number,String,
  enemy:{sourcePlayerSideEntries:[{kind:'pet',petId:'p1'}]},
  battlePetOutIds:new Set(),
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourcePlayerProfessionSkillAt:slot=>({skillId:slot}),
  sourceProfessionSkillTemplate:id=>id===56?{func:'PROFESSION_DOCILE'}:id===57?{func:'PROFESSION_ENRAGE_PET'}:{func:'PROFESSION_TOXIN_WEAPON'},
  targetEnemyUnit:()=>({battleSlot:2})
};
vm.createContext(liveCtx);
vm.runInContext(extractFunction(game,'sourceProfessionLiveSelectedToNo'),liveCtx);
assert.equal(liveCtx.sourceProfessionLiveSelectedToNo(56,{}),0);
assert.equal(liveCtx.sourceProfessionLiveSelectedToNo(57,{}),5);
assert.equal(liveCtx.sourceProfessionLiveSelectedToNo(50,{}),12);

// Dispatcher is before generic same-side rejection.
const dispatch=extractFunction(game,'sourceProfessionBattleSkillExecute');
const enrageAt=dispatch.indexOf("prepared.functionName==='PROFESSION_ENRAGE_PET'");
const sameSideAt=dispatch.indexOf('if(toNo<10){');
assert.ok(enrageAt>=0&&sameSideAt>enrageAt);
assert.ok(dispatch.includes('sourceProfessionEnragePetExecute(prepared,enragePetName)'));

// Zero AttackPower calc + lethal safety + fixed helper suppressions.
const attack=extractFunction(game,'sourceProfessionEnragePetAttackResult');
assert.ok(attack.includes("Object.assign({},base,{attack:0})"));
assert.ok(attack.includes('sourcePlayerPetGuardAdjust'));
assert.ok(attack.includes('sourcePlayerPetGuardCommand'));

const execute=extractFunction(game,'sourceProfessionEnragePetExecute');
assert.ok(execute.includes('hpBefore<=calculatedDamage'));
assert.ok(execute.includes('attack.damage=0'));
assert.ok(execute.includes('suppressSuitPoison:true,suppressDamageReact:true'));
assert.ok(execute.includes('sourceProfessionPetStrSet(targetDesc.pet,turns,power)'));
assert.ok(execute.includes("targetDesc.kind==='pet'"));
assert.ok(execute.includes('sourcePlayerPetHidden(targetDesc.pet)'));

// Shared physical apply keeps owner->Pet loyalty before dodge/miss and now supports reaction suppression.
const apply=extractFunction(game,'battleApplyPhysicalHit');
assert.ok(apply.indexOf("attackerDesc?.kind==='player'&&targetDesc?.kind==='pet'")
  <apply.indexOf('if(r.dodged)'));
assert.ok(apply.includes('suppressDamageReact'));
assert.ok(apply.includes("suppressDamageReact?{triggered:false}:sourcePrepareProfessionTrapReaction"));
assert.ok(apply.includes("suppressDamageReact?{triggered:false}:sourcePrepareAcupunctureReaction"));

// PreCommand and Pet StatusSeq ordering.
const order=extractFunction(game,'normalBattleOrder');
assert.ok(order.indexOf('sourcePrepareProfessionPetStrRoundStates()')
  <order.indexOf('sourcePrepareMagicPetRoundStates()'));
const status=extractFunction(game,'processBattleStatusTurn');
assert.ok(status.indexOf('sourceProfessionPetStrStatusSeq(desc)')
  <status.indexOf('sourceMagicPetStatusSeq(desc)'));
const petView=extractFunction(game,'petBattleView');
assert.ok(petView.indexOf('sourceProfessionPetStrAdjusted')
  <petView.indexOf('sourceMagicPetAdjusted'));

// Battle reset clears active/round/raw mirrors.
const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battleProfessionPetStrStates=new Map()'));
assert.ok(reset.includes('battleProfessionPetStrRoundStates=new Map()'));
assert.ok(reset.includes('battleProfessionPetStrPowerRaw=new Map()'));

for(const v of ['2.41','2.44','2.45','2.46','2.47'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.47 live：[^<]*馴服寵物[^<]*激怒寵物/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.47-core',
  focus:'Skill 57 PROFESSION_ENRAGE_PET same-side zero-attack + Pet MYSKILLSTR lifecycle',
  skillId:57,mpCost:13,target:'OTHER / live Pet bid 5',
  power:'tier*2+10 = 10..30',
  turns:'tier 0..4=>3, 5..9=>4, 10=>5',
  sourceQuirks:['owner->Pet loyalty before dodge','lethal damage forced to zero','STR add uses FIXTOUGH base','new buff can lose a turn before first compliance snapshot'],
  saveSchema:30
}));
