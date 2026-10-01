# Endpoint Item Seed Audit

更新日期：2026-10-01

## 目的

固定 pinned fixed-C 曾經得到 ITEM1=24114，並證明固定 build 的 itemset6.txt 有 id=11817 / imagenumber=24114。但現在既然 VM 一鍵端是實際可部署版本資料，必須先檢查它自己的 Item 設定。

本 audit 專門驗證：

`ro0000/server/merged-source/gmsv/setup.cf`
→ `ITEM1`
→ `itemset6file`
→ endpoint `gmsv/data/itemset6.csv`
→ 對應 Item row。

**重要：本 audit 不把 pinned fixed-C 的第 17 欄 Item ID 規則直接套到 endpoint。** endpoint 的欄位語義必須由 endpoint 自己的資料／程式證據閉合。

## 已知 endpoint 差異

目前 endpoint `setup.cf` 與 pinned fixed-C 的已知差異包含：

- endpoint `ITEM1=32003`
- endpoint `itemset6file=data/itemset6.csv`
- pinned fixed-C `ITEM1=24114`
- pinned fixed-C `itemset6file=data/itemset6.txt`

這代表 Starter Item 24114 現在不能繼續只以 fixed-C blocker 描述；它至少同時存在一個「endpoint deployment variant」待閉合。

## 目前實際結果

目前 Runner 直接讀取 endpoint 原始 CSV：

- `setup.cf`：`ITEM1=32003`
- `itemset6file`：`data/itemset6.csv`
- CSV：3,792,005 bytes；14,502 rows；主要資料列為 95 columns
- exact numeric token `32003`：0 次
- exact numeric token `24114`：1 次，line 6943 / token 18；相鄰 token 17 = `11817`、token 19 = `9900`、token 20 = `16`

因此目前 **endpoint seed = unresolved**：配置指定的 32003 在它所指定的 Item table 中沒有找到 exact token。

這不能直接證明遊戲部署一定無法建立新玩家，因為 endpoint 的 loader / transform semantics 尚未從實際 endpoint 程式層完整閉合；但也不能把 24114 或其他 Item 偷換成 32003。

## 判定規則

- 找到 `ITEM1=32003` 且 endpoint Item table 有一致 row evidence：建立 endpoint item evidence。
- 找不到：維持 endpoint seed unresolved，不猜測。
- 即使 endpoint CSV 存在某個看似相近的 Item，也必須先閉合 endpoint loader／row semantics 才能正式進 canonical Item runtime。
- audit 不輸出 setup.cf 的 password、server IP 或其他敏感設定。
