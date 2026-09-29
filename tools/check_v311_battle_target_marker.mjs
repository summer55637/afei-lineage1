import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('start.html','utf8');
const css=fs.readFileSync('game.css','utf8');
const game=fs.readFileSync('game.js','utf8');

assert.match(html,/id=["']battleStage["']/,'battle stage missing');
assert.match(html,/id=["']battleStageEnemySide["']/,'enemy side missing');
assert.match(html,/id=["']battleStagePlayerSide["']/,'player side missing');

assert.ok(css.includes('.battle-stage-unit.target{'),'target unit rule missing');
assert.ok(css.includes('.battle-stage-unit.target::before{'),'target ring missing');
assert.ok(css.includes('.battle-stage-unit.target::after{'),'target label missing');
assert.ok(css.includes('@keyframes battleTargetPulse{'),'target pulse animation missing');
assert.ok(css.includes('@keyframes battleTargetRing{'),'target ring animation missing');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce){.battle-stage-unit.target'), 'reduced-motion guard missing');

const stageStart=game.indexOf('function renderBattleStage(){');
assert.ok(stageStart>=0,'renderBattleStage missing');
const stageEnd=game.indexOf('function renderEnemy(){',stageStart);
assert.ok(stageEnd>stageStart,'renderBattleStage boundary missing');
const stage=game.slice(stageStart,stageEnd);

assert.ok(stage.includes('targetEnemyUnit()'),'target source must remain targetEnemyUnit');
assert.equal(stage.includes('Math.random'),false,'presentation renderer must not consume RNG');
assert.equal(stage.includes('normalBattleOrder('),false,'presentation renderer must not execute battle order');

console.log(JSON.stringify({pass:true,version:'V3.11',focus:'battle target marker presentation',sourceTarget:'targetEnemyUnit',rngConsumed:false,combatMutation:false}));