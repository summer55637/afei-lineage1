# Endpoint Item Seed Audit

更新日期：2026-10-02

## 結論

目前 RO0000 的 Endpoint Starter Item boundary 已完成 loader / lookup semantics closure，結果為：

`ITEM1=32003` → **fail-closed：沒有對應的 source Item ID 32003**。

這不是「不知道 loader 怎麼運作」，而是已經知道它怎麼查，並確認目前 snapshot 沒有這個 Item row。

## 新增：15 個 Endpoint Starter Item 設定的整體交叉檢查

Endpoint `setup.cf` 的 `ITEM1..ITEM15` 設定為：

`32003, 32004, 32005, 32006, 32007, 32013, 32008, 32009, 32010, 32011, 32160, 22407, 22077, 32419, 32420`

對目前 Endpoint `data/itemset6.csv` 做完整原文檢查後：

- 15 個值全部沒有出現在 CSV 原文。
- 15 個值全部沒有出現在 Loader 使用的第 17 token（Item ID）。
- 15 個值也全部沒有出現在第 18 token；因此不能由目前 CSV 的 image-number 欄位直接替代。
- Endpoint `setup.cf` 同時仍明確宣告 `itemset6file=data/itemset6.csv`。
- Fixed-C 的 `configfile.c` 也證明在 `_ITEMSET6_TXT` 分支下，`itemset6file` 是選中的 Item loader 檔，其他 itemset3/4/5 是不同 compile-time branch。

因此目前更準確的描述是：

**Endpoint Starter Item 設定與目前 Endpoint Item table 存在整組資料版本／部署不一致。**

這比單一 `32003` 缺 row 更嚴重，但也更不能猜測。現階段仍不把任何其他 Item ID、image number 或 fixed-C 24114 映射成這 15 個設定值。

## Endpoint 設定

| Key | Endpoint | Fixed-C |
|---|---:|---:|
| `ITEM1` | `32003` | `24114` |
| Item file | `data/itemset6.csv` | `data/itemset6.txt` |

本 audit 不把 fixed-C 的資料值直接套進 endpoint。

## Item CSV 證據

RO0000 `itemset6.csv`：

- 3,792,005 bytes。
- 14,502 rows。
- 14,500 rows 為 95 columns；2 rows 為 94 columns。
- 原始檔內容中字串 `32003`：**0 次**。
- exact numeric token `32003`：**0 次**。
- `24114`：1 次，line 6943 / token 18；token 17=`11817`、token 19=`9900`、token 20=`16`。

## Deployed gmsvjt：Item Loader

`ro0000/server/merged-source/gmsv/gmsvjt`：

- blob SHA：`fe574643d35966f4c22f6b0efd8ea504227ed4cd`。
- ELF64 x86-64。
- not stripped、帶 debug information。
- 可見 `ITEM_readItemConfFile`、`ITEM_makeItem`、`ITEM_makeItemAndRegist`、`ITEM_tbl`、`ITEM_idx`、`ITEM_tblen`、`ITEM_idxlen`。
- 沒有觀察到 `ITEM_TransformList` / `ITEM_getSIndexFromTransList`。

### Loader 的 Item ID

`ITEM_readItemConfFile` 第一輪對 parser 明確使用 index `0x11`（十進位 **17**），結果經 `atoi` 存入 Item-ID 變數；同一路徑再用這個值更新 `ITEM_tblen` 與 `ITEM_idxlen`。

因此 endpoint 的 source Item ID 是由第 **17 token** 建立，而不是把 `imagenumber` 當成 ID。

### ITEM_idx

endpoint 有自己的 index table：

`ITEM_idx[ItemID] = { presentFlag, sequentialTableIndex }`

loader 會先配置 `ITEM_idxlen = max(ItemID) + 1`，然後把每個 parsed Item ID 的 entry 設為 present，並寫入該 row 的 sequential table index。

`ITEM_CHECKITEMTABLE(number)` 的 compiled code：

1. 檢查 `number < ITEM_idxlen`；
2. 讀取 `ITEM_idx[number]` 的第一個欄位；
3. 用該 present flag 決定 Item 是否存在。

所以 `ITEM_idx` 是 endpoint 真正的 ID→table-index lookup，不是把某個 image number 自動轉成另一個 Item ID。

## 新玩家實際 Grant Chain

compiled endpoint call chain：

`CHAR_loginAddItemForNew`

→ `getNewplayergiveitem`

→ `ITEM_makeItemAndRegist`

`getNewplayergiveitem` 直接由 endpoint 的 new-player Item 設定陣列取值；呼叫 `ITEM_makeItemAndRegist` 前只有 `mov edi,eax`，沒有觀察到中間 ID remap。

`ITEM_makeItemAndRegist` 再直接把收到的值傳入 `ITEM_makeItem`。

`ITEM_makeItem` 先呼叫 `ITEM_CHECKITEMTABLE`，通過後才依 `ITEM_idx[number].sequentialTableIndex` 找到 `ITEM_tbl` 的實際 row。

## 目前正式判定

因此目前 endpoint execution chain 可以閉合成：

`setup.cf ITEM1=32003`

→ `getNewplayergiveitem()` 直接取得 `32003`

→ `ITEM_makeItemAndRegist(32003)`

→ `ITEM_makeItem(32003)`

→ `ITEM_CHECKITEMTABLE(32003)`

→ `ITEM_idx[32003]`

→ source table 必須存在 Item ID `32003`。

但目前 endpoint `itemset6.csv` 的第 17 token 完全沒有 `32003`。

所以目前 snapshot 的 Endpoint Starter Item **正式 fail-closed**。

這也意味著：

- 不把 `24114` 當 endpoint ITEM1。
- 不把 `imagenumber=24114` 改成 Item ID。
- 不把 `32003` remap 成 `11817`。
- 不跨版本補 Item template。

只有新的 authoritative endpoint evidence 能重新打開這個 boundary，例如新的部署資料、不同且可證明與目前 snapshot 對應的 Item source，或能證明 `ITEM1` 在該部署版本有另一條正式 mapping path。

## Fixed-C 關係

固定-C 的 `ITEM1=24114` 仍維持自己的 scope，且先前已證明 24114 超過 fixed-C Item table boundary；這個結論不與 endpoint `ITEM1=32003` 混用。

因此目前同時保留：

- Fixed-C Starter Item 24114：fail-closed。
- Endpoint Starter Item 32003：fail-closed。

## Regression / CI

`data/generated/stoneage_endpoint_item_seed_audit.json` 會由 audit script 從 RO0000 `setup.cf`、`itemset6.csv`、`gmsvjt` 重新生成。

CI 會檢查 endpoint source catalog 與 deployed binary 的 Item loader / lookup evidence。
