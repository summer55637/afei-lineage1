# V3.14 fixed-C map header catalog

V3.14 不再手動挑選下一批地圖，而是建立可重跑的固定 C `gmsv/data/map` header scanner。

工具：`tools/check_v314_stoneage_map_headers.mjs`。

它遞迴掃描 fixed C `gmsv/data/map`，只把前 6 bytes 為 `LS2MAP` 的檔案視為地圖，並依 `MAP_readMapOne()` 讀取：

- floor ID：offset 6，big-endian u16。
- show string：offset 8，32 bytes。
- width：offset 40，big-endian u16。
- height：offset 42，big-endian u16。
- expected file size：`44 + width × height × 4`。

工具同時計算 Git blob SHA、記錄 trailing bytes，並把 floor ID／尺寸／檔案大小寫成 JSON artifact。

這一版不改遊戲 runtime，也不把全部 1284 張地圖一次塞進 Pages。它的用途是讓後續 V3.15+ 可以依固定 source catalog 自動選擇與產生 verified runtime，而不靠手抄路徑。