import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const petskill=JSON.parse(fs.readFileSync('data/generated/stoneage_petskill_runtime.json','utf8'));
const attackMagic=JSON.parse(fs.readFileSync('data/generated/stoneage_attack_magic_runtime.json','utf8'));

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const legalRows=Object.entries(petskill.byId||{}).filter(([,row])=>Number(row?.field)===1&&Number(row?.illegal)===0);
const legalFunctions=[...new Set(legalRows.map(([,row])=>row.f).filter(Boolean))];
assert.equal(legalFunctions.length,61,'current legal PetSkill function family count');

const loyalStart=game.indexOf('function sourcePerformPetLoyalAction');
const loyalEnd=game.indexOf('function sourcePetPreCommandAction',loyalStart);
assert.ok(loyalStart>=0&&loyalEnd>loyalStart,'loyal dispatcher must exist');
const loyal=game.slice(loyalStart,loyalEnd);
const loyalDispatch=[...new Set([...loyal.matchAll(/meta\?\.f==='([^']+)'/g)].map(m=>m[1]))];
const unregistered=['PETSKILL_SelfExplodeAttack','PETSKILL_Awaken','PETSKILL_Temptation'];
assert.equal(legalFunctions.filter(f=>!unregistered.includes(f)).every(f=>loyalDispatch.includes(f)),true,'every current legal PetSkill function except three fixed-unregistered families must be dispatched');
assert.deepEqual(unregistered.filter(f=>legalFunctions.includes(f)).sort(),unregistered.slice().sort(),'exact fixed-unregistered PetSkill families');
assert.equal(loyalDispatch.length,58,'current loyal dispatcher count');

const statusRows=legalRows.filter(([,row])=>row.f==='PETSKILL_StatusChange').map(([id,row])=>({id:Number(id),option:String(row.o||'')}));
assert.deepEqual(statusRows.map(x=>x.id),[60,61,80,90,100,110,707,708,709,710,711,712]);
const statusParserStart=game.indexOf('function sourcePetStatusSkillType');
const statusParserEnd=game.indexOf('function sourcePetStatusSkillTurn',statusParserStart);
assert.ok(statusParserStart>=0&&statusParserEnd>statusParserStart,'StatusChange parser must exist');
const statusParser=game.slice(statusParserStart,statusParserEnd);
for(const token of ['毒','剧','虛','麻','障','默','煞','醉','眠','石','乱'])assert.ok(statusParser.includes("'"+token+"'"),'StatusChange parser missing token '+token);
for(const row of statusRows){
  assert.match(row.option,/^(毒|剧|劇|石|乱|亂|醉|眠|虚|虛|麻|障|默|煞)\s/,'fixed StatusChange option must begin with a known source token');
  assert.match(row.option,/turn\s+-?\d+/i,'fixed StatusChange option must expose source turn');
  assert.match(row.option,/攻%[+-]?\d+(?:\.\d+)?/,'fixed StatusChange option must expose source attack percent');
}

const refreshRows=legalRows.filter(([,row])=>row.f==='PETSKILL_Refresh').map(([id,row])=>({id:Number(id),option:String(row.o||'')}));
assert.deepEqual(refreshRows.map(x=>x.id),[583,584,591,592,593]);
assert.deepEqual(refreshRows.map(x=>x.option),['默','剧','障','全','虚']);
const refreshParserStart=game.indexOf('function battleStatusTypeFromOption');
const refreshParserEnd=game.indexOf('function battleStatusTurnFromOption',refreshParserStart);
assert.ok(refreshParserStart>=0&&refreshParserEnd>refreshParserStart,'generic status option parser must exist');
const refreshParser=game.slice(refreshParserStart,refreshParserEnd);
for(const token of ['默','剧','障','虚'])assert.ok(refreshParser.includes("includes('"+token+"')"),'refresh parser missing token '+token);
assert.ok(refreshParser.includes("if(t.includes('煞'))return 'sars';"),'refresh parser must retain sars mapping');
assert.ok(game.includes("const all=option.includes('全');"),'Refresh must retain source all-token branch');

const specialRows=legalRows.filter(([,row])=>['PETSKILL_Weaken','PETSKILL_Deeppoison','PETSKILL_Barrier','PETSKILL_Nocast'].includes(row.f)).map(([id,row])=>({id:Number(id),f:row.f,option:String(row.o||'')}));
assert.equal(specialRows.length,12,'fixed special status row count');
for(const row of specialRows)assert.match(row.option,/^(虚|虛|剧|劇|障|默)\s+turn\s+\d+\s+成\s+\d+$/,'special status option must expose source status/turn/success');
const specialSpecStart=game.indexOf('function sourcePetSpecialStatusSpec');
const specialSpecEnd=game.indexOf('const SOURCE_REFRESH_STATUS_ORDER',specialSpecStart);
assert.ok(specialSpecStart>=0&&specialSpecEnd>specialSpecStart,'special status source spec parser must exist');
const specialSpec=game.slice(specialSpecStart,specialSpecEnd);
assert.ok(specialSpec.includes('/turn\\s*(-?\\d+)/i'),'special status parser must read turn');
assert.ok(specialSpec.includes('/成\\s*([+-]?\\d+)/'),'special status parser must read success');
assert.ok(specialSpec.includes('type:battleStatusTypeFromOption(option)'),'special status parser must use generic fixed token mapping');

const magicStatusRows=legalRows.filter(([,row])=>row.f==='PETSKILL_MagicStatusChange').map(([id,row])=>({id:Number(id),option:String(row.o||'')}));
assert.deepEqual(magicStatusRows.map(x=>x.id),[552,553,565,658]);
for(const row of magicStatusRows)assert.match(row.option,/^铁壁\|\d+\|\d+\|/,'MagicStatusChange fixed rows must remain 铁壁');
const magicStatusStart=game.indexOf('function sourcePerformPetMagicStatusChangeSkill');
const magicStatusEnd=game.indexOf('function sourcePerformPetLoyalAction',magicStatusStart);
assert.ok(magicStatusStart>=0&&magicStatusEnd>magicStatusStart);
const magicStatus=game.slice(magicStatusStart,magicStatusEnd);
assert.ok(magicStatus.includes("(status==='铁壁'||status==='鐵壁')"),'MagicStatusChange must keep both source glyph variants');
assert.ok(magicStatus.includes("status:'superWall'"),'MagicStatusChange must map proven 铁壁 to superWall');

const propertyRows=legalRows.filter(([,row])=>row.f==='PETSKILL_BattleProperty');
assert.deepEqual(propertyRows.map(([id])=>Number(id)),[612]);
assert.equal(propertyRows[0][1].o,'PET_PetskillPropertyEvent');
const propertyStart=game.indexOf('function sourcePerformPetBattlePropertySkill');
const propertyEnd=game.indexOf('function sourcePerformPetAntInterSkill',propertyStart);
const propertyFn=game.slice(propertyStart,propertyEnd);
assert.ok(propertyFn.includes("meta?.o||'')!=='PET_PetskillPropertyEvent"),'BattleProperty must keep exact callback gate');
assert.ok(propertyFn.includes('battlePropertyKeys.add(key)'),'BattleProperty must keep proven property callback behavior');

const combinedRows=legalRows.filter(([,row])=>row.f==='PETSKILL_Combined');
assert.equal(combinedRows.length,36,'current legal PETSKILL_Combined row count');
const combinedIds=[...new Set(combinedRows.flatMap(([,row])=>{const parts=String(row.o||'').split('|');const count=Math.max(0,Math.trunc(Number(parts[1])||0));return parts.slice(2,2+count).map(Number).filter(Number.isFinite).map(Math.trunc);}))].sort((a,b)=>a-b);
assert.equal(combinedIds.length,101,'unique Combined magic id count');
const combinedKnown=new Set([458,459,462,20,21,22,23,24,25,61,71,81,91,101,121,139,159,169,179,189,413,414,416,194,204,214,224,230,240,436,460,461]);
const combinedUnresolved=combinedIds.filter(id=>{if(combinedKnown.has(id))return false;return attackMagic.byMagicId?.[String(id)]?.func!=='MAGIC_AttMagic';});
assert.deepEqual(combinedUnresolved,[],'every current Combined magic id must have a fixed JS branch or AttackMagic runtime row');
assert.deepEqual([458,459,462].filter(id=>attackMagic.byMagicId?.[String(id)]!==undefined),[],'458/459/462 must remain source-missing magic rows');
const combinedStart=game.indexOf('const SOURCE_COMBINED_MISSING_MAGIC_IDS');
const combinedEnd=game.indexOf('function sourcePerformPetLoyalAction',combinedStart);
const combinedFn=game.slice(combinedStart,combinedEnd);
for(const id of [458,459,462])assert.ok(combinedFn.includes(String(id)),'Combined source-missing set must retain '+id);
assert.ok(combinedFn.includes('missingMagicRow:true'),'Combined source-missing result must remain explicit');
assert.ok(combinedFn.includes('sourceRuntimePending:true'),'Combined must retain defensive pending fallback for future/unmapped rows');

assert.equal((game.match(/sourceRuntimePending/g)||[]).length,7,'seven defensive sourceRuntimePending guards remain documented');
assert.ok(html.includes('PLAYABLE CORE V2.81'),'HTML version marker must advance');
console.log(JSON.stringify({pass:true,version:'V2.81',focus:'petskill-fixed-runtime-reachability-and-pending-boundary-audit',legalPetSkillFunctions:legalFunctions.length,loyalDispatcherFunctions:loyalDispatch.length,combinedRows:combinedRows.length,combinedUniqueMagicIds:combinedIds.length,defensiveSourceRuntimePendingGuards:7,saveSchema:30}));