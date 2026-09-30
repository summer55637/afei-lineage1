# V3.25 New-player Item Reward Runtime

更新日期：2026-09-30

V3.25 把新手 `GetItem` 從 V3.23 Event Orchestrator 的 literal action 接到 fixed-C Item creation 與 canonical inventory。

## Source closure

fixed-C `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56` 的 `gmsv/src/npc/npc_eventaction.c::NPC_ActionAddItem()` 明確執行：

`ITEM_makeItemAndRegist(itemID) → CHAR_addItemSpecificItemIndex()`

目前 `stoneage-item-make-runtime-v2` 已包含新手 closure 的全部 16 個 Item ID，因此這一批 reward 不再依賴缺失的 raw itemset6 checkout。

`data/generated/stoneage_new_player_item_reward_runtime.json` 是從現有 source-backed Item make catalog 聚焦產生的 16-item catalog。

## Inventory semantics

canonical persistent state 使用 24 個 player item slots；source `CHAR_findEmptyItemBox()` 從 `CHAR_STARTITEMARRAY=9` 往後找第一個空位，所以這個 adapter 使用 player slots 9..23。

每個 `GetItem` action 都建立獨立 existing-item object，然後寫入：

`inventory.itemRuntime.slots[existingIndex]`

`inventory.playerItemSlots[playerSlot] = existingIndex`

它不執行 stack merge，符合 source `CHAR_addItemSpecificItemIndex()` 的 direct slot insertion 行為。

## Atomic boundary

handler 本身會直接修改 caller 提供的 staged state；真正的 atomicity 由 V3.22 `applyNpcEventActionPlan()` 提供。只要任一後續 action 失敗，原始 canonical state 不會提交。

Item creation 仍使用共用 `createSourceItemAllocator()`，所以 fixed-C 66-field Item RNG、existing index cursor 與 Item Init callback boundary 都保持同一套。

## Closed / pending

新手 16 個 Item definitions：**source-closed**。

仍 pending：

- `Charm:1` 的固定-C concrete mutation semantics。
- `changeevent` 本身不在 pinned `npctemplate.c::functionSet[]`，所以正式 NPC template instantiation 仍是 unresolved。

因此現在可以安全做到「Item reward mutation runtime」，但不把完整新手事件宣稱已經在 browser 中完成。

## Regression

`tools/check_v325_new_player_item_reward_runtime.mjs` 鎖定 16/16 source Item rows、66-RNG Item creation、第一個 backpack slot、4-item sequential insertion、15-slot capacity 與 focused catalog generator。

V3.25 不建立 playable HTML。
