# V4.00 Browser Battle Attack Preflight

更新日期：2026-10-01

V4.00 把 fixed-C `BATTLE_Attack()` 真正進入點的 admission boundary 接上 V3.98 / V3.99 target chain。

## Execution chain

普通非 Bow 攻擊的前置關係：

`requested target`
→ `BATTLE_TargetCheck`
→ target 無效時 `BATTLE_DefaultAttacker(opposite side)`
→ final target
→ attacker / target HP gate
→ 才能進 `BATTLE_AttackSeq()`

V4.00 使用 caller-injected default target RNG，並把最終 target 送成 execution plan；尚未修改 HP。

## BATTLE_Attack hard gate

固定 C 的最前端：

- attacker index 無效 → FALSE
- target index 無效 → FALSE
- target HP <= 0 → FALSE
- attacker HP <= 0 → FALSE

接著檢查 DamageReact：

- attacker DamageReact > 0，或 target > 0 → `iRet = FALSE)
- 但 source 仍會呼叫 `BATTLE_AttackSeq())

因此 V4.00 不把 DamageReact 誤解成「完全不進 Attack」。

## Boundary

尚未執行：

- `BATTLE_AttackSeq()`
- 命中／閃避／Critical RNG
- `BATTLE_DamageCalc()`
- Guardian substitution
- DamageReact resolution
- status application
- death / ultimate
- reward / counter

Regression：`tools/check_v400_browser_battle_attack_preflight.mjs`
