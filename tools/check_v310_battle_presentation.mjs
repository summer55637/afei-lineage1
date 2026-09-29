import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('game.html','utf8');
const css=fs.readFileSync('game.css','utf8');
const game=fs.readFileSync('game.js','utf8');

for(const id of ['battleStage','battleStageState','battleStageEnemySide','battleStagePlayerSide']){
  assert.match(html,new RegExp('id=["\\\']'+id+'["\\\']'));
}
assert.match(html,/class=["']battle-stage["']/);
assert.ok(css.includes('.battle-stage{'),'battle stage CSS missing');
assert.match(css,/grid-template-areas:"head head head" "enemy center \." "\. center player"/);
assert.ok(css.includes('.battle-stage-enemy-side'),'enemy side CSS missing');
assert.ok(css.includes('.battle-stage-player-side'),'player side CSS missing');

const helperStart=game.indexOf('function renderBattleStageUnit(');
const helperEnd=game.indexOf('function renderBattleStage(){',helperStart);
const stageStart=helperEnd;
const stageEnd=game.indexOf('function renderEnemy(){',stageStart);
assert.ok(helperStart>=0&&helperEnd>helperStart&&stageEnd>stageStart,'battle stage render helpers missing');
const helper=game.slice(helperStart,helperEnd);
const renderStage=game.slice(stageStart,stageEnd);

assert.ok(helper.includes('battle-stage-unit'),'unit markup missing');
assert.ok(renderStage.includes('battle-stage-enemy-side')||renderStage.includes("$('#battleStageEnemySide')"),'enemy side wiring missing');
assert.ok(renderStage.includes('battle-stage-player-side')||renderStage.includes("$('#battleStagePlayerSide')"),'player side wiring missing');
assert.ok(renderStage.includes('targetEnemyUnit()'),'current target must be represented');
assert.ok(renderStage.includes('activePet()'),'active pet must be represented');
assert.ok(!helper.includes('Math.random'),'presentation helper must not consume RNG');
assert.ok(!renderStage.includes('Math.random'),'presentation renderer must not consume RNG');
assert.ok(!renderStage.includes('attackTurn('),'presentation renderer must not execute combat');
assert.ok(!renderStage.includes('captureTurn('),'presentation renderer must not execute capture');

const renderStart=game.indexOf('function render(){');
const enemyRenderCall=game.indexOf('  renderEnemy();',renderStart);
const stageRenderCall=game.indexOf('  renderBattleStage();',enemyRenderCall);
assert.ok(renderStart>=0&&enemyRenderCall>renderStart&&stageRenderCall>enemyRenderCall,'battle stage must render after enemy state');

console.log(JSON.stringify({
  pass:true,
  version:'V3.10',
  focus:'battle presentation layer',
  sourceLayout:'enemy upper-left / player lower-right',
  rngConsumed:false,
  combatMutation:false
}));
