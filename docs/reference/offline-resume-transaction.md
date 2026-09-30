# Offline Resume Transaction

更新日期：2026-09-30

這層目前只把 offline resume 做成安全的 checkpoint transaction，沒有假造離線戰鬥或收益。

## Phase 1: prepare

`prepareOfflineResume()` 驗證 `idle.offline.eligible=true`，計算 closedAt → resumedAt 的合法時間窗，保存 elapsed time，並把 `resumePending=true`。

`accruedSeconds` 仍然設為 `0`；這是刻意的，因為目前尚未完成 source-backed offline battle/reward simulation。

## Phase 2: commit

`commitOfflineResume()` 使用 Save Envelope 的 revision guard 進行 atomic save。舊 state 不能覆蓋更新 revision。

## Phase 3: reward completion

`markOfflineRewardsApplied()` 只標示外部已完成的 offline reward simulation，並記錄 accruedSeconds；它不自己產生 EXP / Gold / Item。

因此目前 offline pipeline 是：

`closedAt → time-window check → resume checkpoint → save`

而不是：

`closedAt → 猜測戰鬥 → 自動發獎`。

Runtime：`src/stoneage_offline_resume.mjs`
Regression：`tools/check_offline_resume.mjs`
