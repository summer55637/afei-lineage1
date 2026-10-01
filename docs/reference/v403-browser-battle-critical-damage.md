# V4.03 Browser Battle Critical Damage Plan

更新日期：2026-10-01

V4.03 接續 V4.01 AttackSeq Prelude 與 V4.02 Damage Plan，加入 fixed-C `BATTLE_CriDamageCalc()` 與 AttackSeq 的後段 read-only settlement。

## Critical damage

fixed-C：

- normal/critical 判定由 V4.01 的 `BATTLE_CriticalCheck` 產生；V4.03 不重新抽 critical RNG。
- 非 Bow critical 走 `BATTLE_CriDamageCalc`：
  `damage = BATTLE_DamageCalc() + DEFENCEPOWER * attackerLevel / defenderLevel * 0.5`
- Bow 即使命中 critical 判定，AttackSeq 仍使用普通 `BATTLE_DamageCalc()`，因此不套用 critical bonus。

## GuardAdjust

當防守方 command 1 為 Guard 且沒有 confusion：

- 1–25 → 0%
- 26–50 → 10%
- 51–70 → 20%
- 71–85 → 30%
- 86–95 → 40%
- 96–100 → 50%

Guard RNG 由 caller 注入；缺失或超出範圍時 fail-closed。

## Final handling

若 Guard 後 damage < 1，fixed-C 再抽 `RAND(0,1)`；V4.03 同樣要求 caller 注入，缺失或超出範圍時 fail-closed。
最後套用 `gBattleDamageModyfy`，預設由 caller 提供 1.0。

## Boundary

V4.03 仍然：

- 不修改 HP
- 不修改 Persistent State
- 不執行 DamageSub / DamageReact / Counter / Death / Reward
- 不偷偷啟用其他 feature branch
- 不重抽 V4.01 的 critical RNG

Regression：`tools/check_v403_browser_battle_critical_damage.mjs`
