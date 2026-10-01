# Endpoint MapWarp Audit

更新日期：2026-10-01

## 目的

把最完整的 VM 一鍵端 `gmsv/data/map/mapwarp.txt` 納入 World reconstruction evidence，同時保留 pinned fixed-C 版本作為語義校驗基準。

## 目前結果

- Endpoint mapwarp：4,734 rows
- Pinned fixed-C mapwarp：5,457 rows
- Exact identical rows：4,425
- Endpoint-only rows：309
- Fixed-C-only rows：1,032

### First-route 關鍵 Warp

- `1006 ↔ 1000`：endpoint 2 / fixed-C 2
- `2006 ↔ 2000`：endpoint 2 / fixed-C 2
- `3006 ↔ 3000`：endpoint 2 / fixed-C 2
- `4006 ↔ 4000`：endpoint 2 / fixed-C 2
- `4000 ↔ 200`：endpoint 4 / fixed-C 4
- `3000 ↔ 200`：endpoint 10 / fixed-C 10

因此目前 first-route 直接 Warp rows 並不是 endpoint 與 fixed-C 的主要差異點。既有 4000→200 disconnected/reachability 與 3000→200 landing (587,318) 的 blocker 仍需以實際 movement／landing evidence 判定；不能因 mapwarp row 存在就宣告玩家一定走得到。

另外 `2006 → 1998` 在 pinned fixed-C 有 1 row，但 endpoint 沒有；這是 endpoint variant evidence，不是自動修正 endpoint 的理由。

## 使用規則

Endpoint-only / fixed-C-only 都保留為 variant evidence。

本 audit 不新增 synthetic Warp、不修改 endpoint 座標，也不把 fixed-C world graph 直接冒充 endpoint world graph。

正式 Runtime 使用前仍需：provenance → exact row identity → walkability / reachability → fixed-C semantic check → regression。
