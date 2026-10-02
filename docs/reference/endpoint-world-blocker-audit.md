# Endpoint World Blocker Audit

更新日期：2026-10-02

## 目前結論

| Blocker | Endpoint 結果 |
|---|---|
| 4000 → 200 | **仍阻塞**：4000 的出生入口與 200 入口 portal origins 位於不同 walkable connected components |
| 3000 → 200 / (587,318) | **仍阻塞**：可由 `(587,318)` 走進 component 1，但無法進入主 component 0，也沒有可用的 component-1 outgoing warp |

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

因此目前沒有證據證明玩家能從這個 landing island 回到主地圖或觸發該 outgoing warp。

目前不把 `(587,318)` 改成 `(587,317)`，也不把 component 1 強行併入 component 0。

## Evidence

`data/generated/stoneage_endpoint_world_blocker_audit.json`

`tools/audit_endpoint_world_blockers.mjs`

這份 audit 由 GitHub Actions 隨 RO0000 / map / mapset 變更自動重算。
