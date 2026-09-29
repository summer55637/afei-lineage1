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

## Web parser boundary

`tools/stoneage_ls2map_parser.mjs` 僅解析 binary container 結構，使用 `Uint8Array` 與 big-endian u16；它不猜測 image attributes，也不替 `mapset.txt` 補資料。

目前因原始地圖檔是 binary，connector 無法直接取得其 bytes，因此本版用 synthetic fixture 驗證 parser；真正 map bytes 後續可由 CI 在 fixed ref 下抓取，再產生受控的 generated JSON。

此外，其他 reverse-engineered client 分支存在不同 `.dat` map container 實作，本專案不把那些格式直接當成 gmsv `LS2MAP` 的格式。

## Runtime API extension

V3.13 的 `sourceMapBattleCandidatesAt(map,x,y)` 將 `sourceMapTileAt()` 與 fixed-C `BATTLE_getBattleFieldNo()` 的 image→battlemap candidate 對照串成一次查詢；它只回傳已存在的 map data，座標越界或未知資料直接 `null`，不生成替代 tile。
