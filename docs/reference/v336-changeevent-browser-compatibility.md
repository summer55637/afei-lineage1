# V3.36 ChangeEvent Browser Compatibility Execution

更新日期：2026-09-30

V3.36 把 V3.35 的 external compatibility alias 放進實際 NPC dispatch regression。

## 1006 new-player NPC

使用既有 start-floor reachability 的 map 1006 新手接待員座標 `15,22`。

玩家位於 `15,21`，facing cell 為 `15,22`，interaction rule 使用 distance=1 + front/facing。

Strict registry：`changeevent` 仍停在 module-resolution，沒有 mutation。

Compatibility registry：`changeevent → ExChangeMan`，而 ExChangeMan module 由 explicit handler factory 提供同一份 source-closed `xinshoujd.arg` script。

執行結果：4 個 Item、1 個 Pet、EndSetFlg 366、Save Envelope revision 1；Charm 因 `EventNo=-1` 維持 no-op。

## Important boundary

這條路徑是 legacy compatibility mode，不是宣稱 pinned `npctemplate.c/functionSet[]` 突然出現了 `changeevent`。

因此 browser runtime 可以提供一個明確開關：

`strict` → source discrepancy visible / no mutation
`compatibility` → external-corrobated alias allowed / normal reward runtime

下一步：把這個 mode 做成 browser UI 的 runtime configuration，並把 1006 新手接待員的 interaction request 接到現有遊戲 state controller。
