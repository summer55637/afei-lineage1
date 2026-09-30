# V3.72 4000→200 fixed-C transition audit

更新日期：2026-10-01

V3.72 不是嘗試解除 4000→200 blocker，而是把「是否存在其它 fixed-source transition」再做一層機器化盤點。

## Source checks

1. `gmsv/data/map/mapwarp.txt`：直接 `from.floor=4000 → to.floor=200` 的 row 必須為 0。
2. `gmsv/data/npc/**/*.create`：`floorid=4000` 且 `enemy=npcgen_warp|200|...` 的 rows 必須為 4，對應兩組雙格 warp。
3. `gmsv/src`：掃描同時出現 4000 / 200 且上下文帶有 warp / floor / transfer 語義的 source candidates，以及 literal `200` warp call lines；這一層只做 corroboration，不把文字搜尋當成完整程式語義證明。

## Result

固定 source 仍可看到兩組 4000→200 NPC warp：

- `(104,55) → floor 200 (304,599)`
- `(104,56) → floor 200 (304,600)`
- `(101,96) → floor 200 (301,640)`
- `(101,97) → floor 200 (301,641)`

沒有 `mapwarp.txt` 的 direct 4000→200 row。

因此 V3.72 不新增替代 transition；V3.62 的 movement-parity blocker 繼續維持。只有取得新的 pinned source transition evidence，才可以重新開啟 route promotion。

## Policy

不新增 synthetic warp、不放寬 movement、不手動 teleport、不以其它版本資料替換 pinned source。
