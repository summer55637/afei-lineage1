# V3.91 Browser Battle Enemy Core Hydration

更新日期：2026-10-01

V3.91 把 V3.90 的 Enemy Core Stat Runtime 接入 V3.86 的 transient Battle Context。

## Opt-in boundary

只有 action 明確帶：

`materializeEnemyStats=true`

而且提供每隻 Enemy 對應的：

- 1 個 levelRoll
- 4 個 baseStatRolls
- 10 個 allocationRolls

才會把 stat seed materialize 成 Battle Context。

## Context fields

Enemy entry 現在可得到：

- level
- HP / MaxHP
- MP / MaxMP（目前仍為 null）
- VITAL / STR / TOUGH / DEX
- FIXVITAL / FIXSTR / FIXTOUGH / FIXDEX
- Attack / Defence / Quick
- PetRank
- elements / status resist
- sourceCoreStats provenance

以 first-route Encounter 65 的 Group 94 為例，固定測試 RNG 可得到：

- Enemy 120：Lv2、VITAL 448 / STR 390 / TOUGH 331 / DEX 487、MaxHP 30、rank 5
- Enemy 123：Lv2、VITAL 611 / STR 470 / TOUGH 376 / DEX 658、MaxHP 39、rank 4

## 尚未升格

V3.91 仍沒有把以下東西冒充已完成：

- CHAR_getDefaultChar 的完整 default MP/source field
- ITEM_equipEffect
- Enemy style weapon
- ENEMY_RandomChange
- battle turn / AI / damage
- reward / capture / death

所以目前 `in_battle` 的 Battle Context 已有來源化 Enemy HP/四圍，但仍是 pre-turn context。

Regression：tools/check_v391_browser_battle_enemy_core_hydration.mjs
