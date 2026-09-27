import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const field2=JSON.parse(fs.readFileSync('data/generated/stoneage_item_field2_runtime.json','utf8'));
const make=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const idx=Object.fromEntries(make.itemDataIntOrder.map((name,i)=>[name,i]));

const expectedArgs={
  20184:'EA:40|WA:40|FI:40|WI:40|QU:40',
  20420:'EA:10|WA:10|FI:10|WI:10|QU:10',
  20421:'EA:10|WA:10|FI:10|WI:10|QU:10'
};
for(const [idText,arg] of Object.entries(expectedArgs)){
  const id=Number(idText),row=field2.byItemId[String(id)],m=make.byItemId[String(id)];
  assert.ok(row&&m,'runtime '+id);
  assert.equal(row.argument,arg);
  assert.equal(m.g,arg,'small item-make runtime must carry callback argument without field2 preload');
  assert.equal(row.functions.attach,'ITEM_MagicEquitWear');
  assert.equal(row.functions.detach,'ITEM_MagicEquitReWear');
  assert.equal(row.typeCode,undefined);
  const base=make.defaultData.map(Number);
  for(let i=0;i<(m.b||[]).length;i+=2)base[m.b[i]]=m.b[i+1];
  assert.equal(base[idx.ITEM_TYPE],7);
  assert.equal(base[idx.ITEM_NEEDPROFESSION],0);
}

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

const slots={
  1:{use:true,owner:'player',itemId:20184},
  2:{use:true,owner:'player',itemId:20420},
  3:{use:true,owner:'player',itemId:20421}
};
const templates={
  1:{itemId:20184,attachFunc:'ITEM_MagicEquitWear',detachFunc:'ITEM_MagicEquitReWear'},
  2:{itemId:20420,attachFunc:'ITEM_MagicEquitWear',detachFunc:'ITEM_MagicEquitReWear'},
  3:{itemId:20421,attachFunc:'ITEM_MagicEquitWear',detachFunc:'ITEM_MagicEquitReWear'}
};
let dodgeRoll=1;
const ctx={
  Math,Number,Object,parseInt,
  state:{luck:5,playerItemSlots:Array(24).fill(null),itemRuntime:{slots:{}}},
  itemMakeDb:make,
  PLAYER_EQUIP_SLOT_COUNT:9,
  SOURCE_PLAYER_MAGIC_DEFENSE_ITEM_IDS:new Set([20184,20420,20421]),
  SOURCE_PLAYER_NOENEMY_LEVEL_BY_ITEM:Object.freeze({18546:40,18547:80,18548:120}),
  SOURCE_PLAYER_RANDENEMY_BY_ITEM:Object.freeze({20126:60,20127:70,20128:100}),
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourcePlayerItemSlots:t=>t.playerItemSlots,
  sourceRuntimeSlotFromTarget:(t,i)=>t.itemRuntime.slots[String(i)]||null,
  sourcePlayerEquipTemplateForExisting:i=>templates[i]||null,
  sourcePlayerFixedEquipResistTemplate:()=>false,
  magicTargetResist:()=>20,
  sourceDefMagicResistBonus:()=>50,
  cRand:()=>dodgeRoll
};
vm.createContext(ctx);
for(const name of [
  'sourceItemMakeCallbackArgument',
  'sourcePlayerLiveCallbackArgument',
  'sourcePlayerEquipCallbackSupported',
  'sourcePlayerMagicDefenseArgumentValue',
  'sourcePlayerEquipMagicDefense',
  'sourceMagicEffectiveResist',
  'enemyMagicDodge'
])vm.runInContext(extractFunction(game,name),ctx);

const cb=id=>ctx.sourcePlayerEquipCallbackSupported({
  itemId:id,attachFunc:'ITEM_MagicEquitWear',detachFunc:'ITEM_MagicEquitReWear'
});
assert.equal(cb(20184),true);
assert.equal(cb(20420),true);
assert.equal(cb(20421),true);
assert.equal(cb(99999),false);

assert.equal(ctx.sourcePlayerMagicDefenseArgumentValue('EA:40|WA:-10|QU:25','EA'),40);
assert.equal(ctx.sourcePlayerMagicDefenseArgumentValue('EA:40|WA:-10|QU:25','WA'),-10);
assert.equal(ctx.sourcePlayerMagicDefenseArgumentValue('EA:101','EA'),0);

ctx.state.itemRuntime.slots['1']=slots[1];
ctx.state.playerItemSlots[1]=1;
assert.deepEqual(
  JSON.parse(JSON.stringify(ctx.sourcePlayerEquipMagicDefense(ctx.state))),
  {
    earth:40,water:40,fire:40,wind:40,quick:40,
    items:[{slot:1,itemIndex:1,itemId:20184,argument:expectedArgs[20184],
      values:{earth:40,water:40,fire:40,wind:40,quick:40}}]
  }
);

// fixed order: (natural 20 + equip 40) then +50% def-magic status => 90.
let r=ctx.sourceMagicEffectiveResist({kind:'player'},0);
assert.deepEqual(JSON.parse(JSON.stringify(r)),{base:60,natural:20,equip:40,bonus:50,effective:90});

// QU only affects player magic dodge: luck*3 + naturalResist*.15 + QU*.9 = 54.
dodgeRoll=54;
r=ctx.enemyMagicDodge({kind:'player'},0);
assert.deepEqual(JSON.parse(JSON.stringify(r)),{dodged:true,roll:54,threshold:54});
dodgeRoll=55;
r=ctx.enemyMagicDodge({kind:'player'},0);
assert.equal(r.dodged,false);
assert.equal(r.threshold,54);

// Pet/Enemy do not receive player equipment defense.
r=ctx.sourceMagicEffectiveResist({kind:'pet',pet:{}},0);
assert.equal(r.equip,0);
assert.equal(r.base,20);

// Live callback/argument mutation removes the equipment effect immediately.
templates[1]={itemId:20184,attachFunc:'',detachFunc:''};
assert.deepEqual(
  JSON.parse(JSON.stringify(ctx.sourcePlayerEquipMagicDefense(ctx.state))),
  {earth:0,water:0,fire:0,wind:0,quick:0,items:[]}
);
templates[1]={itemId:20184,attachFunc:'ITEM_MagicEquitWear',detachFunc:'ITEM_MagicEquitReWear'};
slots[1].field2Char={argument:'EA:5|WA:6|FI:7|WI:8|QU:9'};
assert.deepEqual(
  JSON.parse(JSON.stringify(ctx.sourcePlayerEquipMagicDefense(ctx.state))),
  {
    earth:5,water:6,fire:7,wind:8,quick:9,
    items:[{slot:1,itemIndex:1,itemId:20184,argument:'EA:5|WA:6|FI:7|WI:8|QU:9',
      values:{earth:5,water:6,fire:7,wind:8,quick:9}}]
  }
);

assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);
console.log(JSON.stringify({
  pass:true,version:'V2.16',focus:'magic-defense-equip-callback',
  items:expectedArgs,
  damageResist:'natural + EA/WA/FI/WI, then positive def-magic status scaling',
  dodge:'luck*3 + naturalResist*.15 + QU*.9',
  baseArgumentSource:'item-make runtime g; field2 preload not required',
  saveSchema:30
}));
