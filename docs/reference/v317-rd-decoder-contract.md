# V3.17 client RD decoder contract

V3.17 閉合 client Real binary 裡 decoder() 使用的 RD header 與 legacy RLE。

## Fixed client source

`client/stoneage/systeminc/unpack.h` 定義 RD_HEADER：id[2]、compressFlag、width、height、size。

`client/stoneage/system/unpack.cpp::decoder()`：

- 驗證 magic 為 RD。
- compressFlag 0：直接複製 width × height bytes。
- legacy compression：使用 0x80、0x40、0x10、0x20 flags 做 repeat / zero / large-count / literal 解碼。
- 若編譯啟用 `_NEW_COLOR_`，compressFlag >= 16 走 zlib truecolor path；Web decoder 目前刻意不實作這個分支，遇到時 fail-closed。

## Web

新增 `src/stoneage_rd_decoder.mjs`，提供 raw/RLE decoder，以及 `decodeAuthorizedClientGraphic(realBytes,graphic)`。

這一層不包含任何 Real binary 資產。只有在使用者或部署環境提供合法的 client asset bytes 與 ADRNBIN metadata 時，才可以把 image ID 解成像素。

因此目前 Pages 不會因此自動出現原版圖像；但資料鏈已經完整到 image ID → ADRNBIN → Real payload → RD pixels 的最後 parser 階段。