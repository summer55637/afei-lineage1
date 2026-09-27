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
  .filter(([,row])=>row?.f?.a==='ITEM_randEnemyEquip'||row?.f?.d==='ITEM_RerandEnemyEquip')
  .map(([id,row])=>({id:Number(id),a:row.f?.a||'',d:row.f?.d||''}))
  .sort((a,b)=>a.id-b.id);
assert.deepEqual(callbackRows,[
  {id:20126,a:'ITEM_randEnemyEquip',d:'ITEM_RerandEnemyEquip'},
  {id:20127,a:'ITEM_randEnemyEquip',d:'ITEM_RerandEnemyEquip'},
  {id:20128,a:'ITEM_randEnemyEquip',d:'ITEM_RerandEnemyEquip'}
]);
for(const [id,level] of [[20126,40],[20127,80],[20128,120]]){
  const x=resolved(id);
  assert.equal(x.base[idx.ITEM_TYPE],10);
  assert.equal(x.base[idx.ITEM_LEVEL],level);
  assert.equal(x.base[idx.ITEM_NEEDPROFESSION],0);
}
assert.ok(game.includes('const SOURCE_PLAYER_RANDENEMY_BY_ITEM=Object.freeze({20126:60,20127:70,20128:100});'));

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
  [1,{itemId:20126,attachFunc:'ITEM_randEnemyEquip',detachFunc:'ITEM_RerandEnemyEquip'}],
  [2,{itemId:20127,attachFunc:'ITEM_randEnemyEquip',detachFunc:'ITEM_RerandEnemyEquip'}],
  [3,{itemId:20128,attachFunc:'ITEM_randEnemyEquip',detachFunc:'ITEM_RerandEnemyEquip'}],
  [4,{itemId:99999,attachFunc:'ITEM_randEnemyEquip',detachFunc:'ITEM_RerandEnemyEquip'}]
]);

let primary=0,secondary=0,spawnCalls=0;
const ctx={
  Math:Object.create(Math),Number,Object,
  state:null,enemy:null,
  PLAYER_EQUIP_SLOT_COUNT:9,
  SOURCE_PLAYER_NOENEMY_LEVEL_BY_ITEM:Object.freeze({18546:40,18547:80,18548:120}),
  SOURCE_PLAYER_RANDENEMY_BY_ITEM:Object.freeze({20126:60,20127:70,20128:100}),
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  sourcePlayerItemSlots:t=>t.playerItemSlots,
  sourcePlayerEquipTemplateForExisting:i=>templates.get(Number(i))||null,
  currentMap:()=>ctx.map,
  currentEncounter:()=>({encounterId:7}),
  randomPointInEncounter:()=>({x:1,y:1}),
  resolveEncounterAt:()=>({encounterId:7,encounterMin:5,encounterMax:10}),
  sourcePlayerNoEnemyActive:()=>false,
  cRand:()=>{secondary++;return ctx.secondaryRoll},
  spawnEnemy:()=>{spawnCalls++;ctx.enemy={}}
};
ctx.Math.random=()=>{primary++;return ctx.primaryRandom};
vm.createContext(ctx);
for(const name of [
  'sourcePlayerEquipCallbackSupported',
  'sourcePlayerRandEnemyThreshold',
  'walkEncounterStep'
])vm.runInContext(extractFunction(game,name),ctx);

const supported=id=>ctx.sourcePlayerEquipCallbackSupported({
  itemId:id,attachFunc:'ITEM_randEnemyEquip',detachFunc:'ITEM_RerandEnemyEquip'
});
assert.equal(supported(20126),true);
assert.equal(supported(20127),true);
assert.equal(supported(20128),true);
assert.equal(supported(99999),false);

function playerWith(index){
  const p={level:1,playerItemSlots:Array(24).fill(null),encounterCep:7,virtualWalkSteps:0,lastEncounterRoll:null};
  if(index!=null)p.playerItemSlots[3]=index;
  return p;
}
ctx.map={floorId:1000,questZone:false};

// Exact threshold derives from equipped existing item.
ctx.state=playerWith(1); assert.equal(ctx.sourcePlayerRandEnemyThreshold(ctx.state),60);
ctx.state=playerWith(2); assert.equal(ctx.sourcePlayerRandEnemyThreshold(ctx.state),70);
ctx.state=playerWith(3); assert.equal(ctx.sourcePlayerRandEnemyThreshold(ctx.state),100);
ctx.state=playerWith(null); assert.equal(ctx.sourcePlayerRandEnemyThreshold(ctx.state),0);

// Primary miss: no secondary RNG; CEP increments.
primary=secondary=spawnCalls=0;ctx.enemy=null;ctx.state=playerWith(1);
ctx.primaryRandom=0.99; // floor(.99*120)=118 >= CEP 7
ctx.secondaryRoll=0;
assert.equal(ctx.walkEncounterStep(),false);
assert.equal(primary,1);
assert.equal(secondary,0);
assert.equal(spawnCalls,0);
assert.equal(ctx.state.encounterCep,8);

// Primary hit + Rnum == threshold: suppressed because original condition is strictly >.
primary=secondary=spawnCalls=0;ctx.enemy=null;ctx.state=playerWith(1);
ctx.primaryRandom=0;ctx.secondaryRoll=60;
assert.equal(ctx.walkEncounterStep(),false);
assert.equal(primary,1);
assert.equal(secondary,1);
assert.equal(spawnCalls,0);
assert.equal(ctx.state.encounterCep,7);
assert.equal(ctx.state.lastEncounterRoll.randEnemyThreshold,60);
assert.equal(ctx.state.lastEncounterRoll.randEnemyRoll,60);
assert.equal(ctx.state.lastEncounterRoll.randEnemySuppressed,true);

// Primary hit + Rnum > threshold: encounter proceeds and CEP resets to min.
primary=secondary=spawnCalls=0;ctx.enemy=null;ctx.state=playerWith(1);
ctx.primaryRandom=0;ctx.secondaryRoll=61;
assert.equal(ctx.walkEncounterStep(),true);
assert.equal(primary,1);
assert.equal(secondary,1);
assert.equal(spawnCalls,1);
assert.equal(ctx.state.encounterCep,5);
assert.equal(ctx.state.lastEncounterRoll.randEnemySuppressed,false);

// rand:100 can never pass RAND(0,100) > 100.
primary=secondary=spawnCalls=0;ctx.enemy=null;ctx.state=playerWith(3);
ctx.primaryRandom=0;ctx.secondaryRoll=100;
assert.equal(ctx.walkEncounterStep(),false);
assert.equal(spawnCalls,0);
assert.equal(ctx.state.encounterCep,7);
assert.equal(ctx.state.lastEncounterRoll.randEnemySuppressed,true);

// No moon item: primary hit immediately encounters and consumes no secondary roll.
primary=secondary=spawnCalls=0;ctx.enemy=null;ctx.state=playerWith(null);
ctx.primaryRandom=0;ctx.secondaryRoll=0;
assert.equal(ctx.walkEncounterStep(),true);
assert.equal(secondary,0);
assert.equal(spawnCalls,1);
assert.equal(ctx.state.encounterCep,5);

assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=29/);
console.log(JSON.stringify({
  pass:true,version:'V2.15',focus:'randenemy-equip-callback',
  callbackItems:{20126:60,20127:70,20128:100},
  rngOrder:'rand()%120 first; RAND(0,100) only on primary hit; require > threshold',
  saveSchema:30
}));
