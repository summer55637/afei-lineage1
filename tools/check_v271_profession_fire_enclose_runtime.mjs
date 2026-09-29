import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const game=fs.readFileSync('game.js','utf8');
const runtime=JSON.parse(fs.readFileSync('data/generated/stoneage_profession_skill_runtime.json','utf8'));
const readme=fs.readFileSync('README.md','utf8');
const changelog=fs.readFileSync('docs/changelog/part-07-v1.75-onward.md','utf8');
// Historical README compatibility marker: keep V2.70/V2.71 visible while V2.72 is current.

function extractFunction(src,name){
  const sig='function '+name+'(';
  const i=src.indexOf(sig); assert.ok(i>=0,'missing '+name);
  const b=src.indexOf('{',src.indexOf(')',i));
  let d=0,q=null,esc=false,line=false,block=false;
  for(let p=b;p<src.length;p++){
    const c=src[p],nx=src[p+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&nx==='/'){block=false;p++}continue}
    if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){line=true;p++;continue}
    if(c==='/'&&nx==='*'){block=true;p++;continue}
    if(c==='"'||c==="'"||c==='`'){q=c;continue}
    if(c==='{')d++; else if(c==='}'&&--d===0)return src.slice(i,p+1);
  }
  throw new Error('unterminated '+name);
}
assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const row=runtime.bySkillId['15'];
assert.equal(row.name,'火附体');
assert.equal(row.func,'PROFESSION_FIRE_ENCLOSE');
assert.equal(row.option,'炎|效%1|回%3|成%100');
assert.equal(row.skillId,15);
assert.equal(row.commonCommand,'BATTLE_COM_S_FIRE_ENCLOSE');

const opt=(text,label,fallback=0)=>{
  const at=String(text).indexOf(String(label)+'%');
  if(at<0)return fallback;
  const m=String(text).slice(at+String(label).length+1).match(/^[+-]?\d+/);
  return m?Number(m[0]):fallback;
};
const tier=level=>{
  level=Math.trunc(Number(level)||0);
  if(level>=100)return 10;if(level>90)return 9;if(level>80)return 8;if(level>70)return 7;
  if(level>60)return 6;if(level>50)return 5;if(level>40)return 4;if(level>30)return 3;
  if(level>20)return 2;if(level>10)return 1;return 0;
};
const ctx={Math,Number,n:v=>Number.isFinite(Number(v))?Number(v):0,
  sourceProfessionSkillTemplate:()=>row,sourceProfessionAttackSkillTier:tier,sourceProfessionStatusOptionInt:opt};
vm.createContext(ctx);
vm.runInContext(extractFunction(game,'sourceProfessionEncloseAuraSpec'),ctx);
for(const [raw,expectedTier,effective,onHitStored,chance] of [[10,0,1,2,20],[50,4,1,2,28],[100,10,3,4,40]]){
  const x=ctx.sourceProfessionEncloseAuraSpec({skillId:15,displayLevel:raw},'fire');
  assert.equal(x.attackTier,expectedTier);
  assert.equal(x.rawTurn,3);
  assert.equal(x.storedTurns,4);
  assert.equal(x.onHitTurn,effective);
  assert.equal(x.onHitStoredTurns,onHitStored);
  assert.equal(x.onHitChance,chance);
}

assert.ok(game.includes("statusAuraToken=element==='thunder'?'擊':element==='ice'?'凍':'炎'"));
assert.ok(game.includes("statusHitToken=element==='thunder'?'電':element==='ice'?'霜':'燒'"));
assert.ok(game.includes('sourceCounterFieldWritten:true'));
assert.equal(game.includes('sourceFireEncloseSourceCounterNeverWritten'),false);
assert.equal(game.includes('sourceFireEncloseAuraActive=false;'),false);
assert.ok(game.includes("prepared?.functionName==='PROFESSION_FIRE_ENCLOSE'&&Math.trunc(n(prepared?.skillId))===15"));
assert.ok(changelog.includes('炎'));
assert.ok(fs.readFileSync('README.md','utf8').includes('PLAYABLE CORE V2.72'));

console.log(JSON.stringify({pass:true,focus:'V2.71 Fire Enclose corrected aura mapping',mapping:'炎->_F_ENCLOSE_2, 燒->_F_ENCLOSE',storedTurns:4,onHitChanceTier10:40}));