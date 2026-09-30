# V3.68 Browser Idle lifecycle and offline checkpoint

更新日期：2026-09-30

V3.68 補齊 Browser Idle 的 lifecycle/status 與 offline checkpoint 邊界，仍不產生任何離線收益。

## Browser actions

`IDLE_STATUS`：唯讀回傳 canonical Persistent State 的 idle section、revision、routeId、mode、enabled 與 offline accounting。

`IDLE_OFFLINE_RESUME`：呼叫既有 `prepareOfflineResume()` → `commitOfflineResume()`，計算 closedAt → resumedAt 的合法時間窗並寫入 Save Envelope，再做既有 parse/validate round-trip。

## 收益邊界

目前 offline checkpoint 只保存合法 elapsed/accrued window metadata；`rewardsSimulated=false`、`rewardsApplied=false`、`resumePending=true`。真正的 offline EXP / Gold / Item / Battle outcome 仍未執行。

## Revision

Browser offline resume 使用 expectedRevision；舊 revision 無法覆蓋較新的 Persistent State。

