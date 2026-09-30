# V3.19 palette runtime contract

V3.19 接續 V3.17 的 RD indexed pixels 與 V3.18 的 client asset pack adapter，固定 `Palet_1.sap` 的顏色映射。

## Source contract

固定 client source 的 `InitPalette()` 對 `data/pal/Palet_1.sap` 逐筆讀取 palette 16..239；每筆資料順序是 Blue、Green、Red。索引 0..15 與 240..255 則由 client 內建固定色盤提供。

公開 client 工具鏈 `tools/ride_sprite_generator/sprite_data.py` 也以 224×3 bytes 讀取 `PALET_1.SAP`，並把 BGR 轉成 RGB。

## Web runtime

`src/stoneage_palette_runtime.mjs` 提供：

- `parseStoneAgeSap()`：672-byte SAP → 256 色 RGBA table。
- `paletteColorRgba()`：查單色。
- `indexedPixelsToRgba()`：把 RD decoder 的 indexed pixels 轉成 RGBA；index 0 預設作透明色。

目前沒有發布原版 `Palet_1.sap`；repo 只發布 parser、固定色盤與 synthetic regression。