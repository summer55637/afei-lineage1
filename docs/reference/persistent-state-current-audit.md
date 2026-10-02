# Persistent State 現況與缺口盤點

更新日期：2026-10-02

## 結論

Canonical Persistent State v1、Save Envelope v1 與多種 runtime transaction 已存在。這一輪已補上 canonical 存檔的持久寫入與重新載入 runtime，且不依賴 playable HTML。

## 已完成

- `src/stoneage_persistent_state.mjs`：Canonical State schema v1，包含 player、inventory、equipment、pets、quests、events、titles、world、idle、battleSettings 等容器，並提供 normalize / validate。
- `src/stoneage_save_transaction.mjs`：Save Envelope v1，提供 deterministic JSON、SHA-256、parse/validation、revision guard 與 commit。
- `src/stoneage_save_storage.mjs`：注入式 read/write storage port、瀏覽器 LocalStorage adapter、Envelope 寫入、載入驗證，以及 commit-and-persist API。
- `src/stoneage_browser_state_controller.mjs`：可選擇注入 save storage；成功且 revision 前進的 dispatch 會自動保存，儲存失敗會回復 controller 的 canonical state 與相關暫態狀態。
- `src/stoneage_browser_persistent_state_session.mjs`：建立 controller 前先載入並驗證存檔；沒有既有存檔時，要求呼叫端提供已建立的 initialState，不自行猜出生資料。
- `tools/check_save_storage.mjs`：覆蓋 LocalStorage adapter contract、持久寫入／載入、controller 自動保存、重建 session 還原、壞檔拒絕、寫入失敗回復及 revision conflict。
- `.github/workflows/check-persistent-state.yml`：已納入上述新模組與 regression。
- 原有 `tools/check_persistent_state_schema.mjs`、`tools/check_save_transaction.mjs`、`tools/check_v344_persistent_state_save_join.mjs` 的 schema、envelope 與交易層測試仍保留。

## 尚待確認的邊界

1. 新增的 save-storage regression 已納入 GitHub Actions workflow；目前尚未取得這次變更的實際 CI 執行結果，因此暫不宣稱測試通過或自動關閉 blocker。
2. Playable HTML 尚未接入這個 session factory，這是刻意保留的 UI 整合工作，不是完成 headless Persistent State 的前置條件。
3. Legacy schema 30 目前只保證 known-field migration；本輪沒有宣稱可直接匯入舊版 LocalStorage 的 raw save。
4. `equipment.sourceSlotRefs`、任務／每日任務內部內容、events、titles、battleSettings 等部分內容仍採 opaque shape validation。沒有 source evidence 的內部語義不臆造；只有目前啟用的玩法確實需要時才另行閉合。

## 下一步

確認新增 Persistent State workflow 的 regression 結果。若通過，將 canonical v1 的持久寫入／還原生命週期從 blocker 中關閉；legacy raw-save 匯入、opaque 欄位與 playable HTML 整合各自按實際需求另行處理，不再用廣義「expand all state」混在同一 blocker。
