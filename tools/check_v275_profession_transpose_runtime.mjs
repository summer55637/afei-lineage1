import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sourceProfessionTransposeProfile,sourceProfessionTransposeApply,sourceProfessionTransposeExecute} from './profession_transpose_runtime.mjs';

const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));
const row=runtime.bySkillId['21'];
assert.ok(row,'missing Skill 21 runtime row');
assert.deepEqual(
  {skillId:row.skillId,name:row.name,func:row.func,professionClass:row.professionClass,target:row.target,kind:row.kind,costMp:row.costMp,option:row.option,commonCommand:row.commonCommand,img1:row.img1,img2:row.img2},
  {skillId:21,name:'移形换位',func:'PROFESSION_TRANSPOSE',professionClass:2,target:5,kind:2,costMp:10,option:'回%80|回%3',commonCommand:'BATTLE_COM_S_TRANSPOSE',img1:101697,img2:101695}
);

// PROFESSION_CHANGE_SKILL_LEVEL_M-compatible levels used by battle_event.c.
assert.deepEqual(sourceProfessionTransposeProfile(1),{skillLevel:1,avoid:10,turn:1});
assert.deepEqual(sourceProfessionTransposeProfile(2),{skillLevel:2,avoid:10,turn:1});
assert.deepEqual(sourceProfessionTransposeProfile(3),{skillLevel:3,avoid:25,turn:1});
assert.deepEqual(sourceProfessionTransposeProfile(5),{skillLevel:5,avoid:30,turn:1});
assert.deepEqual(sourceProfessionTransposeProfile(6),{skillLevel:6,avoid:45,turn:4});
assert.deepEqual(sourceProfessionTransposeProfile(8),{skillLevel:8,avoid:50,turn:4});
assert.deepEqual(sourceProfessionTransposeProfile(9),{skillLevel:9,avoid:60,turn:4});
assert.deepEqual(sourceProfessionTransposeProfile(10),{skillLevel:10,avoid:70,turn:5});

const targets=[
  {battleSlot:10,id:'front-a'},
  {battleSlot:11,id:'front-b'},
  {battleSlot:13,id:'back-a'}
];
const applied=sourceProfessionTransposeApply(targets,10);
assert.deepEqual(applied.profile,{skillLevel:10,avoid:70,turn:5});
assert.deepEqual(applied.targets.map(x=>({id:x.id,professionTransposeDuckTurns:x.professionTransposeDuckTurns,professionTransposeDuckPower:x.professionTransposeDuckPower})),[
  {id:'front-a',professionTransposeDuckTurns:6,professionTransposeDuckPower:70},
  {id:'front-b',professionTransposeDuckTurns:6,professionTransposeDuckPower:70},
  {id:'back-a',professionTransposeDuckTurns:6,professionTransposeDuckPower:70}
]);
assert.equal(targets[0].professionTransposeDuckPower,undefined,'apply must not mutate caller targets');

const executed=sourceProfessionTransposeExecute({skillId:21,functionName:'PROFESSION_TRANSPOSE',toNo:21,displayLevel:6,targets:[{id:'u1'}]});
assert.equal(executed.handled,true);
assert.equal(executed.skillId,21);
assert.equal(executed.commonCommand,'BATTLE_COM_S_TRANSPOSE');
assert.equal(executed.targetNo,21);
assert.equal(executed.profile.avoid,45);
assert.equal(executed.profile.turn,4);
assert.deepEqual(executed.targets[0],{id:'u1',professionTransposeDuckTurns:5,professionTransposeDuckPower:45});
assert.equal(executed.sourceTargetExpansion,'BATTLE_MultiList(defNo2)');
assert.equal(executed.sourceAnimation,'BATTLE_MagicEffect(attackNo,ToList,img1,img2)');

assert.match(fs.readFileSync('tools/profession_transpose_runtime.mjs','utf8'),/PROFESSION_TRANSPOSE/);
console.log(JSON.stringify({pass:true,version:'V2.75-core',focus:'Skill 21 移形換位',avoid:[10,10,25,30,45,50,60,70],turn:[1,1,1,1,4,4,4,5],targetExpansion:'BATTLE_MultiList(defNo2)'}));
