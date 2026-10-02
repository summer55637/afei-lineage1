# Endpoint Item Seed Audit

更新日期：2026-10-02

## 目的

確認 RO0000 的新玩家 `ITEM1` 到底是直接 Item ID、其他欄位，還是由部署端 loader / transform 轉換。

固定 boundary：

`setup.cf` → `ITEM1` → `itemset6file` → endpoint Item table → deployed `gmsvjt`

## Endpoint 設定

| Key | Endpoint | Fixed-C |
|---|---:|---:|
| `ITEM1` | `32003` | `24114` |
| Item file | `data/itemset6.csv` | `data/itemset6.txt` |

本 audit 不把 fixed-C 的欄位位置或 ID transform 直接套到 endpoint。

## 目前資料證據

RO0000：

- `itemset6.csv`：3,792,005 bytes；14,502 rows。
- 主要資料列：95 columns；另有 2 rows 為 94 columns。
- 原始檔內容中字串 `32003`：**0 次**。
- exact numeric token `32003`：**0 次**。
- `24114`：1 次，line 6943 / token 18；相鄰 token 17=`11817`、19=`9900`、20=`16`。
- 若暫以 fixed-C 第 17 token 當 Item ID 做「假設性 probe」：最大值為 99999，32003 出現 0 次；這只是 shape probe，不是 endpoint 語義結論。

## Deployed Server Binary

RO0000 的 `gmsvjt`：

- blob SHA：`fe574643d35966f4c22f6b0efd8ea504227ed4cd`
- ELF 64-bit x86-64
- **not stripped**
- 帶 debug information
- 可直接看到：
  - `ITEM_readItemConfFile`
  - `ITEM_makeItem`
  - `ITEM_makeItemAndRegist`
  - `ITEM_tblen`
- 目前 symbol table 沒有 `ITEM_TransformList`。

這表示我們已經找到 endpoint 本身的 Item loader / makeItem 執行證據入口，而且目前沒有證據顯示部署 binary 使用 fixed-C 那個 `ITEM_TransformList` 機制。

但「沒有 `ITEM_TransformList` symbol」只代表**目前尚未觀察到該特定 transform implementation**；不單獨證明 endpoint 完全沒有其他 ID transform。

## 目前結論

目前最穩妥的結論是：

`ITEM1=32003` **尚未在 endpoint Item table 中閉合**。

而且問題已從「CSV 找不到 32003」進一步縮小為：

1. endpoint CSV 原始內容沒有 `32003`；
2. endpoint `gmsvjt` 確實包含獨立的 Item loader / maker；
3. endpoint binary 目前沒有 `ITEM_TransformList` symbol；
4. 因此下一個決定性 evidence layer 是 **endpoint `ITEM_readItemConfFile` 的實際 binary semantics**，特別是它讀取哪一個 token 當 ID，以及是否存在其他 mapping。

在這層閉合以前：

- 不把 24114 當成 endpoint ITEM1。
- 不把 imageNumber 當 Item ID。
- 不自行建立 32003 → 11817 remap。
- 不用其他版本／port 補 template。
- Starter Item runtime 維持 fail-closed。

## Regression / CI

`.github/workflows/check-endpoint-item-seed-audit.yml` 現在會在以下資料改動時重跑：

- endpoint `setup.cf`
- endpoint `itemset6.csv`
- endpoint `gmsvjt`
- committed generated audit
- audit script / 本文件

並檢查 deployed binary 的 Item loader symbols。
