import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const make=JSON.parse(fs.readFileSync('data/generated/stoneage_item_make_runtime.json','utf8'));

assert.equal(make.source.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(make.source.itemEventGitBlobSha,'00e05ebe58ef3988f7e0121f2a3aa5ede78344b5');
assert.ok(Array.isArray(make.equipResistSource?.markers));
assert.equal(make.equipResistSource.markers.length,7);
assert.equal(make.equipResistSource.detachClearsKey,'fire');
assert.match(make.equipResistSource.detachSemantics,/clear CHAR_WORKEQUITFIRE only/);

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

const ctx={
  Math,Number,Object,parseInt,
  itemMakeDb:make,
  PLAYER_EQUIP_SLOT_COUNT:9,
  SOURCE_PLAYER_NOENEMY_LEVEL_BY_ITEM:Object.freeze({18546:40,18547:80,18548:120}),
  SOURCE_PLAYER_RANDENEMY_BY_ITEM:Object.freeze({20126:60,20127:70,20128:100}),
  SOURCE_PLAYER_MAGIC_DEFENSE_ITEM_IDS:new Set([20184,20420,20421]),
  BATTLE_STATUS_INDEX:{poison:0,paralysis:1,sleep:2,stone:3,drunk:4,confusion:5},
  state:{playerItemSlots:Array(24).fill(null),itemRuntime:{slots:{}},playerEquipCompliance:{statusResist:{poison:12}}},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourcePlayerItemSlots:t=>t.playerItemSlots,
  sourceRuntimeSlotFromTarget:(t,i)=>t.itemRuntime.slots[String(i)]||null,
  sourcePlayerEquipTemplateForExisting:(i,t)=>ctx.templates[String(i)]||null,
  livingEnemyUnits:()=>[],
  templates:{}
};
vm.createContext(ctx);
for(const name of [
  'sourceItemMakeCallbackArgument',
  'sourcePlayerLiveCallbackArgument',
  'sourcePlayerEquipResistSpecFromArgument',
  'sourcePlayerFixedEquipResistTemplate',
  'sourcePlayerEquipCallbackSupported',
  'sourcePlayerEquipResistFreshWork',
  'sourcePlayerEquipResistAttachEvent',
  'sourcePlayerEquipResistDetachEvent',
  'sourcePlayerEquipResistWork',
  'sourcePlayerProfessionMagicEquipSuitResist',
  'battleStatusResist'
])vm.runInContext(extractFunction(game,name),ctx);

const rows=Object.entries(make.byItemId)
  .filter(([,row])=>row?.f?.a==='ITEM_MagicResist'&&row?.f?.d==='ITEM_MagicReResist')
  .map(([id,row])=>({id:Number(id),row,spec:ctx.sourcePlayerEquipResistSpecFromArgument(row.g)}));
assert.ok(rows.length>0,'fixed itemset6 must contain ITEM_MagicResist/ReResist rows');
for(const x of rows){
  assert.equal(typeof x.row.g,'string','callback row '+x.id+' must carry byte-preserving g');
  assert.ok(x.spec,'callback row '+x.id+' argument must match one of the seven pinned C strstr markers');
  assert.ok(['fire','thunder','ice','weaken','barrier','nocast','fallride'].includes(x.spec.key));
  assert.equal(ctx.sourcePlayerEquipCallbackSupported({
    itemId:x.id,attachFunc:'ITEM_MagicResist',detachFunc:'ITEM_MagicReResist'
  }),true);
}
assert.equal(ctx.sourcePlayerEquipCallbackSupported({
  itemId:999999,attachFunc:'ITEM_MagicResist',detachFunc:'ITEM_MagicReResist'
}),false);

// Login rebuild: fixed CHAR_loginCheckUserItem replays equipped attach callbacks in slot order.
const base=rows[0];
ctx.state.itemRuntime.slots['101']={use:true,owner:'player',itemId:base.id};
ctx.state.itemRuntime.slots['102']={use:true,owner:'player',itemId:base.id,field2Char:{
  argument:base.spec.marker+'37'
}};
ctx.templates['101']={itemId:base.id,attachFunc:'ITEM_MagicResist',detachFunc:'ITEM_MagicReResist'};
ctx.templates['102']={itemId:base.id,attachFunc:'ITEM_MagicResist',detachFunc:'ITEM_MagicReResist'};
ctx.state.playerItemSlots[1]=101;
ctx.state.playerItemSlots[2]=102;
ctx.state.playerEquipResistWork=null;
let work=ctx.sourcePlayerEquipResistWork(ctx.state);
assert.equal(work[base.spec.key],37,'later equip slot must overwrite same CHAR_WORK value');

// Exact fixed detach bug: a non-fire argument still clears FIRE only and leaves its own Work stale.
const nonFireMarker=make.equipResistSource.markers.find(x=>x.key!=='fire');
assert.ok(nonFireMarker);
ctx.state.itemRuntime.slots['102'].field2Char.argument=nonFireMarker.marker+'29';
work[nonFireMarker.key]=29;
work.fire=77;
assert.equal(ctx.sourcePlayerEquipResistDetachEvent(102,ctx.state),true);
assert.equal(work.fire,0);
if(nonFireMarker.key!=='fire')assert.equal(work[nonFireMarker.key],29);

// Current consumers: weaken/barrier/nocast subtract this Work in BATTLE_StatusAttackCheck.
work.weaken=31;work.barrier=22;work.nocast=13;
assert.equal(ctx.battleStatusResist({kind:'player'},'weaken'),31);
assert.equal(ctx.battleStatusResist({kind:'player'},'barrier'),22);
assert.equal(ctx.battleStatusResist({kind:'player'},'nocast'),13);
assert.equal(ctx.battleStatusResist({kind:'player'},'poison'),12);

// Fire/thunder/ice are kept as the exact Work values for PROFESSION_MAGIC_GET_DAMAGE.
// This web still has no profession-magic attack path, so they must not be guessed into BATTLE_MultiAttMagic.
work.fire=9;work.thunder=8;work.ice=7;
assert.equal(ctx.sourcePlayerProfessionMagicEquipSuitResist('fire',ctx.state),9);
assert.equal(ctx.sourcePlayerProfessionMagicEquipSuitResist('thunder',ctx.state),8);
assert.equal(ctx.sourcePlayerProfessionMagicEquipSuitResist('ice',ctx.state),7);

const moveIn=extractFunction(game,'sourcePlayerMoveBackpackToEquip');
assert.ok(moveIn.indexOf('sourcePlayerEquipResistWork(target)')<moveIn.indexOf('slots[toindex]=fromid'));
assert.ok(moveIn.indexOf('sourcePlayerEquipResistDetachEvent(toid,target)')<moveIn.indexOf('sourcePlayerEquipResistAttachEvent(fromid,target)'));
const moveOut=extractFunction(game,'sourcePlayerMoveEquipToBackpack');
assert.ok(moveOut.indexOf('sourcePlayerEquipResistWork(target)')<moveOut.indexOf('slots[toindex]=fromid;slots[fromindex]=null'));
assert.ok(moveOut.includes('sourcePlayerEquipResistDetachEvent(fromid,target)'));

const fall=extractFunction(game,'performEnemyFallGround');
assert.ok(fall.includes('sourcePlayerEquipResistWork(state).fallride'));
assert.ok(fall.includes('fallRoll>50+fallResist'));

const effective=extractFunction(game,'sourceMagicEffectiveResist');
assert.equal(effective.includes('sourcePlayerProfessionMagicEquipSuitResist'),false,
  'do not mix _EQUIT_RESIST profession suit resistance into V2.16 BATTLE_MultiAttMagic defense');
assert.ok(game.includes('s.playerEquipResistWork=null'));
assert.match(game,/schemaVersion:29/);
assert.match(game,/s\.schemaVersion=29/);

console.log(JSON.stringify({
  pass:true,version:'V2.17',focus:'ITEM_MagicResist / ITEM_MagicReResist',
  fixedRows:rows.map(x=>({id:x.id,key:x.spec.key,value:x.spec.value})),
  sourceMarkers:make.equipResistSource.markers.map(x=>x.key),
  detachBug:'every branch clears fire only',
  currentConsumers:['weaken','barrier','nocast','fallride'],
  deferredConsumer:'fire/thunder/ice -> PROFESSION_MAGIC_GET_DAMAGE not yet present in web core',
  saveSchema:29
}));
