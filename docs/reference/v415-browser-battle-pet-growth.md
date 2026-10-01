# V4.15 Browser Battle Pet Growth Plan

## Source boundary

Pinned source: `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`, function `CHAR_PetLevelUp()`.

The fixed C implementation reads `CHAR_ALLOCPOINT` as four packed bytes in VITAL/STR/TOUGH/DEX order. Each level-up consumes exactly ten inclusive `RAND(0,3)` calls to distribute one point among those four work values, then one inclusive rank roll. Rank 0..5 use 450..500, 470..520, 490..540, 510..560, 530..580 and 550..600 respectively; the roll is multiplied by 0.01. The resulting floating-point stat increments are cast to C `int` before being added to the live Pet VITAL/STR/TOUGH/DEX values.

## Browser contract

V4.15 is a read-only deterministic plan. It consumes the V4.14 `levelUps` count plus explicit RNG evidence. It does not call `Math.random()` and does not reroll during commit.

For each planned level the runtime outputs the exact eleven source RNG results, allocation counts, rank multiplier, integer stat deltas and before/after raw stats. The same packed `allocPointPacked` is used for each `CHAR_PetLevelUp()` call because the fixed function reads the stored `CHAR_ALLOCPOINT` and does not rewrite it during the level-up function itself.

The starter-pet runtime now also preserves `allocPointPacked`, `serverStats` and `serverProgression=true` so newly created source-closed pets have the source fields required for later progression. Legacy pets without those source fields remain fail-closed rather than inventing them.

## Deferred boundary

V4.15 does not run `CHAR_complianceParameter()` and therefore does not claim final HP/MP/combat-derived values. Those derived values need their own source-backed compliance calculation or an existing trusted equivalent. V4.15 also does not mutate Persistent State; it only prepares the Pet stat mutation for `BATTLE_LEVELUP_COMMIT`.

## Next boundary

`BATTLE_LEVELUP_COMMIT` should atomically apply the already-planned player and pet EXP/level changes, player DuelPoint/skill/charm changes, and Pet raw stat deltas, while preserving the recorded RNG evidence. Only after that should the battle item transfer boundary be closed.
