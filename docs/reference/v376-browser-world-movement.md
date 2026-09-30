# V3.76 Browser World Movement Step

更新日期：2026-10-01

## Scope

V3.76 把已完成 source closure 的 fixed-C 走格規則接進唯一 Browser State Controller。

本輪只做「逐格移動」：一次 action 只允許同一 floor 內移動一格，目的格必須通過 source-backed walkability；斜向移動另外要求起點沿 X / Y 的兩個 orthogonal side cells 同時可走。

它不是 pathfinding engine，也不自行產生 route、encounter、battle、reward 或 NPC interaction。

## Fixed-C parity

固定 source：

- repository：`gavinlinasd/StoneAge`
- ref：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/map/map_deal.c`：`MAP_walkAbleFromPoint()`
- `gmsv/src/char/char_walk.c`：`CHAR_walk()`

V3.62 已證明 4000→200 目前沒有合法的 fixed-C diagonal bridge 可以跨越 disconnected components，因此 V3.76 不繞過該 blocker。

## Browser chain

`WORLD_MOVE_STEP → map runtime → sourceMapWalkableAt → diagonal side-cell gate → commitSave → Save Envelope verification`

Canonical Persistent State 只改：

- `world.position.floorId`
- `world.position.x`
- `world.position.y`
- `revision`
- `runtimeMeta.updatedAt / lastSavedAt`

## Guard rails

會直接 fail-closed：

- 無法載入對應 map / mapset
- player 與 canonical world.position 不一致
- 非 [-1, 0, 1] 的 dx / dy
- 同時 dx=0、dy=0
- 目的格不可走
- 斜向任一 side cell 不可走
- 嘗試跨 floor
- expectedRevision 不一致
- Save Envelope 驗證失敗

## Interaction with V3.75

V3.75 的 Warp 仍是唯一 source-backed 跨 floor position transition。

因此：

- hometown → start-floor Warp：使用 `NPC_WARP_EXECUTE`
- 同 floor 逐格走：使用 `WORLD_MOVE_STEP`
- 4000→200：仍不得人工 teleport / synthetic bridge
- 3000→200 的 `(587,318)` landing：仍 unavailable

## Regression

`tools/check_v376_browser_world_movement.mjs`：

- 直接讀 pinned source path 並檢查 walkability / diagonal gate evidence
- 使用正式 `stoneage_map_1000.json` + `stoneage_mapset_runtime.json`
- 驗證 V3.75 warp landing `1000:98,44` 至少存在 source-legal adjacent move
- 驗證 blocked destination 會 fail-closed
- 驗證 diagonal side-cell gate
- 驗證 revision guard、Save Envelope round-trip 與 no-floor-change
