# V3.53 Starter Item 24114 Build Closure Audit

更新日期：2026-09-30。

V3.53 將 Item 24114 的最後一層疑點收斂成可重跑的 build-closure 證據：不只看資料列，而是驗證 pinned repository-defined build 是否可能注入 Item ID transform，以及 loader 建表後的實際 table boundary。

## 1. Pinned build 的 Item table 邊界

`gmsv/data/itemset6.txt`：

- 10,737 個 non-blank data rows。
- 最大 source Item ID = **23009**。
- `ITEM_readItemConfFile()` 對非 `_IMPOROVE_ITEMTABLE` build 使用 `ITEM_tblen = maxid + 1`。
- 因此 `ITEM_tblen = 23010`。

配置的 `ITEM1=24114`：

`24114 >= 23010`

所以 `ITEM_CHECKITEMTABLE(24114)` 在這個 build 中會直接失敗。

## 2. 排除「其實有編譯旗標」的可能

pinned：

- `gmsv/src/Makefile`：`CFLAGS=-w -O3 $(INCFLAGS)`，沒有 `-D_IMPOROVE_ITEMTABLE`。
- `gmsv/src/item/makefile`：同樣沒有 `-D_IMPOROVE_ITEMTABLE`。
- `version.h` 只保留 `//#define _IMPOROVE_ITEMTABLE` 註解，沒有啟用它。
- `_ITEMSET6_TXT` 是啟用狀態。

因此在 repo 自己定義的 build path 中，Item transform list 不會被編譯進去。

## 3. 唯一 24114 資料列

`itemset6.txt` 第 3602 行：

- source Item ID = **11817**
- imageNumber = **24114**
- cost = **9900**
- type = **16**
- identity = `古代木`

因此 24114 仍然不是這筆 row 的 source Item ID。

## 4. Generated catalog 交叉驗證

`data/generated/stoneage_item_make_runtime.json` 使用相同 pinned Item blob：

- 10,737 templates
- `byItemId[11817]` 存在
- `byItemId[11817].imageNumber = 24114`
- `byItemId[24114]` 不存在

## 5. Migration / reload closure

正式 loader：

`init.c -> ITEM_readItemConfFile(getItemfile())`

Item reload：

`chatmagic.c -> ITEM_readItemConfFile(getItemfile())`

兩條路都使用相同 `config.itemfile`，沒有另一個正式 Item data file。

V3.53 同時記錄了 repository build makefiles、version flag、loader/reload call sites；目前沒有找到可把 configured `24114` 映射成 source Item ID `11817` 的 active source-ID migration / transform path。

## 6. 最終狀態

- Item data：✅
- Item parser：✅
- source Item 11817：✅
- imageNumber 24114：✅
- configured Item ID 24114：⚠️ 超過 `ITEM_tbl` boundary
- source-ID remap：❌
- production Starter Item grant：⚠️ **fail-closed**

所以現在不能把 `11817` 改成 `24114`，也不能從其他版本／port 補一個假 template。

V3.50 的 new-player creation → Save pipeline 維持原設計：Item stage pending，可 resume；沒有合法 Item source execution path 時不產生 completed save。

仍不建立 playable HTML。
