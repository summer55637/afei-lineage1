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

fixed source tree 裡另有：

"gmsv/data/map/jyaruga/jalga"

size = 3,840,044 bytes，blob SHA = "dcbb20f0212192fc852e1489a29a0d6d8d4c95ce"。

公開的石器地圖編號資料也把 floor 200（加魯卡）對應到 "./data/map/jyaruga/jalga"。citeturn592731search0turn735247search1

但這裡仍不把它直接升格成 verified runtime：本次工具鏈能拿到 fixed-source path / blob SHA，卻不能在目前 connector 上直接解碼這個 binary map header。因此 "jalga" 目前標記為 **source-path identified / runtime-unverified**。

## 下一步

1. 把 "jalga" binary 轉成 verified map runtime，並確認其 LS2MAP header、dimensions、tile/object walkability。
2. 在 "4000" 上做 connected-component / blocked-cell 分析，確認兩組 portal 為何與 direct landing component 不連通；不用人工 warp 修正。
3. "1000 / 2000 / 3000" 已有 world-exit coordinate evidence，可接著做 ordinary encounter region 的座標級閉合。
4. 若 fixed source 最終證明 "4000" 確實沒有可達出口，就把它記成 source-proven route exception，而不是自行修改世界規則。

對應 generated result："data/generated/stoneage_start_world_exit_reachability.json"；重跑工具："tools/audit_start_world_exit_reachability.mjs"。

## 4000 component audit

進一步以 4-neighbor connected component 分析 fixed 4000 runtime：出生落點 (80,90) / (80,91) 位於 component 48，大小 457；四個 4000→200 portal origins 全部位於 component 0，大小 12,513。兩個 component 最近的 Manhattan 距離為 4，最近點為 (90,109) → (94,109)，中間是三格連續的不可走 tile：(91,109) tile 409、(92,109) tile 196、(93,109) tile 307。三格的 object 都不是造成 blocker 的主因；真正的阻隔來自 tile image walkability。

這讓目前的 blocker 更具體：不是 pathfinder 找不到路，而是 fixed-C runtime 的可走空間本身把「村內 landing 區」與「200 號 world portal 區」分成兩個 disconnected component。對應細節保存在 data/generated/stoneage_4000_exit_component_audit.json。
