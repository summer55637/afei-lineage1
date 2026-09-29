import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('start.html','utf8');
const css=fs.readFileSync('game.css','utf8');
const game=fs.readFileSync('game.js','utf8');

assert.match(html,/id=["']battleStageFx["']/,'battle FX node missing');
assert.ok(css.includes('.battle-stage-fx{'),'battle FX CSS missing');
assert.ok(css.includes('@keyframes battleFxPop'),'battle FX animation missing');

const start=game.indexOf('let battlePresentationFx=null;');
const end=game.indexOf('function hasItem(',start);
assert.ok(start>=0&&end>start,'battle presentation FX helpers missing');
const fx=game.slice(start,end);

for(const token of ['classifyBattlePresentationFx','setBattlePresentationFx','renderBattlePresentationFx','battlePresentationFx']){
  assert.ok(fx.includes(token),token+' missing');
}
for(const token of ['傷害','會心','MISS','捕獲成功','捕獲失敗','睡眠','中毒']){
  assert.ok(fx.includes(token),token+' feedback classification missing');
}
assert.ok(fx.includes('renderBattlePresentationFx();'),'FX renderer must update the existing battlefield node');
assert.equal(fx.includes('Math.random'),false,'presentation FX must not consume random');
assert.equal(fx.includes('cRand('),false,'presentation FX must not consume source RNG');
assert.equal(fx.includes('normalBattleOrder('),false,'presentation FX must not execute battle order');
assert.equal(fx.includes('attackTurn('),false,'presentation FX must not execute attack');
assert.equal(fx.includes('captureTurn('),false,'presentation FX must not execute capture');

const addStart=game.indexOf('function addLog(');
const addEnd=game.indexOf('\nfunction hasItem(',addStart);
const add=game.slice(addStart,addEnd);
assert.ok(add.includes('setBattlePresentationFx(text,type);'),'addLog must feed the presentation layer');

console.log(JSON.stringify({pass:true,version:'V3.10',focus:'battle effects presentation',source:'existing battle log',rngConsumed:false,combatMutation:false,saveMutation:false}));
