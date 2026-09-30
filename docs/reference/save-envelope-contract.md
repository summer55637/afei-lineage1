# Save Envelope Contract

更新日期：2026-09-30

`src/stoneage_save_transaction.mjs` 將 canonical persistent state 包裝成可驗證的單機存檔 envelope。

## Envelope

`format`、`schemaVersion`、`revision`、`savedAt`、`source`、`payloadHash`、`payload`。

`payload` 使用 sorted-key deterministic JSON；`payloadHash` 使用 SHA-256。讀檔時先驗 hash，再 JSON parse，再執行 canonical state validation / migration。

## Revision

`commitSave()` 可接受 `expectedRevision`。revision 不一致就回傳 `revision-conflict`，避免舊 runtime 覆蓋較新的 local state。

正常 commit 會建立新 revision，並寫入 `runtimeMeta.lastSavedAt`。

## Migration

Envelope v1 的 payload 是 canonical state；payload 內若仍是 legacy schema 30，會透過既有 `normalizePersistentState()` 做 known-field migration，未知欄位仍由 migration layer 保存。

任何 hash mismatch、JSON 壞檔、unsupported envelope schema 或 migration 後 state invalid 都 fail-closed。

## Boundary

Save layer 不：重新計算 battle、重新抽 reward RNG、產生 offline rewards、猜測 missing source fields、決定死亡／補給政策。

Regression：`tools/check_save_transaction.mjs`。

Generated schema：`data/generated/stoneage_save_envelope_schema.json`。
