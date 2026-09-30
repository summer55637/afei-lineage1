# V3.58 Browser SavePoint service runtime

更新日期：2026-09-30

V3.58 將 pinned fixed-C `SavePoint` 從 service routing 推進到 source-backed headless state mutation。

## Source evidence

固定 source `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56` 的 `gmsv/src/npc/npc_savepoint.c` 定義 `NPC_SavePointInit / NPC_SavePointTalked / NPC_SavePointWindowTalked`。

`NPC_SavePointTalked()` 使用 `NPC_Util_charIsInFrontOfChar(..., RANGE)`，而 `RANGE` 為 2；同 cell 有 source code 的特殊例外。`ID` 會成為 `CHAR_SAVEPOINT` bit，`CHAR_LASTTALKELDER` 會被設定為該 elder ID。

`NPC_SavePointInit()` 從 NPC arg 讀 `ID` 與 `Born`，並以 `CHAR_ElderSetPosition()` 設定該 elder 的實際出生／復活座標。因此 Browser runtime 不把 NPC 自身座標當成 save point。

## Runtime contract

`NPC_SAVEPOINT_SET` / `NPC_SAVEPOINT_CONFIRM` 必須先通過 audited `SavePoint` functionSet、固定 source、精確 source binding 與距離 2 facing gate。

目前 source catalog 的 28 筆 SavePoint 中，27 筆含 `GetItem`，1 筆（ID 33）沒有 `GetItem`，但依 fixed-C `NPC_SavePointTalked()` 會進入確認視窗；沒有任何正式 SavePoint 使用 `NOITEM` shortcut。Browser runtime 目前先完整支援這個 confirmation-only path，並以 normalized `unlockedElderIds` 保存 elder ID；對 `ID > 30` 不宣稱 fixed-C `CHAR_SAVEPOINT` 32-bit shift parity。

`GetItem` 型 SavePoint 暫不執行；若已在 browser state 中解鎖同一 elder，重訪可直接設定為目前 save point，符合 fixed-C 已設 flag 後不再要求道具的分支。因 fixed-C 會按 OR-of-AND item requirement 檢查並在確認後刪除 inventory item，現有 Persistent Item representation 還不足以在不猜 stack/delete semantics 的情況下宣稱 parity，所以維持 fail-closed。

## World binding

SavePoint 使用獨立 source catalog，key 為 `NPC create path#blockIndex`；catalog 必須和 fixed source repository/ref 完全一致。

## Boundaries

本輪沒有改動 Player world.position；save point 是之後死亡／回村使用的持久化目標，不是立即傳送。

本輪沒有建立 playable HTML，也沒有改動 changeevent、Starter Item 24114、4000→200、3000→200 non-walkable landing 或 GMQUE 永久停用政策。
