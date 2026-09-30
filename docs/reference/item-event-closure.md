# Item / Quest Event Closure

更新日期：2026-09-30

## 固定來源與 loader

本輪以 fixed source `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56` 為唯一 source parity 基準。

`gmsv/src/item/item.c` 在 `_ITEMSET2_ITEM` 下使用第 17 欄作為 `ITEM_ID`。`ITEM_makeItemAndRegist()` 會先透過 `ITEM_CHECKITEMTABLE()` 驗證這個 ID，再建立實體道具。

因此 NPC event 中直接出現的 `AddItem`、`DelItem`、`GetItem`、`GetRandItem`、`ITEM` 條件，若 ID 不在 active `itemset6.txt` table 中，屬於真正的 source closure gap，而不是單純名稱或圖片缺失。

## 最新 closure 統計

- itemset6 rows：10,737
- 有效 item rows：10,737
- duplicate item IDs：0
- item ID 範圍：0–23,009
- NPC item references：17,010
- unique item IDs referenced：2,301
- resolved unique item IDs：2,065
- unresolved unique item IDs：236
- resolved reference occurrences：16,259
- unresolved reference occurrences：751

角色拆分：

| 角色 | occurrences | unique IDs |
|---|---:|---:|
| AddItem | 361 | 335 |
| DelItem | 3,543 | 1,114 |
| GetItem | 1,670 | 734 |
| GetRandItem | 2,505 | 923 |
| ITEM condition | 8,895 | 1,227 |
| EntryItem | 34 | 5 |
| CheckItem | 2 | 2 |

其中 unresolved：

- requirement / consume：1,220 occurrences、103 unique IDs
- reward / grant：476 occurrences、163 unique IDs

## 事件旗標

NPC data 中掃到 7,728 次 event-reference occurrence，共 158 個 unique event IDs。

- mission.txt 可直接對上的：4 個
- jobdaily rule 可直接對上的：116 個
- 仍未從這兩張表關閉：42 個

未關閉 event ID 目前包括 10、11、12、19、25、26、36、42、48、49、50、51、62、98、105、107、120、135、146、147、151、152、153、154、161、162、163、165、166、179、199、200、203、210、224、225、226、231、363、364、365、366。

這 42 個不能直接視為不存在；它們可能屬於 NPC EventEnd、NPC-specific story flag、舊活動或其他條件資料。下一輪會從 `EventNo` / `EventEnd` / `NPC_EventSetFlg` / `NPC_EventCheckFlg` 反向找 owner。

## 目前判定

最重要的是：不要把 236 個 unresolved item IDs 補成虛構道具，也不要把 42 個 unresolved event IDs 當成不存在。

目前所有 gap 都維持 `unresolved / non-promoted`。

## 下一步

1. item gap cluster：依 NPC path / event owner 分群，優先找出新手、城鎮、主要任務的缺口。
2. event owner closure：為 42 個 event IDs 找出真正的 owner / script / completion path。
3. item reward closure：把 `AddItem` / `GetRandItem` 接到具體 NPC event 流程。
4. 再進入 persistent state schema 與 idle loop contract。

仍不建立 playable HTML。

## Event owner closure (2026-09-30)

另建立 `stoneage_event_owner_index.json` 專門反查事件 owner。NPC Event / owner scan 得到 160 個 unique event IDs 與 10,552 次引用；mission 對上 4 個、jobdaily 對上 117 個。其餘 43 個目前未由這兩張表直接關閉，其中 48、49、50、51 可對到 fixed C startup defaults，1 個可對到 `encount.txt` 的 event 欄位，剩餘 38 個維持 ownerless / non-promoted。
