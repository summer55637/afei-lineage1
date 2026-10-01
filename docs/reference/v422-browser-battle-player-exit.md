# V4.22 Browser Battle Player Exit State Plan

## Source boundary

Fixed source: `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`.

V4.22 closes the Browser-to-Persistent-State gap for the final Player HP/MP snapshot before V4.21 Pet exit cleanup.

The existing Idle Simulation already treats a finished battle result's Player HP/MP snapshot as battle-runtime output. V4.22 exposes the same concept through the canonical Browser State Controller rather than creating another battle engine.

The fixed-C `BATTLE_Exit()` path also restores a dead Player to HP 1 on final exit and clears the death flag. Persistent State v1 does not persist `CHAR_ISDIE`, so Browser only commits the source-visible HP result and the final HP 1 outcome for a dead Player.

## Plan contract

- only a finished Battle Context is accepted;
- caller must explicitly provide `settlementComplete=true`;
- Player entry must be the side-0 `bid=0` entry;
- HP and MP must be present in the battle entry;
- live Player: commit battle HP/MP;
- dead Player (`isDie=true`): commit HP 1 and the battle MP snapshot; an HP<=0 entry without the source death flag is fail-closed.
- no RNG, reward, EXP, Gold, or Battle Context mutation during planning.

## Commit contract

- validates transactionId and expectedRevision;
- validates the Persistent State HP/MP snapshot captured by the plan;
- applies only Player HP/MP;
- increments revision exactly once;
- duplicate transactionId is an idempotent no-op;
- stale HP/MP snapshots fail closed.

## Lifecycle

`Battle Finish → Idle settlement → reward/other commits → V4.22 Player Exit State Commit → V4.21 Pet Exit Plan/Commit → clear Battle Context`

V4.22 does not implement player full-heal, supply policy, BecomePig, network/status sends, or a new death-recovery policy.
