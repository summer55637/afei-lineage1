# V3.17 client RD decoder contract

V3.17 閉合 client Real binary 裡 decoder() 使用的 RD header 與 legacy RLE；RO0000 target APK 再以 x86 ELF 直接校正 compression-flag 分支。

## Fixed client source

`client/stoneage/systeminc/unpack.h` 定義 RD_HEADER：id[2]、compressFlag、width、height、size。

`client/stoneage/system/unpack.cpp::decoder()` 的歷史 source branch 可見：

- RD magic。
- compressFlag 0：直接複製 width × height bytes。
- legacy compression：使用 0x80、0x40、0x10、0x20 flags 做 repeat / zero / large-count / literal 解碼。
- 某些版本在 `_NEW_COLOR_` 下加入 truecolor / zlib 路徑。

## RO0000 target correction

Target x86 `libStoneage.so` 的 `decoder()` @ `0x2f5410` 直接閉合：

- flag 0 → width × height、1 byte/pixel raw；
- flag 0x20 → zlib `uncompress`、輸出容量 width × height × 4；
- 其他非零 flag → custom RLE；
- 非 RD magic 若為 little-endian `0x4767`（`gG`）→ `decoderPng()`，其輸出長度為 width × height × 4。

因此不能把舊版「compressFlag >= 16 一律走 zlib」直接套到 RO0000；target 的 observed implementation 明確把 **0x20** 單獨作為 zlib RGBA 分支，其餘非零值仍進 RLE。

## Web

`src/stoneage_rd_decoder.mjs` 現在提供：

- raw RD decoder；
- target custom RLE decoder；
- target `0x20` zlib RGBA 的 browser-safe async decoder；
- RD / gG graphic magic classifier；
- `decodeAuthorizedClientGraphic()`；
- `decodeAuthorizedClientGraphicAsync()`。

瀏覽器 zlib 路徑使用 `DecompressionStream('deflate')`，避免把 Node-only `node:zlib` 帶入 browser bundle。

這一層仍不包含任何 Real binary 資產。只有在合法 client asset bytes 與 ADRNBIN metadata 提供後，才能把 image ID 解成實際像素。

目前 `gG` 仍只完成 carrier classification，尚未加入 browser PNG decode implementation；target 的 `decoderPng()` 已確認會把 `+0x10` 起始的 payload 交給 `IMG_LoadPNG_MEM`。
