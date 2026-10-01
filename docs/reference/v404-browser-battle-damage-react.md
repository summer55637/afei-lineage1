# V4.04 Browser Battle DamageReact Plan

更新日期：2026-10-01

V4.04 接續 V4.03 的 damage result，升格 fixed-C `BATTLE_GetDamageReact()` + `BATTLE_DamageSub()` 的 DamageReact boundary。

## Source priority

固定 C 的 reaction priority：

`VANISH → ABSORB → REFLECT → TRAP → ACUPUNCTURE`

其中 `_PROFESSION_SKILL` 與 `_PETSKILL_ACUPUNCTURE` 在 pinned `version.h` 已啟用。

## Reaction behavior

- VANISH：本次 damage 不落 HP，消耗 1 次 vanish。
- ABSORB：incoming damage 改成 defender 的 HP recovery，消耗 1 次 absorb。
- REFLECT：damage 轉向 attacker；throw weapon 時 source 不啟用 reflect。
- TRAP：用 `WORKMODTRAP` 作為 damage 轉向 attacker；throw weapon 時 source 不啟用 trap。
- ACUPUNCTURE：damage 向上取偶數，先打 defender，再以一半 damage 反打 attacker；throw weapon 時 source 不啟用 acupuncture。

Ride Pet 的 damage split 保留 fixed-C 的整數公式。

## Browser boundary

V4.04 是 read-only plan：

- 不修改 HP
- 不修改 Persistent State
- 不自行抽 RNG
- reaction charge / trap clear 只以 `stateConsumption` 計畫回傳
- caller 必須提供 trap damage；缺失時 fail-closed

Regression：`tools/check_v404_browser_battle_damage_react.mjs`
