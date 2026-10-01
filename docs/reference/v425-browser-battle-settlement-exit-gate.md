# V4.25 Browser Battle Settlement Receipt-Bound Exit Gate

## Purpose

V4.24 made `IDLE_EVENTS.REWARD_APPLIED` require a verified settlement receipt while a Battle Context is still live. V4.25 closes the next trust gap: final Player/Pet Exit can no longer rely on `settlementComplete=true` alone.

## Contract

`BATTLE_PLAYER_EXIT_PLAN` and `BATTLE_EXIT_PLAN` now resolve exactly one valid settlement receipt for the live finished battle.

The receipt must match the battle `settlementStartRevision`, Player identity when available, Encounter identity when available, and fixed `finish` mode. Its referenced reward transactions must remain inside the battle settlement revision window.

A new exit plan carries:

- `settlementReceiptBound=true`
- `settlementReceiptId`
- `settlementStartRevision`
- `settlementReceiptRevision`

The corresponding Commit verifies that the referenced receipt is still present and unchanged before mutating Persistent State.

## Fail-closed behavior

No matching receipt returns `settlement-receipt-required`.

Multiple valid receipts for the same battle window return `settlement-receipt-ambiguous` rather than guessing.

Tampered or stale receipt metadata is rejected at Commit time.

## Scope

No new reward values, EXP rules, Gold rules, RNG, death policy, or fixed-C semantics are introduced. This is a lifecycle integrity boundary only.

The canonical flow is now:

`Finish Commit → settlement transaction commits → Settlement Receipt Commit → REWARD_APPLIED → Player Exit Plan/Commit → Pet Exit Plan/Commit → clear Battle Context`

Fixed source remains `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`.
