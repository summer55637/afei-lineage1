import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(src,name){
  const sig='function '+name+'(';
  const i=src.indexOf(sig);assert.ok(i>=0,'missing '+name);
  const openParen=src.indexOf('(',i);
  let paren=0,q=null,esc=false,line=false,block=false,closeParen=-1;
  for(let p=openParen;p<src.length;p++){const c=src[p],nx=src[p+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&nx==='/'){block=false;p++}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){line=true;p++;continue}
    if(c==='/'&&nx==='*'){block=true;p++;continue}
    if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue}
    if(c==='(')paren++;else if(c===')'&&--paren===0){closeParen=p;break}
  }
  assert.ok(closeParen>=0,'missing signature close '+name);
  const b=src.indexOf('{',closeParen);assert.ok(b>=0,'missing body '+name);
  let d=0;q=null;esc=false;line=false;block=false;
  for(let p=b;p<src.length;p++){const c=src[p],nx=src[p+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&nx==='/'){block=false;p++}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){line=true;p++;continue}
    if(c==='/'&&nx==='*'){block=true;p++;continue}
    if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue}
    if(c==='{')d++;else if(c==='}'&&--d===0)return src.slice(i,p+1);
  }
  throw new Error('unterminated '+name);
}

const row=runtime.bySkillId['72'];
assert.ok(row);assert.equal(row.name,'破除结界');assert.equal(row.func,'PROFESSION_BOUNDARY');
assert.equal(row.option,'破结界|1|2|320|240|3200|4200|1|320|240');
assert.equal(row.target,1);assert.equal(row.costMp,10);assert.equal(row.kind,1);
assert.equal(row.img1,101697);assert.equal(row.img2,101771);assert.equal(row.commonCommand,'BATTLE_COM_S_BOUNDARY');

const supportCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(supportCtx);vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
for(const id of [68,69,70,71,72])assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_BOUNDARY',id),true);

const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:level=>{level=Math.trunc(Number(level)||0);if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;}};
vm.createContext(costCtx);vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [level,cost] of [[10,5],[20,5],[30,10],[50,15],[80,15],[90,20],[100,20]]){
  const x=costCtx.sourceProfessionMagicCostPlan('PROFESSION_BOUNDARY',level,row.option);
  assert.equal(x.dynamic,true);assert.equal(x.cost,cost);
}

const pure={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(pure);
for(const fn of ['sourceProfessionBoundaryTurns','sourceProfessionBoundaryPower','sourceProfessionBoundaryBreakChance'])vm.runInContext(extractFunction(game,fn),pure);
for(const [level,chance] of [[20,50],[21,60],[40,60],[41,70],[80,70],[81,80],[99,80],[100,100]])assert.equal(pure.sourceProfessionBoundaryBreakChance(level),chance);

for(const fn of ['sourceProfessionEarthBoundaryExecute','sourceProfessionWaterBoundaryExecute','sourceProfessionFireBoundaryExecute','sourceProfessionWindBoundaryExecute']){
  const body=extractFunction(game,fn);
  assert.ok(body.indexOf('cRand(1,100)')>=0,fn+' must consume fixed unused boundary RNG');
  assert.ok(body.indexOf('cRand(1,100)')<body.indexOf('sourceSetMagicPetMultiList'),fn+' RNG must precede MultiList');
}

const enemyA={id:'e1',name:'甲'},enemyB={id:'e2',name:'乙'};
let roll=80,events=[];
const ctx={Math,Number,String,Map,Object,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  SOURCE_PROFESSION_BOUNDARY_ATTRS:['earth','water','fire','wind'],
  battleProfessionBoundaryStates:new Map(),
  battleStatusKey:d=>d?.kind==='enemy'?'enemy:'+d.unit.id:null,
  battleStatusDescName:d=>d?.unit?.name||'目標',
  cRand:(a,b)=>{events.push('roll:'+a+'-'+b);return roll;},
  sourceSetMagicPetMultiList:raw=>{events.push('multi:'+raw);return {ok:true,toNo:raw,slots:[10,11],fallback:false,rolls:[]};},
  sourceSetMagicPetTargetableDescFromSlot:slot=>slot===10?{kind:'enemy',unit:enemyA,unitId:'e1'}:{kind:'enemy',unit:enemyB,unitId:'e2'},
  sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(id)]||null,
  addLog:()=>{}
};
vm.createContext(ctx);
for(const fn of ['sourceProfessionBoundaryTurns','sourceProfessionBoundaryPower','sourceProfessionBoundaryBreakChance','sourceProfessionBoundaryClear','sourceProfessionBreakBoundaryExecute'])vm.runInContext(extractFunction(game,fn),ctx);

const stateA={earth:{power:20,turns:1},water:null,fire:null,wind:null};
const stateB={earth:null,water:{power:100,turns:5},fire:null,wind:null};
ctx.battleProfessionBoundaryStates.set('enemy:e1',stateA);
ctx.battleProfessionBoundaryStates.set('enemy:e2',stateB);
let out=ctx.sourceProfessionBreakBoundaryExecute({skillId:72,functionName:'PROFESSION_BOUNDARY',toNo:13,displayLevel:81,attackSkillTier:9},'破除結界');
assert.deepEqual(events,['roll:1-100','multi:21']);
assert.equal(out.chance,80);assert.equal(out.roll,80);assert.equal(out.success,true);
assert.equal(out.forcedSideToNo,21);assert.equal(out.power,0);assert.equal(out.turns,0);
assert.equal(out.sourcePower,60);assert.equal(out.sourceTurns,3);
assert.equal(out.img1,101697);assert.equal(out.img2,101771);assert.equal(out.results.length,2);
assert.equal(ctx.battleProfessionBoundaryStates.has('enemy:e1'),false);
assert.equal(ctx.battleProfessionBoundaryStates.has('enemy:e2'),false);

events=[];roll=81;
ctx.battleProfessionBoundaryStates.set('enemy:e1',stateA);
ctx.battleProfessionBoundaryStates.set('enemy:e2',stateB);
out=ctx.sourceProfessionBreakBoundaryExecute({skillId:72,functionName:'PROFESSION_BOUNDARY',toNo:13,displayLevel:81,attackSkillTier:9},'破除結界');
assert.deepEqual(events,['roll:1-100','multi:21']);
assert.equal(out.success,false);assert.equal(out.power,60);assert.equal(out.turns,3);
assert.strictEqual(ctx.battleProfessionBoundaryStates.get('enemy:e1'),stateA);
assert.strictEqual(ctx.battleProfessionBoundaryStates.get('enemy:e2'),stateB);

events=[];roll=100;
out=ctx.sourceProfessionBreakBoundaryExecute({skillId:72,functionName:'PROFESSION_BOUNDARY',toNo:3,displayLevel:100,attackSkillTier:10},'破除結界');
assert.deepEqual(events,['roll:1-100','multi:20']);
assert.equal(out.success,true);assert.equal(out.forcedSideToNo,20);assert.equal(out.img2,101770);

const breakFn=extractFunction(game,'sourceProfessionBreakBoundaryExecute');
assert.ok(breakFn.indexOf('cRand(1,100)')<breakFn.indexOf('sourceSetMagicPetMultiList'));
assert.ok(breakFn.includes('rawToNo<10?20:21'));assert.ok(breakFn.includes('roll<=chance'));

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("Math.trunc(n(prepared.skillId))===72"));
assert.ok(dispatcher.includes('sourceProfessionBreakBoundaryExecute'));

for(const v of ['2.52','2.53','2.54','2.55','2.56'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.56 live：[^<]*破除結界/);
assert.match(game,/schemaVersion:30/);assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({pass:true,version:'V2.56-core',focus:'Skill 72 break boundary',support:'68-72',mp:'break dynamic 5/10/15/20',chance:'raw 50/60/70/80/100; roll <= chance',target:'raw side -> whole side 20/21',rng:'all boundary cases consume RAND(1,100) before MultiList',saveSchema:30}));
