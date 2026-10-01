# V4.18 Browser Battle Item Commit

V4.18 is the Persistent State commit boundary for the fixed-C `BATTLE_GetExpGold()` carried-item path. It consumes the V4.17 plan only; it never rerolls the carried-item reservoir.

Accepted existing item indices are transferred from tracked `enemy:*` ownership into the exact planned player backpack slot (9..23). Items marked `inventory-full` are released from the item runtime, matching the source `ITEM_endExistItemsOne()` cleanup. The battle entry's transient `getitem[i] = -1` clearing is represented as a lifecycle side effect and is not persisted as player inventory state.

The commit validates the transaction id, revision, every existing item and every planned target slot before mutation. A successful transaction increments revision once and records `runtimeMeta.battleItemTransactions[transactionId]`. Repeated transaction ids are idempotent no-ops.

No new item object is allocated at this boundary, no RNG is consumed, and no generic Gold reward is invented. The next battle closure is the outer settlement/lifecycle path that consumes all already-committed battle results and exits the battle context cleanly.
