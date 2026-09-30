# V3.93 Browser Battle Surprise

更新日期：2026-10-01

V3.93 將 fixed-C BATTLE_SurpriseCheck() 獨立成 caller-injected RNG runtime。

## Fixed-C rule

只要是 P_vs_E：

- 由 Side[0].Entry[0] 讀取 CHAR_WORKFIXLUCK。
- WinFunc 不為 NULL 時直接回傳 0。
- 以 RAND(1,100) 得到 surprise roll。
- luck 5：1..20 → result 1。
- luck 4：1..15 → result 1；16 → result 2。
- luck 3：1..10 → result 1；11..12 → result 2。
- luck 2：1..5 → result 1；6..9 → result 2。
- 其他 luck：1..6 → result 2。

result 1 讓 Enemy side 設定 BSIDE_FLG_SURPRISE；result 2 讓 Player side 設定 BSIDE_FLG_SURPRISE。

## Browser boundary

Persistent State 的 player.luck 不是 CHAR_WORKFIXLUCK 的等價替代，因此 V3.93 強制 caller 注入 fixedLuck。

V3.93 不啟動 battle、不修改 Persistent State、不執行 AI 或 damage。

Regression：tools/check_v393_browser_battle_surprise_runtime.mjs
