import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const templates=JSON.parse(fs.readFileSync('data/generated/stoneage_gmque_reward_enemy_templates.json','utf8'));

function extractFunction(source,name){
  const marker='function '+name+'('; const start=source.indexOf(marker);
  assert.ok(start>=0,'missing '+name);
  const next=source.indexOf('\nfunction ',start+marker.length);
  return source.slice(start,next<0?source.length:next);
}

assert.ok(game.includes("const GMQUE_REWARD_ENEMY_TEMPLATE_URL='data/generated/stoneage_gmque_reward_enemy_templates.json';"));
assert.ok(game.includes('gmqueRewardEnemyTemplatesDb=null'));
assert.ok(game.includes('fetch(GMQUE_REWARD_ENEMY_TEMPLATE_URL,{cache:\'no-store\'})'));
assert.ok(game.includes('gmqueRewardEnemyTemplatesDb=await gmquePetTemplateR.json();'));
assert.ok(game.includes("gmqueRewardEnemyTemplatesDb?.format!=='stoneage-gmque-reward-enemy-template-source-v2'"));
assert.ok(game.includes('function sourceCreateGmQueRewardPet('));

const ctx={
  Math,Number,String,Object,Array,Date,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  gmqueRewardEnemyTemplatesDb:templates,
  rnd:(a,b)=>{calls++; return Math.trunc(Number(a));},
  uid:()=> 'test-pet-1',
  packPetAllocPoint:v=>v
};
let calls=0;
vm.createContext(ctx);
for(const name of ['rollEnemyCreateStats','serverEnemyDerived','sourceGmQueRewardPetTemplate','sourceCreateGmQueRewardPet']) vm.runInContext(extractFunction(game,name),ctx);

for(const [id,expect] of Object.entries({
  '1642':{tempNo:809,name:'瑞里西尔',rank:2,slot:6,imageNumber:100904,petSkills:[1,2,210]},
  '1636':{tempNo:803,name:'可可恩',rank:0,slot:4,imageNumber:100898,petSkills:[1,2]},
  '475':{tempNo:5,name:'黑乌力',rank:1,slot:7,imageNumber:100388,petSkills:[1,2]}
})){
  const reward=ctx.sourceGmQueRewardPetTemplate(Number(id));
  assert.equal(reward.ok,true,id);
  assert.equal(reward.petId,Number(id));
  assert.equal(reward.template.tempNo,expect.tempNo,id+' tempNo');
  assert.equal(reward.template.name,expect.name,id+' name');
  assert.deepEqual(reward.template.petSkills,expect.petSkills,id+' skills');
  assert.equal(reward.template.rank,expect.rank,id+' rank');
  assert.equal(reward.template.slot,expect.slot,id+' slot');
  assert.equal(reward.template.imageNumber,expect.imageNumber,id+' image');
  const before=calls;
  const created=ctx.sourceCreateGmQueRewardPet(Number(id));
  assert.equal(created.ok,true,id);
  assert.equal(created.pet.sourceRewardPet,true,id+' reward marker');
  assert.equal(created.pet.sourceEnemyId,Number(id),id+' enemy id');
  assert.equal(created.pet.petId,expect.tempNo,id+' petId=tempNo');
  assert.equal(created.pet.tempNo,expect.tempNo,id+' tempNo');
  assert.equal(created.pet.name,expect.name,id+' name');
  assert.equal(created.pet.level,1,id+' level');
  assert.equal(created.pet.petRank,expect.rank,id+' rank');
  assert.deepEqual(created.pet.petSkills,expect.petSkills,id+' created skills');
  assert.equal(calls-before,16,id+' C creation RNG call count');
  assert.equal(ctx.gmqueRewardEnemyTemplatesDb.templates[String(id)].enemyId,Number(id));
}

const zero=ctx.sourceGmQueRewardPetTemplate(0);
assert.equal(zero.ok,false); assert.equal(zero.reason,'implicit-zero-pet-slot');
console.log(JSON.stringify({pass:true,version:'V3.10-groundwork',rewardTemplateRuntime:true,ids:[1642,1636,475],cCreationRngCallCount:16,implicitZeroGuard:true}));
