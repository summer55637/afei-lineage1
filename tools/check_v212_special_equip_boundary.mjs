import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const idx=Object.fromEntries(runtime.itemDataIntOrder.map((name,i)=>[name,i]));

function template(id){
  const row=runtime.byItemId[String(id)];
  assert.ok(row,'template '+id);
  const base=runtime.defaultData.map(Number);
  for(let i=0;i<(row.b||[]).length;i+=2)base[row.b[i]]=row.b[i+1];
  return {base,row};
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

const angel=template(2884),hero=template(2885);
assert.equal(angel.base[idx.ITEM_TYPE],10);
assert.equal(hero.base[idx.ITEM_TYPE],16);
assert.equal(angel.base[idx.ITEM_NEEDPROFESSION],0);
assert.equal(hero.base[idx.ITEM_NEEDPROFESSION],0);
assert.deepEqual(angel.row.f||{},{});
assert.deepEqual(hero.row.f||{},{});

assert.ok(game.includes('const SOURCE_PLAYER_SPECIAL_EQUIP_IDS=new Set([2884]);'));
assert.equal(game.includes('const SOURCE_PLAYER_SPECIAL_EQUIP_IDS=new Set([2884,2885]);'),false);

const ctx={
  Math,Number,
  state:{transmigration:0,level:1,playerStats:{str:0,dex:0}},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  SOURCE_PLAYER_SPECIAL_EQUIP_IDS:new Set([2884]),
  PLAYER_ARM_SLOT:2,PLAYER_HEAD_SLOT:0,PLAYER_BODY_SLOT:1,
  PLAYER_DECORATION1_SLOT:3,PLAYER_BELT_SLOT:5,PLAYER_SHIELD_SLOT:6,
  PLAYER_SHOES_SLOT:7,PLAYER_GLOVE_SLOT:8,
  sourcePlayerItemSlots:()=>Array(24).fill(null),
  sourcePlayerEquipTemplateForExisting:()=>null
};
vm.createContext(ctx);
vm.runInContext(extractFunction(game,'sourcePlayerEquipRequirements'),ctx);
vm.runInContext(extractFunction(game,'sourcePlayerEquipPlace'),ctx);

const t=id=>({
  itemId:id,level:0,needStr:0,needDex:0,needTrans:0,needProfession:0,
  attachFunc:'',detachFunc:'',type:id===2884?10:16
});
assert.deepEqual(JSON.parse(JSON.stringify(ctx.sourcePlayerEquipRequirements(t(2884),ctx.state))),{ok:false,reason:'special-equip-unported'});
assert.deepEqual(JSON.parse(JSON.stringify(ctx.sourcePlayerEquipRequirements(t(2885),ctx.state))),{ok:true});
assert.equal(ctx.sourcePlayerEquipPlace(t(2884),Array(24).fill(null),ctx.state),3);
assert.equal(ctx.sourcePlayerEquipPlace(t(2885),Array(24).fill(null),ctx.state),-1);

assert.match(game,/schemaVersion:29/);
assert.match(game,/s\.schemaVersion=29/);
console.log(JSON.stringify({
  pass:true,version:'V2.12',focus:'angel-hero-token-equip-boundary',
  angel:{itemId:2884,type:10,specialGate:true},
  hero:{itemId:2885,type:16,specialGate:false,equipPlace:-1},
  saveSchema:29
}));
