# V3.15 source-map Encounter coordinate probe

V3.15 把已存在的 verified map runtime 真正接到目前 Encounter 的已產生 `(floor,x,y)`。

## Runtime chain

`spawnEnemy()` 已保存一般 Encounter 的 `roamX / roamY`；V3.15 不重新抽座標，也不修改遇敵 RNG。

世界 HUD 在有已發生的 Encounter 座標時非同步查詢：

`Floor + X/Y → LS2MAP tile/object → mapset attributes → MAP_WALKABLE / MAP_HAVEHEIGHT → battlemap candidates`。

顯示內容只反映 source probe 結果，例如 tile ID、object ID、walkability 與固定 C 三候選 battle map。

## Boundary

- probe 是 presentation/source verification，不改戰鬥結果。
- probe 不消耗 `Math.random`，不進行 `RAND(0,2)`；battle field 的實際選擇仍由外部 RNG injection API 保留。
- 未收錄的 Floor、超出 map bounds 或無法通過 mapset 驗證時，畫面維持 fail-closed。
- 不把 Encounter 的隨機點重新解釋成「玩家真實目前座標」；只使用已由 encounter runtime 產生並保存的 `roamX / roamY`。