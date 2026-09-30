# Event Owner Closure

更新日期：2026-09-30

## 固定來源

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

本索引掃描全部 NPC data 的 `ENDEV` / `NOWEV` / `Event_End` / `Event_Now` / `EvEnd` / `EvNow` / `EventNo`，再與 `mission.txt`、`jobdaily.txt` 及 fixed C startup defaults 交叉比對；另外納入 `encount.txt` 的 `event_now` / `event_end`。

## 結果

- NPC files：3,960
- unique event IDs：160
- event-reference occurrences：10,552
- mission matched IDs：4
- jobdaily matched IDs：117
- mission/jobdaily 之外仍未關閉：43
- 其中 startup default 可辨識：4 個（48、49、50、51）
- 其中 encounter-owned：1 個
- 真正目前無 owner：38 個

注意：這份 owner scan 與 Item / Quest Event Closure 的 regex 範圍不同，因此 unique event count 不能直接與後者的 158 做數學相減；兩份索引用途不同。

## 目前 ownerless event IDs

10、11、12、19、25、26、36、42、62、98、105、107、120、135、146、147、151、152、153、154、161、162、163、165、166、179、199、200、203、210、224、225、226、231、363、364、365、366。

這些不能直接視為不存在。它們可能是 NPC-specific story flags、舊版事件、其他 source module 狀態或未被現行 mission/jobdaily 表保存的事件。

## 已確認的 startup defaults

fixed C 的 `char.c` 在 `_75_TEST` 區塊存在 `event_end` / `event_now` 陣列；48、49、50、51 出現在 startup end-event defaults，因此不應誤判成沒有任何 source owner。

## 已確認的 encounter owner

`encount.c` 明確把 `encount.txt` 第 31 欄解析為 `event_now`、第 32 欄解析為 `event_end`。目前 43 個 mission/jobdaily-unresolved ID 中有 1 個能透過這條資料層建立 owner 關係。

## 下一步

優先針對 38 個 ownerless IDs 反查：

1. NPC-specific arg / EventEnd blocks
2. encounter conditions
3. `char.c` / `chatmagic.c` 等狀態寫入點
4. event reward / item dependency

未形成 concrete owner 前，不建立虛假的 quest state 或 event runtime。