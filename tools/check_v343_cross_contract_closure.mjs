#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const route=JSON.parse(fs.readFileSync('data/generated/stoneage_start_route_closure.json','utf8'));
const eventClosure=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_event_closure.json','utf8'));
const rewardCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_item_reward_runtime.json','utf8'));
const petCatalog=JSON.parse(fs.readFileSync('data/generated/stoneage_new_player_pet_runtime.json','utf8'));
const componentAudit=JSON.parse(fs.readFileSync('data/generated/stoneage_4000_exit_component_audit.json','utf8'));

assert.equal(route.format,'stoneage-start-route-closure-v8');
assert.equal(route.fixedSource.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(eventClosure.rewardClosure.status,'reward-source-closed-changeevent-template-pending');
assert.equal(eventClosure.semantics.rewardDefinitionsSourceClosed,true);
assert.equal(eventClosure.semantics.rewardMutationChainClosed,true);
assert.equal(rewardCatalog.stats?.requestedItemIds,16);
assert.equal(rewardCatalog.stats?.resolvedItemIds,16);
assert.equal(petCatalog.stats?.requestedEnemyIds,5);
assert.equal(petCatalog.stats?.resolvedEnemyIds,5);
assert.equal(petCatalog.stats?.resolvedTempNos,5);
assert.ok(!route.remainingWork.some(x=>/new-player.*reward|reward.*item.*pet/i.test(x)));
assert.equal(componentAudit.components.reachableFromDirectLanding,false);
assert.equal(componentAudit.portalOrigins.length,4);
assert.equal(route.status.fullFirstRoute,'partial');

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-cross-contract-closure-v1',
  rewardDefinitions:'source-closed',
  rewardPromotion:'no stale blocker',
  fourThousandExitReachable:componentAudit.components.reachableFromDirectLanding,
  fullFirstRoute:route.status.fullFirstRoute
}));
