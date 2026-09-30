# First-route world exit reachability

更新日期：2026-09-30

本文件把四個 hometown 的 direct destination → 下一個 world-floor warp 從 floor-level graph 進一步下降到座標級 walkability / path reachability。

固定 source：

- "gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56"
- portal source："data/generated/stoneage_start_destination_warp_coordinates.json"
- walkability contract："src/stoneage_map_runtime.mjs::sourceMapWalkableAt"

## 本輪結論

四個 direct destination 的 7 個 landing points 全部 walkable，這一點維持 closed。

真正重要的新結果是：floor-level world graph 的 edge 不一定等於「玩家從出生村剛傳進來的位置就能走到該出口」。

- "1000"：兩組 "1000→100" portal 都可由 direct landing 走到；最短路徑 120 與 104 步。
- "2000"：兩組 "2000→100" portal 都可由 direct landing 走到；最短路徑 33 與 82 步。
- "3000"：兩組 "3000→200" portal 均至少有一條可行路徑；第二組 6 個 source origins 有 5 個可達，第 6 個 "(73,59)" 因 object image 2 不可走而被排除。
- "4000"：兩組 "4000→200" portal 都是座標級 blocker。它們的 source origins 本身是 walkable cell，但從 hometown 3 的 direct landings "(80,90)" / "(80,91)" 都沒有 walkable path 可以到達。

因此目前不可以只因為 world graph 有 "4000→200" edge，就把這條路標成可玩的 first-route。

## floor 200 的更大問題

本輪同時確認 "data/generated/stoneage_map_200.json" 不是 3000/4000 → 200 這條 first-route 世界地圖的可用 runtime。

它來自：

"gmsv/data/map/extra/200"

尺寸只有 30×30；但 fixed-C "200warp.create" 的 world portals 已使用到至少 x=588、y=1008，因此 30×30 圖不可能容納這些傳送點。

fixed source tree 裡另有 gmsv/data/map/jyaruga/jalga，size = 3,840,044 bytes，blob SHA = dcbb20f0212192fc852e1489a29a0d6d8d4c95ce。GitHub Actions 已直接 checkout 這個 fixed-C binary，並由現有 generate_verified_map_runtime.mjs 通過 Git blob SHA、LS2MAP header 與 mapset/battlemap validation，因此 floor 200 現在已升格為 verified runtime：800×1200。公開地圖索引與 SourceForge 的固定資料樹也都把 jalga 對應到加魯卡 floor 200；這些外部來源只作 path/identity corroboration。citeturn679721search4turn679721search5

## 下一步

1. 把 "jalga" binary 轉成 verified map runtime，並確認其 LS2MAP header、dimensions、tile/object walkability。
2. 在 4000 上繼續做 connected-component / blocked-cell 與 source-transition 分析，確認兩組 portal 為何與 direct landing component 不連通；不用人工 warp 修正。
3. 1000 / 2000 / 3000 / 4000 的 encounter landing → unconditional rectangle 已完成 floor 100/200 path closure；接下來把這些 closure 接到 Idle Loop。
4. 若 fixed source 最終證明 4000 確實沒有可達 200 號 portal 出口，就把它記成 source-proven route exception，而不是自行修改世界規則。

對應 generated result："data/generated/stoneage_start_world_exit_reachability.json"；重跑工具："tools/audit_start_world_exit_reachability.mjs"。

## Floor 100 / 200 encounter path closure

新增 data/generated/stoneage_start_encounter_path_closure.json：

- floor 100：4 組 incoming portal groups 全部有 walkable landing，且全部 landing 均可走到 unconditional encounter rectangle。
- floor 200：4 組 incoming portal groups 全部至少有可用 landing 可走到 unconditional encounter rectangle；其中 4000→200 兩組 landing 直接落在 Encounter 95；3000→200 第二組有 5/6 landing 可走，(587,318) 不可走。
- 這裡的 route closure 是「landing → unconditional encounter region」closure，不會把 mixed 或 unresolved group 當成 unconditional。

## 4000 component audit

進一步以 4-neighbor connected component 分析 fixed 4000 runtime：出生落點 (80,90) / (80,91) 位於 component 48，大小 457；四個 4000→200 portal origins 全部位於 component 0，大小 12,513。兩個 component 最近的 Manhattan 距離為 4，最近點為 (90,109) → (94,109)，中間是三格連續的不可走 tile：(91,109) tile 409、(92,109) tile 196、(93,109) tile 307。三格的 object 都不是造成 blocker 的主因；真正的阻隔來自 tile image walkability。

這讓目前的 blocker 更具體：不是 pathfinder 找不到路，而是 fixed-C runtime 的可走空間本身把「村內 landing 區」與「200 號 world portal 區」分成兩個 disconnected component。對應細節保存在 data/generated/stoneage_4000_exit_component_audit.json。
