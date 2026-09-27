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

const row=runtime.bySkillId['49'];
assert.ok(row);
assert.equal(row.name,'尸体掠夺');
assert.equal(row.func,'PROFESSION_PLUNDER');
assert.equal(row.option,'效%1');
assert.equal(row.costMp,10);
assert.equal(row.target,10);
assert.equal(row.kind,2);
assert.equal(row.commonCommand,'BATTLE_COM_S_PLUNDER');

const supportCtx={};
vm.createContext(supportCtx);
vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_PLUNDER'),true);

// Fixed CHAR_getMyMaxPilenum + CHAR_findSurplusItemBox mapping.
const pileBase={
  Math,Number,Array,
  PLAYER_BACKPACK_START:9,PLAYER_ITEM_SLOT_COUNT:24,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourcePlayerItemSlots:t=>t.playerItemSlots,
  sourcePlayerEquipmentModifiers:()=>({attachPile:99})
};
vm.createContext(pileBase);
vm.runInContext(extractFunction(game,'sourceProfessionPlayerMaxPile'),pileBase);
vm.runInContext(extractFunction(game,'sourceProfessionPlayerBackpackSurplus'),pileBase);
let player={transmigration:0,playerEquipCompliance:{attachPile:0},playerItemSlots:Array(24).fill(null)};
assert.equal(pileBase.sourceProfessionPlayerMaxPile(player),3);
player={transmigration:5,playerEquipCompliance:{attachPile:2},playerItemSlots:Array(24).fill(null)};
assert.equal(pileBase.sourceProfessionPlayerMaxPile(player),12);
player.playerItemSlots[9]=100;
player.playerItemSlots[23]=200;
assert.equal(pileBase.sourceProfessionPlayerBackpackSurplus(player),13);

// AddPile: capacity failure returns -1 before add/free.
let slots={'50':{use:true,itemId:700,owner:'enemy:u',pile:1}};
let adds=[],frees=[],allocs=[],writes=[];
const addCtx={
  Math,Number,Array,
  PLAYER_BACKPACK_START:9,PLAYER_ITEM_SLOT_COUNT:24,
  state:{},
  sourceItemRuntimeSlot:i=>slots[String(i)]||null,
  sourceItemRuntimeResolvedDataInt:(x,f)=>f==='ITEM_USEPILENUMS'?x.pile:null,
  sourceProfessionPlayerMaxPile:()=>4,
  sourceProfessionPlayerBackpackSurplus:()=>0,
  sourcePlayerAddSpecificExistingItem:(i)=>{adds.push(i);return 9},
  sourceItemRuntimeFree:i=>{frees.push(i);delete slots[String(i)];return true},
  sourceItemRuntimeAlloc:(itemId)=>{const i=101+allocs.length;allocs.push(i);slots[String(i)]={use:true,itemId,owner:null,pile:1};return i},
  sourceItemRuntimeSetDataInt:(x,f,v)=>{writes.push(v);x.pile=v;return true}
};
vm.createContext(addCtx);
vm.runInContext(extractFunction(game,'sourceProfessionPlunderAddPileItem'),addCtx);
let add=addCtx.sourceProfessionPlunderAddPileItem(50,{});
assert.equal(add.ok,false);
assert.equal(add.reason,'capacity-or-nonpositive-pile');
assert.deepEqual(adds,[]);
assert.deepEqual(frees,[]);

// Direct transfer preserves original existing item.
addCtx.sourceProfessionPlayerBackpackSurplus=()=>1;
add=addCtx.sourceProfessionPlunderAddPileItem(50,{});
assert.equal(add.ok,true);
assert.equal(add.split,false);
assert.equal(add.ret,9);
assert.deepEqual(adds,[50]);
assert.deepEqual(frees,[]);

// Split branch: pile 9 with max 4 => fresh 4/4/1, then original ends.
slots={'50':{use:true,itemId:700,owner:'enemy:u',pile:9}};
adds=[];frees=[];allocs=[];writes=[];
addCtx.sourceProfessionPlayerBackpackSurplus=()=>3;
addCtx.sourcePlayerAddSpecificExistingItem=(i)=>{adds.push(i);return 9+adds.length-1};
add=addCtx.sourceProfessionPlunderAddPileItem(50,{});
assert.equal(add.ok,true);
assert.equal(add.split,true);
assert.deepEqual(writes,[4,4,1]);
assert.deepEqual(allocs,[101,102,103]);
assert.deepEqual(adds,[101,102,103]);
assert.deepEqual(frees,[50]);

// Same-side scan is battle-slot first, then carried item slot 1..10.
const u10={id:'u10',enemyDrops:[{slot:3,itemIndex:103},{slot:1,itemIndex:101}]};
const u11={id:'u11',enemyDrops:[{slot:1,itemIndex:201}]};
const scanSlots={
  '101':{use:true,itemId:1,owner:'enemy:u10'},
  '103':{use:true,itemId:3,owner:'enemy:u10'},
  '201':{use:true,itemId:2,owner:'enemy:u11'}
};
const scanCtx={
  Math,Number,Array,
  sourceProfessionEnemyByBattleSlot:s=>s===10?u10:s===11?u11:null,
  sourceItemRuntimeSlot:i=>scanSlots[String(i)]||null
};
vm.createContext(scanCtx);
vm.runInContext(extractFunction(game,'sourceProfessionPlunderFirstCarried'),scanCtx);
let found=scanCtx.sourceProfessionPlunderFirstCarried(10);
assert.equal(found.battleSlot,10);
assert.equal(found.itemSlot,1);
assert.equal(found.itemIndex,101);

// Execute accepts a dead raw target, can loot another Enemy, and exits ONLY the raw target.
const raw={id:'raw',hp:0,enemyDrops:[]};
const owner={id:'owner',hp:30,enemyDrops:[{slot:1,itemIndex:301}]};
let exited=null,detached=null,logs=0,hidden=false;
const execCtx={
  Math,Number,String,
  state:{},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionEnemyByBattleSlot:s=>s===12?raw:s===10?owner:null,
  enemyUnitHidden:()=>hidden,
  sourceProfessionPlunderFirstCarried:()=>({
    battleSlot:10,itemSlot:1,unit:owner,drop:owner.enemyDrops[0],
    itemIndex:301,existing:{itemId:777}
  }),
  sourceProfessionPlunderAddPileItem:()=>({ok:true,ret:9}),
  sourceProfessionPlunderDetachCarried:x=>{detached=x.itemIndex;return true},
  questItemMeta:()=>null,
  addLog:()=>{logs++},
  finishEnemyDirectExit:u=>{exited=u.id;return {battleEnded:false,noReward:true}}
};
vm.createContext(execCtx);
vm.runInContext(extractFunction(game,'sourceProfessionPlunderExecute'),execCtx);
let out=execCtx.sourceProfessionPlunderExecute(
  {skillId:49,functionName:'PROFESSION_PLUNDER',toNo:12},
  '屍體掠奪'
);
assert.equal(out.handled,true);
assert.equal(out.targetWasDead,true);
assert.equal(out.loot.sourceUnitId,'owner');
assert.equal(out.loot.itemIndex,301);
assert.equal(detached,301);
assert.equal(exited,'raw');
assert.equal(logs,1);
assert.equal(out.noDamage,true);
assert.equal(out.noCounter,true);

// Raw EarthRound returns before scan/detach/exit.
hidden=true;exited=null;detached=null;
out=execCtx.sourceProfessionPlunderExecute(
  {skillId:49,functionName:'PROFESSION_PLUNDER',toNo:12},
  '屍體掠奪'
);
assert.equal(out.noAction,true);
assert.equal(out.reason,'target-earthround');
assert.equal(exited,null);
assert.equal(detached,null);

// Structural source boundaries.
const addFn=extractFunction(game,'sourceProfessionPlunderAddPileItem');
assert.ok(addFn.includes('itemPile>surplus*myPile||itemPile<=0'));
assert.ok(addFn.includes('created.length>=10'));
assert.ok(addFn.includes('sourceItemRuntimeAlloc(itemId,null'));
assert.ok(addFn.includes("sourceItemRuntimeSetDataInt(made,'ITEM_USEPILENUMS',take)"));
assert.ok(addFn.lastIndexOf('sourceItemRuntimeFree(idx)')>addFn.indexOf('for(const newIndex of created)'));

const scanFn=extractFunction(game,'sourceProfessionPlunderFirstCarried');
assert.ok(scanFn.indexOf('for(let battleSlot=start;battleSlot<start+10;battleSlot++)')
  <scanFn.indexOf('for(let itemSlot=1;itemSlot<=10;itemSlot++)'));
assert.ok(scanFn.includes("existing.owner!=='enemy:'+unit.id"));

const plunderFn=extractFunction(game,'sourceProfessionPlunderExecute');
assert.ok(plunderFn.indexOf('sourceProfessionPlunderAddPileItem')
  <plunderFn.indexOf('sourceProfessionPlunderDetachCarried'));
assert.ok(plunderFn.indexOf('sourceProfessionPlunderDetachCarried')
  <plunderFn.indexOf('finishEnemyDirectExit(rawTarget'));
assert.equal(plunderFn.includes('sourceMarkEnemyDeathCredit'),false);

const dispatch=extractFunction(game,'sourceProfessionBattleSkillExecute');
const sameSideAt=dispatch.indexOf('if(toNo<10){');
const rangeAt=dispatch.indexOf('if(toNo>19){');
const plunderAt=dispatch.indexOf("prepared.functionName==='PROFESSION_PLUNDER'");
const targetResolveAt=dispatch.indexOf('const target=sourceProfessionEnemyByBattleSlot(toNo);');
const deadAt=dispatch.indexOf("reason:'target-dead-or-missing'");
assert.ok(sameSideAt>=0&&rangeAt>sameSideAt&&plunderAt>rangeAt);
assert.ok(targetResolveAt>plunderAt&&deadAt>plunderAt);
assert.ok(dispatch.includes('sourceProfessionPlunderExecute(prepared,plunderName)'));

assert.match(html,/PLAYABLE CORE V2\.45/);
assert.match(html,/V2\.45 live：[^<]*毒素武器[^<]*屍體掠奪/);
assert.match(game,/schemaVersion:30/);
assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({
  pass:true,version:'V2.45-core',
  focus:'Skill 49 PROFESSION_PLUNDER fixed dead-target carried-item scan + CHAR_AddPileItem + raw-target BATTLE_Exit',
  skillId:49,mpCost:10,target:'DEATH',
  scan:'same-side battle slot ascending -> carried item slot ascending',
  addPile:'source max-pile/capacity/split lifecycle; caller ignores failure and detaches',
  exit:'original raw target only; no damage/counter/exit kill reward',
  saveSchema:30
}));
