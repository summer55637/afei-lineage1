# V3.51 Starter Item 24114 Source Mapping Audit

更新日期：2026-09-30。

V3.51 修正 V3.49 對固定 C Item1=24114 的錯誤判讀，重新沿 pinned source 驗證「設定的 Item ID」與 itemset6.txt 的真正 id 欄位。

## 修正後的固定 C 證據

固定 build：

- `_ITEMSET2_ITEM` 啟用，所以 `ITEM_readItemConfFile()` 將第 17 個 comma token 視為 `ITEM_ID`。
- `_IMPOROVE_ITEMTABLE` 沒有在 pinned `version.h` 定義，因此沒有 `ITEM_TransformList` 的 source-id → sequential-index remap。
- `setup.cf` 的 `ITEM1=24114` 會直接進入 `CHAR_loginAddItemForNew()` → `ITEM_makeItemAndRegist(24114)`。
- selected data file 是 `gmsv/data/itemset6.txt`，實際大小 2,777,181 bytes，共 10,744 行。

## 24114 實際落在哪裡？

`itemset6.txt` 只找到一個數值欄位完全等於 `24114` 的 occurrence，而且是在第 18 個 token，不是第 17 個 token。

第 3602 行的關鍵結構為：

`古代木,...,11817,24114,9900,16,...`

依 pinned `ITEM_itemconfentries[]`：

- token 17 = `id` → **11817**
- token 18 = `imagenumber` → **24114**
- token 19 = `cost` → **9900**
- token 20 = `type` → **16**

因此 source Item table 的 key 是 **11817**，而不是 24114。

## 為什麼仍然不能直接發 24114？

固定 C 的 `ITEM_makeItem(number)` 先呼叫 `ITEM_CHECKITEMTABLE(number)`，在 `_IMPOROVE_ITEMTABLE` 未啟用時實際檢查的是 `ITEM_tbl[number]`。

所以：

`ITEM_makeItem(24114)` ≠ 「使用 imageNumber=24114 的那筆資料」。

要把 11817 強行改稱 24114，等於自行建立 source mapping，這會改變 fixed-C 行為，因此 production runtime 不允許這樣做。

同時，`.bak` 也可看到 `24114` 位於第 18 個 token；它不是另一個合法的 source-id mapping。

## Runtime boundary

目前分層結果：

- `ITEM1=24114` 設定值：✅
- Item loader / 66-field template parser：✅
- source row containing imageNumber 24114：✅
- source Item ID 24114：❌
- `ITEM_tbl[24114]` direct resolution：❌
- existing Item allocator implementation：✅
- 24114 production grant：⚠️ fail-closed
- `imageNumber → itemId` 自行 remap：禁止
- 跨版本／外部資料補 template：禁止

因此 V3.50 的 new-player creation → Save pipeline 仍正確停在 `starter-item` pending checkpoint；不是因為檔案不存在，而是因為 configured ID 在 fixed-C loader semantics 下沒有閉合成可執行 source Item ID。

## 後續搜尋原則

下一次仍只接受同一 pinned commit 能證明的 source-id mapping、編譯期 transform table 或其他 fixed-C execution path。

不使用其他 StoneAge 版本、其他 port、外部資料或「看起來像 24114」的 item row 來改寫 ID。

仍不建立 playable HTML。
