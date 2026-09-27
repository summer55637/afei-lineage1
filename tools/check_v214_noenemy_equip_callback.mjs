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
  return {id,row,base};
}
const callbackRows=Object.entries(runtime.byItemId||{})
  .filter(([,row])=>row?.f?.a==='ITEM_equipNoenemy'||row?.f?.d==='ITEM_remNoenemy')
  .map(([id,row])=>({id:Number(id),a:row.f?.a||'',d:row.f?.d||''}))
  .sort((a,b)=>a.id-b.id);
assert.deepEqual(callbackRows,[
  {id:18546,a:'ITEM_equipNoenemy',d:'ITEM_remNoenemy'},
  {id:18547,a:'ITEM_equipNoenemy',d:'ITEM_remNoenemy'},
  {id:18548,a:'ITEM_equipNoenemy',d:'ITEM_remNoenemy'}
]);
for(const [id,level] of [[18546,40],[18547,80],[18548,120]]){
  const x=resolved(id);
  assert.equal(x.base[idx.ITEM_TYPE],10);
  assert.equal(x.base[idx.ITEM_LEVEL],level);
  assert.equal(x.base[idx.ITEM_NEEDPROFESSION],0);
}
assert.ok(game.includes('const SOURCE_PLAYER_NOENEMY_LEVEL_BY_ITEM=Object.freeze({18546:40,18547:80,18548:120});'));

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

const templates=new Map([
  [1,{itemId:18546,attachFunc:'ITEM_equipNoenemy',detachFunc:'ITEM_remNoenemy'}],
  [2,{itemId:18547,attachFunc:'ITEM_equipNoenemy',detachFunc:'ITEM_remNoenemy'}],
  [3,{itemId:18548,attachFunc:'ITEM_equipNoenemy',detachFunc:'ITEM_remNoenemy'}],
  [4,{itemId:99999,attachFunc:'ITEM_equipNoenemy',detachFunc:'ITEM_remNoenemy'}]
]);
let pointCalls=0,spawnCalls=0,randomCalls=0;
const ctx={
  Math:Object.create(Math),
  Number,Object,
  state:null,enemy:null,
  PLAYER_EQUIP_SLOT_COUNT:9,
  SOURCE_PLAYER_NOENEMY_LEVEL_BY_ITEM:Object.freeze({18546:40,18547:80,18548:120}),
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  sourcePlayerItemSlots:t=>t.playerItemSlots,
  sourcePlayerEquipTemplateForExisting:i=>templates.get(Number(i))||null,
  currentMap:()=>ctx.map,
  currentEncounter:()=>({encounterId:7}),
  randomPointInEncounter:()=>{pointCalls++;return {x:1,y:1}},
  resolveEncounterAt:()=>({encounterId:7,encounterMin:5,encounterMax:10}),
  spawnEnemy:()=>{spawnCalls++;ctx.enemy={}},
};
ctx.Math.random=()=>{randomCalls++;return 0};
vm.createContext(ctx);
for(const name of [
  'sourcePlayerEquipCallbackSupported',
  'sourcePlayerNoEnemyLevel',
  'sourcePlayerNoEnemyFloorActive',
  'sourcePlayerNoEnemyActive',
  'walkEncounterStep'
])vm.runInContext(extractFunction(game,name),ctx);

const supported=id=>ctx.sourcePlayerEquipCallbackSupported({
  itemId:id,attachFunc:'ITEM_equipNoenemy',detachFunc:'ITEM_remNoenemy'
});
assert.equal(supported(18546),true);
assert.equal(supported(18547),true);
assert.equal(supported(18548),true);
assert.equal(supported(99999),false);

assert.equal(ctx.sourcePlayerNoEnemyFloorActive(40,100),true);
assert.equal(ctx.sourcePlayerNoEnemyFloorActive(40,200),true);
assert.equal(ctx.sourcePlayerNoEnemyFloorActive(40,300),false);
assert.equal(ctx.sourcePlayerNoEnemyFloorActive(80,400),true);
assert.equal(ctx.sourcePlayerNoEnemyFloorActive(80,500),false);
assert.equal(ctx.sourcePlayerNoEnemyFloorActive(120,500),true);
assert.equal(ctx.sourcePlayerNoEnemyFloorActive(120,600),false);
assert.equal(ctx.sourcePlayerNoEnemyFloorActive(200,9999),true);

const player={level:1,playerItemSlots:Array(24).fill(null),encounterCep:7,virtualWalkSteps:0,lastEncounterRoll:{old:true}};
player.playerItemSlots[3]=2;
ctx.state=player;ctx.map={floorId:300,questZone:false};
assert.equal(ctx.sourcePlayerNoEnemyLevel(player),80);
assert.equal(ctx.sourcePlayerNoEnemyActive(player,ctx.map),true);
const oldRoll=player.lastEncounterRoll;
assert.equal(ctx.walkEncounterStep(),false);
assert.equal(player.virtualWalkSteps,1);
assert.equal(player.encounterCep,7);
assert.equal(player.lastEncounterRoll,oldRoll);
assert.equal(pointCalls,0);
assert.equal(randomCalls,0);
assert.equal(spawnCalls,0);

ctx.map={floorId:500,questZone:false};
assert.equal(ctx.sourcePlayerNoEnemyActive(player,ctx.map),false);

// Removing the equipped existing item immediately restores normal eligibility.
player.playerItemSlots[3]=null;
assert.equal(ctx.sourcePlayerNoEnemyLevel(player),0);
assert.equal(ctx.sourcePlayerNoEnemyActive(player,{floorId:100}),false);

assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);
console.log(JSON.stringify({
  pass:true,version:'V2.14',focus:'noenemy-equip-callback',
  callbackItems:{18546:40,18547:80,18548:120},
  walkSuppression:'count-step; no encounter RNG; no CEP mutation',
  saveSchema:30
}));
