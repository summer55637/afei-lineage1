# Endpoint World Blocker Audit

更新日期：2026-10-02

## 目前結論

| Blocker | Endpoint 結果 |
|---|---|
| 4000 → 200 | **仍阻塞**：4000 的出生入口與 200 入口 portal origins 位於不同 walkable connected components |
| 3000 → 200 / (587,318) | **已閉合（event warp）**：落點 `(587,318)` 雖不可走，但 `(588,318)` 的反向 Warp 可由相鄰格透過標準 event 流程觸發，無需踩上不可走格 |

## Endpoint Map Format

RO0000 的 world map 使用 `LS&MAP`，不是 fixed-C 使用的 `LS2MAP`。

- 4000：`ro0000/server/merged-source/gmsv/data/map/jyaruga/karutana/karutana`
- 3000：`ro0000/server/merged-source/gmsv/data/map/jyaruga/jaja/jaja`
- 200：`ro0000/server/merged-source/gmsv/data/map/jyaruga/jalga`
- 4006：`ro0000/server/merged-source/gmsv/data/map/jyaruga/karutana/4006`

Endpoint `LS&MAP` header 的 show-name 欄位為 48 bytes；fixed-C `LS2MAP` 為 32 bytes。

## 4000 → 200

Endpoint `mapwarp.txt` 有四個 4000 → 200 source rows：

- `(104,55)` → `(200,304,599)`
- `(104,56)` → `(200,304,600)`
- `(101,96)` → `(200,301,640)`
- `(101,97)` → `(200,301,641)`

4000 endpoint map：150×150、65 個 walkable connected components。

- 4006 → 4000 landing `(80,90)`、`(80,91)`：component 48。
- 四個 4000 → 200 portal origins：component 0。
- endpoint movement BFS 無法從 component 48 到 component 0。

所以這不是固定-C 才有的 mismatch；RO0000 endpoint 本身也重現同一個 world connectivity blocker。

目前不做 synthetic teleport、component merge 或私自 remap。

## 3000 → 200 / (587,318)

Endpoint 有精確 warp row：

`(3000,73,59) → (200,587,318)`

200 地圖中：

- `(587,318)` 本身不可走。
- 但 fixed-C 的 warp handler 只要求目標座標有效，不要求目標格可走，因此不能單憑這一點判定 warp 無效。
- 從 `(587,318)` 出發，合法第一步可到 `(586,318)`、`(587,317)`、`(586,317)`。
- 這三格都在 endpoint component 1。
- component 1 與主 component 0 分離。
- component 1 相關唯一 outgoing warp origin 為 `(200,588,318)` → `(3000,74,59)`，但 `(588,318)` 本身也是不可走。

但固定 C 的 `lssproto_EV_recv()` 會接受 3×3 範圍內的 Warp 目標座標；`EVENT_main()` 會對相鄰的 `CHAR_EVENT_WARP` NPC 執行標準 Warp。endpoint `200warp.create` 又明確存在 `(200,588,318) → (3000,74,59)` 的反向 Warp，因此玩家落在 `(587,318)` 後，可以在不踩上 `(588,318)` 的情況下直接用 event 觸發回傳。

因此這個「不可走落點」不再構成 blocker；目前不改 `(587,318)`，也不把 component 1 強行併入 component 0。

## Evidence

`data/generated/stoneage_endpoint_world_blocker_audit.json`

`tools/audit_endpoint_world_blockers.mjs`

這份 audit 由 GitHub Actions 隨 RO0000 / map / mapset 變更自動重算。
