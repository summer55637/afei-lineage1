import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');

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
  assert.ok(pe>ps,'unterminated params '+name);
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

const queue=[];
let calls=[];
const equip={fire:15,thunder:20,ice:25};
const ctx={
  Math,Number,Object,String,
  state:{},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  cRand:(a,b)=>{
    calls.push([a,b]);
    assert.ok(queue.length>0,'unexpected RNG '+a+'..'+b);
    const v=queue.shift();
    assert.ok(v>=a&&v<=b,'queued RNG '+v+' outside '+a+'..'+b);
    return v;
  },
  sourcePlayerSuitWork:()=>({M_POW:20,M2_POW:10,UN_POW_M:10}),
  sourcePlayerProfessionMagicEquipSuitResist:(key)=>equip[key]??0
};
vm.createContext(ctx);
for(const name of [
  'sourceProfessionMagicLevelM',
  'sourceProfessionMagicTypeFromOption',
  'sourcePlayerProfessionMagicSuitPower',
  'sourcePlayerProfessionMagicEquipSuitForType',
  'sourceProfessionMagicPracticePower',
  'sourceProfessionMagicPreDamagePower',
  'sourceProfessionMagicGetDamage',
  'sourcePlayerProfessionMagicDamageCore'
])vm.runInContext(extractFunction(game,name),ctx);

assert.equal(ctx.sourceProfessionMagicLevelM(0),1);
assert.equal(ctx.sourceProfessionMagicLevelM(10),1);
assert.equal(ctx.sourceProfessionMagicLevelM(11),2);
assert.equal(ctx.sourceProfessionMagicLevelM(90),9);
assert.equal(ctx.sourceProfessionMagicLevelM(91),10);

assert.equal(ctx.sourceProfessionMagicTypeFromOption('火'),1);
assert.equal(ctx.sourceProfessionMagicTypeFromOption('冰'),2);
assert.equal(ctx.sourceProfessionMagicTypeFromOption('电'),3);
assert.equal(ctx.sourceProfessionMagicTypeFromOption('電'),-1);

queue.push(25,29,100);calls=[];
let r=ctx.sourceProfessionMagicPracticePower(
  'BATTLE_COM_S_VOLCANO_SPRINGS',95,0,{M_POW:20,M2_POW:10}
);
assert.equal(r.skillLevel,10);
assert.equal(r.power,396);
assert.equal(r.hpPower,396);
assert.deepEqual(calls,[[1,100],[0,99],[98,102]]);

queue.push(99,30,98);calls=[];
r=ctx.sourceProfessionMagicPracticePower(
  'BATTLE_COM_S_FIRE_BALL',85,0,{M_POW:0,M2_POW:99}
);
assert.equal(r.skillLevel,9);
assert.equal(r.power,313);
assert.ok(Math.abs(r.hpPower-Math.fround(320*Math.fround(98/100)))<1e-6);
assert.deepEqual(calls,[[1,100],[0,99],[98,102]]);

queue.push(50,10);calls=[];
r=ctx.sourceProfessionMagicPracticePower('UNKNOWN',50,0,{M_POW:0,M2_POW:10});
assert.equal(r.power,0);
assert.equal(r.varianceRoll,null);
assert.deepEqual(calls,[[1,100],[0,99]]);

queue.push(50,99,100);calls=[];
r=ctx.sourceProfessionMagicPracticePower('BATTLE_COM_S_CURRENT',85,0,{M_POW:0,M2_POW:0});
assert.equal(r.skillLevel,9);
assert.equal(r.power,200);

assert.equal(ctx.sourceProfessionMagicPreDamagePower(333,10),299);
assert.equal(ctx.sourceProfessionMagicPreDamagePower(333,0),333);

let dmg=ctx.sourceProfessionMagicGetDamage({
  magicType:2,power:100,
  proficiency:{thunder:20,ice:999},
  resist:{thunder:10,ice:99},
  baseSuit:{ice:5,thunder:77},
  equipSuit:{thunder:15,ice:88},
  spirit:{thunder:0,ice:99}
});
assert.equal(dmg,86);

dmg=ctx.sourceProfessionMagicGetDamage({
  magicType:3,power:100,
  proficiency:{ice:20,thunder:999},
  resist:{ice:10,thunder:99},
  baseSuit:{thunder:5,ice:77},
  equipSuit:{ice:15,thunder:88},
  spirit:{ice:0,thunder:99}
});
assert.equal(dmg,86);

assert.equal(ctx.sourceProfessionMagicGetDamage({magicType:-1,power:77}),77);

assert.equal(ctx.sourceProfessionMagicGetDamage({
  magicType:3,power:10,command:'BATTLE_COM_S_DOOM',
  proficiency:{fire:10,thunder:0,ice:0},
  resist:{fire:0,thunder:127,ice:100}
}),2);

const wrapped=ctx.sourcePlayerProfessionMagicDamageCore({magicType:1,power:333});
assert.equal(wrapped.power,299);
assert.equal(wrapped.unPower,10);
assert.deepEqual(JSON.parse(JSON.stringify(wrapped.equipSuit)),{fire:15,thunder:20,ice:25});
assert.equal(wrapped.damage,254);

for(const name of ['sourceProfessionMagicGetDamage','sourcePlayerProfessionMagicDamageCore']){
  assert.equal(extractFunction(game,name).includes('BATTLE_MultiAttMagic'),false);
}

assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,
  version:'V2.19',
  focus:'PROFESSION_MAGIC_GET_PRACTICE -> UN_POW_M -> PROFESSION_MAGIC_GET_DAMAGE',
  rngOrder:['RAND(1,100)','rand()%100','RAND(98,102) if hp_power>0'],
  saveSchema:30
}));
