import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('game.html','utf8');
const readme=fs.readFileSync('README.md','utf8');
const workflow=fs.readFileSync('.github/workflows/v282-fallground-react.yml','utf8');

assert.doesNotThrow(()=>new Function(game),'game.js syntax');

const fallStart=game.indexOf('function sourcePerformPetFallGroundSkill');
const fallEnd=game.indexOf('function sourcePerformPetBattlePropertySkill',fallStart);
assert.ok(fallStart>=0&&fallEnd>fallStart,'FallGround source adapter must exist');
const fallFn=game.slice(fallStart,fallEnd);

const helperStart=game.indexOf('function sourcePetOriginalDamageReact');
const helperEnd=game.indexOf('function sourcePetDrainHeal',helperStart);
assert.ok(helperStart>=0&&helperEnd>helperStart,'source DamageReact helper must exist');
const helperFn=game.slice(helperStart,helperEnd);

assert.ok(helperFn.includes('return !!target?.acupunctureActive'),'current source-backed Enemy DamageReact must remain ACUPUNCTURE');
assert.ok(fallFn.includes('const hadDamageReact=sourcePetOriginalDamageReact(target);'),'FallGround must snapshot original DamageReact');
assert.ok(fallFn.includes('if(!hadDamageReact&&r.damage>0&&!r.dodged&&!r.miss){'),'fall RNG must require react == 0 and positive clean hit');
assert.ok(fallFn.includes('fallRoll=cRand(0,100)'),'FallGround must preserve RAND(0,100)');
assert.ok(fallFn.includes('if(fallRoll>50)'),'FallGround must preserve >50 source threshold');
assert.ok(fallFn.includes('hadDamageReact'),'FallGround result must expose the source gate for regression/debugging');

const fallRng=fallFn.indexOf('fallRoll=cRand(0,100)');
const gate=fallFn.indexOf('if(!hadDamageReact&&r.damage>0&&!r.dodged&&!r.miss){');
assert.ok(gate>=0&&gate<fallRng,'DamageReact gate must dominate the fall RNG');

assert.ok(fallFn.includes('does not assign a positive CHAR_RIDEPET'));
assert.ok(fallFn.includes('do not apply the STR/TOUGH/VITAL *0.7 branch'));
assert.equal(game.includes('state.ridePetId=null;'),true,'player fall placeholder remains explicitly fail-closed, not fabricated ride state');
assert.equal(game.includes('sourcePetFall=true;'),true,'BecomeFox keeps its existing source-proven dismount marker');

assert.ok(workflow.includes('node --check game.js'));
assert.ok(workflow.includes('node tools/check_v282_fallground_react.mjs'));
assert.match(html,/PLAYABLE CORE V2\.91/);
assert.match(readme,/PLAYABLE CORE V2\.91/);
assert.match(readme,/V2\.82.*FallGround.*DamageReact/i);

console.log(JSON.stringify({pass:true,version:'V2.82',focus:'FallGround react==0 gate + CHAR_WORKPETFALL ride-system fail-closed boundary',fallRng:'RAND(0,100) > 50',currentDamageReact:'ACUPUNCTURE',rideSystem:'fail-closed'}));