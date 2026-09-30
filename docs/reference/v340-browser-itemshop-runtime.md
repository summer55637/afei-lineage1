# V3.40 Browser ItemShop Runtime

更新日期：2026-09-30

V3.40 把已完成的 Item / Economy / NPC ItemShop source runtime 接到 canonical browser state layer。

## Runtime boundary

正式資料流：

`browser action → facing/distance gate → NPC ItemShop catalog → source Item template / price → Item allocator → Item/Economy transaction → canonical persistent state`

本層不建立第二套商店或貨幣系統。

## Browser actions

`stoneage_browser_itemshop_runtime.mjs` 提供三個 action：

- `NPC_ITEMSHOP_OPEN`：只解析 shop 與 source-backed offers，不修改 state。
- `NPC_ITEMSHOP_BUY`：確認 shop offer、解析 Item base cost、使用 source Item allocator，再交給 `buyShopItem()`。
- `NPC_ITEMSHOP_SELL`：從 canonical existing item 的 source data 讀取 Item ID / Cost / Type，套用 `LimitItemType / LimitItemNo / special_item / special_rate`，再交給 `sellShopItem()`。

每一個 action 都必須先通過 fixed-C interaction boundary（same-floor、distance、facing）。

## Source parity

固定 C `npc_itemshop.c` 的買入流程以 `ITEM_getcostFromITEMtabl(itemID) × buy_rate` 計算總價，確認 Gold 後建立每個 Item，完成後扣除 Gold。賣出流程則先用 shop limit policy 產生價格，確認不超過 Gold 上限，再刪除 Item 並增加 Gold。這些 source boundary 已在既有 runtime 中分層實作，不由 browser layer 重算。

## Fail-closed

缺少 NPC ItemShop catalog、Item make catalog、shop offer、source Item template 或 source Item field 時，browser runtime 直接拒絕 action，不用猜測資料。

`changeevent` 的 strict / compatibility policy 不在這一層修改；V3.39 的 strict fail-closed 邏輯保持不變。

## Regression

`tools/check_v340_browser_itemshop_runtime.mjs` 覆蓋：

- 5 個 range-expanded buy offers
- open 不修改 revision
- source Item allocation + Gold debit
- source Item fields 反解析
- sell policy + Gold credit
- transaction idempotency
- interaction distance gate
- non-offered item rejection
- shop sell restriction

回歸使用 `tools/fixtures/npc-itemshop/` 的 synthetic source-backed fixture；這只是驗證 browser bridge 的 contract，不宣稱為 336 個正式 ItemShop bindings 的完整 world catalog。

## 下一步

下一段應把正式 pinned source 產生的 ItemShop catalog 接到 world/NPC service binding，而不是把 fixture promotion 成 production data。之後再把 shop UI 接到同一個 browser state controller。

