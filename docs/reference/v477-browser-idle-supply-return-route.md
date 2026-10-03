# V4.77 Browser Idle Supply Return Route

## Purpose

V4.77 adds a read-only planner for returning from the current encounter floor to the route's birth town, entering that town's hospital, and reaching the WindowHealer interaction range.

The planner does not mutate Persistent State and does not execute WarpPoint or movement actions. It is intentionally separated from execution until the source-backed route plan is closed and regression-covered.

## Route composition

`current encounter position → reverse source portal → birth town → hospital source portal → hospital landing → WindowHealer interaction position`

The active idle routeId is the binding key. This is important on floor 100 because both the Samugiru and Marinasu routes share the same encounter floor but use different return portals.

## Source boundaries

- Reverse encounter portals are derived by reversing the exact rows already closed in `stoneage_start_destination_warp_coordinates.json`.
- Town-to-hospital portals are exact `NONE:NULL` rows from the pinned `mapwarp.txt`.
- Hospital maps 1005/2005/3005/4005 are the verified V4.75 LS2MAP runtimes.
- Nurse coordinates come from the fixed-C recovery-service source catalog; no synthetic hospital coordinate is used.
- Movement uses the existing `sourceMapWalkableAt` semantics.

## Routing semantics

Each movement segment uses 4-neighbor walkability. Portal source cells are required to be walkable because the browser route must reach the source cell before executing the existing WarpPoint boundary.

The final hospital segment targets a walkable cell whose Manhattan distance from the exact WindowHealer point is within the source-configured WindowHealer range.

## Fail-closed

The planner fails closed when the routeId is invalid, the player is not on the route encounter floor, a required source portal is missing, a required hospital WindowHealer instance is not unique, maps/mapset cannot be resolved, or any movement segment has no walkable path.

## Regression

`tools/check_v477_idle_supply_route_planner.mjs` plans all four first-route variants (two encounter-floor-100 hometown variants and two encounter-floor-200 variants) from a deterministic walkable point discovered inside the verified unconditional encounter rectangle.

The regression also confirms the planner is read-only and rejects a player positioned on the wrong floor.

Production execution is intentionally not enabled yet. The next boundary is a transaction-safe route executor that reuses the existing movement and WarpPoint commits, followed by wiring that executor into the V4.72 supply continuation.