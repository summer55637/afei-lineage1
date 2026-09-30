# V3.78 Browser World First-Route Planning

更新日期：2026-10-01

## Scope

V3.78 把前面已完成的三個 primitive 串成一個唯讀 headless route planner：

`direct hometown landing → WORLD_MOVE_STEP* → WORLD_WARPPOINT_EXECUTE → WORLD_MOVE_STEP* → unconditional encounter boundary`

它不是第二套移動引擎，也不會代替 V3.76 的 movement runtime 或 V3.77 的 WarpPoint runtime。planner 只產生可以餵給既有 controller 的 action sequence。

## Fixed-C boundary

V3.76 的 `WORLD_MOVE_STEP` 已依 fixed-C `MAP_walkAbleFromPoint` / `CHAR_walk` 的 walkability semantics 做單格驗證；V3.77 的 `WORLD_WARPPOINT_EXECUTE` 已依 exact `mapwarp.txt` from cell 執行跨 floor transition。

Encounter 邊界則取自：

- `gmsv/src/char/encount.c::ENCOUNT_initEncount`
- `ENCOUNT_getEncountAreaArray()`
- `gmsv/src/util.c::CoordinateInRect()`

fixed-C 的 rectangle comparison 是 inclusive，因此 planner 只把最後位置放在該 unconditional row 的矩形內，就宣告「已抵達 encounter boundary」。

這一階段不擲 encounter probability RNG。固定 C 真正的 encounter probability state 是在走路／角色檢查流程中另外處理，因此 planner 不把「進入矩形」偷換成「已經開戰」。

## Path policy

planner 使用 source-backed `sourceMapWalkableAt()` 做四方向 BFS，避免把新的最短路徑演算法冒充成 fixed-C 原始輸入序列。

因此輸出的 path 是：

`source walkability proof + browser navigation choice`

而不是：

`original game client exact joystick / click history`

## First-route coverage

現有 first-idle-route catalog：

- 6 個 eligible variants。
- 1000→100：2 組。
- 2000→100：2 組。
- 3000→200：2 組；`3000_to_200_b` 排除不可走 destination landing `(587,318)`。
- 4000→200：兩組仍 source-blocked，因 hometown direct landing component 與 portal origin component disconnected。

V3.78 不建立 synthetic bridge、manual warp 或跨版本地圖替代資料。

## Controller

新增：

`WORLD_FIRST_ROUTE_PLAN`

controller 接收 route catalog、WarpPoint catalog、encounter target index 後，回傳唯讀 plan，不改 revision，也不寫 Save Envelope。

plan 內容包括：

- route / portal identity
- selected source line
- to-portal path
- cross-floor WarpPoint action
- destination-to-encounter path
- unconditional encounter metadata
- final encounter-boundary status
- 完整 action sequence

## Route length cross-check

first-idle-route catalog 的 `originPathMin`、`landingPathMin` 與 `totalWalkBeforeEncounterMin` 是已閉合資料中的全域最小值，不要求每一個合法 direct landing 都得到完全相同的步數。V3.78 對目前玩家實際位置計算 route，並只拒絕「比 catalog minimum 更短」的結果；因此不同 direct landing 出現多幾步是正常的。

## Regression

`tools/check_v378_browser_world_first_route.mjs` 鎖定：

- fixed-C `CoordinateInRect` inclusive semantics
- 1000→100 `1000_to_100_a` path closure
- catalog minimum 120 + 71 = 191 walk steps
- 一次 WarpPoint action
- action revision ordering 可接既有 commitSave
- planner 純唯讀、revision 不變
- 4000→200 仍 fail-closed
