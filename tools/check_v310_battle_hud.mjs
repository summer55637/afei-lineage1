import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('game.html','utf8');
const css=fs.readFileSync('game.css','utf8');
const game=fs.readFileSync('game.js','utf8');

for(const id of ['battleStage','battleStageEnemySide','battleStagePlayerSide','battleHudRound','battleHudTarget','guardBtn','captureBtn','autoCaptureBtn','professionBattleActions']){
  assert.match(html,new RegExp('id=["\\\']'+id+'["\\\']'),id+' missing');
}

assert.match(html,/class=["']battle-command-window["']/);
assert.match(html,/class=["']battle-command-grid["']/);
for(const label of ['攻擊','技能','防禦','捕獲','自動捕獲','道具','更換寵物','逃跑']){
  assert.match(html,new RegExp(label),label+' command missing');
}

assert.ok(css.includes('.battle-command-window{'),'battle command CSS missing');
assert.ok(css.includes('.battle-command-grid{'),'battle command grid CSS missing');
assert.ok(css.includes('grid-template-areas:"head head head command"'),'desktop command grid areas missing');
assert.ok(css.includes('"enemy center . command"'),'enemy command grid area missing');
assert.ok(css.includes('". center player command"'),'player command grid area missing');
assert.ok(css.includes('.battle-stage-unit-bar.mp i'),'MP bar CSS missing');

function extractFunction(name){
  const marker='function '+name+'('; const start=game.indexOf(marker);
  assert.ok(start>=0,'missing '+name);
  const next=game.indexOf('\nfunction ',start+marker.length);
  return game.slice(start,next<0?game.length:next);
}

const unit=extractFunction('renderBattleStageUnit');
const stage=extractFunction('renderBattleStage');
const order=extractFunction('normalBattleOrder');

assert.ok(unit.includes('showMp===true'),'unit renderer must expose MP without changing combat');
assert.ok(unit.includes('opts.mp'),'unit renderer must use runtime MP');
assert.ok(stage.includes('enemy?.sourceBattleTurn'),'HUD round must use existing battle turn');
assert.ok(stage.includes('targetEnemyUnit()'),'HUD target must use existing target resolver');
assert.ok(stage.includes('state.mp')&&stage.includes('state.maxMp'),'player MP must use existing state');
assert.ok(stage.includes('pet.mp')&&stage.includes('pet.maxMp'),'pet MP must use existing state');
assert.ok(order.includes('enemy.sourceBattleTurn')&&order.includes('+1'),'battle HUD must not invent a parallel round counter');

assert.equal(unit.includes('Math.random'),false);
assert.equal(stage.includes('Math.random'),false);
assert.equal(stage.includes('attackTurn('),false);
assert.equal(stage.includes('captureTurn('),false);
assert.equal(stage.includes('normalBattleOrder('),false);

console.log(JSON.stringify({pass:true,version:'V3.10',focus:'battle HUD',roundSource:'enemy.sourceBattleTurn',targetSource:'targetEnemyUnit',resources:['player.hp','player.mp','pet.hp','pet.mp'],rngConsumed:false,combatMutation:false}));
