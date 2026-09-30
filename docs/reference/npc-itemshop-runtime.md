# NPC ItemShop Runtime

更新日期：2026-09-30

這層把 fixed-C `npcgen_shop` → shop arg → `ItemList` / `buy_rate` / `sell_rate` / sell limits 接到 Item / Economy Runtime。

## Source closure

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

核心 C 模組：`gmsv/src/npc/npc_itemshop.c`。

`NPC_SetNewItem()` 的買入路徑讀取 NPC arg 的 `buy_rate` 與 `ItemList`。`ItemList` 支援單一 Item ID 與 range；normal ascending range 為 inclusive。買入單價是 source Item cost 乘 `buy_rate` 後取整數。

`NPC_GetSellItemList()` 的賣出路徑先看 `special_item` / `special_rate`，未命中再使用 `sell_rate`。賣出資格先檢查 `LimitItemType`，再檢查 `LimitItemNo`。

`LimitItemType` 的固定-C 特殊分類也已收進 runtime：`ACCESSORY` 對應 item type 8..15、`OFFENCE` 對應 0..4 與 17..19、`DEFENCE` 對應 5..7；其餘基本類型按 source type code 比對。

## Runtime

`src/stoneage_npc_itemshop_runtime.mjs` 提供 exact shop lookup、Item→Shop acquisition reverse index、buy offer resolution、sell policy / rate resolution，以及 source Item template cost → economy transaction request。

`buyNpcItemShopItem()` 直接呼叫既有 `buyShopItem()`；因此目前資料鏈可以變成：

`NPC create → NPC shop arg → ItemList → Item template cost → Item allocator → Economy transaction`

Runtime 不猜 Item cost；cost 一律從 `stoneage-item-make-runtime-v2` 的 66-field source Item template 取得。

## Generator

`tools/generate_npc_itemshop_runtime.mjs --source-root /path/to/StoneAge --out data/generated/stoneage_npc_itemshop_runtime.json`

generator 會：

- 掃描 `gmsv/data/npc/**/*.create`。
- 只提升 `enemy=npcgen_shop|file:...` 的 NPC。
- 解析對應 `.arg`，保留 exact source paths、Git blob SHA、SHA-256、原始 ItemList 與展開後 item IDs。
- 產生 `shopId` 與 `itemIndex`，讓單一 Item 可以反查所有 source shops。
- source checkout 若含 `.git`，會強制 HEAD 等於 pinned ref；避免拿錯版本的 shop data。
- 找不到 arg file 時進入 `unresolved`，不生成假的 shop。

完整 336 個 ItemShop binding 尚未複製 fixed-C checkout 到本 repo；因此完整 catalog 的生成仍以 pinned source checkout 為輸入。現有 `stoneage_npc_service_index.json` 已固定 ItemShop = 336 bindings、190 floors。

## Regression / policy

`tools/check_npc_itemshop_runtime.mjs` 鎖定 range 展開、LimitItemType / LimitItemNo、special sell rate、Item template cost、reverse acquisition index，以及 end-to-end Economy Buy adapter。

仍不建立 playable HTML。
