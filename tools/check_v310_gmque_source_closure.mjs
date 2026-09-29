import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const readme=fs.readFileSync('README.md','utf8');
const changelog=fs.readFileSync('CHANGELOG.md','utf8');
const ledger=JSON.parse(fs.readFileSync('data/generated/stoneage_gmque_source_closure.json','utf8'));
const gmque=JSON.parse(fs.readFileSync('data/generated/stoneage_gmque_trophy_runtime.json','utf8'));
const ai=JSON.parse(fs.readFileSync('data/generated/stoneage_enemy_ai.json','utf8'));
const encounter=JSON.parse(fs.readFileSync('data/generated/stoneage_general_encounter_runtime.json','utf8'));

function extractFunction(source,name){
  const marker='function '+name+'('; const start=source.indexOf(marker); assert.ok(start>=0,'missing '+name);
  const ps=source.indexOf('(',start); let pd=0,pe=-1,q=null,esc=false,lc=false,bc=false;
  for(let i=ps;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(lc){if(c==='\n')lc=false;continue} if(bc){if(c==='*'&&n==='/'){bc=false;i++}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='`'){q=c;continue} if(c==='/'&&n==='/'){lc=true;i++;continue} if(c==='/'&&n==='*'){bc=true;i++;continue}
    if(c==='(')pd++; else if(c===')'&&--pd===0){pe=i;break}
  }
  assert.ok(pe>=0,'unterminated params '+name); const bs=source.indexOf('{',pe); let d=0;q=null;esc=false;lc=false;bc=false;
  for(let i=bs;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(lc){if(c==='\n')lc=false;continue} if(bc){if(c==='*'&&n==='/'){bc=false;i++}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='`'){q=c;continue} if(c==='/'&&n==='/'){lc=true;i++;continue} if(c==='/'&&n==='*'){bc=true;i++;continue}
    if(c==='{')d++; else if(c==='}'&&--d===0)return source.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

assert.equal(ledger.fixedC.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(gmque.source.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.deepEqual(gmque.petReward.effectiveIds,[1642,1636,475,0]);
assert.deepEqual(ledger.evidence.enemyAiKeysPresent,[1642,1636,475]);
for(const id of [1642,1636,475])assert.ok(ai.byEnemyId?.[String(id)],'missing enemy AI id '+id);
assert.match(readme,/AI metadata.*完整 Enemy template|AI metadata.*不等於可直接建立 Pet/s);
assert.equal(encounter.groups['124'].members[0].enemyItems[0],1642);
assert.equal(encounter.groups['125'].members[0].enemyItems[0],1642);
assert.equal(encounter.groups['128'].members[1].enemyItems[0],1642);
assert.match(readme,/\*\*目前可玩核心：V3\.09\*\*/);
assert.match(readme,/1642／1636／475/);
assert.match(changelog,/## V3\.10 groundwork：GMQUE source closure \/ handover parser/);

const ctx={
  Math,Number,String,Object,Array,Set,Map,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceRandModulo:fn=>{let i=0;return()=>[0,40,57,98][i++%4]},
  sourceGmQueActionValue:randModulo=>{let v=Math.trunc(randModulo(100));if(v<1)v=1;return v},
  sourceGmQueRewardType:v=>{v=Math.trunc(Number(v));return v>97?'pet':(v>40?'item':'gold')},
  cRand:()=>0,
  gmqueDb:null,
  gmquePetTemplateIndex:null
};
// The production helpers depend on sourceGmQueActionValue / RewardType globals; inject exact test doubles.
vm.createContext(ctx);
for(const name of ['sourceGmQueBuildPetTemplateIndex','sourceGmQueRewardPetTemplate','sourceGmQueResolveTrophy','sourceGmQueTaskEntries','sourceGmQuePetIdentity','sourceGmQueMatchPetToTask','sourceGmQueHandoverCheck']){
  vm.runInContext(extractFunction(game,name),ctx);
}
let parsed=ctx.sourceGmQueTaskEntries('1642-10&1636-11&475-12&1642-13');
assert.equal(parsed.ok,true); assert.equal(parsed.entries.length,4); assert.equal(parsed.entries[2].petId,475);
assert.equal(ctx.sourceGmQueTaskEntries('1-1&2-2').reason,'task-count');
assert.equal(ctx.sourceGmQueTaskEntries('1-x&2-2&3-3&4-4').reason,'task-token');

const pets=[
  {id:'p1',petId:1642,level:10,name:'A'},
  {id:'p2',petId:9999,level:11,name:'B'},
  {id:'p3',petId:475,level:12,name:'C'},
  {id:'p4',tempNo:1642,level:13,name:'D'}
];
assert.equal(ctx.sourceGmQueMatchPetToTask(pets[0],{petId:1642,level:10}).reason,'exact-id');
assert.equal(ctx.sourceGmQueMatchPetToTask(pets[1],{petId:1636,level:11},{expectedName:'B'}).reason,'enemy-name-fallback');
assert.equal(ctx.sourceGmQueMatchPetToTask(pets[1],{petId:1636,level:11}).match,false);

const index=ctx.sourceGmQueBuildPetTemplateIndex(JSON.parse(fs.readFileSync('data/generated/stoneage_general_lv1_pets.json','utf8')));
for(const id of [1642,1636,475])assert.equal(index[String(id)]??null,null,'reward id must not be promoted from AI-only data');
assert.equal(ctx.sourceGmQueRewardPetTemplate(0,{templateIndex:index}).reason,'implicit-zero-pet-slot');
assert.equal(ctx.sourceGmQueRewardPetTemplate(1642,{templateIndex:index}).reason,'pet-template-pending');
const synthetic={1642:{enemyId:1642,tempNo:9000,name:'synthetic',stats:{vital:1,str:1,tgh:1,dex:1},elements:{earth:0,water:0,fire:0,wind:0},resistances:{poison:0,paralysis:0,sleep:0,stone:0,drunk:0,confusion:0},skillIds:[1]}};
const reward=ctx.sourceGmQueRewardPetTemplate(1642,{templateIndex:synthetic});
assert.equal(reward.ok,true); assert.equal(reward.template.tempNo,9000);

ctx.gmqueDb=gmque;
const petRoll=ctx.sourceGmQueResolveTrophy(98,{randInclusive:()=>0});
assert.equal(petRoll.ok,false); assert.equal(petRoll.reason,'pet-template-pending');
const zeroRoll=ctx.sourceGmQueResolveTrophy(99,{randInclusive:()=>3});
assert.equal(zeroRoll.ok,false); assert.equal(zeroRoll.reason,'implicit-zero-pet-slot');

let check=ctx.sourceGmQueHandoverCheck('1642-10&1636-11&475-12&1642-13',pets,{gmqueNums:98,bagHasSpace:true,gold:0,expectedNames:{1636:'B'}});
assert.equal(check.ok,true); assert.equal(check.type,'pet'); assert.equal(check.nums,98);
check=ctx.sourceGmQueHandoverCheck('1642-10&1636-11&475-12&1642-13',pets,{gmqueNums:57,bagHasSpace:false,gold:0});
assert.equal(check.ok,false); assert.equal(check.reason,'item-full');
check=ctx.sourceGmQueHandoverCheck('1642-10&1636-11&475-12&1642-13',pets,{gmqueNums:40,bagHasSpace:true,gold:800000});
assert.equal(check.ok,false); assert.equal(check.reason,'gold-cap');

// Fail-closed guarantee for absent source names: ID mismatch does not become a match.
check=ctx.sourceGmQueHandoverCheck('1642-10&1636-11&475-12&1642-13',[pets[0],pets[2],pets[3]],{gmqueNums:98,bagHasSpace:true,gold:0});
assert.equal(check.ok,false); assert.equal(check.reason,'missing-pet');

console.log(JSON.stringify({pass:true,version:'V3.10-groundwork',focus:'GMQUE source closure and handover eligibility parser',rewardPetIds:[1642,1636,475,0],playableCore:'V3.09'}));
