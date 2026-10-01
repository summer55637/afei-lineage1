# V4.10 Browser Battle Profit Route Plan

更新日期：2026-10-01

V4.10 接續 V4.09 Finish Commit，將 fixed-C BATTLE_GetProfit() 的第一層分流閉合。

## Source boundary

fixed-C BATTLE_Finish() 逐一呼叫 BATTLE_GetProfit()。BATTLE_GetProfit() 只有一個分流：dpbattle == 1 時進 BATTLE_GetDuelPoint()，否則進 BATTLE_GetExpGold()。

V4.10 只輸出 route，不執行任何 reward mutation。

## Browser contract

- `dpbattle = 1` → `duel-point` → `BATTLE_GetDuelPoint`
- `dpbattle = 0` → `exp-gold` → `BATTLE_GetExpGold`
- `dpbattle` 缺失或非 0/1 → fail-closed
- 不修改 Battle Context、Persistent State、Gold、DuelPoint 或 EXP

下一層再分別閉合 Duel Point 與 Exp/Gold，避免把固定源中不同結算系統混在一起。

Regression：`tools/check_v410_browser_battle_profit_route.mjs`
