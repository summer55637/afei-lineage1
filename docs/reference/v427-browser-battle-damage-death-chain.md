# V4.27 Browser Battle Damage→Death Commit Chain

更新日期：2026-10-02

V4.27 composes the V4.26 HP transaction with V4.06 death planning and V4.07 death commit. The caller still supplies source-required death RNG when the target is a critical-hit enemy.

## Behavior

- Uses the pipeline-bound V4.04 DamageReact plan; it does not recompute damage or draw random values.
- Nonlethal results commit HP only.
- When HP reaches zero, it plans death from the resulting HP and commits `isDie`, `deadCount`, `battleOutcomeFlags`, and `ultimate` before publishing the new transient context.
- For a lethal critical enemy, `deathRoll` is required. Missing or invalid RNG rejects the whole chain before the new context is published, so callers can retry with the required roll.
- Same-transaction replay after death is idempotent and does not increment `deadCount` again.
- Persistent State is unchanged. HP and death records remain transient Battle Context mutations.
- Unsupported DamageReact and ride-pet split branches retain V4.26 fail-closed behavior.

Action: `BATTLE_DAMAGE_DEATH_COMMIT`.

## Regression

`tools/check_v427_browser_battle_damage_death_chain.mjs` covers nonlethal damage, lethal damage/death, critical death RNG retry, ultimate propagation, replay idempotency and input immutability.

Workflow: `.github/workflows/check-v427-browser-battle-damage-death-chain.yml`.

V4.27 does not yet implement enemy AI turn selection or full battle-round orchestration.
