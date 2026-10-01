# V4.02 Browser Battle Damage Plan

更新日期：2026-10-01（pinned branch alignment patch）

V4.02 將 fixed-C BATTLE_DamageCalc() 拆成 read-only browser damage plan。

## Base damage

固定 C（pinned ref 的 gmsv/src/include/version.h 已定義 _BATTLE_NEWPOWER）：

defense = FIXTOUGH * 0.70 + FIXDEX * 0.20 + FIXVITAL * 0.10

0.45／0.20／0.05 是另一條非 _BATTLE_NEWPOWER／騎寵相關路徑，不應在 pinned build 的一般無騎寵分支直接使用。

三個分支：

1. defense <= attack 且 attack < defense*8/7：
   RAND(0, attack/16)
2. defense > attack：
   RAND(0,1)
3. attack >= defense*8/7：
   RAND(0, attack/8) - attack/16 + (attack-defense)*2

每次 RAND 都要求 caller 注入，browser 不藏 Math.random。

## Element

BATTLE_AttrAdjust 在 base damage 後執行：

- SAME = 1.0
- UP = 1.5
- DOWN = 0.6
- ATTR_MAX = 100
- D_ATTR = 1/10000

V4.02 目前把 FieldAtt=NONE 視為 fixed-C default 0.5/0.5，ratio=1。實際場地倍率由 caller 提供 fieldAtt/attPow。

## Boundary

尚未應用：

- Ride Pet adjust
- _BATTLE_NEWPOWER branch
- _MAGIC_SUPERWALL
- _NPCENEMY_ADDPOWER
- _PETSKILL_REGRET
- _EQUIT_NEGLECTGUARD
- _PROFESSION_ADDSKILL 四屬結界
- _ADD_DEAMGEDEFC
- actual HP mutation
- GuardAdjust
- DamageReact / counter / death / reward

Regression：tools/check_v402_browser_battle_damage_plan.mjs

## 2026-10-01 Pinned branch correction

固定 source 審核確認 pinned gavinlinasd/StoneAge ref 的 gmsv/src/include/version.h 會編譯 _BATTLE_NEWPOWER。因此 V4.02 原先使用 0.45 防禦係數的 regression 已校正為 pinned branch 的 0.70 / 0.20 / 0.10，並同步更新 schema 與 regression fixture。
