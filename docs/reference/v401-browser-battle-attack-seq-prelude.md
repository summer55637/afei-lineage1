# V4.01 Browser Battle AttackSeq Prelude

更新日期：2026-10-01

V4.01 將 fixed-C BATTLE_AttackSeq() 的前三層接成 deterministic browser prelude：

BATTLE_DuckCheck -> BATTLE_GuardianCheck -> BATTLE_CriticalCheck

## Duck

普通 fixed-C DuckCheck 使用 gKawashiPara=0.02；JYUJYUTU branch 使用 0.027。

最後使用：

RAND(1,10000) <= per

V4.01 的 roll 一律 caller-injected。

## Guardian

Guardian 必須：

- target entry 有 guardian bid
- Guardian entry 存在、存活
- Guardian flag 命中 CHAR_BATTLEFLG_GUARDIAN = 1<<3
- Guardian 沒有 source-blocked status
- Guardian 不是 attacker / target
- attacker 不是投擲武器

成立後，Critical 對 Guardian 作為新的 defender 計算。

## Critical

V4.01 使用 fixed-C BATTLE_CriticalCheckPlayer()：

- gCriticalPara=0.09
- Player attacker -> non-player defender：DfDex x 0.6
- Pet attacker -> Enemy defender：DfDex x 0.8
- Enemy -> Pet / any non-player -> Player：divisor=10、linear root mode
- Player attacker 讀取 fixLuck
- 最後：

RAND(1,10000) < perCri

Critical 是嚴格 <；Duck 則是 <=。

## Boundary

V4.01 不做：

- BATTLE_DamageCalc / BATTLE_CriDamageCalc
- HP mutation
- counter
- status application
- death / ultimate
- reward
- internal RNG

缺少 fixDex 時直接 fail-closed。
Regression：tools/check_v401_browser_battle_attack_seq_prelude.mjs
