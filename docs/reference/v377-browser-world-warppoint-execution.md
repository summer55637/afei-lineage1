# V3.77 Browser World WarpPoint Execution

更新日期：2026-10-01

## Scope

V3.77 把 fixed-C 的 first-route `mapwarp.txt` 座標型傳送點接入 canonical Browser State Controller，新增 `WORLD_WARPPOINT_EXECUTE`。

這裡和 V3.75 的 `NPC_WARP_EXECUTE` 是兩件不同的事：

- `NPC_WARP_EXECUTE)：NPC `npcgen_warp` / `Warp` source module。
- `WORLD_WARPPOINT_EXECUTE)：map warp point / `MAPPOINT_MapWarpHandle()`。

V3.77 只接受目前已經生成、且 fixed-source pin 完全一致的 first-route mapwarp catalog。它要求玩家現在的 canonical `world.position` 恰好位於 source from cell，然後驗證 destination map 的座標存在，再透過既有 Save Envelope 寫入新的 floor/x/y。

## Fixed-C evidence

固定 source：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/map/map_warppoint.c`
- `gmsv/src/char/event.c`
- `gmsv/data/map/mapwarp.txt`

`MAPPOINT_getMapWarpGoal()` 要求傳入的 floor/x/y 與 source from point 完全一致，並呼叫 `MAP_IsValidCoordinate()` 驗證 destination；成功後 `MAPPOINT_MapWarpHandle()` 呼叫 `CHAR_warpToSpecificPoint()`。

`EVENT_main()` 遇到 `OBJTYPE_WARPPOINT` 且 event type 符合時，會呼叫 `MAPPOINT_MapWarpHandle()`。因此 browser runtime 不把這條線當成 NPC interaction，也不重複實作 NPC `Warp`。

## Browser chain

`WORLD_WARPPOINT_EXECUTE → exact source-cell binding → destination map coordinate validation → commitSave → Save Envelope verification`

## Route boundary

目前 first-route catalog 有 8 個 portal groups，共 31 個 source warp rows。V3.77 把它們全部保留在 source catalog，但「能不能從玩家目前路線走到這個 source point」仍由 V3.76 movement / first-route reachability closure 負責。

所以：

- 1000→100：兩組 source portal 都可從 direct landing 走到。
- 2000→100：兩組都可走到。
- 3000→200：兩組都至少有可達 source origin；第二組 destination landing 的 `(587,318)` 仍是不可走例外。
- 4000→200：source warp rows 存在，但從 hometown direct landing 到 portal origin 仍 disconnected；V3.77 不繞過這個 blocker。

## Product boundary

V3.77 不建立自動導航、不選「最佳」portal、不修改 encounter probability，也不自動啟動戰鬥。它只提供一個 source-backed cross-floor transition primitive，交由後續 route orchestrator 決定何時使用。

## Regression

`tools/check_v317_browser_world_warppoint.mjs`：

- fixed-C source function evidence
- 8 portal groups / exact row count
- 1000→100 真实 warp
- wrong source position rejection
- revision guard
- destination map validation
- 3000→200 blocked landing 保持 source behavior
- 4000→200 source binding 仍存在，但 route reachability 不由 runtime 偽造
