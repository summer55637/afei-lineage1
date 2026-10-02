# V3.20 real tile presentation contract

V3.20 第一次把已閉合的 source/runtime 鏈接到瀏覽器畫布，但先限制為「目前 Encounter Floor/X/Y 的 tile/object preview」，不假裝已經完成整張地圖 camera／character z-order。

## Fixed source draw order

公開 client `map.cpp::drawMap()` 先以 `StockDispBuffer(..., tile, ...)` 畫 tile；同一格再解析 `parts`，透過 `realGetNo()`／`realGetPos()`／`realGetWH()`／`setPartsPrio()` 放置 object。因此 V3.20 preview 的單格順序固定為 tile → object。

## Browser chain

`src/stoneage_tile_presentation.mjs` 串起：

`source map tile/object image ID → V3.18 asset pack → V3.16 80-byte ADRNBIN → Real offset/size → V3.17 RD indexed pixels → V3.19 Palet_1.sap BGR → RGBA → Canvas`。

預設 asset 路徑為 `client-assets/manifest.json` + `client-assets/Palet_1.sap`。任一來源不存在或無法解碼都維持 unavailable/fail-closed；repo 不發布原版 client binaries。

這一版仍是 source tile preview，不改 encounter RNG、map runtime、battle runtime 或 save schema。完整 camera、整張 verified map、角色／NPC 與更大的 z-order 將分階段處理。

## Target battle SABEX preview extension

A separate `renderBattleSabexPreviewAsync()` path now accepts the target 33×33 SABEX byte layout directly. Its browser-safe parser is `src/stoneage_sabex_decoder.mjs`; it decodes the 4-byte header plus 1089 big-endian uint16 image IDs without importing Node-only tooling.

The renderer:
- preserves the target row-major cell submission order;
- uses the target 32-pixel horizontal and 23-pixel vertical lattice (`inner dy = -23`, `outer dy = +23`);
- resolves each unique drawable image ID once per preview;
- fits resolved image bounds to the supplied canvas by default;
- reports unresolved drawable assets as `partial`, without substituting fabricated terrain.

The target positional anchor `(-450, 350)` is normalized around cell `(16,16)` for the preview canvas. The preview closes SABEX byte ingestion and tile placement, but does not claim target-camera equivalence, original SDL compositing, character/NPC z-order, or pixel parity while actual target SABEX/ADRN/Real bytes are unavailable.
