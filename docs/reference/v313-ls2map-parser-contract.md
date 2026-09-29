# V3.13 LS2MAP parser contract

這一版正式把 fixed C 的地圖 binary header 轉成可測試的 Web-side parser contract，但尚未把任意原始地圖檔直接發布到 Pages。

## Fixed C layout

`gavinlinasd/StoneAge@git fixed ref 1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56` 的 `gmsv/src/map/readmap.c` 明確定義 `MAP_MAGIC` 為 `LS2MAP`。

`MAP_readMapOne()` 的讀取順序：

1. 6 bytes magic：`LS2MAP`。
2. 1 個 network-order `short`：floor ID。
3. 32 bytes `showstring`。
4. 1 個 network-order `short`：`xsiz`。
5. 1 個 network-order `short`：`ysiz`。
6. `xsiz * ysiz` 個 network-order `short`：tile layer。
7. `xsiz * ysiz` 個 network-order `short`：object layer。

原 C 會將 tile/object 每格轉成 host order，並逐格以 `IsValidImagenumber()` 驗證；檔案若有額外 bytes 只會印出大小警告，不會在此處當成硬失敗。

## Verified maps\n\n目前已產生 7 張 verified map runtime：`200、400、2000、5507、10406、10702、20000`。每張都保留 fixed-C source blob SHA、原始路徑、尺寸、tile/object 陣列，以及 tile image → battlemap candidate 對照。\n\n## Web parser boundary

`tools/stoneage_ls2map_parser.mjs` 僅解析 binary container 結構，使用 `Uint8Array` 與 big-endian u16；它不猜測 image attributes，也不替 `mapset.txt` 補資料。

原始地圖檔為 binary，但 GitHub connector 可用 base64 讀取；目前已對上述 7 張地圖實際取得 bytes，產生受控 generated JSON，並以 CI regression 驗證尺寸、陣列長度與 battlemap candidate coverage。

此外，其他 reverse-engineered client 分支存在不同 `.dat` map container 實作，本專案不把那些格式直接當成 gmsv `LS2MAP` 的格式。

## Runtime API extension

V3.13 的 `sourceMapBattleCandidatesAt(map,x,y)` 將 `sourceMapTileAt()` 與 fixed-C `BATTLE_getBattleFieldNo()` 的 image→battlemap candidate 對照串成一次查詢；它只回傳已存在的 map data，座標越界或未知資料直接 `null`，不生成替代 tile。

`sourceMapBattleFieldNoAt(map,x,y,{randIndex})` 將 fixed C `map[RAND(0,2)]` 的選擇保留為外部 RNG injection：沒有提供 RNG 時不自行抽樣，也不消耗隨機數。

## Walkability runtime

`sourceMapWalkableAt(map,x,y,mapset,{flying})` 依 fixed C `MAP_walkAbleFromPoint()` 對真實 tile/object 做可走性判斷：一般角色先看 object 的 `MAP_WALKABLE`，object 為 1 時還必須 ground 為 1；飛行分支則要求 tile/object 都沒有 `MAP_HAVEHEIGHT`。

目前 generated `mapset` 已經按照 fixed C `MAP_flgSet()` 正規化 `MAP_WALKABLE`，因此 raw 非 0 值都成為 1；API 保留 C 的 switch 結構，但不自行製造不存在的 object walkability mode。
