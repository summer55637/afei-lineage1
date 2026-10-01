# V4.17 Browser Battle Item Settlement Plan

## Source boundary

Pinned source: `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`, function `BATTLE_GetExpGold()`.

The fixed C battle entry owns exactly `GETITEM_MAX = 3` carried-item indices. During `BATTLE_GetExpGold()`, a live player scans those indices in order. For each valid existing item it checks `CHAR_findEmptyItemBox()` and then calls `CHAR_addItemSpecificItemIndex()`. A successful transfer moves the existing item into the player's inventory; a failed/full case ends the existing item. The battle entry `getitem` slot is cleared to `-1` in either case.

## Browser contract

V4.17 is read-only. It does not roll carried-item RNG: the reservoir decision has already happened during enemy death credit. The plan consumes the existing `getitem` indices and the canonical item runtime, then assigns the first available player backpack slots in fixed scan order.

Current browser item semantics match the source-backed economy layer: player backpack slots are 9..23. Existing carried items are expected to be tracked under `owner` values beginning with `enemy:`. Missing or non-transferable existing indices fail closed rather than being recreated.

When the backpack fills partway through the three-item scan, earlier valid items are accepted and later items are marked for source-equivalent discard. No fresh item allocation or reward RNG is performed.

## Deferred commit

V4.17 does not mutate Persistent State. The next commit boundary will transfer accepted existing indices to player ownership, place them into the planned slots, release discarded indices, and record idempotency. The transient battle `getitem` slots are then cleared by the battle-context lifecycle rather than persisted as player inventory.

## No fabricated Gold

`BATTLE_GetExpGold()` in this fixed source handles player EXP, Pet EXP/level-up effects and carried battle items. The current project therefore does not use this boundary to invent a generic per-enemy Gold reward.

## Next boundary

`BATTLE_ITEM_COMMIT` -> accepted item ownership transfer + discarded existing-item release, with no reroll.
