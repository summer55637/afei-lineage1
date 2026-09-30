# Item / Economy Runtime

更新日期：2026-09-30

這一層把 fixed-C 的 Item 與 Gold 邊界接到 canonical persistent state；它不是 UI，也不自行建立未經 source 驗證的 Item template。

## Fixed-C source boundary

來源固定為 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### Gold

`CHAR_getMaxHaveGold()` 在 fixed C 啟用 `_FIX_MAX_GOLD` 時為：

`1,000,000 + 轉生次數 × 1,800,000`

因此 canonical runtime 由 `sourcePlayerMaxGold()` 提供同一公式。Gold transaction 不能超過此上限。

### Player Item slots

固定 player inventory 為 24 格；本專案 canonical state 使用 `inventory.playerItemSlots[24]`，背包範圍為 9–23。這與既有 Reward Transaction / item lifecycle contract 共用，不另建第二套 slot numbering。

### 商店買入

fixed C `NPC_SetNewItem()` 先解析 ItemList、數量與 `buy_rate`，再進入 `NPC_AddItemBuy()`。正常買入的 source boundary 是：

1. 判定物品與單價。
2. 檢查玩家石幣是否足夠。
3. 呼叫 `ITEM_makeItemAndRegist(itemID)` 建立 existing item。
4. 透過 `CHAR_addItemSpecificItemIndex()` 放入玩家 inventory。
5. 全部建立後再用 `CHAR_DelGold()` 扣石幣。

本 runtime 因目前尚未重新建立完整 source Item maker，所以買入 API 必須提供 `allocateItem()` source adapter；沒有 adapter 就 fail-closed。這避免拿假的 itemId 或簡化 RNG 冒充 fixed-C item creation。

## 商店賣出

fixed C `NPC_SellNewItem()` 先由 NPC sell resolver 得到可賣價格，檢查金錢上限與 Item validity，再：

1. `NPC_DelItem()` / `CHAR_DelItem()` 移除玩家 Item。
2. `CHAR_AddGold()` 加回石幣。

本 runtime 對 stack Item 保留既有生命週期：pile 從 5 減為 4 時 existing item 仍存在；pile 減到 0 才清 player item slot 並 free runtime existing item。

SimpleShop 的 base Item cost 上限固定為 9,999；ItemShop sell price 仍必須來自 source resolver，runtime 不猜 NPC-specific `LimitItemType` / `sell_rate`。

## 不做的事情

不在本層猜 Item template、shop rate、NPC-specific discount、missing item ID、製作配方或任務獎勵。需要完整 source Item creation 時，交給 source adapter；需要 NPC shop policy 時，交給 source-resolved offer。

Runtime：`src/stoneage_item_economy_runtime.mjs`

Regression：`tools/check_item_economy_runtime.mjs`

Generated contract：`data/generated/stoneage_item_economy_runtime_schema.json`
