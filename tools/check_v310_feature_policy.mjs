import fs from 'node:fs';
import assert from 'node:assert/strict';

const manifest=JSON.parse(fs.readFileSync('data/generated/stoneage_disabled_features.json','utf8'));
assert.equal(manifest.format,'stoneage-disabled-features-v1');
const gmque=manifest.features?.gmque;
assert.equal(gmque?.enabled,false);
assert.equal(gmque?.playable,false);
assert.equal(gmque?.permanent,true);
assert.equal(gmque?.sourceArchaeology,'stopped');
assert.equal(manifest.policy?.disabledFeaturesAreNotVersionBlockers,true);
assert.equal(manifest.policy?.doNotInventReplacementNpcData,true);
assert.equal(manifest.policy?.doNotAutoEnableDisabledFeatures,true);

const html=fs.readFileSync('index.html','utf8');
assert.ok(!/id=["'][^"']*gmque/i.test(html),'GMQUE must not have live UI ids');
assert.ok(!/GMACTION|ShowGmque|DelGmquePet|GetGmPrize|CleanGmque/i.test(html),'GMQUE action handlers must not be wired in UI');

const game=fs.readFileSync('game.js','utf8');
assert.ok(!/GMACTION|ShowGmque|DelGmquePet|GetGmPrize|CleanGmque/i.test(game),'GMQUE NPC action handlers must not be wired in runtime');

const workflows=fs.readdirSync('.github/workflows').filter(name=>/gmque/i.test(name));
assert.deepEqual(workflows,[],'GMQUE workflows must be retired');

console.log(JSON.stringify({pass:true,version:'V3.10',feature:'gmque-disabled-permanently',liveUi:false,liveNpcWiring:false,gmqueWorkflows:0}));
