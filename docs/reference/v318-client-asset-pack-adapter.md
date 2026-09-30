# V3.18 client asset pack adapter

V3.18 接續 V3.16 的 ADRNBIN resolver 與 V3.17 的 RD decoder，正式把「可由部署者自行提供、但不由本 repo 發布」的 client asset pack 介面固定下來。

## Source chain

目前 fixed/public client source 已能閉合：

`map image ID → ADRNBIN bitmapno → graphicNo → adder/size → Real binary → RD raw/RLE pixels`。

公開的 client 重建專案也把 `real.bin`、`adrn.bin` 與 `pal/Palet_1.sap` 列為原版 client data；因此本版不把這些二進位資料直接複製進 Pages。citeturn958999search0turn943447search0

## Web adapter

新增 `src/stoneage_client_asset_pack.mjs`：

- `normalizeClientAssetPackManifest()`：鎖定 manifest schema。
- `loadClientAssetPack()`：載入 ADRNBIN + Real，必要時驗證 SHA-256，建立 ADRN index。
- `resolveClientTilePixels()`：把目前 map image ID 串到 V3.16/V3.17 的完整 resolver/decoder。
- 缺少 manifest、缺少檔案、digest 不符或 decoder 失敗都維持 fail-closed。

預設 `client-assets/manifest.json` 為 `unavailable`，所以目前 Pages 不會自動下載或打包任何原版 client BIN。

## 為什麼還沒有直接畫出真實 tile

V3.18 已能得到「圖素 bytes」，但這仍是 indexed pixel 資料；要可靠還原原客戶端畫面，還需要固定 palette／顏色映射與等距地圖 draw order。這兩層會在後續版本另外閉合，不用猜顏色或自行重畫原版 sprite。

## 使用規則

要啟用 `status: ready`，部署者必須自行提供有使用權的 `adrn.bin` 與 `real.bin`，並在 manifest 中留下 authorization note；可再填 SHA-256 鎖定精確檔案。

本 repo 只發布 adapter、schema、測試與空白 manifest，不發布原版二進位。

