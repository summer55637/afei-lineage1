import assert from 'node:assert/strict';
import fs from 'node:fs';

const evidence=JSON.parse(fs.readFileSync('data/generated/stoneage_gmque_reward_enemy_templates.json','utf8'));
const docs=fs.readFileSync('docs/reference/gmque-reward-enemy-template-source-closure.md','utf8');

assert.equal(evidence.fixedC.repository,'gavinlinasd/StoneAge');
assert.equal(evidence.fixedC.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.deepEqual(evidence.rewardArray,[1642,1636,475,0]);

const expected={1642:{tempNo:809,name:'瑞里西尔'},1636:{tempNo:803,name:'可可恩'},475:{tempNo:5,name:'黑乌力'}};
for(const [id,exp] of Object.entries(expected)){
  const row=evidence.slots[id];
  assert.equal(row.enemyId,Number(id));
  assert.equal(row.tempNo,exp.tempNo);
  assert.equal(row.name,exp.name);
  assert.match(row.enemy1SourceRow,new RegExp(',,${id},${exp.tempNo},'.replace('${id}',id).replace('${exp.tempNo}',String(exp.tempNo))));
  assert.match(row.enemybaseSourceRow,new RegExp(','+String(exp.tempNo)+','));
}

assert.equal(evidence.slots['0'].implicitCArraySlot,true);
assert.equal(evidence.activationGuard.activationState,'pending-adapter-update');
assert.match(docs,/ENEMY_getEnemyArrayFromId/);
assert.match(docs,/ENEMY_createPetFromEnemyIndex/);
assert.match(docs,/source template：已解析/);
assert.match(docs,/runtime adapter：尚未接入/);

console.log(JSON.stringify({pass:true,version:'V3.10-groundwork',sourceTemplateClosure:true,rewardEnemyIds:[1642,1636,475],tempNos:[809,803,5],implicitZeroSlot:true,runtimeAdapterPending:true}));
