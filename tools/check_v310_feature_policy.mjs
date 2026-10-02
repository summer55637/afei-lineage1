import fs from 'node:fs';
import assert from 'node:assert/strict';

const disabled=JSON.parse(fs.readFileSync('data/generated/stoneage_disabled_features.json','utf8'));
assert.equal(disabled.format,'stoneage-disabled-features-v2');
assert.deepEqual(disabled.features,{} ,'No feature should remain in the current permanent-disabled list after the 2026-10-01 reopen policy reset.');
assert.equal(disabled.policy?.disabledFeaturesAreNotVersionBlockers,true);
assert.equal(disabled.policy?.disabledFeaturesCanBeReopenedWithEvidence,true);
assert.equal(disabled.policy?.doNotInventReplacementNpcData,true);
assert.equal(disabled.policy?.doNotAutoEnableDisabledFeatures,true);

const reopened=JSON.parse(fs.readFileSync('data/generated/stoneage_reopened_features.json','utf8'));
assert.equal(reopened.format,'stoneage-reopened-features-v1');
assert.equal(reopened.features?.gmque,undefined,'GMQUE must not remain in active reopened feature scope after retirement.');
const world=reopened.features?.['world-blockers'];
assert.equal(world?.status,'reopened-for-endpoint-reaudit');
assert.equal(world?.runtimeEnabled,false);
assert.equal(world?.playable,false);

const html=fs.readFileSync('index.html','utf8');
assert.ok(!/id=["'][^"']*gmque/i.test(html),'GMQUE must not have live UI ids merely because historical archaeology exists.');
assert.ok(!/GMACTION|ShowGmque|DelGmquePet|GetGmPrize|CleanGmque/i.test(html),'GMQUE action handlers must not be wired in UI.');

const game=fs.readFileSync('game.js','utf8');
assert.ok(!/GMACTION|ShowGmque|DelGmquePet|GetGmPrize|CleanGmque/i.test(game),'GMQUE action handlers must not be wired in runtime.');

console.log(JSON.stringify({
  pass:true,
  version:'V3.10 policy reset',
  permanentlyDisabledFeatures:Object.keys(disabled.features??{}),
  reopenedFeatures:Object.keys(reopened.features??{}),
  gmque:'retired-from-active-scope',
  worldBlockers:'reopened-for-endpoint-reaudit'
}));
