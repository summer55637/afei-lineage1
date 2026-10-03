# V4.72 Browser Idle Supply

## Purpose

V4.72 adds a narrow supply continuation boundary for an idle run that has already reached SUPPLY_CHECK.

It does not invent a route to a healer. The caller must provide a source-resolved Healer NPC and a player position within the existing healer interaction rule. Route navigation remains the responsibility of the existing world movement / route runtimes.

## Runtime Contract

Runtime format: stoneage-v472-browser-idle-supply-runtime-v1

Controller action: IDLE_SUPPLY_USE_HEALER

The runtime requires:

- persistent idle state supply_check;
- an explicit policy.supply object;
- the existing Healer runtime;
- a source-resolved Healer NPC and player interaction position when recovery is actually required.

The supply threshold is never invented by V4.72. It is read through the existing supplyRequired() policy function.

## Recovery

When the policy says supply is required, V4.72 invokes the existing Browser Healer runtime. That runtime performs the source-backed full player HP/MP recovery and the established pet-box full recovery behavior.

After healing, V4.72 runs the same explicit policy again. It only emits IDLE_EVENTS.SUPPLY_DONE when the policy no longer requires supply.

When supply is not required under the supplied policy, the runtime can emit SUPPLY_DONE without invoking a healer.

## Boundaries

V4.72 deliberately does not:

- choose a supply threshold;
- invent an automatic route to a healer;
- teleport to a healer;
- infer a death recovery policy;
- alter the Persistent State schema.

The result returns to moving only after the existing idle state-machine SUPPLY_DONE transition succeeds.

## Fail-Closed

Missing policy, wrong idle state, missing Healer context, unresolved healer interaction, invalid policy, or post-heal failure to clear the supplied threshold all fail closed.

## Regression

Regression: tools/check_v472_browser_idle_supply.mjs

It covers the pure supply runtime boundary and Browser State Controller integration with the existing Healer fixture. It verifies player/pet recovery, SUPPLY_DONE -> moving, revision increments, source-resolved Healer routing, and missing-policy rejection.
