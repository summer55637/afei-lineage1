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

const gmque=reopened.features?.gmque;
assert.equal(gmque?.status,'reopened-for-source-reconstruction');
assert.equal(gmque?.runtimeEnabled,false);
assert.equal(gmque?.playable,false);
assert.equal(gmque?.nextEvidence?.includes('endpoint NPC RANDGMQUE / QUEPART0..3 exact arguments'),true);

const world=reopened.features?.['world-blockers'];
assert.equal(world?.status,'reopened-for-endpoint-reaudit');
assert.equal(world?.runtimeEnabled,false);
assert.equal(world?.playable,false);

const html=fs.readFileSync('index.html','utf8');
assert.ok(!/id=["'][^"']*gmque/i.test(html),'GMQUE must not have live UI ids merely because archaeology was reopened.');
assert.ok(!/GMACTION|ShowGmque|DelGmquePet|GetGmPrize|CleanGmque/i.test(html),'GMQUE action handlers must not be wired in UI before runtime closure.');

const game=fs.readFileSync('game.js','utf8');
assert.ok(!/GMACTION|ShowGmque|DelGmquePet|GetGmPrize|CleanGmque/i.test(game),'GMQUE NPC action handlers must not be wired in runtime before closure.');

console.log(JSON.stringify({
  pass:true,
  version:'V3.10 policy reset',
  permanentlyDisabledFeatures:Object.keys(disabled.features??{}),
  reopenedFeatures:Object.keys(reopened.features??{}),
  gmque:{sourceArchaeology:'reopened',runtimeEnabled:false,playable:false},
  worldBlockers:'reopened-for-endpoint-reaudit'
}));
