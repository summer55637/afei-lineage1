# Idle Supply / Death / Offline Policy

更新日期：2026-09-30

這一層把 Idle Loop 的產品政策與 fixed-C 行為分開。

## Source-backed

已有 source research 證據顯示 Healer 行為會把角色 HP 與 MP 補滿。因此 `sourceHealerRecovery()` 只負責這個已確定的 recovery action。

固定戰鬥結算中，player death-extra 在 `BATTLE_AddProfit → BATTLE_AddExpItem` 階段處理；`BATTLE_OnlyRescue()` 是戰鬥完整流程之後的 side-0 rescue boundary，不把它解讀成自動復活規則。

## Product policy

以下項目不設定預設值：

- 何時需要補血／補 MP。
- 死亡後停止、手動復原、回存點或找 Healer。
- offline 最大收益時間。
- offline 是否允許戰鬥／掉落／經驗繼續。

這些必須存在於 `policy` object 才會生效。

## Offline

`offlineResumeWindow()` 只計算時間窗與明確 `maxSeconds` cap；它不自行產生 EXP、Gold、Item。

Runtime：`src/stoneage_idle_policy.mjs`
Regression：`tools/check_idle_policy.mjs`
Generated：`data/generated/stoneage_idle_policy_schema.json`
