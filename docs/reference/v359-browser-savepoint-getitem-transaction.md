# V3.59 Browser SavePoint GetItem transaction closure

更新日期：2026-09-30

V3.59 把 pinned fixed-C SavePoint 的 GetItem path 從 fail-closed 推進到 source-backed browser transaction。

## Fixed-C evidence

固定 source gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56 的 gmsv/src/npc/npc_savepoint.c 中，NPC_UsedCheck(flg=0) 先解析 GetItem；逗號是候選 branch，& 讓同一 branch 內的條件全部成立；每個 token 是 itemNo 或 itemNo*count。

NPC_SavePointItemCheck() 從 CHAR_STARTITEMARRAY 到 CHAR_MAXITEMHAVE-1 掃玩家 item slots，按 ITEM_ID 計數。NPC_SavePointWindowTalked() 在 YES 後再次執行 NPC_UsedCheck(flg=1)，NPC_SavePointItemDelete() 最終對符合的 inventory slot 執行 CHAR_DelItem()。

因此 Browser runtime 把 count 定義為需要多少個符合 ITEM_ID 的 inventory objects，而不是 stack/pile 數量。canonical player inventory 的 source item range 為 9–23；一個 pile:5 的 item object 仍只算一個 source requirement object。

## Runtime

NPC_SAVEPOINT_SET：未解鎖 elder 時先選第一個成立的 OR branch；條件成立只進確認，不修改 inventory；條件不成立 fail-closed。

NPC_SAVEPOINT_CONFIRM：重新檢查 requirement，只刪除選定 branch 的指定 item objects；刪除後同步清除 canonical playerItemSlots reference 與 inventory.piles mirror；最後才在同一次 state transaction 寫入 save point。

已解鎖 elder 再訪仍直接設定 current savepoint，不再要求 GetItem。

## Source catalog

tools/generate_savepoint_source_catalog.mjs 現在把 GetItem 解析成 itemRequirements = OR branches × AND item requirements，每個 requirement 為 { itemId, count }。

空 GetItem、非法 token、同一 AND branch 重複 item ID 都 fail-closed。固定 source 的 SavePoint mode 數維持 28 instances、27 item-required、1 confirm-only、0 no-item。

## Scope

本輪沒有改 CHAR_SAVEPOINT 高 ID 的 32-bit shift 宣稱，也沒有立即 teleport；GMQUE、changeevent、Starter Item 24114、4000→200、3000→200 單點 non-walkable landing 政策均不變。

另外，fixed-C `genout/sp_200_449_982` 的 `GetItem` 有一個原始資料 token `1991*&1992*1`。依 C parser，`atoi("")` 會得到 0，因此該 AND branch 的 requirement count 為 0，`NPC_SavePointItemCheck(...,0)` 不會成立；V3.59 catalog 將此 branch 記為 `zero-count-branch-impossible` 並跳過，保留其他可成立 OR branches，不自行把 `*` 改成 `*1`。
