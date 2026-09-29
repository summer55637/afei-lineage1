# V3.12 battlefield source contract

這一版先閉合「戰鬥場景地形來源」資料鏈，不直接把未取得 floor/x/y tile 的值硬塞進目前 Web battle runtime。

## Fixed C 證據

- `setup.cf` 將 `maptilefile` 指向 `data/map/mapset.txt`，並將 `battlemapfile` 指向 `data/map/battlemap.txt`。
- `readmap.c` 啟動時先讀 map tile config，再讀 battle-map config，最後讀實際地圖檔。
- `readmap.h` 暴露 `MAP_getTileAndObjData()` 與 `MAP_getImageInt()`；地圖 tile 的 battle-map 欄位包含 `MAP_BATTLEMAP`、`MAP_BATTLEMAP2`、`MAP_BATTLEMAP3`。
- `battle.c` 的 `BATTLE_getBattleFieldNo()` 讀取目前 floor/x/y 的 tile，取得上述三個候選值，最後以 `RAND(0,2)` 選其中一個。

## Generated manifest

`data/generated/stoneage_battlefield_source_manifest.json` 保留 pinned source、220 個 battle map 定義、122 個有效範圍宣告，以及原始檔中的 1 筆反向範圍 `3137 to 1349`。

反向範圍不在 Web 端自行修正；它被當作來源異常原樣保留，等待後續再對照 fixed C parser 行為。

## Runtime 邊界

目前 Web runtime 尚未擁有完整的 source-backed floor/x/y → tile descriptor，因此本版不把 battlemap 編號推測套到玩家畫面。

下一階段才能在取得真正 tile data 後，把 `tile[0] → MAP_BATTLEMAP[0..2] → RAND(0,2)` 接到 battle presentation。