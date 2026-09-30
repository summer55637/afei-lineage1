# V3.62 4000→200 source movement parity audit

更新日期：2026-09-30

## Fixed-C movement contract

固定 source 1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56 的 gmsv/src/map/map_deal.c 定義 MAP_walkAbleFromPoint()：非飛行狀態先看 object 的 MAP_WALKABLE；object=0 直接不可走，object=1 時 tile 也必須 MAP_WALKABLE，object=2 直接可走。

同一固定 source 的 gmsv/src/char/char_walk.c 在 CHAR_walk() 的 diagonal branch 會先檢查 destination cell，再檢查起點沿 X 方向與 Y 方向的兩個 orthogonal side cells。任一 side cell 不可走，整個 diagonal move 被拒絕。

## 4000 exhaustive result

V3.62 regression 使用 data/generated/stoneage_map_4000.json + stoneage_mapset_runtime.json 做實際 walkable connected-component 分析，並枚舉所有跨 component 的 diagonal neighbor pairs。只有在 destination、X-side、Y-side 三者都 walkable 時，該 diagonal 才可模擬 fixed-C legal move。

現有 source audit 的 direct landing `(80,90)/(80,91)` 位於 component 48；四個 4000→200 portal origins 位於 component 0。V3.62 exhaustive check 找不到任何可合法跨越這兩個 component 的 diagonal bridge，因此 4-neighbor component blocker 結論與 fixed-C movement semantics 一致。

最近邊界仍是 `(90,109) -> (94,109)`，中間 `(91,109)`, `(92,109)`, `(93,109)` 三格 tile 不可走；portal object 不是主因。

## Policy

- 不放寬 diagonal movement。
- 不以 8-neighbor BFS 取代 fixed-C legal movement。
- 不新增人工橋接格。
- 不手動 teleport 玩家到 portal origin。
- 若未來找到新的 fixed-source transition evidence，才重新開啟 4000→200 closure。

目前因此將 4000→200 標記為 source-movement-parity verified exception，而不是待修的 browser pathfinding bug。
