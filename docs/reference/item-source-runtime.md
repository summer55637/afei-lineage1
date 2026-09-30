# Source Item Runtime / Allocator

更新日期：2026-09-30

這一層正式把 fixed-C 的 Item template → ITEM_makeItem() → ITEM_makeItemAndRegist() 邊界接到 canonical economy runtime。

## Fixed-C source

固定來源：

- gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56
- active item table：gmsv/data/itemset6.txt
- item ID：第 17 欄
- generated runtime：data/generated/stoneage_item_make_runtime.json
- generated runtime format：stoneage-item-make-runtime-v2
- template count：10,737

## 建立流程

sourceMakeItemData() 依 generated source runtime：

1. 先解析 exact Item ID template；不存在時直接 fail-closed，且不消耗 RNG。
2. 展開 defaultData + b 與 w。
3. 完整跑 66 個 ITEM_DATAINT 欄位的 inclusive RNG；即使 width=0 也照 source lifecycle 消耗一次 RNG。
4. 66 次完成後把 ITEM_LEAKLEVEL 設成 1。

createSourceItemAllocator() 再模擬 ITEM_initExistItemsOne() 的 existing item slot 掃描：

- Sindex 由 allocator instance 保存，起點預設 1。
- 從 1 開始循環掃描到 capacity 前一格。
- 已使用的 existing index 跳過；找到 free index 才建立 item object。
- 若 item runtime 已滿，仍保留已消耗的 66 次 Item-make RNG。
- Item 建立結果不直接寫入 persistent state；由上層 transaction 決定 ownership / player slot。

## Callback 邊界

fixed-C ITEM_initExistItemsOne() 會依 template 的 ITEM_INITFUNC 解析 callback。瀏覽器 runtime 不會猜 callback 行為。

因此：

- 沒有 registered init handler → source-init-callback-unresolved
- handler 明確回傳 false → 建立失敗
- handler 拋錯 → 建立失敗
- 未提供 callback 的一般 item 可以直接進 economy transaction

這是刻意的 fail-closed，不把缺少 source callback 的 item 偷換成「看起來能買」。

## 與 Item / Economy Runtime 的連接

現有 buyShopItem() 不再需要知道 Item 66-field 細節。它接受 allocateItem() adapter；現在可以直接傳入 createSourceItemAllocator({ catalog, ... }).allocate。

交易層仍維持原本的 atomic 規則：

- allocator 失敗不污染原 state
- 建立 existing item 後才交由 buy transaction 放入 player backpack
- Gold 仍由 economy transaction 在所有 item allocations 成功後一次扣除
- transactionId 仍可做 idempotency guard

## Regression

tools/check_item_source_runtime.mjs 會鎖定：

- fixed source ref / item blob SHA
- 66-field layout
- 10,737 templates
- Item 20131 的 66 次 make RNG
- existing item cursor 行為
- item array full 時的 RNG lifecycle
- missing template 的 zero-RNG fail-closed
- init callback 的 explicit handler boundary
- 真正接上 buyShopItem() 的 end-to-end transaction

仍不建立 playable HTML。
