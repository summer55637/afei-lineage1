# V4.71 Browser World Idle Loop

## Purpose

V4.71 adds a single orchestration boundary for the normal online idle world loop. It does not create a second movement system, encounter system, or battle system.

The loop composes the existing runtimes in this order:

`WORLD_MOVE_STEP → encounter target/roll idle commit → Group select → Enemy generate → Battle Context build → BATTLE_STARTED → Battle Initialize → BATTLE_AUTO_RUN + completeLifecycle=true → idle moving/supply_check`

The orchestration layer owns sequencing and boundary checks only. Source formulas, encounter selection, enemy generation, battle turns, settlement transactions, and save semantics remain in their existing runtimes.

## Runtime Contract

Runtime format:

`stoneage-v471-browser-world-idle-loop-v1`

Controller action:

`WORLD_IDLE_LOOP_TICK`

A tick requires caller-provided movement input:

`move: { dx, dy }`

and, when the moved-to cell resolves to a source-backed unconditional encounter target, the caller must provide the encounter RNG evidence:

`encounter: { rng120, cep? }`

A triggered encounter then requires:

- `groupRoll`
- `enemyGeneration.entryMaxRoll`
- `enemyGeneration.enemyRolls[]`
- `battle.battleFieldNo` or a configured field-number provider
- `battle.fixedLuck`
- `battle.surpriseRoll`
- enough `battle.rounds[]` input for the requested auto-battle rounds
- enemy stat RNG evidence when battle context materialization is enabled

No RNG is generated inside V4.71.

## State Boundaries

The loop starts only from persistent idle state `moving`.

After movement, the existing encounter idle bridge commits the existing `MOVE_TICK` transition. A hit enters `encounter_pending`.

After a successful battle lifecycle, V4.70 returns the persistent idle state to:

- `moving` when `supplyRequired=false`
- `supply_check` when `supplyRequired=true`

V4.71 does not invent a supply implementation. It returns a successful paused boundary at `supply_check`, so a later supply runtime can resume the world loop without bypassing the existing idle state machine.

## Fail-Closed Rules

The loop rejects:

- invalid runtime dependencies
- a start or continuation state that is not `moving`
- invalid movement or stale save revisions
- missing encounter RNG
- missing or out-of-range group/enemy RNG
- unresolved enemy core-stat RNG when materialization is requested
- missing battlefield identity
- incomplete auto-battle round input
- a battle lifecycle that does not actually clear its battle context

A cell without an encounter target is not treated as an error. The loop records that tick as a normal movement continuation and proceeds to the next tick.

## Persistence

Movement and encounter roll use their existing save transactions. Complete battle lifecycle uses the V4.70 transaction chain and therefore updates Persistent State through the existing commit runtimes.

The V4.71 runtime itself does not add Persistent State schema fields.

## Regression

Primary regression:

`tools/check_v471_browser_world_idle_loop.mjs`

It uses the real generated Group/Enemy catalog and a deterministic test-only encounter/map surface to verify:

1. movement reaches an encounter boundary;
2. the existing encounter roll enters `encounter_pending`;
3. Group 94 is selected with the source catalog;
4. Enemy generation produces a two-entry test roster;
5. Battle Context and initialization succeed;
6. the battle lifecycle boundary is cleared;
7. the world remains `moving`;
8. the next movement tick continues normally;
9. missing encounter RNG fails closed.

This fixture is regression input only; it is not a production remap or replacement for endpoint/source world data.
