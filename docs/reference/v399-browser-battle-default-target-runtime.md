# V3.99 Browser Battle Default Target Runtime

更新日期：2026-10-01

V3.99 把 fixed-C `BATTLE_DefaultAttacker()` 接成 read-only browser runtime。

## Fixed-C behavior

固定 C：

1. 讀取指定 side 的 10 個 Entry
2. 排除不存在的 Entry
3. 排除 RESCUE mode
4. 以 `BATTLE_TargetCheck()` 篩掉無效目標
5. 若沒有候選，回傳 `-1`
6. 否則執行 `RAND(0,candidateCount-1)`

V3.99 要求 caller 注入 `defaultTargetRoll`，不直接呼叫隱藏 RNG。

## Integration boundary

V3.98 在 target invalid 時只標記 `defaultAttackerRequired=true`。

V3.99 提供真正的 default target selection，但仍不修改 Battle Context，也不執行攻擊或傷害。下一層才會把 resolved target 交給 `BATTLE_Attack()` 前置 boundary。

Regression：`tools/check_v399_browser_battle_default_target_runtime.mjs`
