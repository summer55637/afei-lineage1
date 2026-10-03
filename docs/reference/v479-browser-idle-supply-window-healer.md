# V4.79 Browser Idle Supply WindowHealer

V4.79 closes the browser idle supply continuation once the player is already at a source-verified WindowHealer interaction position.

Flow:

`SUPPLY_CHECK → NPC_WINDOW_HEALER_USE → re-check explicit supply policy → SUPPLY_DONE → MOVING`

The runtime reuses the existing WindowHealer transaction and idle state-machine runtimes. It does not invent a supply threshold, route to a healer, or a new Persistent State schema.

When `confirm=false`, the WindowHealer plan is returned without mutating Persistent State.

When `confirm=true`, the WindowHealer transaction must actually succeed and the same explicit supply policy must report that supply is no longer required before `SUPPLY_DONE` is committed.

Failure to provide policy, healer/player context, successful healer recovery, or a post-heal cleared policy fails closed.

Regression: `tools/check_v479_browser_idle_supply_window_healer.mjs`.
