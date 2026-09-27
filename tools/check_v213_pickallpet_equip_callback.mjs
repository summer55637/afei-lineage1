import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const idx=Object.fromEntries(runtime.itemDataIntOrder.map((name,i)=>[name,i]));

function resolved(id){
  const row=runtime.byItemId[String(id)];
  assert.ok(row,'item '+id);
  const base=runtime.defaultData.map(Number);
  for(let i=0;i<(row.b||[]).length;i+=2)base[row.b[i]]=row.b[i+1];
  return {id,base,row};
}
const pairRows=Object.entries(runtime.byItemId||{})
  .filter(([,row])=>row?.f?.a==='ITEM_WearEquip'||row?.f?.d==='ITEM_ReWearEquip')
  .map(([id,row])=>({id:Number(id),a:row.f?.a||'',d:row.f?.d||''}))
  .sort((a,b)=>a.id-b.id);
assert.deepEqual(pairRows,[
  {id:1975,a:'ITEM_WearEquip',d:'ITEM_ReWearEquip'},
  {id:20130,a:'ITEM_WearEquip',d:'ITEM_ReWearEquip'}
]);
for(const id of [1975,20130]){
  const x=resolved(id);
  assert.equal(x.base[idx.ITEM_TYPE],11);
  assert.equal(x.base[idx.ITEM_NEEDPROFESSION],0);
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

assert.ok(game.includes("return attach==='ITEM_WearEquip'&&detach==='ITEM_ReWearEquip';"));
assert.ok(game.includes("if(!sourcePlayerEquipCallbackSupported(template))return {ok:false,reason:'callback-unported'};"));
assert.ok(game.includes("if(!sourcePlayerCaptureLevelAllowed(target,state))return {raw:0,display:0,allowed:false"));

const templates=new Map([
  [1,{itemId:1975,attachFunc:'ITEM_WearEquip',detachFunc:'ITEM_ReWearEquip'}],
  [2,{itemId:9999,attachFunc:'ITEM_suitEquip',detachFunc:'ITEM_ResuitEquip'}]
]);
const ctx={
  Math,Number,
  state:null,
  PLAYER_EQUIP_SLOT_COUNT:9,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourcePlayerItemSlots:t=>t.playerItemSlots,
  sourcePlayerEquipTemplateForExisting:i=>templates.get(Number(i))||null,
  // V2.18 adds a source-backed suit branch to the shared callback gate. This legacy
  // V2.13 fixture intentionally uses item 9999, which is not a fixed suit template.
  sourcePlayerFixedSuitTemplate:()=>false,
  SOURCE_PLAYER_SPECIAL_EQUIP_IDS:new Set([2884])
};
vm.createContext(ctx);
for(const name of [
  'sourcePlayerEquipCallbackSupported',
  'sourcePlayerPickAllPetEnabled',
  'sourcePlayerCaptureLevelAllowed',
  'sourcePlayerEquipRequirements'
])vm.runInContext(extractFunction(game,name),ctx);

assert.equal(ctx.sourcePlayerEquipCallbackSupported({attachFunc:'',detachFunc:''}),true);
assert.equal(ctx.sourcePlayerEquipCallbackSupported({attachFunc:'ITEM_WearEquip',detachFunc:'ITEM_ReWearEquip'}),true);
assert.equal(ctx.sourcePlayerEquipCallbackSupported({attachFunc:'ITEM_suitEquip',detachFunc:'ITEM_ResuitEquip'}),false);

const basePlayer={level:10,transmigration:0,playerStats:{str:0,dex:0},playerItemSlots:Array(24).fill(null)};
ctx.state=basePlayer;
assert.equal(ctx.sourcePlayerPickAllPetEnabled(basePlayer),false);
assert.equal(ctx.sourcePlayerCaptureLevelAllowed({level:15},basePlayer),true);
assert.equal(ctx.sourcePlayerCaptureLevelAllowed({level:16},basePlayer),false);

const ringPlayer={...basePlayer,playerItemSlots:Array(24).fill(null)};
ringPlayer.playerItemSlots[3]=1;
assert.equal(ctx.sourcePlayerPickAllPetEnabled(ringPlayer),true);
assert.equal(ctx.sourcePlayerCaptureLevelAllowed({level:99},ringPlayer),true);

const otherCallbackPlayer={...basePlayer,playerItemSlots:Array(24).fill(null)};
otherCallbackPlayer.playerItemSlots[3]=2;
assert.equal(ctx.sourcePlayerPickAllPetEnabled(otherCallbackPlayer),false);
assert.equal(ctx.sourcePlayerCaptureLevelAllowed({level:16},otherCallbackPlayer),false);

const equipTemplate={
  itemId:1975,type:11,level:0,needStr:0,needDex:0,needTrans:0,needProfession:0,
  attachFunc:'ITEM_WearEquip',detachFunc:'ITEM_ReWearEquip'
};
assert.deepEqual(JSON.parse(JSON.stringify(ctx.sourcePlayerEquipRequirements(equipTemplate,basePlayer))),{ok:true});
const unsupported={...equipTemplate,itemId:9999,attachFunc:'ITEM_suitEquip',detachFunc:'ITEM_ResuitEquip'};
assert.deepEqual(JSON.parse(JSON.stringify(ctx.sourcePlayerEquipRequirements(unsupported,basePlayer))),{ok:false,reason:'callback-unported'});

assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=29/);
console.log(JSON.stringify({
  pass:true,version:'V2.13',focus:'pickallpet-equip-callback',
  callbackItems:[1975,20130],
  captureLevelRule:'PickAllPet || playerLevel+5>=enemyLevel',
  saveSchema:30
}));
