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

const earth=runtime.bySkillId['68'],water=runtime.bySkillId['69'];
assert.ok(earth&&water);
assert.equal(water.name,'水结界');assert.equal(water.func,'PROFESSION_BOUNDARY');
assert.equal(water.target,2);assert.equal(water.costMp,14);assert.equal(water.kind,1);
assert.equal(water.img1,101697);assert.equal(water.img2,101777);
assert.equal(water.commonCommand,'BATTLE_COM_S_BOUNDARY');

const supportCtx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};
vm.createContext(supportCtx);vm.runInContext(extractFunction(game,'sourceProfessionBattleFunctionSupported'),supportCtx);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_BOUNDARY',68),true);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_BOUNDARY',69),true);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_BOUNDARY',70),true);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_BOUNDARY',71),true);
assert.equal(supportCtx.sourceProfessionBattleFunctionSupported('PROFESSION_BOUNDARY',72),false);

const costCtx={Math,Number,String,n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionMagicLevelM:level=>{level=Math.trunc(Number(level)||0);if(level>90)return 10;if(level>80)return 9;if(level>70)return 8;if(level>60)return 7;if(level>50)return 6;if(level>40)return 5;if(level>30)return 4;if(level>20)return 3;if(level>10)return 2;return 1;}};
vm.createContext(costCtx);vm.runInContext(extractFunction(game,'sourceProfessionMagicCostPlan'),costCtx);
for(const [level,cost] of [[10,10],[60,10],[70,15],[90,15],[100,20]]){
  const x=costCtx.sourceProfessionMagicCostPlan('PROFESSION_BOUNDARY',level,water.option);
  assert.equal(x.dynamic,true);assert.equal(x.cost,cost);
}

const pure={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0};vm.createContext(pure);
vm.runInContext(extractFunction(game,'sourceProfessionBoundaryTurns'),pure);
vm.runInContext(extractFunction(game,'sourceProfessionBoundaryPower'),pure);
assert.equal(pure.sourceProfessionBoundaryTurns(10),5);assert.equal(pure.sourceProfessionBoundaryTurns(9),3);
assert.equal(pure.sourceProfessionBoundaryTurns(5),2);assert.equal(pure.sourceProfessionBoundaryTurns(4),1);
assert.equal(pure.sourceProfessionBoundaryPower(20),20);assert.equal(pure.sourceProfessionBoundaryPower(100),100);

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
ctx.sourceProfessionBoundaryApply(player,'earth',100,5);
ctx.sourceProfessionBoundaryApply(player,'water',20,1);
let st=ctx.battleProfessionBoundaryStates.get('player');
assert.equal(st.earth,null,'water cast must clear earth');
assert.equal(st.water.power,20);assert.equal(st.water.turns,1);

let adj=ctx.sourceProfessionBoundaryPhysicalAdjust({elements:{water:100}}, {boundaryKey:'player'},100);
assert.equal(adj.attr,'water');assert.equal(adj.damage,50);assert.equal(adj.storedPower,20);assert.equal(adj.sourceStoredPowerIgnored,true);
ctx.sourceProfessionBoundaryApply(player,'water',100,3);
adj=ctx.sourceProfessionBoundaryPhysicalAdjust({elements:{water:100}}, {boundaryKey:'player'},100);
assert.equal(adj.damage,50,'stored power must not change water reduction');
adj=ctx.sourceProfessionBoundaryPhysicalAdjust({elements:{water:20}}, {boundaryKey:'player'},100);assert.equal(adj.damage,90);
adj=ctx.sourceProfessionBoundaryPhysicalAdjust({elements:{water:0,fire:100}}, {boundaryKey:'player'},100);assert.equal(adj.damage,100);

ctx.sourceProfessionBoundaryApply(player,'water',20,1);
let tick=ctx.sourceProfessionBoundaryPostAction({kind:'player'});
assert.equal(tick.ticks[0].before,1);assert.equal(tick.ticks[0].after,0);assert.equal(tick.active,true);
tick=ctx.sourceProfessionBoundaryPostAction({kind:'player'});
assert.equal(tick.ticks[0].after,-1);assert.equal(tick.active,false);

const execCtx={Math,Number,String,
  n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceSetMagicPetMultiList:raw=>({ok:true,toNo:raw,slots:[0,5],fallback:false,rolls:[]}),
  sourceSetMagicPetTargetableDescFromSlot:slot=>slot===0?{kind:'player'}:{kind:'pet',pet,petId:pet.id},
  sourceProfessionSkillTemplate:id=>runtime.bySkillId[String(id)]||null,
  sourceProfessionBoundaryPower:pure.sourceProfessionBoundaryPower,
  sourceProfessionBoundaryTurns:pure.sourceProfessionBoundaryTurns,
  sourceProfessionBoundaryApply:()=>({ok:true}),
  battleStatusDescName:d=>d.kind==='player'?'你':'寵',addLog:()=>{}
};
vm.createContext(execCtx);vm.runInContext(extractFunction(game,'sourceProfessionWaterBoundaryExecute'),execCtx);
const out=execCtx.sourceProfessionWaterBoundaryExecute({skillId:69,functionName:'PROFESSION_BOUNDARY',toNo:20,displayLevel:100,attackSkillTier:10},'水結界');
assert.equal(out.power,100);assert.equal(out.turns,5);assert.equal(out.img1,101697);assert.equal(out.img2,101774);assert.equal(out.results.length,2);
assert.equal(out.sourcePowerStoredButPhysicalRateUsesAttackerWater,true);

const dispatcher=extractFunction(game,'sourceProfessionBattleSkillExecute');
assert.ok(dispatcher.includes("Math.trunc(n(prepared.skillId))===69"));
assert.ok(dispatcher.includes('sourceProfessionWaterBoundaryExecute'));
const core=extractFunction(game,'battleDamageCore');
assert.ok(core.indexOf('battleAttrDamage(attacker,defender,damage)')<core.indexOf('sourceProfessionBoundaryPhysicalAdjust(attacker,defender,damage)'));
assert.ok(core.indexOf('sourceProfessionBoundaryPhysicalAdjust(attacker,defender,damage)')<core.indexOf('const sourceOtherDamage'));
const magic=extractFunction(game,'sourcePlayerProfessionMagicDamageCore');assert.ok(!magic.includes('battleProfessionBoundaryStates'));

assert.ok(fs.existsSync('tools/check_v252_profession_earth_boundary_runtime.mjs'));
for(const v of ['2.52','2.53'])assert.ok(html.includes('PLAYABLE CORE V'+v));
assert.match(html,/V2\.53 live：[^<]*水結界/);assert.match(game,/schemaVersion:30/);assert.match(game,/s\.schemaVersion=30/);

console.log(JSON.stringify({pass:true,version:'V2.53-core',focus:'Skill 69 water boundary',support:'68/69 only',mp:'dynamic 10/15/20',waterPhysical:'damage -= damage*(attackerWater/200)',storedPower:'active flag only',tick:'post-command; low 0 remains active',rightSideImg2:101774,saveSchema:30}));
