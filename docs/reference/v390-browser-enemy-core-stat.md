# V3.90 Browser Enemy Core Stat Runtime

更新日期：2026-10-01

V3.90 開始把 V3.84 的 generated Enemy roster 進一步轉成固定 C ENEMY_createEnemy() 的核心 stat state。

## RNG order

固定 C 的 ENEMY_createEnemy() 在沒有指定 baselevel 時：

1. RAND(ENEMY_LV_MIN, ENEMY_LV_MAX)
2. 四次 RAND(0,4)，各自再減 2
3. 十次 RAND(0,3)，每次把其中一個 base stat +1

所以 V3.90 要求 caller 注入 15 個 RNG 結果。

## Stat formula

四圍最後依：

((level-1) * E_T_LVUPPOINT + E_T_INITNUM) * allocatedBaseStat

轉成整數。

`CHAR_initcharWorkInt()` 再以這四圍產生：

- FIXVITAL
- FIXSTR
- FIXTOUGH
- FIXDEX
- ATTACKPOWER
- DEFENCEPOWER
- QUICK
- MAXHP

MaxHP 依 fixed-C：

(VITAL * 4 + STR + TOUGH + DEX) * 0.01

並轉成整數。

## Rank

ENEMY_getRank() 使用原始 EnemyBase 四個 base stat 相加，再依 100/95/90/85/80/0 threshold 得到 rank 0..5。

## 目前刻意未升格

- CHAR_getDefaultChar() 的完整 default-character field source join
- Item_equipEffect() 真正套裝備後修正
- Enemy style weapon
- ENEMY_RandomChange()
- item drops
- compile-time profession / PetSkill branches

因此 V3.90 是 core stat materialization，不把它冒充成完整 ENEMY_createEnemy() parity。

Regression：tools/check_v390_browser_world_encounter_enemy_core_stat.mjs
