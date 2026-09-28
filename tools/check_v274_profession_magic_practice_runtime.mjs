import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));
const html=fs.readFileSync('game.html','utf8');

function extractFunction(source,name){
  const marker='function '+name+'(';const start=source.indexOf(marker);assert.ok(start>=0,'missing '+name);
  const ps=source.indexOf('(',start);let d=0,end=-1,q=null,esc=false,line=false,block=false;
  for(let i=ps;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;i++;}continue}if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}if(c==='/'&&n==='/'){line=true;i++;continue}if(c==='/'&&n==='*'){block=true;i++;continue}if(c==="'"||c==='"'||c==='`'){q=c;continue}if(c==='(')d++;else if(c===')'&&--d===0){end=i;break}}
  const bs=source.indexOf('{',end);d=0;q=null;esc=false;line=false;block=false;
  for(let i=bs;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;i++;}continue}if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}if(c==='/'&&n==='/'){line=true;i++;continue}if(c==='/'&&n==='*'){block=true;i++;continue}if(c==="'"||c==='"'||c==='`'){q=c;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return source.slice(start,i+1)}
  throw new Error('unterminated '+name);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');
const rows=[18,19,20].map(id=>runtime.bySkillId[String(id)]);
assert.ok(rows.every(Boolean));
assert.deepEqual(rows.map(r=>[r.skillId,r.name,r.func,r.professionClass,r.target,r.kind,r.costMp,r.fixValue]),[
  [18,'火熟练度','PROFESSION_FIRE_PRACTICE',2,5,2,0,10],
  [19,'雷熟练度','PROFESSION_THUNDER_PRACTICE',2,5,2,0,10],
  [20,'冰熟练度','PROFESSION_ICE_PRACTICE',2,5,2,0,10]
]);
assert.equal(rows.every(r=>r.commonCommand===undefined),true);

const ctx={Math,Number,Object,Array,PROFESSION_CLASS_NONE:0,PROFESSION_SKILL_SLOT_COUNT:26,
  state:null,battlePlayerProfessionMagicProficiencyWork:{fire:0,ice:0,thunder:0},
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:level=>{level=Math.trunc(Number(level)||0);if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;},
  sourcePlayerProfessionSkillAt:(i,t)=>{const e=t.professionSkills[i];return e?{slot:i,skillId:e.skillId,rawLevel:e.rawLevel}:null;},
  sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(id)]||null,
  sourcePlayerProfessionSkillDisplayLevel:e=>Math.trunc(Number(e.rawLevel||0)/100)
};
vm.createContext(ctx);
for(const fn of ['sourceProfessionMagicPracticeWork','sourceProfessionPlayerMagicProficiencyRefresh','sourceProfessionPlayerMagicProficiencyVector'])vm.runInContext(extractFunction(game,fn),ctx);

assert.deepEqual(JSON.parse(JSON.stringify(ctx.sourceProfessionMagicPracticeWork(1))),{tier:1,value:2});
assert.deepEqual(JSON.parse(JSON.stringify(ctx.sourceProfessionMagicPracticeWork(10))),{tier:1,value:2});
assert.deepEqual(JSON.parse(JSON.stringify(ctx.sourceProfessionMagicPracticeWork(60))),{tier:6,value:13});
assert.deepEqual(JSON.parse(JSON.stringify(ctx.sourceProfessionMagicPracticeWork(100))),{tier:10,value:25});

const p={professionClass:2,professionSkills:Array(26).fill(null)};
p.professionSkills[4]={skillId:18,rawLevel:6000};
p.professionSkills[7]={skillId:19,rawLevel:10000};
p.professionSkills[9]={skillId:20,rawLevel:8000};
let snap=ctx.sourceProfessionPlayerMagicProficiencyRefresh(p,'v274');
assert.deepEqual(JSON.parse(JSON.stringify(snap.work)),{fire:13,ice:19,thunder:25});
assert.deepEqual(JSON.parse(JSON.stringify(ctx.sourceProfessionPlayerMagicProficiencyVector())),{fire:13,ice:19,thunder:25});

p.professionSkills[0]={skillId:999,rawLevel:10000};p.professionSkills[1]=null;
snap=ctx.sourceProfessionPlayerMagicProficiencyRefresh(p,'sparse');
assert.deepEqual(JSON.parse(JSON.stringify(snap.work)),{fire:13,ice:19,thunder:25});

p.professionClass=1;
snap=ctx.sourceProfessionPlayerMagicProficiencyRefresh(p,'wrong-class');
assert.equal(snap.active,false);assert.equal(snap.reason,'profession-mismatch-terminator');

const entry=extractFunction(game,'sourceInitPlayerSideEntrySnapshot');
assert.ok(entry.includes("sourceProfessionPlayerMagicProficiencyRefresh(state,'battle-entry')"));
const reset=extractFunction(game,'resetBattleStatuses');
assert.ok(reset.includes('battlePlayerProfessionMagicProficiencyWork={fire:0,ice:0,thunder:0}'));

const supported={};vm.createContext(supported);vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supported);
assert.equal(supported.sourceProfessionBattleFunctionSupported('PROFESSION_FIRE_PRACTICE'),false);
assert.equal(supported.sourceProfessionBattleFunctionSupported('PROFESSION_ICE_PRACTICE'),false);
assert.equal(supported.sourceProfessionBattleFunctionSupported('PROFESSION_THUNDER_PRACTICE'),false);

assert.match(html,/PLAYABLE CORE V2\.72/);
console.log(JSON.stringify({pass:true,version:'V2.74-core',focus:'Skills 18-20 magic practice parity',snapshot:{fire:13,ice:19,thunder:25}}));
