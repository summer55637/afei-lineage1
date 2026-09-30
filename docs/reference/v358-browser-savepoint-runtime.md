# V3.58 Browser SavePoint service runtime

更新日期：2026-09-30

V3.58 將 pinned fixed-C `SavePoint` 從 service routing 推進到 source-backed headless state mutation。

## Source evidence

固定 source `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56` 的 `gmsv/src/npc/npc_savepoint.c` 定義 `NPC_SavePointInit / NPC_SavePointTalked / NPC_SavePointWindowTalked`。

`NPC_SavePointTalked()` 使用 `NPC_Util_charIsInFrontOfChar(..., RANGE)`，而 `RANGE` 為 2；同 cell 有 source code 的特殊例外。`ID` 會成為 `CHAR_SAVEPOINT` bit，`CHAR_LASTTALKELDER` 會被設定為該 elder ID。

`NPC_SavePointInit()` 從 NPC arg 讀 `ID` 與 `Born`，並以 `CHAR_ElderSetPosition()` 設定該 elder 的實際出生／復活座標。因此 Browser runtime 不把 NPC 自身座標當成 save point。

## Runtime contract

`NPC_SAVEPOINT_SET` / `NPC_SAVEPOINT_CONFIRM` 必須先通過 audited `SavePoint` functionSet、固定 source、精確 source binding 與距離 2 facing gate。

目前已閉合的 execution mode 是 source arg 含 `NOITEM` 的 SavePoint：直接設定 `world.savePoint.elderId`、`unlockedMask` 與 `position`，並建立新的 Persistent State revision。

`GetItem` 型 SavePoint 暫不執行。因 fixed-C 會按 OR-of-AND item requirement 檢查並在確認後刪除 inventory item，現有 Persistent Item representation 還不足以在不猜 stack/delete semantics 的情況下宣稱 parity，所以維持 fail-closed。

## World binding

SavePoint 使用獨立 source catalog，key 為 `NPC create path#blockIndex`；catalog 必須和 fixed source repository/ref 完全一致。

## Boundaries

本輪沒有改動 Player world.position；save point 是之後死亡／回村使用的持久化目標，不是立即傳送。

本輪沒有建立 playable HTML，也沒有改動 changeevent、Starter Item 24114、4000→200、3000→200 non-walkable landing 或 GMQUE 永久停用政策。
