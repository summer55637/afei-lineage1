import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const readme=fs.readFileSync('README.md','utf8');
const changelog=fs.readFileSync('CHANGELOG.md','utf8');

function sliceFunction(name){
  const start=game.indexOf('function '+name+'(');
  assert.ok(start>=0,'missing '+name);
  const end=game.indexOf('\nfunction ',start+10);
  return game.slice(start,end>start?end:start+18000);
}

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const duck=sliceFunction('battleDuckChance');
const result=new Function('n',duck+"\nreturn {normal:battleDuckChance({type:'player',fixedDex:100},{type:'player',fixedDex:130,luck:0},0.02),jujutsu:battleDuckChance({type:'player',fixedDex:100},{type:'player',fixedDex:130,luck:0},0.027),fallback:battleDuckChance({type:'player',fixedDex:100},{type:'player',fixedDex:130,luck:0),undefined)};")(v=>Number(v)||0);

assert.ok(Math.abs(result.normal-3872.9833462074166)<1e-9,'default K=0.02 math drift');
assert.ok(Math.abs(result.jujutsu-3333.3333333333335)<1e-9,'JYUJYUTU K=0.027 math drift');
assert.equal(result.normal,result.fallback,'missing Kawashi divisor must remain on fixed default 0.02');
assert.ok(result.normal>result.jujutsu,'JYUJYUTU branch must use the larger divisor');

const total=sliceFunction('sourceBattleDuckTotal');
assert.ok(total.includes('sourceDefenderBattleCommand'),'sourceBattleDuckTotal must expose defender command adapter');
assert.ok(total.includes("options.sourceDefenderBattleCommand??defender?.battleCommand"),'defender command precedence missing');
assert.ok(total.includes("sourceDefenderBattleCommand==='BATTLE_COM_JYUJYUTU'?0.027:.02"),'fixed 0.027/0.02 branch missing');
assert.ok(total.includes('battleDuckChance(attacker,defender,kawashiPara)'), 'selected Kawashi divisor must reach BATTLE_DuckCheck math');

assert.match(html,/PLAYABLE CORE V2\.94/);
assert.match(readme,/PLAYABLE CORE V2\.94/);
assert.match(readme,/V2\.94 — fixed BATTLE_DuckCheck JYUJYUTU KawashiPara branch/);
assert.match(changelog,/V2\.94：fixed BATTLE_DuckCheck JYUJYUTU KawashiPara=0\.027 branch/);

console.log(JSON.stringify({
  pass:true,
  version:'V2.94',
  kawashiPara:{normal:0.02,jujutsu:0.027},
  deterministicDuckRateUnits:result
}));
