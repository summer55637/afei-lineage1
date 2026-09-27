import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));
const idx=Object.fromEntries(runtime.itemDataIntOrder.map((name,i)=>[name,i]));
assert.ok(Number.isInteger(idx.ITEM_SUITCODE),'ITEM_SUITCODE missing');

const SUIT_KEYS=[
  'VIT','FSTR','MSTR','MTGH','MDEX','WAST','HP','MP',
  'FRES','IRES','TRES','RESIST','COUNTER','M_POW',
  'EARTH','WRITER','FIRE','WIND',
  'WDUCKPOWER','RENOCASE','SUITSTRP','SUITTGH_P','SUITDEXP',
  'SUITPOISON','M2_POW','UN_POW_M'
];

function expand(itemId){
  const row=runtime.byItemId[String(itemId)];
  assert.ok(row,'missing '+itemId);
  const base=runtime.defaultData.map(Number);
  for(let i=0;i<(row.b||[]).length;i+=2)base[row.b[i]]=row.b[i+1];
  return {row,base};
}
function cAtoi(v){
  const m=String(v??'').match(/^[ \t]*([+-]?\d+)/);
  return m?Number(m[1]):0;
}
function delimValue(argument,key){
  for(const token of String(argument||'').split('|')){
    if(!token.includes(key))continue;
    const fields=token.split(':');
    if(fields.length<2)continue;
    return cAtoi(fields[1]);
  }
  return null;
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

const callbackRows=Object.entries(runtime.byItemId||{})
  .filter(([,row])=>row?.f?.a==='ITEM_suitEquip'||row?.f?.d==='ITEM_ResuitEquip')
  .map(([id,row])=>{
    const {base}=expand(Number(id));
    return {id:Number(id),row,suitCode:base[idx.ITEM_SUITCODE],type:base[idx.ITEM_TYPE]};
  })
  .sort((a,b)=>a.id-b.id);
assert.equal(callbackRows.length,236);
for(const x of callbackRows){
  assert.equal(x.row.f?.a,'ITEM_suitEquip');
  assert.equal(x.row.f?.d,'ITEM_ResuitEquip');
  assert.ok(x.suitCode>0);
}
const suitCodes=[...new Set(callbackRows.map(x=>x.suitCode))].sort((a,b)=>a-b);
assert.equal(suitCodes.length,51);
assert.deepEqual(suitCodes,[
  1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
  38,39,40,41,42,43,44,45,46,47,49,50,51,52,53,54,55,56,57
]);

// Every positive SUITCODE row must expose its argument to ITEM_CheckSuitEquip even if its
// own callback does not need ITEM_ARGUMENT. Empty arguments may omit g.
const allPositiveSuit=[];
for(const [idText,row] of Object.entries(runtime.byItemId||{})){
  const id=Number(idText),{base}=expand(id),suitCode=base[idx.ITEM_SUITCODE];
  if(suitCode<=0)continue;
  allPositiveSuit.push({id,row,suitCode});
  const field2Arg=typeof row.g==='string'?row.g:'';
  if(field2Arg!=='')assert.equal(typeof row.g,'string');
}
assert.ok(allPositiveSuit.length>=callbackRows.length);

const used=new Set();
for(const x of callbackRows){
  const argument=typeof x.row.g==='string'?x.row.g:'';
  for(const key of SUIT_KEYS)if(delimValue(argument,key)!==null)used.add(key);
}
assert.deepEqual([...used].sort(),[
  'COUNTER','FSTR','HP','M2_POW','MDEX','MP','MSTR','MTGH','M_POW',
  'RENOCASE','RESIST','SUITDEXP','SUITPOISON','UN_POW_M','WAST','WDUCKPOWER'
].sort());

const templates={};
const slots={};
function addExisting(itemIndex,itemId,argumentOverride=null){
  const {row,base}=expand(itemId);
  slots[String(itemIndex)]={use:true,owner:'player',itemId};
  if(argumentOverride!==null)slots[String(itemIndex)].field2Char={argument:String(argumentOverride)};
  templates[String(itemIndex)]={
    itemId,suitCode:base[idx.ITEM_SUITCODE],
    attachFunc:row.f?.a||'',detachFunc:row.f?.d||''
  };
}
const state={playerItemSlots:Array(24).fill(null),itemRuntime:{slots}};
let roll=99,rollCalls=0,appliedStatus=null,statusRules=null;
const ctx={
  Math,Number,Object,parseInt,
  itemMakeDb:runtime,
  state,
  PLAYER_EQUIP_SLOT_COUNT:9,
  SOURCE_PLAYER_SUIT_KEYS:Object.freeze(SUIT_KEYS),
  SOURCE_PLAYER_NOENEMY_LEVEL_BY_ITEM:Object.freeze({18546:40,18547:80,18548:120}),
  SOURCE_PLAYER_RANDENEMY_BY_ITEM:Object.freeze({20126:60,20127:70,20128:100}),
  SOURCE_PLAYER_MAGIC_DEFENSE_ITEM_IDS:new Set([20184,20420,20421]),
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  sourcePlayerItemSlots:t=>t.playerItemSlots,
  sourceRuntimeSlotFromTarget:(t,i)=>t.itemRuntime.slots[String(i)]||null,
  sourcePlayerEquipTemplateForExisting:i=>templates[String(i)]||null,
  sourcePlayerFixedEquipResistTemplate:()=>false,
  battleHasAnyStatus:()=>false,
  battleStatusKey:()=>null,
  battleSarsCarrierKeys:new Set(),
  battleStatusResist:()=>5,
  battleStatusRawStats:()=>({vital:25,str:25,tgh:25,dex:25}),
  battleStatusLevel:()=>10,
  battleStatusLuck:()=>0,
  sourceCounterWeaponFactor:()=>1,
  cRand:()=>{rollCalls++;return roll},
  battleStatusChance:(...args)=>{statusRules=args[3];return {allowed:true,success:true,per:args[3]?.perOffset??30}},
  battleStatusApply:(target,type,turns)=>{appliedStatus={target,type,turns};return true},
  battleStatusDescName:()=> '目標',
  addLog:()=>{}
};
vm.createContext(ctx);
for(const name of [
  'sourceItemMakeCallbackArgument','sourcePlayerLiveCallbackArgument',
  'sourcePlayerFixedSuitTemplate','sourcePlayerSuitArgumentValue','sourcePlayerSuitFreshWork',
  'sourcePlayerSuitWork','sourcePlayerApplySuitCompliance','sourcePlayerEquipCallbackSupported',
  'sourceSuitDuckCheck','battleCounterChance','sourcePlayerSuitStatusSeq',
  'sourcePlayerSuitPoisonAfterPhysicalHit'
])vm.runInContext(extractFunction(game,name),ctx);

// Fixed callback gate: fixed suit items pass, invented item with copied names remains fail-closed.
assert.equal(ctx.sourcePlayerEquipCallbackSupported({
  itemId:1397,attachFunc:'ITEM_suitEquip',detachFunc:'ITEM_ResuitEquip'
}),true);
assert.equal(ctx.sourcePlayerEquipCallbackSupported({
  itemId:999999,attachFunc:'ITEM_suitEquip',detachFunc:'ITEM_ResuitEquip'
}),false);

// Three same codes activate; real code 3 contributes MDEX/HP/MSTR from three distinct members.
addExisting(101,1397);addExisting(102,1398);addExisting(103,1399);
state.playerItemSlots.fill(null);state.playerItemSlots[0]=101;state.playerItemSlots[1]=102;state.playerItemSlots[2]=103;
let suit=ctx.sourcePlayerSuitWork(state);
assert.equal(suit.activeCode,3);
assert.equal(suit.MDEX,40);
assert.equal(suit.HP,30);
assert.equal(suit.MSTR,40);

// Fewer than 3 members: no set Work survives.
state.playerItemSlots[2]=null;
suit=ctx.sourcePlayerSuitWork(state);
assert.equal(suit.activeCode,0);
assert.equal(suit.MDEX,0);

// ITEM_CheckSuitEquip chooses the first qualifying code in equip-slot order, not lowest code.
for(const [idx2,id] of [[201,1341],[202,1342],[203,1343],[204,1338],[205,1339],[206,1340]])addExisting(idx2,id);
state.playerItemSlots.fill(null);
state.playerItemSlots[0]=201;state.playerItemSlots[1]=204;
state.playerItemSlots[2]=202;state.playerItemSlots[3]=205;
state.playerItemSlots[4]=203;state.playerItemSlots[5]=206;
suit=ctx.sourcePlayerSuitWork(state);
assert.equal(suit.activeCode,2);
assert.equal(suit.HP,100);

// Later slot CHAR_setWorkInt overwrites earlier values for the same key.
addExisting(301,2124,'FSTR:11');addExisting(302,2125,'FSTR:22');addExisting(303,2126,'FSTR:33');
state.playerItemSlots.fill(null);state.playerItemSlots[0]=301;state.playerItemSlots[1]=302;state.playerItemSlots[2]=303;
suit=ctx.sourcePlayerSuitWork(state);
assert.equal(suit.activeCode,20);
assert.equal(suit.FSTR,33);

// Other_DefcharWorkInt arithmetic, including percentage bases and int truncation.
const applied=ctx.sourcePlayerApplySuitCompliance(
  {fixedAttack:100,fixedTough:80,fixedDex:60,maxHp:500},
  {FSTR:30,MSTR:40,MTGH:10,MDEX:20,VIT:5,SUITSTRP:10,SUITTGH_P:25,SUITDEXP:20}
);
assert.deepEqual(JSON.parse(JSON.stringify(applied)),{
  fixedAttack:183,fixedTough:110,fixedDex:92,maxHp:505,mfix:130,mtgh:80,mdex:60
});

// COUNTER is a direct additive Player counter chance after Luck.
assert.equal(ctx.battleCounterChance(
  {type:'player',fixedDex:50,luck:2,weaponType:0,suitCounter:20},
  {type:'enemy',fixedDex:50,weaponType:0}
),23.5); // Player->Enemy first applies defender FIXDEX *0.6, yielding CriPer 15 -> 1.5 + Luck 2 + suit 20.

// WDUCKPOWER is an independent rand()%100 check, strict <, and COMBO skips it.
rollCalls=0;roll=19;
assert.deepEqual(JSON.parse(JSON.stringify(ctx.sourceSuitDuckCheck({suitDuckPower:20},{}))),{dodged:true,power:20,roll:19});
roll=20;
assert.deepEqual(JSON.parse(JSON.stringify(ctx.sourceSuitDuckCheck({suitDuckPower:20},{}))),{dodged:false,power:20,roll:20});
const beforeComboCalls=rollCalls;
assert.deepEqual(JSON.parse(JSON.stringify(ctx.sourceSuitDuckCheck({suitDuckPower:20},{sourceCombo:true}))),{dodged:false,power:0,roll:null});
assert.equal(rollCalls,beforeComboCalls);

// Per-action StatusSeq HP/MP recovery uses active suit Work and caps to current max.
for(const [ii,id] of [[401,2119],[402,2120],[403,2121],[404,2122]])addExisting(ii,id);
state.playerItemSlots.fill(null);
state.playerItemSlots[0]=401;state.playerItemSlots[1]=402;state.playerItemSlots[2]=403;state.playerItemSlots[3]=404;
state.hp=50;state.maxHp=100;state.mp=10;state.maxMp=20;
let round=ctx.sourcePlayerSuitStatusSeq(state);
assert.equal(round.activeCode,19);
assert.equal(round.addHp,70);
assert.equal(round.addMp,15);
assert.equal(state.hp,100);
assert.equal(state.mp,20);
assert.equal(round.hpActual,50);
assert.equal(round.mpActual,10);

// SUITPOISON uses its Work as StatusAttackCheck PerOffset and stores poison turn 3 + 1.
for(const [ii,id] of [[501,20720],[502,20721],[503,20722]])addExisting(ii,id);
state.playerItemSlots.fill(null);state.playerItemSlots[0]=501;state.playerItemSlots[1]=502;state.playerItemSlots[2]=503;
statusRules=null;appliedStatus=null;
let poison=ctx.sourcePlayerSuitPoisonAfterPhysicalHit({kind:'player'},{kind:'enemy'},{damage:10});
assert.equal(poison.power,50);
assert.deepEqual(JSON.parse(JSON.stringify(statusRules)),{perOffset:50,range:40,bai:2,forceGeneral:true});
assert.equal(poison.applied,true);
assert.deepEqual(JSON.parse(JSON.stringify(appliedStatus)),{target:{kind:'enemy'},type:'poison',turns:3});
assert.equal(poison.storedTurns,4);

// Exact status formula consumers are locked in production source.
const statusFn=extractFunction(game,'battleStatusChance');
assert.ok(statusFn.includes('suitResist'));
assert.ok(statusFn.includes("type==='weaken'"));
assert.ok(statusFn.includes('suitRenocase'));
assert.ok(statusFn.indexOf("if(type==='paralysis'")<statusFn.indexOf('suitResist'),
  'general suit RESIST must not affect the source paralysis fast-path');

const resolveFn=extractFunction(game,'resolveNormalAttack');
assert.ok(resolveFn.indexOf('sourceBattleDuckTotal')<resolveFn.indexOf('sourceSuitDuckCheck'));
const initialFn=extractFunction(game,'sourceInitialDodgeOnly');
assert.ok(initialFn.includes('sourceSuitDuckCheck'));
const comboNeedle='sourceCombo:true,skipSuitDodge:true';
assert.ok(game.includes(comboNeedle));

const statusTurnFn=extractFunction(game,'processBattleStatusTurn');
assert.ok(statusTurnFn.includes('sourcePlayerSuitStatusSeq(state)'));
const physicalFn=extractFunction(game,'battleApplyPhysicalHit');
assert.ok(physicalFn.includes('sourcePlayerSuitPoisonAfterPhysicalHit'));
const friendlyFn=extractFunction(game,'applyFriendlyEnemyHit');
assert.ok(friendlyFn.includes('sourcePlayerSuitPoisonAfterPhysicalHit'));

// Fixed but currently deferred consumers stay represented instead of being guessed elsewhere.
for(const [code,key,value,ids] of [
  [12,'WAST',-1,[1690,1691,1692]],
  [30,'M_POW',5,[2865,2866,2867]],
  [45,'M2_POW',30,[20726,20727,20728]],
  [47,'UN_POW_M',20,[20738,20739,20740]]
]){
  state.playerItemSlots.fill(null);
  ids.forEach((id,j)=>{const ii=600+code*10+j;addExisting(ii,id);state.playerItemSlots[j]=ii});
  suit=ctx.sourcePlayerSuitWork(state);
  assert.equal(suit.activeCode,code);
  assert.equal(suit[key],value);
}

assert.match(game,/schemaVersion:29/);
assert.match(game,/s\.schemaVersion=29/);
console.log(JSON.stringify({
  pass:true,version:'V2.18',focus:'ITEM_suitEquip / ITEM_ResuitEquip',
  fixedItems:callbackRows.length,suitCodes:suitCodes.length,
  usedKeys:[...used].sort(),
  wiredConsumers:[
    'FSTR/MSTR/MTGH/MDEX/VIT/SUITSTRP/SUITTGH_P/SUITDEXP compliance',
    'RESIST/RENOCASE status',
    'COUNTER','WDUCKPOWER','HP/MP StatusSeq','SUITPOISON'
  ],
  deferredConsumers:['WAST water-world connection state','M_POW/M2_POW/UN_POW_M profession magic'],
  saveSchema:29
}));
