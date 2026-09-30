# V3.79 Browser World First-Route Execution

更新日期：2026-10-01

## Scope

V3.79 把 V3.78 的唯讀 route plan 真正交給 canonical Browser State Controller 執行：

`WORLD_FIRST_ROUTE_EXECUTE → WORLD_MOVE_STEP* → WORLD_WARPPOINT_EXECUTE → WORLD_MOVE_STEP* → encounter boundary`

這不是新的 movement engine、WarpPoint engine 或 battle engine。V3.79 只是 orchestration layer，逐個呼叫 V3.76 與 V3.77 已存在的 runtime primitive。

## Persistence

每一個 `WORLD_MOVE_STEP` 與 `WORLD_WARPPOINT_EXECUTE` 都使用原本的 `commitSave` / Save Envelope contract，因此 revision 會在 action 執行時逐步增加。

planner 產生的 `expectedRevision` 採「執行當下的 current revision」語義：第一個 action 使用初始 revision，之後每成功一個 action 才進入下一個 revision。

V3.79 不做跨多步驟的 rollback transaction。若中途某一步失敗，之前已成功保存的移動仍然保留；runtime 回傳失敗步驟與當前 state，讓上層可以安全停止或重新規劃。

## Encounter boundary

執行完成的條件仍然只是 V3.78 的 unconditional encounter boundary：

- 最終 floor/x/y 必須與 plan 的最後位置一致。
- 該位置必須位於 selected unconditional encounter row 的 `[x1,y1,x2,y2]` rectangle。
- 不消耗 encounter RNG。
- 不啟動 battle。

因此 V3.79 已經可以做到「出生 → 實際逐格行走 → fixed-C mapwarp 傳送 → 實際逐格行走 → encounter 區域」，但還沒有把真正的 encounter probability / battle start 接上。

## 4000 blocker

4000→200 仍然維持 source-blocked。V3.79 不允許因為有 WarpPoint row 就直接把角色傳到 200 floor，必須先通過 V3.78 route planner 的 source-backed route eligibility。

## Regression

`tools/check_v379_browser_world_first_route_execution.mjs` 會實際執行 1000→100_a，驗證：

- 所有 movement actions 與 WarpPoint action 按 revision 順序成功。
- 總 action 數與 plan 一致。
- final position = `(100,610,538)`。
- final revision = executed action count。
- encounter boundary closed。
- RNG / battle 都保持 false。
- 4000→200 仍 fail-closed。
