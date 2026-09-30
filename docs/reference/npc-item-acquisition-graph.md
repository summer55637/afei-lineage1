# NPC Item Acquisition Graph

更新日期：2026-09-30

這份 graph 把 NPC create、arg event block、item condition、item action、pet action、event state action 串成 source-backed graph。

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

## 統計

- NPC create instances：7,979
- instances with resolvable arg：3,610
- unresolved arg files：23
- event blocks：3,772
- item action edges：5,578
- item condition edges：5,421
- pet action edges：500
- event state action edges：218
- unresolved item action edges：300
- unresolved item condition edges：105
- real EventNo nodes：124
- `EventNo:-1` sentinel blocks：3,340

`EventNo:-1` 是常見 sentinel，不作為真正 event owner。

## 語義

`ITEM` 通常是條件；`DelItem` 是消耗；`AddItem` / `GetRandItem` 是發放；`GetPet` / `DelPet` 是寵物狀態；`EndSetFlg` / `EventEnd` 等是 event state 操作。

`GetItem` 在不同 NPC script 中存在語義差異，所以 graph 保留 literal role，不自行合併成 reward 或 consume。

## 下一步

把 graph 與 Start Flow Index、World Graph、NPC Service Index 接起來，先閉合四個 hometown 的第一條玩家路徑，再擴到主線任務與經濟。