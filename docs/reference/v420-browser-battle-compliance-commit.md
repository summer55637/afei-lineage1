# V4.20 Browser Battle Compliance Commit

## Source boundary

Pinned source: `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`.

V4.20 commits only the source-closed `maxHp` values produced by the V4.19 compliance plan. It deliberately does not mutate current HP/MP and does not invent a MaxMP formula.

## Commit contract

The commit requires a ready V4.19 plan, transaction ID, revision guard and source-stat snapshots.

On success:
- Player `maxHp` is updated from the planned fixed-C-derived value.
- Each planned Pet `maxHp` is updated from the planned source-derived value.
- Current HP, MP and MaxMP remain unchanged.
- Revision increments exactly once.
- Duplicate transaction IDs are idempotent no-ops.
- Stale Player/Pet stat snapshots fail closed.

## Deliberate deferred boundaries

Still deferred:
- `CHAR_MAXMP / CHAR_getDefaultChar` source join.
- Exact post-compliance HP clamp / mutation.
- Equipment/suit/profession/feature branches in `Other_DefcharWorkInt`.
- Network/status side effects.

No RNG is used.

## Why only MaxHP

The canonical Persistent State schema explicitly contains `player.maxHp` and Pet state already carries `maxHp`, while the repository has not established a canonical persistent `serverCombat` field. V4.20 therefore avoids writing an uncontracted combat object into saves.

## Next boundary

The next battle layer should close the fixed-C outer lifecycle: only after finish/reward commits, resolve `BATTLE_Exit`-equivalent entry cleanup and transition the battle runtime back into the world/idle loop.