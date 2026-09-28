import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));

function extractFunction(source,name){
  const marker='function '+name+'(';
  const start=source.indexOf(marker);
  assert.ok(start>=0,'missing '+name);
  const ps=source.indexOf('(',start);
  let pd=0,pe=-1,q=null,esc=false,lc=false,bc=false;
  for(let i=ps;i<source.length;i++){
    const c=source[i],nn=source[i+1];
    if(lc){if(c==='\n')lc=false;continue}
    if(bc){if(c==='*'&&nn==='/'){bc=false;i++;}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c=='"'||c.charCodeAt(0)===96){q=c;continue}
    if(c==='/'&&nn==='/'){lc=true;i++;continue}
    if(c==='/'&&nn==='*'){bc=true;i++;continue}
    if(c==='(')pd++;
    else if(c===')'&&--pd===0){pe=i;break}
  }
  assert.ok(pe>=0,'unterminated params '+name);
  const bs=source.indexOf('{',pe);
  assert.ok(bs>=0,'missing body '+name);
  let d=0;q=null;esc=false;lc=false;bc=false;
  for(let i=bs;i<source.length;i++){
    const c=source[i],nn=source[i+1];
    if(lc){if(c==='\n')lc=false;continue}
    if(bc){if(c==='*'&&nn==='/'){bc=false;i++;}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c=='"'||c.charCodeAt(0)===96){q=c;continue}
    if(c==='/'&&nn==='/'){lc=true;i++;continue}
    if(c==='/'&&nn==='*'){bc=true;i++;continue}
    if(c==='{')d++;
    else if(c==='}'&&--d===0)return source.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const expected=new Map([
  ['60',['毒 turn 3  攻%-30','毒攻击']],['61',['毒 turn 5  攻%-50','猛毒攻击']],
  ['80',['石 turn 3  攻%-30','石化攻击']],['90',['乱 turn 3 攻%-30','混乱攻击']],
  ['100',['醉 turn 3 攻%-30','泥醉攻击']],['110',['眠 turn 3  攻%-30','催眠攻击']],
  ['707',['剧 turn 6  攻%+20','剧毒攻击']],['708',['石 turn 9 攻%-30','石化攻击']],
  ['709',['乱 turn 6 攻%-30','混乱攻击']],['710',['眠 turn 6 攻%-30','催眠攻击']],
  ['711',['虚 turn 9 攻%+60','亢奋']],['712',['麻 turn 1 攻%+70','亢奋']]
]);
for(const [id,[option,name]] of expected){
  const row=runtime.byId[id];
  assert.equal(row?.f,'PETSKILL_StatusChange');
  assert.equal(row?.o,option);
  assert.equal(row?.n,name);
  assert.equal(row?.field,1);
  assert.equal(row?.illegal,0);
}
assert.equal(Object.values(runtime.byId).filter(x=>x?.f==='PETSKILL_StatusChange').length,12);

const typeFn=extractFunction(game,'sourcePetStatusSkillType');
const turnFn=extractFunction(game,'sourcePetStatusSkillTurn');
const pctFn=extractFunction(game,'sourcePetStatusSkillAttackPct');
const applyFn=extractFunction(game,'sourcePetApplyStatusAttackHit');

const calls=[];
const ctx={
  Math,Number,String,Object,Array,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  battleStatusChance:()=>({allowed:true,success:true,per:40}),
  battleSarsApplyRaw:(d,t,c)=>{calls.push({kind:'sars',d,t,c});return true;},
  battleStatusApply:(d,type,t)=>{calls.push({kind:'status',d,type,t});return true;},
  battleStatusApplyRaw:(d,type,t)=>{calls.push({kind:'raw',d,type,t});return true;},
  battleStatusDescName:()=>'target',
  BATTLE_STATUS_NAMES:{},
  addLog:()=>{}
};
vm.createContext(ctx);
for(const fn of [typeFn,turnFn,pctFn,applyFn])vm.runInContext(fn,ctx);

for(const [option,type] of [
  ['毒 turn 3 攻%-30','poison'],['醉 turn 3 攻%-30','drunk'],['眠 turn 3 攻%-30','sleep'],
  ['石 turn 3 攻%-30','stone'],['乱 turn 3 攻%-30','confusion'],['剧 turn 6 攻%+20','deepPoison'],
  ['虚 turn 9 攻%+60','weaken'],['麻 turn 1 攻%+70','paralysis'],['障 turn 1','barrier'],
  ['默 turn 3','nocast'],['煞 turn 3','sars']
])assert.equal(ctx.sourcePetStatusSkillType({o:option}),type,option);
assert.equal(ctx.sourcePetStatusSkillType({o:'剧毒 turn 6 攻%+20'}),'deepPoison');
assert.equal(ctx.sourcePetStatusSkillType({o:'亂 turn 6 攻%-30'}),'confusion');
assert.equal(ctx.sourcePetStatusSkillTurn({o:'剧 turn 6 攻%+20'}),6);
assert.equal(ctx.sourcePetStatusSkillTurn({o:'虚 turn 9 攻%+60'}),9);
assert.equal(ctx.sourcePetStatusSkillTurn({o:'麻 turn 1 攻%+70'}),1);
assert.equal(ctx.sourcePetStatusSkillAttackPct({o:'剧 turn 6 攻%+20'}),20);
assert.equal(ctx.sourcePetStatusSkillAttackPct({o:'虚 turn 9 攻%+60'}),60);
assert.equal(ctx.sourcePetStatusSkillAttackPct({o:'麻 turn 1 攻%+70'}),70);

for(const type of ['deepPoison','paralysis','weaken','barrier','nocast','poison','sleep','stone','confusion']){
  calls.length=0;
  const result=ctx.sourcePetApplyStatusAttackHit({id:'pet1'},{kind:'enemy',unit:{hp:100}},{damage:50},type,3,'test');
  assert.equal(result.unsupportedType,undefined,type+' accepted');
  assert.equal(result.applied,true,type+' applied');
  assert.equal(calls.at(0)?.kind,'status',type+' generic');
  assert.equal(calls.at(0)?.type,type);
  assert.equal(calls.at(0)?.t,3);
}
calls.length=0;
const sars=ctx.sourcePetApplyStatusAttackHit({id:'pet1'},{kind:'enemy',unit:{hp:100}},{damage:50},'sars',3,'sars');
assert.equal(sars.applied,true);
assert.equal(calls.at(0)?.kind,'sars');
assert.equal(calls.at(0)?.t,4);
assert.equal(calls.at(0)?.c,true);

assert.ok(html.includes('PLAYABLE CORE V2.78'));
assert.ok(html.includes('V2.78 live：玩家出戰 Pet RANDOMACT 的 PETSKILL_StatusChange 完整狀態 token 映射。'));
console.log(JSON.stringify({pass:true,version:'V2.78-petskill-statuschange',rows:12,newTokens:'麻／虛／劇／障／默／煞',saveSchema:30}));
