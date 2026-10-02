# Persistent State 現況與缺口盤點

更新日期：2026-10-02

## 結論

Persistent State 不是「存檔系統完全沒有」。Canonical State v1、Save Envelope v1、revision guard，以及多種 runtime 的 save transaction 已存在並有 headless regression。

目前真正尚未閉合的，是**持久儲存的寫入與重新載入生命週期**：`commitSave()` 產生 state / envelope；Browser State Controller 以記憶體中的 `currentState` 運作，提供 `getState()` / `dispatch()`，但目前沒有由 controller 負責的 durable storage adapter 與啟動還原入口。因此，封包通過 round-trip 測試，不等於重新開啟遊戲後會自動還原存檔。

這個缺口可以先以獨立 storage port、載入流程及測試補齊；不需要先建立 playable HTML。

## 已完成且不應重複列為缺口

- `src/stoneage_persistent_state.mjs`：Canonical State schema v1，包含 player、inventory、equipment、pets、quests、events、titles、world、idle、battleSettings 等容器，並提供 normalize / validate。
- `src/stoneage_save_transaction.mjs`：Save Envelope v1，提供 deterministic JSON、SHA-256、parse/validation、revision guard 與 commit。
- `tools/check_persistent_state_schema.mjs`：驗證 schema、結構與 reference integrity，並測試基本存讀 round-trip 及 schema 30 已知欄位遷移。
- `tools/check_v344_persistent_state_save_join.mjs`：驗證主要 canonical sections 經 envelope hash → parse → validation 的 round-trip，並檢查 legacy unknown key 名稱記錄及 revision guard。
- NPC、ItemShop、SavePoint、World movement/warp、Idle、Battle 等已經有多處 runtime transaction 使用 `commitSave()`；這些 transaction 層不應被描述成尚未存在。

## 目前尚未閉合

1. **Durable write**：尚無 canonical save-storage port，將成功產生的 envelope 寫到可跨頁面／程序保留的儲存介質。
2. **Startup restore**：尚無共同入口，從儲存介質讀取 envelope、驗 hash、parse、validate/migrate，再以還原後 state 建立 Browser State Controller。
3. **失敗邊界**：需要明確定義儲存介質不可用、寫入失敗、存檔毀損時的行為，不能把只存在記憶體的變更誤報為已持久保存。
4. **整合回歸**：至少驗證新 session 還原、壞檔 fail-closed、寫入失敗、舊 revision 衝突，以及 save/load 後主要 state 不變。

## 暫不擴張的範圍

- `equipment.sourceSlotRefs`、任務／每日任務內部內容、events、titles、battleSettings 等目前有部分採 opaque shape validation。沒有 source evidence 的內部語義不應臆造。
- Legacy schema 30 目前是 known-field migration；未確認的舊欄位不應宣稱已完整相容。
- 個別遊戲系統的欄位語義，應在該功能準備進入 runtime/playable 時按 source evidence 逐項補齊，不再以「把所有欄位一次擴完」作為模糊 blocker。

## 下一步

先建立不依賴 UI 的 injected save-storage interface 與 restore bootstrap，完成其 regression；之後再依實際啟用的玩法，逐項判定是否還需要擴充 state fields。Playable HTML 的整合是後續接線工作，不是開始修復 Persistent State 的前置條件。
