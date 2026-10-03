# V3.18 client asset pack adapter

V3.18 接續 V3.16 的 ADRNBIN resolver 與 V3.17 的 RD decoder，正式把「可由部署者自行提供、但不由本 repo 發布」的 client asset pack 介面固定下來。

## Source chain

目前 fixed/public client source 已能閉合：

`map image ID → ADRNBIN bitmapno → graphicNo → adder/size → Real binary → RD raw/RLE pixels`。

公開的 client 重建專案也把 `real.bin`、`adrn.bin` 與 `pal/Palet_1.sap` 列為原版 client data；因此本版不把這些二進位資料直接複製進 Pages。參考公開 client source：`https://github.com/BismarckDD/stoneage`；另一個逆向 client 專案 `https://github.com/pioneers-g/StoneAgeClient` 亦列出原版 client data 檔案需求。

## Web adapter

新增 `src/stoneage_client_asset_pack.mjs`：

- `normalizeClientAssetPackManifest()`：鎖定 manifest schema。
- `loadClientAssetPack()`：載入 ADRNBIN + Real，必要時驗證 SHA-256，建立 ADRN index；manifest 可選擇附帶 `files.spriteShards[]`，載入多組 SPRADRN／SPR 檔案。
- `resolveClientTilePixels()`：把目前 map image ID 串到 V3.16/V3.17 的完整 resolver/decoder。
- 缺少 manifest、缺少檔案、digest 不符或 decoder 失敗都維持 fail-closed。

預設 `client-assets/manifest.json` 為 `unavailable`，所以目前 Pages 不會自動下載或打包任何原版 client BIN。

## Optional SPR animation shards

若部署者另有可使用的精靈資料，可在 `files.spriteShards[]` 提供多個 shard；每個 shard 必須包含 `spradrn.url`、`spr.url` 與明確的 `nextMaxAdrnID`，SHA-256 為選填。載入器會先載入並解析全部 shard、檢查重複 SpriteData slot，再合併後套用目標程式的四組精靈後處理修正。`resolveClientSpriteAnimation()` 可依 `sprNo` 與動畫索引取回解析結果。

SPRADRN／SPR 是選填資料；只有 ADRN／Real 的既有 manifest 仍可使用。若提供任一個 sprite shard，該 shard 的索引與資料檔都必須完整。資料缺漏、索引越界或跨 shard 修正缺少來源時，載入器會 fail-closed。解析動畫資料不等於已還原實際像素、音效或裝置上的動畫時序。

## 為什麼還沒有直接畫出真實 tile

V3.18 已能得到「圖素 bytes」，但這仍是 indexed pixel 資料；要可靠還原原客戶端畫面，還需要固定 palette／顏色映射與等距地圖 draw order。這兩層會在後續版本另外閉合，不用猜顏色或自行重畫原版 sprite。

## 使用規則

要啟用 `status: ready`，部署者必須自行提供有使用權的 `adrn.bin` 與 `real.bin`，並在 manifest 中留下 authorization note；可再填 SHA-256 鎖定精確檔案。

本 repo 只發布 adapter、schema、測試與空白 manifest，不發布原版二進位。

