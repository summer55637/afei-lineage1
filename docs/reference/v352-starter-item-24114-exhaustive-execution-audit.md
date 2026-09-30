# V3.52 Starter Item 24114 Exhaustive Execution Audit

更新日期：2026-09-30。

V3.52 在 V3.51 的 source-ID mapping audit 之上，再加入 pinned source → generated Item catalog → actual execution path 的交叉驗證。

## 固定 source

- `setup.cf`：`ITEM1=24114`。
- `_ITEMSET6_TXT` 啟用，`itemset6file=data/itemset6.txt`。
- pinned `version.h` 沒有 `_IMPOROVE_ITEMTABLE`。
- `init.c` 啟動時只呼叫一次 `ITEM_readItemConfFile(getItemfile())` 建立 Item table；reload 也仍使用同一個 `getItemfile()`。

## Item 24114 的唯一 source row

pinned `itemset6.txt` 第 3602 行：

`token 17 = 11817`

`token 18 = 24114`

`token 19 = 9900`

`token 20 = 16`

因此這筆 row 的 source Item ID 是 **11817**，`24114` 是 `imagenumber`。

## Generated catalog 交叉驗證

repo 的 `data/generated/stoneage_item_make_runtime.json` 使用相同 pinned blob SHA，且：

- template count = 10,737
- `byItemId[11817]` 存在
- `byItemId[11817]` 的 imageNumber = 24114
- `byItemId[24114]` 不存在

這證明 generated runtime 沒有把 imageNumber 誤當成 Item ID。

## Actual execution path

`CHAR_loginAddItemForNew()` → `ITEM_makeItemAndRegist(getNewplayergiveitem(i))` → `ITEM_makeItem(24114)` → `ITEM_CHECKITEMTABLE(24114)`。

因為 pinned build 沒有 `_IMPOROVE_ITEMTABLE` remap，這個 lookup 仍然直接落到 `ITEM_tbl[24114]`。

`itemset6.txt.bak` 也不是第二條 runtime input；正式 loader 使用的是 `config.itemfile` 指向的 `itemset6.txt`。

## V3.52 結論

同一 pinned commit 目前沒有另一個已證明的 loaded Item data file、source-ID transform table 或 migration path，可以把 configured `ITEM1=24114` 映射到 source Item ID 11817。

所以 Starter Item 24114 **繼續 fail-closed**。不能用 `imagenumber=24114` 取代 `id=11817`。

下一步仍只接受同 pinned commit 新發現的真正 execution path；不跨版本、不用外部 Item template、不自行建立 ID remap。
