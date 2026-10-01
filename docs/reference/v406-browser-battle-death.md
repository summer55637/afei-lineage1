# V4.06 Browser Battle Death Plan

更新日期：2026-10-01

V4.06 接續 V4.05 Counter，升格 fixed-C `BATTLE_DefDieType()` 的死亡判定 boundary。

## Death condition

- `CHAR_HP <= 0` → `BCF_DEATH`
- `iRet = FALSE`
- `ULTIMATE_1`：ABIO 強制；或非玩家 critical 目標通過 `RAND(1,100) < 50`
- `ULTIMATE_2`：沿用前面的 `BATTLE_DamageSub()` threshold result
- pinned LER 特例會取消 ultimate knock-away

## Boundary

V4.06 目前只建立 death decision plan：

- 不直接設定 `CHAR_ISDIE`
- 不修改 HP
- 不結束 Battle
- 不發 EXP / Gold / Reward
- 不寫 Persistent State
- critical death RNG 由 caller 注入；缺失時 fail-closed

下一層才是 `CHAR_ISDIE`、battle-end、reward / persistent settlement。

Regression：`tools/check_v406_browser_battle_death.mjs`
