import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));

function extractFunction(src,name){
  const sig='function '+name+'(';
  const i=src.indexOf(sig);assert.ok(i>=0,'missing '+name);

  // Find the function BODY brace, not an object literal in a default argument
  // such as battleDamageCore(..., options={}).
  const openParen=src.indexOf('(',i);
  let paren=0,q=null,esc=false,line=false,block=false,closeParen=-1;
  for(let p=openParen;p<src.length;p++){
    const c=src[p],nx=src[p+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&nx==='/'){block=false;p++}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){line=true;p++;continue}
    if(c==='/'&&nx==='*'){block=true;p++;continue}
    if(c==="'"||c==='"'||c.charCodeAt(0)===96){q=c;continue}
    if(c==='(')paren++;
    else if(c===')'&&--paren===0){closeParen=p;break}
  }
  assert.ok(closeParen>=0,'missing signature close '+name);

  const b=src.indexOf('{',closeParen);
  assert.ok(b>=0,'missing body '+name);
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

const row=runtime.bySkillId['68'];
assert.ok(row);assert.equal(row.name,'地结界');assert.equal(row.func,'PROFESSION_BOUNDARY');
assert.equal(row.target,2);assert.equal(row.costMp,14);assert.equal(row.kind,1);
assert.equal(row.img1,101697);assert.equal(row.img2,101789);
assert.equal(row.commonCommand,'BATTLE_COM_S_BOUNDARY');

const supportCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(supportCtx);vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_BOUNDARY',68),true);
// Historical regression runs against current game.js: V2.53-56 open 69-72.
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_BOUNDARY',69),true);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_BOUNDARY',70),true);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_BOUNDARY',71),true);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_BOUNDARY',72),true);

const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:level=>{level=Math.trunc(Number(level)||0);if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;}};
vm.createContext(costCtx);vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [level,cost] of [[10,10],[60,10],[70,15],[90,15],[100,20]]){
  const x=costCtx.sourceProfessionMagicCostPlan('PROFESSION_BOUNDARY',level,row.option);
  assert.equal(x.dynamic,true);assert.equal(x.cost,cost);
}

const pure={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};vm.createContext(pure);
vm.runInContext(extractFunction(game,'sourceProfessionBoundaryTurns'),pure);
vm.runInContext(extractFunction(game,'sourceProfessionBoundaryPower'),pure);
for(const [tier,turn] of [[0,1],[4,1],[5,2],[8,2],[9,3],[10,5]])assert.equal(pure.sourceProfessionBoundaryTurns(tier),turn);
assert.notEqual(pure.sourceProfessionBoundaryTurns(9),4);
for(const [level,power] of [[1,20],[20,20],[21,30],[40,30],[41,40],[60,40],[61,50],[80,50],[81,60],[85,60],[86,70],[90,70],[91,80],[95,80],[96,90],[99,90],[100,100]])assert.equal(pure.sourceProfessionBoundaryPower(level),power);

const player={kind:'player'},pet={id:'p1',name:'寵',hp:100,maxHp:100};
const ctx={Math,Number,String,Map,Object,
  state:{petBox:[pet]},enemy:null,battleProfessionBoundaryStates:new Map(),
  SOURCE_PROFESSION_BOUNDARY_ATTRS:['earth','water','fire','wind'],
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  battleStatusKey:d=>d?.kind==='player'?'player':(d?.kind==='pet'?'pet:'+d.pet.id:null),
  battleStatusDescName:d=>d?.kind==='player'?'你':d?.pet?.name||'目標',addLog:()=>{}
};
vm.createContext(ctx);
for(const fn of ['sourceProfessionBoundaryActorDesc','sourceProfessionBoundaryApply','sourceProfessionBoundaryPostAction','sourceProfessionBoundaryPhysicalAdjust'])vm.runInContext(extractFunction(game,fn),ctx);
ctx.sourceProfessionBoundaryApply(player,'water',99,9);
ctx.sourceProfessionBoundaryApply(player,'earth',20,1);
let st=ctx.battleProfessionBoundaryStates.get('player');
assert.equal(st.water,null);assert.equal(st.earth.power,20);assert.equal(st.earth.turns,1);
ctx.sourceProfessionBoundaryApply({kind:'pet',pet},'earth',100,1);

let tick=ctx.sourceProfessionBoundaryPostAction({kind:'player'});
assert.equal(tick.ticks[0].before,1);assert.equal(tick.ticks[0].after,0);assert.equal(tick.active,true);
assert.equal(ctx.battleProfessionBoundaryStates.get('player').earth.turns,0);
tick=ctx.sourceProfessionBoundaryPostAction({kind:'pet',petId:'p1'});
assert.equal(tick.ticks[0].after,0);assert.equal(tick.active,true);
tick=ctx.sourceProfessionBoundaryPostAction({kind:'player'});
assert.equal(tick.ticks[0].after,-1);assert.equal(tick.active,false);assert.equal(ctx.battleProfessionBoundaryStates.has('player'),false);

ctx.sourceProfessionBoundaryApply(player,'earth',20,3);
let adj=ctx.sourceProfessionBoundaryPhysicalAdjust({elements:{earth:100}}, {boundaryKey:'player'},100);
assert.equal(adj.damage,50);assert.equal(adj.storedPower,20);assert.equal(adj.sourceStoredPowerIgnored,true);
ctx.sourceProfessionBoundaryApply(player,'earth',100,3);
adj=ctx.sourceProfessionBoundaryPhysicalAdjust({elements:{earth:100}}, {boundaryKey:'player'},100);
assert.equal(adj.damage,50,'stored power must not change reduction');
adj=ctx.sourceProfessionBoundaryPhysicalAdjust({elements:{earth:20}}, {boundaryKey:'player'},100);assert.equal(adj.damage,90);
adj=ctx.sourceProfessionBoundaryPhysicalAdjust({elements:{earth:0,fire:100}}, {boundaryKey:'player'},100);assert.equal(adj.damage,100);

const core=extractFunction(game,'battleDamageCore');
assert.ok(core.indexOf('battleAttrDamage(attacker,defender,damage)')<core.indexOf('sourceProfessionBoundaryPhysicalAdjust(attacker,defender,damage)'));
assert.ok(core.indexOf('sourceProfessionBoundaryPhysicalAdjust(attacker,defender,damage)')<core.indexOf('const sourceOtherDamage'));
const normal=extractFunction(game,'resolveNormalAttack');
assert.ok(normal.indexOf('battleDamageCore(attacker,defender,options)')<normal.indexOf('damage=Math.trunc(damage+n(defender?.defense)'));
const magic=extractFunction(game,'sourcePlayerProfessionMagicDamageCore');
assert.ok(!magic.includes('battleProfessionBoundaryStates'));

const execCtx={Math,Number,String,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  cRand:()=>42,
  sourceSetMagicPetMultiList:raw=>({ok:true,toNo:raw,slots:[0,5],fallback:false,rolls:[]}),
  sourceSetMagicPetTargetableDescFromSlot:slot=>slot===0?{kind:'player'}:{kind:'pet',pet,petId:pet.id},
  sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(id)]||null,
  sourceProfessionBoundaryPower:pure.sourceProfessionBoundaryPower,
  sourceProfessionBoundaryTurns:pure.sourceProfessionBoundaryTurns,
  sourceProfessionBoundaryApply:()=>({ok:true}),
  battleStatusDescName:d=>d.kind==='player'?'你':'寵',addLog:()=>{}
};
vm.createContext(execCtx);vm.runInContext(extractFunction(game,'sourceProfessionEarthBoundaryExecute'),execCtx);
const out=execCtx.sourceProfessionEarthBoundaryExecute({skillId:68,functionName:'PROFESSION_BOUNDARY',toNo:20,displayLevel:100,attackSkillTier:10},'地結界');
assert.equal(out.power,100);assert.equal(out.turns,5);assert.equal(out.img1,101697);assert.equal(out.img2,101786);assert.equal(out.results.length,2);

const outerMark=extractFunction(game,'sourceMarkBattleActorOuterAddProfit');
const outerProcess=extractFunction(game,'sourceProcessBattleActorOuterBoundary');
assert.ok(outerMark.includes('battleOuterBoundaryActor=actor'));
assert.ok(outerProcess.indexOf('sourceProfessionBoundaryPostAction(actor)')<outerProcess.indexOf('sourceCheckPlayerItemRelifeBeforeOuterAddProfit'));
assert.equal((game.match(/sourceMarkBattleActorOuterAddProfit\(actor\);/g)||[]).length,3);

const reset=extractFunction(game,'resetBattleStatuses');assert.ok(reset.includes('battleProfessionBoundaryStates=new Map()'));assert.ok(reset.includes('battleOuterBoundaryActor=null'));
for(const v of ['2.48','2.49','2.50','2.51','2.52'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.52 live：[^<]*地結界/);assert.match(game,/schemaVersion:30/);assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({pass:true,version:'V2.52-core',focus:'Skill 68 earth boundary only',mp:'dynamic 10/15/20',turn:'A-tier 1/2/3/5; 4 unreachable',power:'raw 20..100 but physical rate ignores stored power',physical:'damage -= damage*(attackerEarth/200)',tick:'post-command; low 0 remains active',saveSchema:30}));
