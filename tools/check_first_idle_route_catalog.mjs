#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
const j=JSON.parse(fs.readFileSync('data/generated/stoneage_first_idle_route_catalog.json','utf8'));
assert.equal(j.format,'stoneage-first-idle-route-catalog-v1');
assert.equal(j.summary.towns,4);
assert.equal(j.summary.pathClosedTowns,3);
assert.equal(j.summary.sourceBlockedTowns,1);
assert.equal(j.summary.eligibleRouteVariants,6);
const kar=j.routes.find(x=>x.hometown===3);
assert.equal(kar.status,'source_blocked_before_portal');
const jaja=j.routes.find(x=>x.hometown===2);
const blocked=jaja.variants.find(x=>x.portalId==='3000_to_200_b');
assert.deepEqual(blocked.unusableLandingPoints,[[587,318]]);
assert.match(j.policy.productBoundary,/battle strategy/);
assert.match(j.policy.productBoundary,/offline accrual/);
console.log(JSON.stringify({pass:true,format:j.format,eligibleRouteVariants:j.summary.eligibleRouteVariants,sourceBlockedTowns:j.summary.sourceBlockedTowns}));
