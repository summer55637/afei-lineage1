# V4.16 Browser Battle Level-Up Commit

## Source boundary

Pinned source: `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`.

V4.16 is the persistent commit boundary after the V4.13 EXP plan, V4.14 level-up plan and V4.15 deterministic Pet growth plan. It applies only values already calculated by those plans; it never rerolls RNG or recalculates progression during commit.

## Atomic commit contract

The commit validates:
- Player EXP and Level snapshot;
- Player DuelPoint, Skill Point and Charm snapshot;
- every Pet EXP/Level snapshot for planned level-ups;
- every Pet raw-stat snapshot against the V4.15 growth plan;
- transaction id and revision.

On success it writes Player level/EXP/DuelPoint/Skill/Charm and each planned Pet level/EXP/raw stats in one cloned Persistent State, increments revision once, and records `runtimeMeta.battleLevelUpTransactions[transactionId]`.

Duplicate transaction IDs are idempotent no-ops. Stale snapshots fail closed before mutation.

## Source-side effects kept separate

The fixed C settlement also invokes `CHAR_complianceParameter()` for the player after player level-up and for the Pet after `CHAR_PetLevelUp()`. V4.16 marks these derived-stat/network effects as deferred rather than pretending that raw Level/Stat writes alone are equivalent to final HP/MP/combat fields.

The V4.15 RNG evidence is preserved as part of the plan chain; V4.16 does not call `Math.random()`.

## Next boundary

The next closure is battle-item settlement: consume the already-determined `getitem` pool, enforce the fixed C inventory-space behavior, transfer successful items into canonical Persistent State, and discard unclaimed existing item indices without inventing new reward RNG.
